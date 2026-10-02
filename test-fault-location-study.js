// test-fault-location-study.js
// Test fault location comparison


global.window = global;


require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');


require('./js/ybus.js');

require('./js/ybus-v2.js');

require('./js/matrix.js');

require('./js/matrix-inverse.js');

require('./js/zbus.js');


require('./js/results.js');

require('./js/newton.js');

require('./js/newton-v2.js');

require('./js/solver.js');


require('./js/units.js');

require('./js/fault-analysis.js');

require('./js/fault-location-study.js');



const system =
  loadSystemV2("4bus");



const result =
  solvePowerFlow(
    system,
    {
      method: "Newton-Raphson"
    }
  );



const zbus =
  calculateZbus(system);



const study =
  runFaultLocationStudy(

    system,

    zbus,

    result,

    {

      faultType: "Three Phase",

      faultImpedance: 0.05

    }

  );



printFaultLocationStudy(study);


console.log("PASS");