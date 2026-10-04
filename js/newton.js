// newton.js — Newton-Raphson power flow solver
//
// Depends on:
//   window.C        (from complex.js)
//   window.buildYbus (from ybus.js)
//
// Exposes:
//   window.solveNewton(system)  ->  result object
//
// Sign convention, per-unit base, and convergence criteria
// are documented in NOTATION.md.

// ---------------------------------------------------------------
// Linear solver: A * x = b, by Gaussian elimination with
// partial pivoting. A is square n x n, b is length n.
// Returns x as an array, or throws if A is singular.
// ---------------------------------------------------------------
function solveLinear(A, b) {
  const n = A.length;

  // Work on copies so we don't mutate the inputs
  const M = A.map(row => row.slice());
  const y = b.slice();

  // --- Forward elimination with partial pivoting ---
  for (let k = 0; k < n; k++) {
    // Find pivot: largest absolute value in column k, row >= k
    let pivotRow = k;
    let pivotVal = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(M[i][k]);
      if (v > pivotVal) {
        pivotVal = v;
        pivotRow = i;
      }
    }
    if (pivotVal < 1e-14) {
      throw new Error("Singular or near-singular Jacobian");
    }
    // Swap rows
    if (pivotRow !== k) {
      [M[k], M[pivotRow]] = [M[pivotRow], M[k]];
      [y[k], y[pivotRow]] = [y[pivotRow], y[k]];
    }
    // Eliminate below the diagonal
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / M[k][k];
      if (factor === 0) continue;
      for (let j = k; j < n; j++) {
        M[i][j] -= factor * M[k][j];
      }
      y[i] -= factor * y[k];
    }
  }

  // --- Back substitution ---
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }
  return x;
}

