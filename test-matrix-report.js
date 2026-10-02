// test-matrix-report.js
// Test matrix reporting utilities


global.window = global;


require('./js/complex.js');
require('./js/data.js');

require('./js/models.js');
require('./js/system-loader-v2.js');

require('./js/ybus-v2.js');

require('./js/matrix.js');
require('./js/matrix-inverse.js');
require('./js/zbus.js');

require('./js/matrix-report.js');



function test(name) {

  console.log(`\n================ ${name} ================`);


  const system = loadSystemV2(name);


  const Ybus = buildYbusV2(system);

  const Zbus = calculateZbus(system);


  matrixSummary(
    Ybus,
    `${name} Ybus`
  );


  printMatrixRectangular(
    Ybus,
    `${name} Ybus`
  );


  printMatrixPolar(
    Ybus,
    `${name} Ybus`
  );


  matrixSummary(
    Zbus,
    `${name} Zbus`
  );

}



test("4bus");
test("9bus");