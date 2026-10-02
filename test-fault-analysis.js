// test-fault-analysis.js
// Test fault analysis


global.window = global;


// Core

require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');



// Ybus

require('./js/ybus.js');

require('./js/ybus-v2.js');



// Matrix + Zbus

require('./js/matrix.js');

require('./js/matrix-inverse.js');

require('./js/zbus.js');



// Solver

require('./js/results.js');

require('./js/newton.js');

require('./js/newton-v2.js');

require('./js/gaussseidel.js');

require('./js/gaussseidel-v2.js');

require('./js/solver.js');



// Analysis

require('./js/units.js');

require('./js/fault-analysis.js');

const system =
  loadSystemV2("4bus");



// Calculate Zbus

const zbus =
  calculateZbus(system);



// Solve load flow first

const result =
  solvePowerFlow(
    system,
    {
      method: "Newton-Raphson"
    }
  );



const fault =
  calculateFaultAnalysis(
    system,
    zbus,
    2,
    result
  );


printFaultReport(fault);


console.log("PASS");