// test-gaussseidel-v2.js
// Validate Gauss-Seidel through PowerSystem V2 adapter


global.window = global;


// ======================================
// Load dependencies in correct order
// ======================================


// Complex engine
require('./js/complex.js');


// Old system data
require('./js/data.js');


// V2 model
require('./js/models.js');

require('./js/system-loader-v2.js');


// Old Gauss-Seidel dependencies
require('./js/ybus.js');

require('./js/gaussseidel.js');


// V2 dependencies
require('./js/ybus-v2.js');

require('./js/results.js');

require('./js/gaussseidel-v2.js');



// ======================================
// Compare V2 GS with old GS
// ======================================

function compare(name) {


  console.log(`\n===== ${name} =====`);



  // Load V2 system

  const v2System = loadSystemV2(name);



  // Run V2 adapter

  const resultV2 = solveGaussSeidelV2(
    v2System
  );



  // Run old solver

  const oldSystem = cloneSystem(
    SYSTEMS[name]
  );


  oldSystem.maxIter = 2000;


  const resultOld = solveGaussSeidel(
    oldSystem
  );



  console.log(
    "V2 converged:",
    resultV2.converged
  );


  console.log(
    "Old converged:",
    resultOld.converged
  );



  let maxDV = 0;

  let maxDA = 0;



  // Compare voltage and angle

  for (
    let i = 0;
    i < resultV2.buses.length;
    i++
  ) {


    const v2Bus = resultV2.buses[i];

    const oldBus = resultOld.busResults[i];



    const dV = Math.abs(
      v2Bus.V -
      oldBus.V
    );



    const dA = Math.abs(
      v2Bus.delta_deg -
      oldBus.delta_deg
    );



    if (dV > maxDV) {

      maxDV = dV;

    }


    if (dA > maxDA) {

      maxDA = dA;

    }

  }



  console.log(
    "Maximum voltage difference:",
    maxDV.toExponential(3)
  );


  console.log(
    "Maximum angle difference:",
    maxDA.toExponential(3)
  );



  const pass =
    maxDV < 1e-10 &&
    maxDA < 1e-6;



  console.log(

    pass

      ? "PASS: V2 GS matches old solver"

      : "FAIL: mismatch"

  );



  return pass;

}



// ======================================
// Run tests
// ======================================

const ok4 = compare("4bus");

const ok5 = compare("5bus");

const ok9 = compare("9bus");



process.exit(
  ok4 && ok5 && ok9
    ? 0
    : 1
);