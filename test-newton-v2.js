// test-newton-v2.js
// Validate Newton-Raphson through PowerSystem V2 adapter

global.window = global;

require('./js/complex.js');
require('./js/data.js');
require('./js/models.js');
require('./js/system-loader-v2.js');

require('./js/ybus.js');
require('./js/newton.js');
require('./js/newton-v2.js');


function compare(name) {

  console.log(`\n===== ${name} =====`);

  const v2System = loadSystemV2(name);


  // V2 adapter solution
  const resultV2 = solveNewtonV2(v2System);


  // Existing solver solution
  const oldSystem = cloneSystem(SYSTEMS[name]);
  const resultOld = solveNewton(oldSystem);


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

    const vDiff = Math.abs(
      resultV2.busResults[i].V -
      resultOld.busResults[i].V
    );


    const aDiff = Math.abs(
      resultV2.busResults[i].delta_deg -
      resultOld.busResults[i].delta_deg
    );


    if (vDiff > maxDV) maxDV = vDiff;
    if (aDiff > maxDA) maxDA = aDiff;
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
    maxDV < 1e-10 && maxDA < 1e-8
      ? "PASS: V2 Newton matches old solver"
      : "FAIL: mismatch"
  );
}


compare("4bus");
compare("5bus");
compare("9bus");