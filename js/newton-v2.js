// newton-v2.js
// Adapter between PowerSystem V2 model and Newton solver
// Converts solver output into common LoadFlowResult_local format

var solveNewton_local, LoadFlowResult_local;

if (typeof require !== "undefined") {
  ({ solveNewton: solveNewton_local } = require("./newton.js"));
  ({ LoadFlowResult: LoadFlowResult_local } = require("./results.js"));
}

if (typeof window !== "undefined") {
  solveNewton_local = window.solveNewton;
  LoadFlowResult_local = window.LoadFlowResult;
}

function solveNewtonV2(powerSystem) {
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
    shunts: []
  };

  // Convert buses.
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

  // Convert lines.
  for (const line of powerSystem.lines) {
    system.lines.push({
      from: line.from,
      to: line.to,
      R: line.R,
      X: line.X,
      B: line.B
    });
  }

  // Convert independent bus shunts.
  for (const shunt of (powerSystem.shunts || [])) {
    system.shunts.push({
      busId: shunt.busId,
      G: shunt.G,
      B: shunt.B
    });
  }

  // Aggregate generator reactive limits at each bus.
  // Limits are in per-unit, consistent with the power-system model.
  const generatorLimits = new Map();

  for (const generator of (powerSystem.generators || [])) {
    const modelBus = system.buses.find(
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

  // Re-solve after converting any violating PV buses to PQ.
  let solverResult = null;
  let totalIterations = 0;
  const combinedConvergenceLog = [];
  const limitTolerance = 1e-8;
  const maxLimitPasses = system.buses.length + 1;

  for (let pass = 0; pass < maxLimitPasses; pass++) {
    const iterationOffset = totalIterations;

    solverResult = solveNewton_local(system);

    if (!solverResult) {
      throw new Error('Newton solver returned no result.');
    }

    const passIterations = Number.isFinite(solverResult.iterations)
      ? solverResult.iterations
      : 0;

    totalIterations += passIterations;

    for (const entry of (solverResult.convergenceLog || [])) {
      combinedConvergenceLog.push({
        ...entry,
        iter: Number.isFinite(entry.iter)
          ? iterationOffset + entry.iter
          : combinedConvergenceLog.length + 1
      });
    }

    // Never enforce limits from an unconverged intermediate solution.
    if (!solverResult.converged) {
      break;
    }

    let convertedAny = false;

    for (const solvedBus of solverResult.busResults || []) {
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

      // Actual generator Q = net bus Q injection + bus Q load.
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

    if (!convertedAny) {
      break;
    }

    // Use the previous solution as the next initial estimate.
    for (const solvedBus of solverResult.busResults || []) {
      const modelBus = system.buses.find(
        bus => bus.id === solvedBus.id
      );

      if (modelBus) {
        modelBus.V = solvedBus.V;
        modelBus.delta = solvedBus.delta_deg;
      }
    }
  }

  const result = new LoadFlowResult_local({
    method: 'Newton-Raphson',
    converged: solverResult.converged,
    iterations: totalIterations,
    baseMVA,
    convergenceHistory: combinedConvergenceLog
  });

  // Report actual solved generation at the slack bus and
  // unconstrained PV buses. A converted PQ bus retains its
  // enforced reactive-generation limit.
  for (const bus of solverResult.busResults || []) {
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

  result.calculateSummary();

  return result;
}


if (typeof window !== "undefined") {
  window.solveNewtonV2 = solveNewtonV2;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { solveNewtonV2 };
}