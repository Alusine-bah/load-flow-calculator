// test-fault-analysis.js
// Test fault analysis


global.window = global;


require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');

require('./js/matrix.js');

require('./js/matrix-inverse.js');

require('./js/ybus-v2.js');
require('./js/zbus.js');

require('./js/units.js');

require('./js/fault-analysis.js');



const system =
  loadSystemV2("4bus");



// Calculate Zbus

const zbus =
  calculateZbus(system);



const fault =
  calculateFaultAnalysis(
    system,
    zbus,
    2
  );



printFaultReport(fault);


console.log("PASS");