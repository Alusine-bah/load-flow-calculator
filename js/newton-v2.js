// newton-v2.js
// Adapter between PowerSystem V2 model and Newton solver
// Converts solver output into common LoadFlowResult format

let solveNewton, LoadFlowResult;

if (typeof require !== "undefined") {
  ({ solveNewton } = require("./newton.js"));
  ({ LoadFlowResult } = require("./results.js"));
}

if (typeof window !== "undefined") {
  solveNewton = window.solveNewton;
  LoadFlowResult = window.LoadFlowResult;
}


function solveNewtonV2(powerSystem) {

  // ---------------------------------------
  // Convert V2 PowerSystem to solver format
  // ---------------------------------------

  const baseMVA = powerSystem.baseMVA || 100;

  const system = {

    name: powerSystem.name,

    baseMVA: baseMVA,

    baseKV: powerSystem.baseKV,

    useV2Ybus: true,


    tol: 1e-9,

    maxIter: 30,


    buses: [],

    lines: []

  };



  // Convert buses (MW/MVAr → pu)

  for (const bus of powerSystem.buses) {

    system.buses.push({

      id: bus.id,

      type: bus.type,


      V: bus.V,

      delta: bus.delta,


      Pgen:  (bus.Pgen  || 0) / baseMVA,

      Qgen:  (bus.Qgen  || 0) / baseMVA,


      Pload: (bus.Pload || 0) / baseMVA,

      Qload: (bus.Qload || 0) / baseMVA

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



  // ---------------------------------------
  // Run existing Newton solver
  // ---------------------------------------

  const solverResult = solveNewton(system);



  // ---------------------------------------
  // Convert to common result model
  // ---------------------------------------

  const result = new LoadFlowResult({

    method: "Newton-Raphson",

    converged: solverResult.converged,

    iterations: solverResult.iterations,

    baseMVA: baseMVA,

    convergenceHistory: solverResult.convergenceLog || []

  });



  // Convert back to MW/MVAr for presentation

  for (const bus of solverResult.busResults) {

    const isSlack = (bus.type === "Slack");

    // At the slack bus, actual generation = computed injection + load.
    // At all other buses, Pgen/Qgen are the scheduled values from input.
    const Pgen_MW  = isSlack
      ? (bus.P_calc * baseMVA) + (bus.Pload * baseMVA)
      : (bus.Pgen * baseMVA);

    const Qgen_MVAr = isSlack
      ? (bus.Q_calc * baseMVA) + (bus.Qload * baseMVA)
      : (bus.Qgen * baseMVA);


    result.addBusResult({

      id: bus.id,

      type: bus.type,


      V: bus.V,

      delta_deg: bus.delta_deg,


      P_calc: bus.P_calc * baseMVA,

      Q_calc: bus.Q_calc * baseMVA,


      Pgen:  Pgen_MW,

      Qgen:  Qgen_MVAr,


      Pload: bus.Pload * baseMVA,

      Qload: bus.Qload * baseMVA

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