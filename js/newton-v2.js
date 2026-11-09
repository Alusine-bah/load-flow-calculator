
// newton-v2.js
// Adapter between PowerSystem V2 model and Newton solver
//
// Supports:
// - Bus conversion
// - Transmission line conversion
// - Transformer conversion
// - Independent bus shunts
// - Generator reactive power limits
// - PV to PQ bus conversion
//
// Converts solver output into common LoadFlowResult format.

var solveNewton_local, LoadFlowResult_local;

if (typeof require !== "undefined") {
  ({ solveNewton: solveNewton_local } = require("./newton.js"));
  ({ LoadFlowResult: LoadFlowResult_local } = require("./results.js"));
}

if (typeof window !== "undefined") {
  solveNewton_local = window.solveNewton;
  LoadFlowResult_local = window.LoadFlowResult;
}


// ======================================
// MAIN NEWTON V2 ADAPTER
// ======================================

function solveNewtonV2(powerSystem) {

  if (!powerSystem || !Array.isArray(powerSystem.buses)) {
    throw new Error("Invalid PowerSystem V2 model.");
  }

  const baseMVA = powerSystem.baseMVA || 100;

  const system = {

    name: powerSystem.name,

    baseMVA,

    baseKV: powerSystem.baseKV,

    useV2Ybus: true,

    tol: 1e-9,

    maxIter: 30,

    buses: [],

    lines: [],

    transformers: [],

    shunts: []

  };


  // ======================================
  // 1. CONVERT BUSES
  // ======================================

  for (const bus of powerSystem.buses) {

    system.buses.push({

      id: bus.id,

      type: bus.type,

      V: bus.V,

      delta: bus.delta,

      Pgen: bus.Pgen || 0,

      Qgen: bus.Qgen || 0,

      Pload: bus.Pload || 0,

      Qload: bus.Qload || 0

    });

  }


  // ======================================
  // 2. CONVERT TRANSMISSION LINES
  // ======================================

  for (const line of (powerSystem.lines || [])) {

    system.lines.push({

      from: line.from,

      to: line.to,

      R: line.R,

      X: line.X,

      B: line.B,

      G: line.G || 0,

      ratingMVA: line.ratingMVA ?? null

    });

  }


  // ======================================
  // 3. CONVERT TRANSFORMERS
  // ======================================

  for (const transformer of (powerSystem.transformers || [])) {

    system.transformers.push({

      from: transformer.from,

      to: transformer.to,

      R: transformer.R,

      X: transformer.X,

      tapRatio: transformer.tapRatio ?? 1.0,

      phaseShift: transformer.phaseShift ?? 0,

      G: transformer.G ?? 0,

      B: transformer.B ?? 0,

      ratingMVA: transformer.ratingMVA ?? null

    });

  }


  // ======================================
  // 4. CONVERT INDEPENDENT BUS SHUNTS
  // ======================================

  for (const shunt of (powerSystem.shunts || [])) {

    system.shunts.push({

      busId: shunt.busId,

      G: shunt.G,

      B: shunt.B

    });

  }


  // ======================================
  // 5. AGGREGATE GENERATOR REACTIVE LIMITS
  // ======================================

  const generatorLimits = new Map();

  for (const generator of (powerSystem.generators || [])) {

    const modelBus = system.buses.find(
      bus => bus.id === generator.busId
    );

    if (!modelBus) {

      throw new Error(
        'Generator references unknown bus ' +
        generator.busId + '.'
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

      generatorLimits.set(
        generator.busId,
        { Qmin, Qmax }
      );

    }

  }


  // ======================================
  // 6. NEWTON-RAPHSON SOLUTION
  // WITH GENERATOR Q LIMIT ENFORCEMENT
  // ======================================

  let solverResult = null;

  let totalIterations = 0;

  const combinedConvergenceLog = [];

  const limitTolerance = 1e-8;

  const maxLimitPasses = system.buses.length + 1;


  for (let pass = 0; pass < maxLimitPasses; pass++) {

    const iterationOffset = totalIterations;

    solverResult = solveNewton_local(system);

    if (!solverResult) {

      throw new Error(
        'Newton solver returned no result.'
      );

    }


    // Count iterations.

    const passIterations =
      Number.isFinite(solverResult.iterations)
        ? solverResult.iterations
        : 0;

    totalIterations += passIterations;


    // Combine convergence history.

    for (const entry of (solverResult.convergenceLog || [])) {

      combinedConvergenceLog.push({

        ...entry,

        iter: Number.isFinite(entry.iter)
          ? iterationOffset + entry.iter
          : combinedConvergenceLog.length + 1

      });

    }


    // Never enforce limits using an unconverged solution.

    if (!solverResult.converged) {

      break;

    }


    let convertedAny = false;


    // Check PV bus reactive power limits.

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


      // Actual generator Q:
      // Net bus Q injection + bus reactive load.

      const solvedQgen =
        solvedBus.Q_calc + solvedBus.Qload;


      if (solvedQgen > limits.Qmax + limitTolerance) {

        modelBus.type = 'PQ';

        modelBus.Qgen = limits.Qmax;

        convertedAny = true;

      } else if (
        solvedQgen < limits.Qmin - limitTolerance
      ) {

        modelBus.type = 'PQ';

        modelBus.Qgen = limits.Qmin;

        convertedAny = true;

      }

    }


    // No violations remain.

    if (!convertedAny) {

      break;

    }


    // Use previous solution as next initial estimate.

    for (const solvedBus of (solverResult.busResults || [])) {

      const modelBus = system.buses.find(
        bus => bus.id === solvedBus.id
      );

      if (modelBus) {

        modelBus.V = solvedBus.V;

        modelBus.delta = solvedBus.delta_deg;

      }

    }

  }


  // ======================================
  // 7. CREATE LOAD FLOW RESULT
  // ======================================

  const result = new LoadFlowResult_local({

    method: 'Newton-Raphson',

    converged: solverResult.converged,

    iterations: totalIterations,

    baseMVA,

    convergenceHistory: combinedConvergenceLog

  });


  // ======================================
  // 8. CONVERT SOLVED BUS RESULTS
  // ======================================

  for (const bus of (solverResult.busResults || [])) {

    const isSlack = bus.type === 'Slack';

    const Pgen = isSlack

      ? bus.P_calc + bus.Pload

      : bus.Pgen;


    const Qgen =

      (bus.type === 'Slack' || bus.type === 'PV')

        ? bus.Q_calc + bus.Qload

        : bus.Qgen;


    result.addBusResult({

      id: bus.id,

      type: bus.type,

      V: bus.V,

      delta_deg: bus.delta_deg,

      P_calc: bus.P_calc,

      Q_calc: bus.Q_calc,

      Pgen,

      Qgen,

      Pload: bus.Pload,

      Qload: bus.Qload

    });

  }


  // ======================================
  // 9. CALCULATE SUMMARY
  // ======================================

  result.calculateSummary();

  return result;

}


// ======================================
// EXPORTS
// ======================================

if (typeof window !== "undefined") {

  window.solveNewtonV2 = solveNewtonV2;

}

if (
  typeof module !== "undefined" &&
  module.exports
) {

  module.exports = { solveNewtonV2 };

}
