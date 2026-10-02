// test-report.js
// Test complete load flow report


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


require('./js/line-flow.js');

require('./js/voltage-analysis.js');

require('./js/report.js');



const system = loadSystemV2("4bus");



const result = solvePowerFlow(
  system,
  {
    method: "Newton-Raphson"
  }
);



const lineFlows =
  calculateLineFlows(
    system,
    result
  );



const voltageReport =
  analyzeVoltageProfile(
    result
  );



const report =
  createLoadFlowReport(
    system,
    result,
    lineFlows,
    voltageReport
  );



printLoadFlowReport(report);