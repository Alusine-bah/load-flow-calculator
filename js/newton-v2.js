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

  const system = {

    name: powerSystem.name,

    baseMVA: powerSystem.baseMVA,

    baseKV: powerSystem.baseKV,

    useV2Ybus: true,


    tol: 1e-9,

    maxIter: 30,


    buses: [],

    lines: []

  };



  // Convert buses

  for (const bus of powerSystem.buses) {

    system.buses.push({

      id: bus.id,

      type: bus.type,


      V: bus.V,

      delta: bus.delta,


      Pgen: bus.Pgen,

      Qgen: bus.Qgen,


      Pload: bus.Pload,

      Qload: bus.Qload

    });

  }



  // Convert lines

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

    convergenceHistory: solverResult.convergenceLog || []

  });



  for (const bus of solverResult.busResults) {


    result.addBusResult({

      id: bus.id,

      type: bus.type,


      V: bus.V,

      delta_deg: bus.delta_deg,


      P_calc: bus.P_calc,

      Q_calc: bus.Q_calc,


      Pgen: bus.Pgen,

      Qgen: bus.Qgen,


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