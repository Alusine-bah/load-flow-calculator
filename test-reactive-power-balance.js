
/**
 * test-reactive-power-balance.js
 *
 * Validates reactive-power conservation for a two-bus
 * network containing:
 *   - A slack bus
 *   - A loaded PQ bus
 *   - Transmission-line reactance and charging
 *   - An independent bus shunt
 *
 * Reactive-power balance under this implementation's
 * Ybus sign convention:
 *
 * Qgeneration - Qload
 *   = sum(branch Q_loss) - sum(B_shunt * |V|^2)
 *
 * The independent shunt term is calculated separately
 * from the branch flows.
 */

global.window = global;


// ============================================================
// Dependencies
// ============================================================

require('./js/complex.js');
require('./js/models.js');
require('./js/ybus.js');
require('./js/ybus-v2.js');
require('./js/results.js');
require('./js/newton.js');
require('./js/newton-v2.js');
require('./js/gaussseidel-v2.js');
require('./js/solver.js');
require('./js/units.js');
require('./js/line-flow.js');


// ============================================================
// Configuration
// ============================================================

const TOL = 1e-8;

let failures = 0;


// ============================================================
// Assertion helper
// ============================================================

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}


// ============================================================
// Build a custom two-bus test system
// ============================================================

const system = new PowerSystem({
  name: 'Reactive Power Balance Test',
  baseMVA: 100,
  baseKV: 230
});


system.addBus(new Bus({
  id: 1,
  name: 'Slack Bus',
  type: 'Slack',
  V: 1.04,
  delta: 0
}));


system.addBus(new Bus({
  id: 2,
  name: 'Load Bus',
  type: 'PQ',
  V: 1.0,
  delta: 0,
  Pload: 0.50,
  Qload: 0.20
}));


system.addLine(new Line({
  from: 1,
  to: 2,
  R: 0.02,
  X: 0.08,
  B: 0.04
}));


system.addShunt(new Shunt({
  busId: 2,
  G: 0,
  B: 0.03
}));


console.log('\n==============================================');
console.log('REACTIVE-POWER BALANCE REGRESSION TEST');
console.log('==============================================');

console.log(`System: ${system.name}`);
console.log(`Base MVA: ${system.baseMVA}`);
console.log(`Independent shunts: ${system.shunts.length}`);


// ============================================================
// Solve the network
// ============================================================

const result = solvePowerFlow(system, {
  method: 'Newton-Raphson'
});


assert(
  result && result.converged === true,
  'Two-bus Newton-Raphson solution converged.'
);


// ============================================================
// Validate reactive-power balance
// ============================================================

if (result && result.converged === true) {

  // ----------------------------------------------------------
  // Total generation and load
  // ----------------------------------------------------------

  const totalQgen = result.buses.reduce(
    (sum, bus) => sum + (bus.Qgen || 0),
    0
  );


  const totalQload = result.buses.reduce(
    (sum, bus) => sum + (bus.Qload || 0),
    0
  );


  const netGenerationMinusLoad =
    totalQgen - totalQload;


  // ----------------------------------------------------------
  // Independently calculated branch reactive-power losses
  // ----------------------------------------------------------

  const flows = calculateLineFlows(system, result);


  assert(
    flows.length === system.lines.length,
    'Line-flow calculation returns one result per branch.'
  );


  const branchReactiveLoss = flows.reduce(
    (sum, flow) => sum + flow.Q_loss,
    0
  );


  // ----------------------------------------------------------
  // Independent shunt contribution
  //
  // For Yshunt = G + jB, this implementation calculates
  // the shunt reactive injection as -B * |V|^2.
  // ----------------------------------------------------------

  let shuntReactiveTerm = 0;


  for (const shunt of system.shunts) {

    const bus = result.buses.find(
      item => item.id === shunt.busId
    );


    assert(
      Boolean(bus),
      `Shunt bus ${shunt.busId} has a solved voltage result.`
    );


    if (bus) {

      shuntReactiveTerm +=
        (shunt.B || 0) * bus.V * bus.V;

    }

  }


  // ----------------------------------------------------------
  // Independent network balance
  // ----------------------------------------------------------

  const expectedNetReactivePower =
    branchReactiveLoss - shuntReactiveTerm;


  const balanceError = Math.abs(
    netGenerationMinusLoad -
    expectedNetReactivePower
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
    `Generation minus load    = ${netGenerationMinusLoad.toFixed(12)} pu`
  );

  console.log(
    `Sum of branch Q losses   = ${branchReactiveLoss.toFixed(12)} pu`
  );

  console.log(
    `Independent shunt term   = ${shuntReactiveTerm.toFixed(12)} pu`
  );

  console.log(
    `Expected net Q balance   = ${expectedNetReactivePower.toFixed(12)} pu`
  );

  console.log(
    `Absolute balance error   = ${balanceError.toExponential(6)} pu`
  );

  console.log(
    `Tolerance                = ${TOL.toExponential(1)} pu`
  );


  // ----------------------------------------------------------
  // Assertions
  // ----------------------------------------------------------

  assert(
    Number.isFinite(totalQgen) &&
    Number.isFinite(totalQload),
    'Total reactive generation and load are finite.'
  );


  assert(
    Number.isFinite(branchReactiveLoss),
    'Total branch reactive-power loss is finite.'
  );


  assert(
    Number.isFinite(shuntReactiveTerm),
    'Independent shunt contribution is finite.'
  );


  assert(
    Number.isFinite(balanceError),
    'Reactive-power balance error is finite.'
  );


  assert(
    Math.abs(shuntReactiveTerm) > 1e-6,
    'Independent shunt has a non-zero reactive contribution.'
  );


  assert(
    balanceError <= TOL,
    'Generation minus load matches branch losses and independent shunt contribution.'
  );


  // ----------------------------------------------------------
  // Cross-check against solved bus injections
  // ----------------------------------------------------------

  const busInjectionSum = result.buses.reduce(
    (sum, bus) => sum + (bus.Q_calc || 0),
    0
  );


  const injectionError = Math.abs(
    netGenerationMinusLoad - busInjectionSum
  );


  console.log(
    `\nSum of solved bus Q injections = ${busInjectionSum.toFixed(12)} pu`
  );

  console.log(
    `Generation/injection error     = ${injectionError.toExponential(6)} pu`
  );


  assert(
    injectionError <= TOL,
    'Generation minus load agrees with the sum of solved bus reactive injections.'
  );

}


// ============================================================
// Final summary
// ============================================================

console.log('\n==============================================');
console.log('REACTIVE-POWER BALANCE TEST SUMMARY');
console.log('==============================================');


if (failures === 0) {

  console.log(
    'PASS: All reactive-power balance checks passed.'
  );

} else {

  console.error(
    `FAIL: ${failures} reactive-power balance check(s) failed.`
  );

}


process.exitCode = failures === 0 ? 0 : 1;
