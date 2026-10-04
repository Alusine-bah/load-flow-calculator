// solver.js
// Unified power flow solver interface for V2 engine

let solveNewtonV2, solveGaussSeidelV2;

if (typeof require !== "undefined") {
  try {
    ({ solveNewtonV2 } = require("./newton-v2.js"));
    ({ solveGaussSeidelV2 } = require("./gaussseidel-v2.js"));
  } catch (e) {
    console.error("solver.js: failed to load V2 solvers —", e.message);
  }
}

if (typeof window !== "undefined") {
  solveNewtonV2 = window.solveNewtonV2;
  solveGaussSeidelV2 = window.solveGaussSeidelV2;
}

function solvePowerFlow(
  system,
  options = {}
) {


  // -----------------------------------
  // Validate power system before solving
  // -----------------------------------

  if (
    system &&
    typeof system.validate === "function"
  ) {

    const result = system.validate();

    if (!result.valid) {

      return {
        success: false,
        method: options.method || "Newton-Raphson",
        errors: result.errors
      };

    }

  }


  // -----------------------------------
  // Dispatch to selected solver
  // -----------------------------------

  const method =
    options.method || "Newton-Raphson";


  try {

    if (method === "Newton-Raphson") {

      return solveNewtonV2(system, options);

    }


    if (method === "Gauss-Seidel") {

      return solveGaussSeidelV2(system, options);

    }


    throw new Error(
      "Unknown power flow method: " + method
    );

  } catch (err) {

    return {
      success: false,
      method,
      errors: [err.message]
    };

  }

}



// ----------------------------
// Exports (Browser + Node.js)
// ----------------------------

if (typeof window !== "undefined") {
  window.solvePowerFlow = solvePowerFlow;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { solvePowerFlow };
}