// ---------------------------------------------------------------
// Main solver
// ---------------------------------------------------------------
function solveNewton(system) {
  const n = system.buses.length;
  const tol = system.tol || 1e-9;
  const maxIter = system.maxIter || 30;

  // --- 1. Build Y-bus ---
  const Y =
  system.useV2Ybus && typeof buildYbusV2 === "function"
  ? buildYbusV2(system)
  : buildYbus(system);

  // --- 2. Identify bus indices ---
  // 0-based indexing throughout. Bus 0 is the slack bus.
  const slackIndex = 0;

  // --- 3. Initialize V and delta (flat start for unknowns) ---
  // V and delta are stored as complex magnitudes and angles,
  // in radians internally.
  const Vmag = new Array(n);
  const Vang = new Array(n);
  for (let i = 0; i < n; i++) {
    Vmag[i] = system.buses[i].V;
    Vang[i] = system.buses[i].delta * Math.PI / 180;
  }

  // --- 4. Determine which buses are PQ and PV ---
  // PQ bus: unknown = (delta, V_mag)
  // PV bus: unknown = (delta); V_mag fixed
  // Slack:  both fixed
  const isPQ = [];
  const isPV = [];
  const pqIndices = [];  // indices of PQ buses (0-based)
  const pvIndices = [];  // indices of PV buses (0-based)
  for (let i = 0; i < n; i++) {
    const t = system.buses[i].type;
    isPQ[i] = (t === "PQ");
    isPV[i] = (t === "PV");
    if (i !== slackIndex) {
      if (isPQ[i]) pqIndices.push(i);
      if (isPV[i]) pvIndices.push(i);
    }
  }

  // The state vector layout:
  //   [ d_1, d_2, ..., d_{n-1},          angles of all non-slack buses
  //     V_1, V_2, ..., V_{num_PQ} ]      magnitudes of all PQ buses
  //
  // where indices refer to position in pqIndices (not bus number).
  const nAngleVars = n - 1;
  const nMagVars = pqIndices.length;
  const stateSize = nAngleVars + nMagVars;

  // --- 5. Iteration loop ---
  const convergenceLog = [];
  let firstJacobian = null;
  let firstMismatch = null;
  let firstCorrection = null;

  let converged = false;
  let iter = 0;

  for (iter = 0; iter < maxIter; iter++) {

    // --- 5a. Compute injected powers at each bus ---
    // P_i = V_i * sum_j [ V_j * (G_ij cos(theta_ij) + B_ij sin(theta_ij)) ]
    // Q_i = V_i * sum_j [ V_j * (G_ij sin(theta_ij) - B_ij cos(theta_ij)) ]
    // where theta_ij = delta_i - delta_j.
    const Pcalc = new Array(n).fill(0);
    const Qcalc = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let Pi = 0, Qi = 0;
      for (let j = 0; j < n; j++) {
        const G = Y[i][j].re;
        const B = Y[i][j].im;
        const theta = Vang[i] - Vang[j];
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        Pi += Vmag[j] * (G * cosT + B * sinT);
        Qi += Vmag[j] * (G * sinT - B * cosT);
      }
      Pcalc[i] = Vmag[i] * Pi;
      Qcalc[i] = Vmag[i] * Qi;
    }

    // --- 5b. Compute mismatches at each non-slack bus ---
    // Scheduled injection = Pgen - Pload (from data.js)
    // We collect mismatches in the state-vector order.
    const mismatch = [];
    const busIdxsByAngle = []; // bus index for each angle variable
    const busIdxsByMag = [];   // bus index for each magnitude variable

    for (let i = 0; i < n; i++) {
      if (i === slackIndex) continue;
      busIdxsByAngle.push(i);
    }
    for (let k = 0; k < pqIndices.length; k++) {
      busIdxsByMag.push(pqIndices[k]);
    }

    // Angle mismatches first (all non-slack buses)
    for (const i of busIdxsByAngle) {
      const Psch = system.buses[i].Pgen - system.buses[i].Pload;
      mismatch.push(Psch - Pcalc[i]);
    }
    // Then magnitude mismatches (PQ buses only)
    for (const i of busIdxsByMag) {
      const Qsch = system.buses[i].Qgen - system.buses[i].Qload;
      mismatch.push(Qsch - Qcalc[i]);
    }

    // --- 5c. Convergence test ---
    let maxMismatch = 0;
    for (const v of mismatch) {
      const a = Math.abs(v);
      if (a > maxMismatch) maxMismatch = a;
    }

    // For logging we break mismatch into dP and dQ parts
    let maxDP = 0, maxDQ = 0;
    for (let k = 0; k < nAngleVars; k++) {
      const a = Math.abs(mismatch[k]);
      if (a > maxDP) maxDP = a;
    }
    for (let k = nAngleVars; k < stateSize; k++) {
      const a = Math.abs(mismatch[k]);
      if (a > maxDQ) maxDQ = a;
    }

    convergenceLog.push({
      iter: iter + 1,
      maxDP: maxDP,
      maxDQ: maxDQ,
      maxMismatch: maxMismatch
    });

    if (maxMismatch < tol) {
      converged = true;
      break;
    }

    // --- 5d. Build the Jacobian ---
    // Standard NR power flow Jacobian, 4 submatrices:
    //   J = [ J11  J12 ]   where J11 = dP/ddelta      (nA x nA)
    //       [ J21  J22 ]         J12 = dP/dV          (nA x nM)
    //                            J21 = dQ/ddelta      (nM x nA)
    //                            J22 = dQ/dV          (nM x nM)
    //
    // We use the polar-form derivatives from Grainger & Stevenson
    // and Saadat (identical to your reference PDFs).
    //
    // Indices:
    //   For angle row k: bus i = busIdxsByAngle[k]
    //   For magnitude row/col k: bus i = busIdxsByMag[k]
    const J = [];
    for (let r = 0; r < stateSize; r++) {
      J.push(new Array(stateSize).fill(0));
    }

    // --- J11: dP_i / ddelta_j ---
    for (let a = 0; a < nAngleVars; a++) {
      const i = busIdxsByAngle[a];
      for (let b = 0; b < nAngleVars; b++) {
        const j = busIdxsByAngle[b];
        if (i === j) {
          // Diagonal: -Q_i - B_ii * V_i^2
          J[a][b] = -Qcalc[i] - Y[i][i].im * Vmag[i] * Vmag[i];
        } else {
          // Off-diagonal: V_i V_j (G_ij sin(theta_ij) - B_ij cos(theta_ij))
          const theta = Vang[i] - Vang[j];
          J[a][b] = Vmag[i] * Vmag[j] *
            (Y[i][j].re * Math.sin(theta) - Y[i][j].im * Math.cos(theta));
        }
      }
    }

    // --- J12: dP_i / dV_j (for PQ buses only) ---
    for (let a = 0; a < nAngleVars; a++) {
      const i = busIdxsByAngle[a];
      for (let b = 0; b < nMagVars; b++) {
        const j = busIdxsByMag[b];
        const col = nAngleVars + b;
        if (i === j) {
          // Diagonal: P_i / V_i + G_ii * V_i
          J[a][col] = Pcalc[i] / Vmag[i] + Y[i][i].re * Vmag[i];
        } else {
          // Off-diagonal: V_i (G_ij cos(theta_ij) + B_ij sin(theta_ij))
          const theta = Vang[i] - Vang[j];
          J[a][col] = Vmag[i] *
            (Y[i][j].re * Math.cos(theta) + Y[i][j].im * Math.sin(theta));
        }
      }
    }

    // --- J21: dQ_i / ddelta_j ---
    for (let a = 0; a < nMagVars; a++) {
      const i = busIdxsByMag[a];
      const row = nAngleVars + a;
      for (let b = 0; b < nAngleVars; b++) {
        const j = busIdxsByAngle[b];
        if (i === j) {
          // Diagonal: P_i - G_ii * V_i^2
          J[row][b] = Pcalc[i] - Y[i][i].re * Vmag[i] * Vmag[i];
        } else {
          // Off-diagonal: -V_i V_j (G_ij cos(theta_ij) + B_ij sin(theta_ij))
          const theta = Vang[i] - Vang[j];
          J[row][b] = -Vmag[i] * Vmag[j] *
            (Y[i][j].re * Math.cos(theta) + Y[i][j].im * Math.sin(theta));
        }
      }
    }

    // --- J22: dQ_i / dV_j ---
    for (let a = 0; a < nMagVars; a++) {
      const i = busIdxsByMag[a];
      const row = nAngleVars + a;
      for (let b = 0; b < nMagVars; b++) {
        const j = busIdxsByMag[b];
        const col = nAngleVars + b;
        if (i === j) {
          // Diagonal: Q_i / V_i - B_ii * V_i
          J[row][col] = Qcalc[i] / Vmag[i] - Y[i][i].im * Vmag[i];
        } else {
          // Off-diagonal: V_i (G_ij sin(theta_ij) - B_ij cos(theta_ij))
          const theta = Vang[i] - Vang[j];
          J[row][col] = Vmag[i] *
            (Y[i][j].re * Math.sin(theta) - Y[i][j].im * Math.cos(theta));
        }
      }
    }

    // --- 5e. Solve J * dx = mismatch ---
    const dx = solveLinear(J, mismatch);

    // Record first-iteration details for display
    if (iter === 0) {
      firstJacobian = J.map(row => row.slice());
      firstMismatch = mismatch.slice();
      firstCorrection = dx.slice();
    }

    // --- 5f. Update state variables ---
    // dx[0..nAngleVars-1] are corrections to Vang[i] for i in busIdxsByAngle
    // dx[nAngleVars..]     are corrections to Vmag[i] / Vmag[i] for PQ buses
    for (let a = 0; a < nAngleVars; a++) {
      const i = busIdxsByAngle[a];
      Vang[i] += dx[a];
    }
    for (let a = 0; a < nMagVars; a++) {
      const i = busIdxsByMag[a];
      // The state variable is Vmag_i, and dx is d(Vmag_i) directly
      // (not dV/V). Update directly.
      Vmag[i] += dx[nAngleVars + a];
    }
  }

  // --- 6. Build result object ---
  // Compute final injections at all buses (including slack and PV)
  const Pcalc = new Array(n).fill(0);
  const Qcalc = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let Pi = 0, Qi = 0;
    for (let j = 0; j < n; j++) {
      const G = Y[i][j].re;
      const B = Y[i][j].im;
      const theta = Vang[i] - Vang[j];
      Pi += Vmag[j] * (G * Math.cos(theta) + B * Math.sin(theta));
      Qi += Vmag[j] * (G * Math.sin(theta) - B * Math.cos(theta));
    }
    Pcalc[i] = Vmag[i] * Pi;
    Qcalc[i] = Vmag[i] * Qi;
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
    firstJacobian: firstJacobian,
    firstMismatch: firstMismatch,
    firstCorrection: firstCorrection,
    error: converged ? null : "Did not converge within " + maxIter + " iterations"
  };
}

// Expose to the browser
window.solveNewton = solveNewton;
