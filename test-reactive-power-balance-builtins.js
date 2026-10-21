
/**
 * test-reactive-power-balance-builtins.js
 *
 * Validates reactive-power conservation for the built-in
 * 4-bus, 5-bus, and 9-bus systems.
 *
 * Checks:
 * 1. Newton-Raphson convergence.
 * 2. Reactive generation minus load equals solved bus injections.
 * 3. Bus injections agree with branch reactive losses and
 *    independent shunt contributions.
 * 4. Result summary agrees with solved bus injections.
 * 5. PV-bus reactive generation reflects the solved operating point.
 *
 * This is an internal conservation-of-power validation.
 * It does not establish external benchmark provenance.
 */

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

const TOL = 1e-8;

let failures = 0;
let pvGenerationChecks = 0;
let pvGenerationDiffersFromSchedule = 0;


// ============================================================
// Helpers
// ============================================================

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}


function sum(values) {
  return values.reduce(
    (total, value) => total + value,
    0
  );
}


function difference(a, b) {
  return Math.abs(a - b);
}


// ============================================================
// Validate one built-in system
// ============================================================

function checkSystem(systemName) {
  console.log(
    `\n========== REACTIVE-POWER BALANCE: ${systemName} ==========`
  );

  const system = loadSystemV2(systemName);

  const result = solvePowerFlow(system, {
    method: 'Newton-Raphson'
  });


  // ----------------------------------------------------------
  // Convergence and result structure
  // ----------------------------------------------------------

  assert(
    result && result.converged === true,
    `${systemName} Newton-Raphson solution converged.`
  );

  if (!result || result.converged !== true) {
    return;
  }

  assert(
    Array.isArray(result.buses) &&
      result.buses.length === system.buses.length,
    `${systemName} result contains one solved result per bus.`
  );


  // ----------------------------------------------------------
  // Total reactive generation and load
  // ----------------------------------------------------------

  const totalQgen = sum(
    result.buses.map(
      bus => bus.Qgen || 0
    )
  );

  const totalQload = sum(
    result.buses.map(
      bus => bus.Qload || 0
    )
  );

  const generationMinusLoad =
    totalQgen - totalQload;


  // ----------------------------------------------------------
  // Sum of solved bus reactive-power injections
  // ----------------------------------------------------------

  const busInjectionSum = sum(
    result.buses.map(
      bus => bus.Q_calc || 0
    )
  );


  // ----------------------------------------------------------
  // Independently calculated branch reactive-power losses
  // ----------------------------------------------------------

  const lineFlows = calculateLineFlows(
    system,
    result
  );

  assert(
    Array.isArray(lineFlows) &&
      lineFlows.length === system.lines.length,
    `${systemName} line-flow result contains one result per modeled branch.`
  );

  const branchReactiveLoss = sum(
    lineFlows.map(
      flow => flow.Q_loss
    )
  );


  // ----------------------------------------------------------
  // Independent shunt contribution
  //
  // With Yshunt = G + jB, the shunt reactive-power
  // contribution to bus injection is -B * |V|^2.
  //
  // Therefore:
  // sum(Q_calc) = sum(branch Q_loss) - sum(B * |V|^2)
  // ----------------------------------------------------------

  let independentShuntTerm = 0;

  for (const shunt of (system.shunts || [])) {
    const bus = result.buses.find(
      item => item.id === shunt.busId
    );

    assert(
      Boolean(bus),
      `${systemName} shunt at bus ${shunt.busId} has a solved voltage result.`
    );

    if (!bus) {
      continue;
    }

    independentShuntTerm +=
      (shunt.B || 0) * bus.V * bus.V;
  }

  const expectedNetworkBalance =
    branchReactiveLoss - independentShuntTerm;


  // ----------------------------------------------------------
  // Result summary
  // ----------------------------------------------------------

  const summaryReactiveLoss =
    result.summary && result.summary.losses
      ? result.summary.losses.Q
      : NaN;


  // ----------------------------------------------------------
  // Balance differences
  // ----------------------------------------------------------

  const generationVsInjection = difference(
    generationMinusLoad,
    busInjectionSum
  );

  const injectionVsNetworkBalance = difference(
    busInjectionSum,
    expectedNetworkBalance
  );

  const generationVsNetworkBalance = difference(
    generationMinusLoad,
    expectedNetworkBalance
  );

  const summaryVsInjection = difference(
    summaryReactiveLoss,
    busInjectionSum
  );


  // ----------------------------------------------------------
  // Diagnostic output
  // ----------------------------------------------------------

  console.log('\nReactive-power quantities:');

  console.log(
    `Total Q generation       = ${totalQgen.toFixed(12)} pu`
  );

  console.log(
    `Total Q load             = ${totalQload.toFixed(12)} pu`
  );

  console.log(
    `Generation minus load    = ${generationMinusLoad.toFixed(12)} pu`
  );

  console.log(
    `Sum of bus Q injections  = ${busInjectionSum.toFixed(12)} pu`
  );

  console.log(
    `Sum of branch Q losses   = ${branchReactiveLoss.toFixed(12)} pu`
  );

  console.log(
    `Independent shunt term   = ${independentShuntTerm.toFixed(12)} pu`
  );

  console.log(
    `Expected network balance = ${expectedNetworkBalance.toFixed(12)} pu`
  );

  console.log(
    `Result summary Q         = ${summaryReactiveLoss.toFixed(12)} pu`
  );

  console.log('\nBalance differences:');

  console.log(
    `|Gen-Load - BusInj|      = ${generationVsInjection.toExponential(6)} pu`
  );

  console.log(
    `|BusInj - Network|       = ${injectionVsNetworkBalance.toExponential(6)} pu`
  );

  console.log(
    `|Gen-Load - Network|     = ${generationVsNetworkBalance.toExponential(6)} pu`
  );

  console.log(
    `|Summary - BusInj|       = ${summaryVsInjection.toExponential(6)} pu`
  );

  console.log(
    `Tolerance                = ${TOL.toExponential(1)} pu`
  );


  // ----------------------------------------------------------
  // Finite-value checks
  // ----------------------------------------------------------

  assert(
    Number.isFinite(totalQgen),
    `${systemName} total reactive generation is finite.`
  );

  assert(
    Number.isFinite(totalQload),
    `${systemName} total reactive load is finite.`
  );

  assert(
    Number.isFinite(busInjectionSum),
    `${systemName} bus reactive-injection sum is finite.`
  );

  assert(
    Number.isFinite(branchReactiveLoss),
    `${systemName} branch reactive-power loss is finite.`
  );

  assert(
    Number.isFinite(independentShuntTerm),
    `${systemName} independent shunt contribution is finite.`
  );

  assert(
    Number.isFinite(summaryReactiveLoss),
    `${systemName} result-summary reactive quantity is finite.`
  );


  // ----------------------------------------------------------
  // Conservation checks
  // ----------------------------------------------------------

  assert(
    generationVsInjection <= TOL,
    `${systemName} generation minus load equals solved bus reactive injections.`
  );

  assert(
    injectionVsNetworkBalance <= TOL,
    `${systemName} bus injections equal branch losses minus independent shunt term.`
  );

  assert(
    generationVsNetworkBalance <= TOL,
    `${systemName} generation minus load matches the independently calculated network balance.`
  );

  assert(
    summaryVsInjection <= TOL,
    `${systemName} result-summary reactive quantity equals solved bus-injection sum.`
  );


  // ----------------------------------------------------------
  // PV-bus reactive-generation reporting
  // ----------------------------------------------------------

  const pvBuses = result.buses.filter(
    bus => bus.type === 'PV'
  );

  assert(
    pvBuses.length > 0,
    `${systemName} contains at least one PV bus for reactive-generation validation.`
  );

  for (const bus of pvBuses) {
    const scheduledBus = system.buses.find(
      item => item.id === bus.id
    );

    if (!scheduledBus) {
      assert(
        false,
        `${systemName} PV bus ${bus.id} exists in the input model.`
      );
      continue;
    }

    const actualQgen = bus.Qgen || 0;
    const calculatedQgen =
      (bus.Q_calc || 0) + (bus.Qload || 0);

    const scheduledQgen =
      scheduledBus.Qgen || 0;

    const generationReportingError = difference(
      actualQgen,
      calculatedQgen
    );

    console.log(
      `\nPV bus ${bus.id}: actual Qgen=${actualQgen.toFixed(12)} pu, ` +
      `solved Q_calc + Qload=${calculatedQgen.toFixed(12)} pu, ` +
      `scheduled Qgen=${scheduledQgen.toFixed(12)} pu`
    );

    assert(
      Number.isFinite(actualQgen),
      `${systemName} PV bus ${bus.id} reactive generation is finite.`
    );

    assert(
      generationReportingError <= TOL,
      `${systemName} PV bus ${bus.id} reports reactive generation from its solved injection and load.`
    );

    pvGenerationChecks++;

    if (difference(actualQgen, scheduledQgen) > TOL) {
      pvGenerationDiffersFromSchedule++;
    }
  }
}


// ============================================================
// Run all built-in systems
// ============================================================

for (const systemName of SYSTEM_NAMES) {
  checkSystem(systemName);
}


// ============================================================
// Cross-system PV reporting regression checks
// ============================================================

console.log('\n==============================================');
console.log('BUILT-IN REACTIVE-POWER BALANCE TEST SUMMARY');
console.log('==============================================');

assert(
  pvGenerationChecks > 0,
  'PV-bus reactive-generation checks were executed.'
);

assert(
  pvGenerationDiffersFromSchedule > 0,
  'At least one PV bus reports solved reactive generation different from its scheduled input.'
);

if (failures === 0) {
  console.log(
    `PASS: All ${SYSTEM_NAMES.length} built-in systems satisfy reactive-power balance and PV reporting checks.`
  );
} else {
  console.error(
    `FAIL: ${failures} built-in reactive-power validation check(s) failed.`
  );
}

process.exitCode = failures === 0 ? 0 : 1;
