// test-zbus.js
// Validate Zbus calculation from Ybus inverse


global.window = global;


require('./js/complex.js');
require('./js/data.js');

require('./js/models.js');
require('./js/system-loader-v2.js');

require('./js/ybus-v2.js');

require('./js/matrix.js');
require('./js/matrix-inverse.js');

require('./js/zbus.js');



function test(name) {

  console.log(`\n===== ${name} =====`);


  const system = loadSystemV2(name);


  const Ybus = buildYbusV2(system);

  const Zbus = calculateZbus(system);


  const I = Matrix.multiply(
    Ybus,
    Zbus
  );


  const identity = Matrix.identity(
    system.numberOfBuses
  );


  const error = Matrix.maxDifference(
    I,
    identity
  );


  console.log(
    "Maximum Ybus × Zbus - I error:",
    error.toExponential(3)
  );


  console.log(
    error < 1e-10
      ? "PASS: Zbus verification successful"
      : "FAIL: Zbus verification failed"
  );

}



test("4bus");
test("5bus");
test("9bus");