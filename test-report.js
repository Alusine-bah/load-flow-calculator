// test-report.js
// Test complete load flow report with fault analysis and fault studies


global.window = global;


// ======================================
// Dependencies
// ======================================

require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');


// Network

require('./js/ybus.js');

require('./js/ybus-v2.js');

require('./js/matrix.js');

require('./js/matrix-inverse.js');

require('./js/zbus.js');


// Solver

require('./js/results.js');

require('./js/newton.js');

require('./js/newton-v2.js');

require('./js/solver.js');


// Analysis

require('./js/units.js');

require('./js/line-flow.js');

require('./js/voltage-analysis.js');

require('./js/line-rating.js');

require('./js/fault-analysis.js');

require('./js/fault-study.js');

require('./js/fault-location-study.js');


// Report

require('./js/report.js');




// ======================================
// Load system
// ======================================

const system =
  loadSystemV2("4bus");




// ======================================
// Solve load flow
// ======================================

const result =
  solvePowerFlow(
    system,
    {
      method: "Newton-Raphson"
    }
  );




// ======================================
// Line flow
// ======================================

const lineFlows =
  calculateLineFlows(
    system,
    result
  );




// ======================================
// Line ratings
// ======================================

system.lines[0].ratingMVA = 100;

system.lines[1].ratingMVA = 80;

system.lines[2].ratingMVA = 50;

system.lines[3].ratingMVA = 20;



const lineRatings =
  analyzeLineRatings(
    system,
    lineFlows
  );




// ======================================
// Voltage analysis
// ======================================

const voltageReport =
  analyzeVoltageProfile(
    result
  );




// ======================================
// Fault analysis
// ======================================

const zbus =
  calculateZbus(
    system
  );



const faultReport =
  calculateFaultAnalysis(
    system,
    zbus,
    2,
    result,
    {
      faultType: "Three Phase",
      faultImpedance: 0.05
    }
  );




// ======================================
// Fault location study
// ======================================

const faultLocationStudy =
  runFaultLocationStudy(

    system,

    zbus,

    result,

    {
      faultType: "Three Phase",
      faultImpedance: 0.05
    }

  );




// ======================================
// Fault severity study
// ======================================

const faultSeverityStudy =
  runFaultSeverityStudy(

    system,

    zbus,

    2,

    result,

    [
      0,
      0.05,
      0.10,
      0.20
    ]

  );




// ======================================
// Create report
// ======================================

const report =
  createLoadFlowReport(

    system,

    result,

    lineFlows,

    voltageReport,

    lineRatings,

    faultReport,

    faultLocationStudy,

    faultSeverityStudy

  );




// ======================================
// Print report
// ======================================

printLoadFlowReport(report);