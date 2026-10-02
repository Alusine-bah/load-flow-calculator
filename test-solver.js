// test-solver.js
// Validate unified solver interface


global.window = global;


// Core

require('./js/complex.js');


// Data

require('./js/data.js');


// V2 model

require('./js/models.js');

require('./js/system-loader-v2.js');


// Network

require('./js/ybus.js');

require('./js/ybus-v2.js');


// Solvers

require('./js/newton.js');

require('./js/gaussseidel.js');

require('./js/newton-v2.js');

require('./js/gaussseidel-v2.js');


// Result model

require('./js/results.js');


// Unified interface

require('./js/solver.js');



function test(method, systemName) {


  console.log(
    `\n===== ${method} : ${systemName} =====`
  );


  const system = loadSystemV2(systemName);



  const result = solvePowerFlow(
    system,
    {
      method: method
    }
  );



  console.log(
    "Converged:",
    result.converged
  );


  console.log(
    "Iterations:",
    result.iterations
  );


  console.log(
    "Buses:",
    result.buses.length
  );


  console.log(
    result.converged
      ? "PASS"
      : "FAIL"
  );

}



test(
  "Newton-Raphson",
  "4bus"
);


test(
  "Gauss-Seidel",
  "4bus"
);