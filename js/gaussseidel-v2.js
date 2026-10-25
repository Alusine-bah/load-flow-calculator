// gaussseidel-v2.js
// Adapter between PowerSystem V2 model and existing Gauss-Seidel solver
// Converts output into common LoadFlowResult_local format

var solveGaussSeidel_local, LoadFlowResult_local;

if (typeof require !== "undefined") {
  ({ solveGaussSeidel: solveGaussSeidel_local } = require("./gaussseidel.js"));
  ({ LoadFlowResult: LoadFlowResult_local } = require("./results.js"));
}

if (typeof window !== "undefined") {
  solveGaussSeidel_local = window.solveGaussSeidel;
  LoadFlowResult_local = window.LoadFlowResult;
}

function solveGaussSeidelV2(powerSystem) {


  // ======================================
  // Convert PowerSystem V2 to solver format
  // ======================================

  const baseMVA = powerSystem.baseMVA || 100;

  // Generator reactive limits are expressed in per-unit.
  // Limits for multiple generators at a bus are aggregated.
  const generatorLimits = new Map();

  for (const generator of (powerSystem.generators || [])) {
    const modelBus = powerSystem.buses.find(
      bus => bus.id === generator.busId
    );

    if (!modelBus) {
      throw new Error(
        'Generator references unknown bus ' + generator.busId + '.'
      );
    }

    const Qmin = Number(generator.Qmin ?? -1);
    const Qmax = Number(generator.Qmax ?? 1);

    if (
      !Number.isFinite(Qmin) ||
      !Number.isFinite(Qmax) ||
      Qmin > Qmax
    ) {
      throw new Error(
        'Invalid reactive-power limits for generator at bus ' +
        generator.busId + '.'
      );
    }

    const existing = generatorLimits.get(generator.busId);

    if (existing) {
      existing.Qmin += Qmin;
      existing.Qmax += Qmax;
    } else {
      generatorLimits.set(generator.busId, { Qmin, Qmax });
    }
  }

  const system = {

    name: powerSystem.name,

    baseMVA: baseMVA,

    baseKV: powerSystem.baseKV,

    useV2Ybus: true,

    tol: 1e-9,

    maxIter: 2000,

    buses: [],

    lines: [],

    shunts: []

  };



  // Convert buses (all values in pu)

  for (const bus of powerSystem.buses) {

    system.buses.push({

      id: bus.id,

      type: bus.type,


      V: bus.V,

      delta: bus.delta,


      Pgen:  bus.Pgen  || 0,

      Qgen:  bus.Qgen  || 0,


      Pload: bus.Pload || 0,

      Qload: bus.Qload || 0

    });

  }



  // Convert lines (already in pu)

  for (const line of powerSystem.lines) {

    system.lines.push({

      from: line.from,

      to: line.to,


      R: line.R,

      X: line.X,


      B: line.B

    });

  }



  // Convert shunts (already in pu)

  for (const shunt of (powerSystem.shunts || [])) {

    system.shunts.push({

      busId: shunt.busId,

      G: shunt.G,

      B: shunt.B

    });

  }



  // ======================================
  // Run existing Gauss-Seidel solver
  // ======================================

  let solverResult = null;
  let totalIterations = 0;
  const combinedConvergenceLog = [];
  const limitTolerance = 1e-8;
  const maxLimitPasses = system.buses.length + 1;

  for (let pass = 0; pass < maxLimitPasses; pass++) {
    const iterationOffset = totalIterations;

    solverResult = solveGaussSeidel_local(system);

    if (!solverResult) {
      throw new Error('Gauss-Seidel solver returned no result.');
    }

    // Count actual iterations from the convergence log.
    // The legacy solver's iterations value is zero-based.
    const passIterations = Array.isArray(solverResult.convergenceLog)
      ? solverResult.convergenceLog.length
      : (Number.isFinite(solverResult.iterations)
          ? solverResult.iterations
          : 0);

    totalIterations += passIterations;

    for (const entry of (solverResult.convergenceLog || [])) {
      combinedConvergenceLog.push({
        ...entry,
        iter: Number.isFinite(entry.iter)
          ? iterationOffset + entry.iter
          : combinedConvergenceLog.length + 1
      });
    }

    // Do not enforce limits using an unconverged intermediate solution.
    if (!solverResult.converged) {
      break;
    }

    // Reuse the previous voltage solution as the next initial estimate.
    for (const solvedBus of (solverResult.busResults || [])) {
      const modelBus = system.buses.find(
        bus => bus.id === solvedBus.id
      );

      if (modelBus) {
        modelBus.V = solvedBus.V;
        modelBus.delta = solvedBus.delta_deg;
      }
    }

    let convertedAny = false;

    for (const solvedBus of (solverResult.busResults || [])) {
      if (solvedBus.type !== 'PV') {
        continue;
      }

      const limits = generatorLimits.get(solvedBus.id);

      if (!limits) {
        continue;
      }

      const modelBus = system.buses.find(
        bus => bus.id === solvedBus.id
      );

      if (!modelBus) {
        continue;
      }

      // Actual generator Q = network injection + bus reactive load.
      const solvedQgen = solvedBus.Q_calc + solvedBus.Qload;

      if (solvedQgen > limits.Qmax + limitTolerance) {
        modelBus.type = 'PQ';
        modelBus.Qgen = limits.Qmax;
        convertedAny = true;
      } else if (solvedQgen < limits.Qmin - limitTolerance) {
        modelBus.type = 'PQ';
        modelBus.Qgen = limits.Qmin;
        convertedAny = true;
      }
    }

    // No violations remain, so this solution is final.
    if (!convertedAny) {
      break;
    }
  }




  // ======================================
  // Convert output to LoadFlowResult_local
  // ======================================

  const result = new LoadFlowResult_local({

    method: "Gauss-Seidel",

    converged: solverResult.converged,

    iterations: totalIterations,

    baseMVA: baseMVA,

    convergenceHistory: combinedConvergenceLog

  });



  // Backfill slack bus Pgen/Qgen from computed injection.

  for (const bus of solverResult.busResults) {

    const isSlack = (bus.type === "Slack");

    const Pgen = isSlack
      ? bus.P_calc + bus.Pload
      : bus.Pgen;

    const Qgen =
      (bus.type === "Slack" || bus.type === "PV")
        ? bus.Q_calc + bus.Qload
        : bus.Qgen;


    result.addBusResult({

      id: bus.id,

      type: bus.type,


      V: bus.V,

      delta_deg: bus.delta_deg,


      P_calc: bus.P_calc,

      Q_calc: bus.Q_calc,


      Pgen:  Pgen,

      Qgen:  Qgen,


      Pload: bus.Pload,

      Qload: bus.Qload

    });


  }



  result.calculateSummary();



  return result;

}



if (typeof window !== "undefined") {
  window.solveGaussSeidelV2 = solveGaussSeidelV2;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { solveGaussSeidelV2 };
}