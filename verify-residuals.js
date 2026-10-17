// verify-residuals.js
//
// Independent residual verification for the built-in AC power-flow systems.
//
// At the converged Newton-Raphson solution:
//
//   Pcalc = Psch at every non-slack bus
//   Qcalc = Qsch at every PQ bus
//
// Reactive power is not checked at PV buses because Q is an
// unknown/output quantity at a PV bus.
//
// Slack-bus P and Q are not checked because the slack injection
// is determined by the solved network.
//
// This test checks whether the calculated voltage state actually
// satisfies the AC power-flow equations represented by the current
// system data and Y-bus.
//
// It does NOT by itself prove that the underlying system data match
// an external published benchmark.

global.window = global;

require('./js/complex.js');
require('./js/data.js');
require('./js/ybus.js');
require('./js/newton.js');

const TOL = 1e-8;

const SYSTEM_NAMES = [
  '4bus',
  '5bus',
  '9bus'
];


function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


function checkSystem(name) {

  console.log(`\n========== RESIDUAL CHECK: ${name} ==========`);

  const sourceSystem =
    global.SYSTEMS &&
    global.SYSTEMS[name];

  if (!sourceSystem) {

    console.error(
      `FAIL: System "${name}" was not found.`
    );

    return false;
  }


  const sys = clone(sourceSystem);

  const n = sys.buses.length;

  const Y =
    global.buildYbus(sys);


  // ------------------------------------------------------------
  // Solve the system with Newton-Raphson
  // ------------------------------------------------------------

  const result =
    global.solveNewton(sys);


  if (
    !result ||
    result.converged !== true
  ) {

    console.error(
      `FAIL: Newton-Raphson did not converge for ${name}.`
    );

    if (
      result &&
      result.iterations !== undefined
    ) {

      console.error(
        `Iterations: ${result.iterations}`
      );

    }

    return false;
  }


  console.log(
    `Converged in ${result.iterations} iterations.`
  );


  if (
    !result.busResults ||
    result.busResults.length !== n
  ) {

    console.error(
      'FAIL: Solver bus-result count does not match system bus count.'
    );

    return false;
  }


  // ------------------------------------------------------------
  // Reconstruct solved voltage magnitudes and angles
  // ------------------------------------------------------------

  const Vmag =
    result.busResults.map(
      bus => bus.V
    );


  const Vang =
    result.busResults.map(
      bus =>
        bus.delta_deg *
        Math.PI / 180
    );


  // ------------------------------------------------------------
  // Independently recompute Pcalc and Qcalc
  // from Ybus and the converged voltage state
  // ------------------------------------------------------------

  const Pcalc =
    new Array(n).fill(0);

  const Qcalc =
    new Array(n).fill(0);


  for (let i = 0; i < n; i++) {

    let Pi = 0;
    let Qi = 0;


    for (let j = 0; j < n; j++) {

      const G =
        Y[i][j].re;

      const B =
        Y[i][j].im;

      const theta =
        Vang[i] -
        Vang[j];


      Pi +=
        Vmag[j] *
        (
          G * Math.cos(theta) +
          B * Math.sin(theta)
        );


      Qi +=
        Vmag[j] *
        (
          G * Math.sin(theta) -
          B * Math.cos(theta)
        );

    }


    Pcalc[i] =
      Vmag[i] * Pi;

    Qcalc[i] =
      Vmag[i] * Qi;

  }


  // ------------------------------------------------------------
  // Compare recomputed injections with scheduled injections
  // ------------------------------------------------------------

  let maxDP = 0;
  let maxDQ = 0;

  let maxDPBus = null;
  let maxDQBus = null;

  let ok = true;


  console.log(
    '\nBus | Type  | Psch       | Pcalc      | |dP|       | Qsch       | Qcalc      | |dQ|'
  );

  console.log(
    '----|-------|------------|------------|------------|------------|------------|------------'
  );


  for (let i = 0; i < n; i++) {

    const bus =
      sys.buses[i];


    // ----------------------------------------------------------
    // Slack bus:
    // P and Q are outputs of the network solution.
    // No scheduled residual equation is imposed.
    // ----------------------------------------------------------

    if (bus.type === 'Slack') {

      console.log(
        `${String(bus.id).padEnd(3)} | ` +
        `${bus.type.padEnd(5)} | ` +
        `(no scheduled P/Q residual check)`
      );

      continue;
    }


    const Psch =
      bus.Pgen -
      bus.Pload;


    const Qsch =
      bus.Qgen -
      bus.Qload;


    const dP =
      Math.abs(
        Pcalc[i] -
        Psch
      );


    if (dP > maxDP) {

      maxDP = dP;
      maxDPBus = bus.id;

    }


    if (dP > TOL) {

      ok = false;

    }


    // ----------------------------------------------------------
    // Q mismatch is checked only for PQ buses.
    // At PV buses Q is solved, not scheduled.
    // ----------------------------------------------------------

    let qschText = '--';
    let qcalcText = '--';
    let dqText = '--';


    if (bus.type === 'PQ') {

      const dQ =
        Math.abs(
          Qcalc[i] -
          Qsch
        );


      if (dQ > maxDQ) {

        maxDQ = dQ;
        maxDQBus = bus.id;

      }


      if (dQ > TOL) {

        ok = false;

      }


      qschText =
        Qsch.toFixed(6);

      qcalcText =
        Qcalc[i].toFixed(6);

      dqText =
        dQ.toExponential(3);

    }


    console.log(

      `${String(bus.id).padEnd(3)} | ` +

      `${bus.type.padEnd(5)} | ` +

      `${Psch.toFixed(6).padStart(10)} | ` +

      `${Pcalc[i].toFixed(6).padStart(10)} | ` +

      `${dP.toExponential(3).padStart(10)} | ` +

      `${qschText.padStart(10)} | ` +

      `${qcalcText.padStart(10)} | ` +

      `${dqText.padStart(10)}`

    );

  }


  // ------------------------------------------------------------
  // Result summary
  // ------------------------------------------------------------

  console.log('\nResidual summary:');

  console.log(
    `Max |dP| = ${maxDP.toExponential(6)} pu` +
    (
      maxDPBus !== null
        ? ` at bus ${maxDPBus}`
        : ''
    )
  );


  console.log(
    `Max |dQ| = ${maxDQ.toExponential(6)} pu` +
    (
      maxDQBus !== null
        ? ` at PQ bus ${maxDQBus}`
        : ''
    )
  );


  console.log(
    `Tolerance = ${TOL.toExponential(1)} pu`
  );


  if (ok) {

    console.log(
      `PASS: ${name} residuals are within tolerance.`
    );

  }

  else {

    console.log(
      `FAIL: ${name} has one or more residuals above tolerance.`
    );

  }


  return ok;
}


// ============================================================
// Run residual validation on every built-in benchmark system
// ============================================================

const results =
  SYSTEM_NAMES.map(
    name => ({
      name,
      passed: checkSystem(name)
    })
  );


console.log(
  '\n=============================================='
);

console.log(
  'POWER-FLOW RESIDUAL VALIDATION SUMMARY'
);

console.log(
  '=============================================='
);


for (const result of results) {

  console.log(
    `${result.name}: ` +
    (
      result.passed
        ? 'PASS'
        : 'FAIL'
    )
  );

}


const allPassed =
  results.every(
    result => result.passed
  );


console.log('');


if (allPassed) {

  console.log(
    `PASS: All ${results.length} systems satisfy the residual tolerance.`
  );

}

else {

  console.log(
    'FAIL: One or more systems failed residual validation.'
  );

}


// Set a useful shell exit status without forcing stdout to terminate early.
process.exitCode =
  allPassed
    ? 0
    : 1;