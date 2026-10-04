// gaussseidel-v2.js
// Adapter between PowerSystem V2 model and existing Gauss-Seidel solver
// Converts output into common LoadFlowResult format

var solveGaussSeidel, LoadFlowResult;

if (typeof require !== "undefined") {
  ({ solveGaussSeidel } = require("./gaussseidel.js"));
  ({ LoadFlowResult } = require("./results.js"));
}

if (typeof window !== "undefined") {
  solveGaussSeidel = window.solveGaussSeidel;
  LoadFlowResult = window.LoadFlowResult;
}


function solveGaussSeidelV2(powerSystem) {


  // ======================================
  // Convert PowerSystem V2 to solver format
  // ======================================

  const baseMVA = powerSystem.baseMVA || 100;

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

  const solverResult = solveGaussSeidel(system);




  // ======================================
  // Convert output to LoadFlowResult
  // ======================================

  const result = new LoadFlowResult({

    method: "Gauss-Seidel",

    converged: solverResult.converged,

    iterations: solverResult.iterations,

    baseMVA: baseMVA,

    convergenceHistory: solverResult.convergenceLog || []

  });



  // Backfill slack bus Pgen/Qgen from computed injection.

  for (const bus of solverResult.busResults) {

    const isSlack = (bus.type === "Slack");

    const Pgen = isSlack
      ? bus.P_calc + bus.Pload
      : bus.Pgen;

    const Qgen = isSlack
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