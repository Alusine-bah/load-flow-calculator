// solver.js
// Unified power flow solver interface for V2 engine


function solvePowerFlow(system, options = {}) {


  const method =
    options.method || "Newton-Raphson";



  if (method === "Newton-Raphson") {

    return solveNewtonV2(system);

  }



  if (method === "Gauss-Seidel") {

    return solveGaussSeidelV2(system);

  }



  throw new Error(
    "Unknown power flow method: " + method
  );

}



window.solvePowerFlow = solvePowerFlow;