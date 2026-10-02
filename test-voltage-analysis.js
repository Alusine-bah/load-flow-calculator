// test-voltage-analysis.js
// Test voltage profile analysis


global.window = global;


require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');


require('./js/ybus.js');

require('./js/newton.js');


require('./js/results.js');

require('./js/newton-v2.js');

require('./js/solver.js');


require('./js/voltage-analysis.js');



const system = loadSystemV2("4bus");



const result = solvePowerFlow(
  system,
  {
    method: "Newton-Raphson"
  }
);



const report = analyzeVoltageProfile(
  result
);



printVoltageProfile(report);