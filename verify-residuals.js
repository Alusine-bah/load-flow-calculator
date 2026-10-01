// verify-residuals.js
// Checks that at the converged solution, Pcalc = Psch and Qcalc = Qsch
// at every bus (Q only at PQ buses; Q is free at PV/slack).
//
// This is the self-consistency test: it does not compare against any
// textbook value. It only checks that the answer IS a solution of
// the power-flow equations we set up.

global.window = global;
require('./js/complex.js');
require('./js/data.js');
require('./js/ybus.js');
require('./js/newton.js');

const TOL = 1e-8; // residuals must be below this in per unit

function checkSystem(name) {
  console.log(`\n===== ${name} =====`);

  const sys = JSON.parse(JSON.stringify(global.SYSTEMS[name]));
  const n = sys.buses.length;
  const Y = global.buildYbus(sys);

  // Solve
  const res = global.solveNewton(sys);
  if (!res.converged) {
    console.log(`  NOT CONVERGED (${res.iterations} iterations)`);
    return false;
  }
  console.log(`  Converged in ${res.iterations} iterations.`);

  // Recompute Pcalc and Qcalc at the converged voltages.
  // Use the solver's reported V (pu) and delta_deg (degrees).
  const Vmag = res.busResults.map(b => b.V);
  const Vang = res.busResults.map(b => b.delta_deg * Math.PI / 180);

  const Pcalc = new Array(n).fill(0);
  const Qcalc = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let Pi = 0, Qi = 0;
    for (let j = 0; j < n; j++) {
      const G = Y[i][j].re;
      const B = Y[i][j].im;
      const th = Vang[i] - Vang[j];
      Pi += Vmag[j] * (G * Math.cos(th) + B * Math.sin(th));
      Qi += Vmag[j] * (G * Math.sin(th) - B * Math.cos(th));
    }
    Pcalc[i] = Vmag[i] * Pi;
    Qcalc[i] = Vmag[i] * Qi;
  }

  // Compare against scheduled values.
  let maxDP = 0, maxDQ = 0;
  let ok = true;
  console.log('  Bus | type  |  Psch   |  Pcalc  |   dP    | Qsch    | Qcalc   |   dQ');
    for (let i = 0; i < n; i++) {
    const b = sys.buses[i];

    // Slack bus has no scheduled P or Q. Its injection is whatever the
    // network requires. Do not check residuals at the slack bus.
    if (i === 0) {
      console.log(`   ${b.id}  | ${b.type.padEnd(5)} |  (slack — no residual check; Pcalc = ${Pcalc[i].toFixed(5)})`);
      continue;
    }

    const Psch = b.Pgen - b.Pload;
    const Qsch = b.Qgen - b.Qload;
    const dP = Math.abs(Pcalc[i] - Psch);
    if (dP > maxDP) maxDP = dP;

    let dQ = 0;
    let qschStr = '  --  ';
    let qcalcStr = '  --  ';
    let dqStr = '  --  ';
    if (b.type === 'PQ') {
      dQ = Math.abs(Qcalc[i] - Qsch);
      if (dQ > maxDQ) maxDQ = dQ;
      qschStr  = Qsch.toFixed(5);
      qcalcStr = Qcalc[i].toFixed(5);
      dqStr    = dQ.toExponential(2);
    }

    console.log(
      `   ${b.id}  | ${b.type.padEnd(5)} | ${Psch.toFixed(5)} | ${Pcalc[i].toFixed(5)} | ` +
      `${dP.toExponential(2)} | ${qschStr.padStart(7)} | ${qcalcStr.padStart(7)} | ${dqStr}`
    );

    if (dP > TOL) ok = false;
    if (b.type === 'PQ' && dQ > TOL) ok = false;
  }

  console.log(`  Max |dP| = ${maxDP.toExponential(2)}   Max |dQ| (PQ only) = ${maxDQ.toExponential(2)}`);
  if (ok) {
    console.log(`  PASS: all residuals below ${TOL}`);
  } else {
    console.log(`  FAIL: residual exceeds ${TOL}`);
  }
  return ok;
}

const ok4 = checkSystem('4bus');
process.exit(ok4 ? 0 : 1);