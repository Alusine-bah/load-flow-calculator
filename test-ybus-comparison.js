// test-ybus-comparison.js
// Compare old Ybus builder and V2 Ybus builder

global.window = global;

require('./js/complex.js');
require('./js/data.js');
require('./js/ybus.js');

require('./js/models.js');
require('./js/system-loader-v2.js');
require('./js/ybus-v2.js');


function compareYbus(name) {

  console.log(`\n===== ${name} =====`);

  const oldSystem = cloneSystem(
    SYSTEMS[name]
  );

  const newSystem = loadSystemV2(name);


  const Yold = buildYbus(oldSystem);

  const Ynew = buildYbusV2(newSystem);


  let maxDiff = 0;


  for (let i = 0; i < Yold.length; i++) {

    for (let j = 0; j < Yold.length; j++) {

      const dre = Math.abs(
        Yold[i][j].re - Ynew[i][j].re
      );

      const dim = Math.abs(
        Yold[i][j].im - Ynew[i][j].im
      );

      const diff = Math.max(dre, dim);

      if (diff > maxDiff) {
        maxDiff = diff;
      }
    }
  }


  console.log(
    "Maximum Ybus difference:",
    maxDiff.toExponential(3)
  );


  console.log(
    maxDiff < 1e-12
      ? "PASS: Ybus matrices are identical"
      : "FAIL: Ybus mismatch"
  );
}


compareYbus("4bus");
compareYbus("5bus");
compareYbus("9bus");