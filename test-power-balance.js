// test-power-balance.js
//
// System-wide active-power balance regression test.
//
// For each built-in system, this test verifies:
//
//   total solved generation - total load
//        = sum of solved bus active-power injections
//        = sum of branch active-power losses
//
// These quantities are obtained through different calculation paths:
//
// 1. Solved generator/load data from LoadFlowResult
// 2. Sum of solved bus P_calc injections
// 3. Independent branch terminal-power calculations
//
// This is an internal conservation-of-power validation.
// It does not establish external benchmark provenance.

global.window = global;


// ============================================================
// Dependencies
// ============================================================

require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');

require('./js/ybus.js');

require('./js/results.js');

require('./js/newton.js');

require('./js/newton-v2.js');

require('./js/gaussseidel.js');

require('./js/gaussseidel-v2.js');

require('./js/solver.js');

require('./js/units.js');

require('./js/line-flow.js');


// ============================================================
// Configuration
// ============================================================

const SYSTEM_NAMES = [
  '4bus',
  '5bus',
  '9bus'
];


const TOL =
  1e-8;


let failures =
  0;


// ============================================================
// Test helpers
// ============================================================

function assert(
  condition,
  message
) {

  if (condition) {

    console.log(
      `PASS: ${message}`
    );

  }

  else {

    failures++;

    console.error(
      `FAIL: ${message}`
    );

  }

}


function sum(
  values
) {

  return values.reduce(
    (total, value) =>
      total + value,
    0
  );

}


function difference(
  a,
  b
) {

  return Math.abs(
    a - b
  );

}


// ============================================================
// Validate one system
// ============================================================

