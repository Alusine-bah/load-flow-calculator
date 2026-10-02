// gaussseidel-v2.js
// Adapter between PowerSystem V2 model and existing Gauss-Seidel solver
// Converts output into common LoadFlowResult format


function solveGaussSeidelV2(powerSystem) {


  // ======================================
  // Convert PowerSystem V2 to solver format
  // ======================================

  const system = {

    name: powerSystem.name,

    baseMVA: powerSystem.baseMVA,

    baseKV: powerSystem.baseKV,


    tol: 1e-9,

    maxIter: 2000,


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



window.solveGaussSeidelV2 = solveGaussSeidelV2;