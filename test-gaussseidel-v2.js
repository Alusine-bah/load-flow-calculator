// test-gaussseidel-v2.js
// Validate Gauss-Seidel through PowerSystem V2 adapter

global.window = global;

require('./js/complex.js');
require('./js/data.js');
require('./js/models.js');
require('./js/system-loader-v2.js');

require('./js/ybus.js');
require('./js/gaussseidel.js');
require('./js/gaussseidel-v2.js');


function compare(name) {

  console.log(`\n===== ${name} =====`);

  const v2System = loadSystemV2(name);

  const resultV2 = solveGaussSeidelV2(v2System);


  const oldSystem = cloneSystem(SYSTEMS[name]);
  oldSystem.maxIter = 2000;

  const resultOld = solveGaussSeidel(oldSystem);


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


  for (let i = 0; i < resultV2.busResults.length; i++) {

    const dV = Math.abs(
      resultV2.busResults[i].V -
      resultOld.busResults[i].V
    );


    const dA = Math.abs(
      resultV2.busResults[i].delta_deg -
      resultOld.busResults[i].delta_deg
    );


    if (dV > maxDV) maxDV = dV;
    if (dA > maxDA) maxDA = dA;
  }


  console.log(
    "Maximum voltage difference:",
    maxDV.toExponential(3)
  );


  console.log(
    "Maximum angle difference:",
    maxDA.toExponential(3)
  );


  console.log(
    maxDV < 1e-10 && maxDA < 1e-6
      ? "PASS: V2 GS matches old solver"
      : "FAIL: mismatch"
  );
}


compare("4bus");
compare("5bus");
compare("9bus");