function checkSystem(
  systemName
) {

  console.log(
    `\n========== POWER BALANCE: ${systemName} ==========`
  );


  const system =
    loadSystemV2(
      systemName
    );


  const result =
    solvePowerFlow(
      system,
      {
        method:
          'Newton-Raphson'
      }
    );


  // ----------------------------------------------------------
  // Solver convergence
  // ----------------------------------------------------------

  assert(
    result &&
    result.converged === true,
    `${systemName} Newton-Raphson solution converged.`
  );


  if (
    !result ||
    result.converged !== true
  ) {

    return;

  }


  assert(
    Array.isArray(result.buses) &&
    result.buses.length ===
      system.buses.length,
    `${systemName} result contains one solved result per bus.`
  );


  // ----------------------------------------------------------
  // Solved generation and load
  // ----------------------------------------------------------

  const totalGenerationP =
    sum(
      result.buses.map(
        bus =>
          bus.Pgen || 0
      )
    );


  const totalLoadP =
    sum(
      result.buses.map(
        bus =>
          bus.Pload || 0
      )
    );


  const generationMinusLoad =
    totalGenerationP -
    totalLoadP;


  // ----------------------------------------------------------
  // Sum of solved bus active-power injections
  // ----------------------------------------------------------

  const busInjectionSum =
    sum(
      result.buses.map(
        bus =>
          bus.P_calc || 0
      )
    );


  // ----------------------------------------------------------
  // Independent branch-flow calculation
  // ----------------------------------------------------------

  const lineFlows =
    calculateLineFlows(
      system,
      result
    );


  assert(
    Array.isArray(lineFlows) &&
    lineFlows.length ===
      system.lines.length,
    `${systemName} line-flow result contains one result per modeled branch.`
  );


  const branchLossSum =
    sum(
      lineFlows.map(
        flow =>
          flow.P_loss
      )
    );


  // ----------------------------------------------------------
  // Result-model summary
  // ----------------------------------------------------------

  const summaryLoss =
    result.summary &&
    result.summary.losses
      ? result.summary.losses.P
      : NaN;


  // ----------------------------------------------------------
  // Differences
  // ----------------------------------------------------------

  const generationVsInjection =
    difference(
      generationMinusLoad,
      busInjectionSum
    );


  const injectionVsBranchLoss =
    difference(
      busInjectionSum,
      branchLossSum
    );


  const generationVsBranchLoss =
    difference(
      generationMinusLoad,
      branchLossSum
    );


  const summaryVsInjection =
    difference(
      summaryLoss,
      busInjectionSum
    );


  // ----------------------------------------------------------
  // Diagnostic output
  // ----------------------------------------------------------

  console.log(
    '\nActive-power quantities:'
  );


  console.log(
    `Total generation      = ${totalGenerationP.toFixed(12)} pu`
  );


  console.log(
    `Total load            = ${totalLoadP.toFixed(12)} pu`
  );


  console.log(
    `Generation - load     = ${generationMinusLoad.toFixed(12)} pu`
  );


  console.log(
    `Sum of bus injections = ${busInjectionSum.toFixed(12)} pu`
  );


  console.log(
    `Sum of branch losses  = ${branchLossSum.toFixed(12)} pu`
  );


  console.log(
    `Result summary loss   = ${summaryLoss.toFixed(12)} pu`
  );


  console.log(
    '\nBalance differences:'
  );


  console.log(
    `|Gen-Load - BusInj|   = ${generationVsInjection.toExponential(6)} pu`
  );


  console.log(
    `|BusInj - LineLoss|   = ${injectionVsBranchLoss.toExponential(6)} pu`
  );


  console.log(
    `|Gen-Load - LineLoss| = ${generationVsBranchLoss.toExponential(6)} pu`
  );


  console.log(
    `|Summary - BusInj|    = ${summaryVsInjection.toExponential(6)} pu`
  );


  console.log(
    `Tolerance             = ${TOL.toExponential(1)} pu`
  );


  // ----------------------------------------------------------
  // Assertions
  // ----------------------------------------------------------

  assert(
    Number.isFinite(
      totalGenerationP
    ),
    `${systemName} total generation is finite.`
  );


  assert(
    Number.isFinite(
      totalLoadP
    ),
    `${systemName} total load is finite.`
  );


  assert(
    Number.isFinite(
      busInjectionSum
    ),
    `${systemName} bus-injection sum is finite.`
  );


  assert(
    Number.isFinite(
      branchLossSum
    ),
    `${systemName} branch-loss sum is finite.`
  );


  assert(
    Number.isFinite(
      summaryLoss
    ),
    `${systemName} result-summary active-power loss is finite.`
  );


  assert(
    branchLossSum >= -TOL,
    `${systemName} total real branch loss is non-negative within tolerance.`
  );


  assert(
    generationVsInjection <= TOL,
    `${systemName} generation minus load equals solved bus-injection sum within tolerance.`
  );


  assert(
    injectionVsBranchLoss <= TOL,
    `${systemName} solved bus-injection sum equals branch active-power loss within tolerance.`
  );


  assert(
    generationVsBranchLoss <= TOL,
    `${systemName} generation minus load equals branch active-power loss within tolerance.`
  );


  assert(
    summaryVsInjection <= TOL,
    `${systemName} result summary loss equals solved bus-injection sum within tolerance.`
  );


  // ----------------------------------------------------------
  // Physical-unit cross-check
  // ----------------------------------------------------------

  const balanceMW =
    generationMinusLoad *
    system.baseMVA;


  const branchLossMW =
    branchLossSum *
    system.baseMVA;


  const mwDifference =
    difference(
      balanceMW,
      branchLossMW
    );


  console.log(
    '\nPhysical-unit cross-check:'
  );


  console.log(
    `Generation-load balance = ${balanceMW.toFixed(9)} MW`
  );


  console.log(
    `Branch active loss      = ${branchLossMW.toFixed(9)} MW`
  );


  console.log(
    `Difference              = ${mwDifference.toExponential(6)} MW`
  );


  assert(
    mwDifference <=
      TOL * system.baseMVA,
    `${systemName} MW-domain power balance is within the equivalent tolerance.`
  );

}


// ============================================================
// Run all built-in systems
// ============================================================

for (
  const systemName
  of SYSTEM_NAMES
) {

  checkSystem(
    systemName
  );

}


// ============================================================
// Final summary
// ============================================================

console.log(
  '\n=============================================='
);

console.log(
  'SYSTEM ACTIVE-POWER BALANCE TEST SUMMARY'
);

console.log(
  '=============================================='
);


if (
  failures === 0
) {

  console.log(
    `PASS: All ${SYSTEM_NAMES.length} systems satisfy active-power conservation.`
  );

}

else {

  console.error(
    `FAIL: ${failures} active-power balance check(s) failed.`
  );

}


process.exitCode =
  failures === 0
    ? 0
    : 1;