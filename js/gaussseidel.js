// gaussseidel.js — Gauss-Seidel power flow solver
//
// Independent algorithm from newton.js. It iterates the complex bus
// voltages directly from the power equation:
//
//   V_i^(k+1) = (1/Y_ii) * ( conj(S_i) / conj(V_i^(k))  -  sum_{j!=i} Y_ij V_j )
//
// where S_i = P_i + jQ_i is the scheduled complex power injection.
// For PQ buses, S_i is fixed.
// For PV buses, the magnitude |V_i| is fixed and Q_i is adjusted each
// iteration from the network equation.
// For the slack bus, both |V| and angle are fixed; its injection is
// never computed inside the loop.
//
// Exposes: window.solveGaussSeidel(system) -> result object
// Same result schema as solveNewton so callers can compare directly.

function solveGaussSeidel(system) {
  const n = system.buses.length;
  const tol = system.tol || 1e-9;
  const maxIter = system.maxIter || 500;

  const Y =
  system.useV2Ybus && typeof buildYbusV2 === "function"
  ? buildYbusV2(system)
  : buildYbus(system);

  // --- Initialize V as complex phasors ---
  // V[i] = Vmag[i] * exp(j * delta[i])
  const V = [];
  for (let i = 0; i < n; i++) {
    const b = system.buses[i];
    const re = b.V * Math.cos(b.delta * Math.PI / 180);
    const im = b.V * Math.sin(b.delta * Math.PI / 180);
    V.push(C.make(re, im));
  }

  // --- Bus classification ---
  const isSlack = [];
  const isPV = [];
  const isPQ = [];
  for (let i = 0; i < n; i++) {
    const t = system.buses[i].type;
    isSlack[i] = (t === "Slack");
    isPV[i] = (t === "PV");
    isPQ[i] = (t === "PQ");
  }

  // Scheduled injections in per unit
  const Psch = new Array(n);
  const Qsch = new Array(n);
  for (let i = 0; i < n; i++) {
    const b = system.buses[i];
    Psch[i] = b.Pgen - b.Pload;
    Qsch[i] = b.Qgen - b.Qload;
  }

  const convergenceLog = [];
  let converged = false;
  let iter = 0;

  for (iter = 0; iter < maxIter; iter++) {
    const Vprev = V.map(v => C.make(v.re, v.im));
    let maxDelta = 0;

    for (let i = 0; i < n; i++) {
      if (isSlack[i]) continue;

      // Compute the "sum of off-diagonal terms"
      //   sum_j Y_ij * V_j   for j != i
      let sum = C.make(0, 0);
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        sum = C.add(sum, C.mul(Y[i][j], V[j]));
      }

      if (isPQ[i]) {
        // S_i is scheduled.
        //   V_i = (1/Y_ii) * ( conj(S_i)/conj(V_i) - sum )
        const S = C.make(Psch[i], Qsch[i]);
        const Sconj = C.conj(S);
        const Vconj = C.conj(V[i]);
        const ratio = C.div(Sconj, Vconj);
        const rhs = C.sub(ratio, sum);
        const Vnew = C.div(rhs, Y[i][i]);
        V[i] = Vnew;
      } else if (isPV[i]) {
        // |V_i| is fixed; Q_i must be computed from the current V_i.
        //
        //   S_i = V_i * conj( Y_ii * V_i + sum )
        //
        // (This is the network equation: S injected into bus i equals
        //  V_i times conjugate of the total current leaving i into
        //  the network.)
        //
        // Then use the real part Psch[i] (fixed) and the computed Q_i.
        const Vconj = C.conj(V[i]);
        // total current into network at bus i:
        const Ibus = C.add(C.mul(Y[i][i], V[i]), sum);
        const Sbus = C.mul(V[i], C.conj(Ibus)); // S = V * conj(I)
        const Qcalc = Sbus.im;

        // Re-solve V with scheduled P and the computed Q
        const S = C.make(Psch[i], Qcalc);
        const Sconj = C.conj(S);
        const ratio = C.div(Sconj, Vconj);
        const rhs = C.sub(ratio, sum);
        let Vnew = C.div(rhs, Y[i][i]);

        // Rescale magnitude to the specified value, keep new angle
        const Vspec = system.buses[i].V;
        const VmagNew = C.abs(Vnew);
        if (VmagNew > 0) {
          const scale = Vspec / VmagNew;
          Vnew = C.make(Vnew.re * scale, Vnew.im * scale);
        }
        V[i] = Vnew;
      }

      // Track convergence by voltage change
      const dV = C.abs(C.sub(V[i], Vprev[i]));
      if (dV > maxDelta) maxDelta = dV;
    }

    convergenceLog.push({ iter: iter + 1, maxDelta });

    if (maxDelta < tol) {
      converged = true;
      break;
    }
  }

  // --- Build result object, same schema as solveNewton ---
  const Vmag = V.map(v => C.abs(v));
    const Vang = V.map(v => C.angle(v)); // radians

  // Compute final Pcalc and Qcalc at every bus from network equations
  const Pcalc = new Array(n).fill(0);
  const Qcalc = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let Ibus = C.make(0, 0);
    for (let j = 0; j < n; j++) {
      Ibus = C.add(Ibus, C.mul(Y[i][j], V[j]));
    }
    const Sbus = C.mul(V[i], C.conj(Ibus));
    Pcalc[i] = Sbus.re;
    Qcalc[i] = Sbus.im;
  }

  const busResults = [];
  for (let i = 0; i < n; i++) {
    busResults.push({
      id: system.buses[i].id,
      type: system.buses[i].type,
      V: Vmag[i],
      delta_deg: Vang[i] * 180 / Math.PI,
      P_calc: Pcalc[i],
      Q_calc: Qcalc[i],
      Pgen: system.buses[i].Pgen,
      Qgen: system.buses[i].Qgen,
      Pload: system.buses[i].Pload,
      Qload: system.buses[i].Qload
    });
  }

  return {
    converged: converged,
    iterations: iter,
    convergenceLog: convergenceLog,
    busResults: busResults,
    error: converged ? null : "Did not converge within " + maxIter + " iterations"
  };
}

window.solveGaussSeidel = solveGaussSeidel;