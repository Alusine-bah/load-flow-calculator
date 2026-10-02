// test-contingency.js
// Test N-1 line outage analysis with impact and thermal study


global.window = global;


// ======================================
// Dependencies
// ======================================

require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');


// ======================================
// Network
// ======================================

require('./js/ybus.js');

require('./js/results.js');


// ======================================
// Solver
// ======================================

require('./js/newton.js');

require('./js/newton-v2.js');

require('./js/solver.js');


// ======================================
// Analysis
// ======================================

require('./js/units.js');

require('./js/line-flow.js');

require('./js/contingency.js');

require('./js/contingency-analysis.js');

require('./js/contingency-thermal.js');




// ======================================
// Load System
// ======================================

const system =
  loadSystemV2("4bus");



// ======================================
// Line Ratings
// ======================================

system.lines[0].ratingMVA = 100;

system.lines[1].ratingMVA = 80;

system.lines[2].ratingMVA = 50;

system.lines[3].ratingMVA = 20;




// ======================================
// Run N-1 Contingency
// Remove line 2-4
// ======================================

const result =
  analyzeContingency(

    system,

    {
      from: 2,
      to: 4
    }

  );





// ======================================
// Basic Contingency Result
// ======================================

printContingencyResult(
  result
);





// ======================================
// Voltage and Loss Impact
// ======================================

const impact =
  analyzeContingencyImpact(
    result
  );


printContingencyImpact(
  impact
);





// ======================================
// Thermal Impact
// ======================================

const thermalImpact =
  calculateThermalImpact(

    system,

    result.baseResult,

    result.outageSystem,

    result.outageResult

  );


printThermalImpact(
  thermalImpact
);





console.log("PASS");