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
require('./js/units.js');
require('./js/line-rating.js');
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

system.lines[0].ratingMVA = 100;
system.lines[1].ratingMVA = 80;
system.lines[2].ratingMVA = 50;
system.lines[3].ratingMVA = 20;


const lineRatings =
  analyzeLineRatings(
    system,
    lineFlows
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
    voltageReport,
    lineRatings
  );


printLoadFlowReport(report);