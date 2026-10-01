// ybus.js — construct the bus admittance matrix from line data
// Requires: complex.js (loaded first, provides window.C)

function buildYbus(system) {
  const n = system.buses.length;
  const Y = [];

  // Initialise Y as n×n complex zeros
  for (let i = 0; i < n; i++) {
    Y.push([]);
    for (let j = 0; j < n; j++) {
      Y[i].push(C.zero());
    }
  }

  // Accumulate contributions from each line
  for (const line of system.lines) {
    const i = line.from - 1;   // 0-based index
    const j = line.to - 1;

    // Series admittance y_ij = 1 / (R + jX)
    const Zseries = C.make(line.R, line.X);
    if (C.abs(Zseries) === 0) {
      throw new Error(`Line ${line.from}→${line.to} has zero impedance`);
    }
    const y_series = C.div(C.make(1, 0), Zseries);

    // Shunt admittance (half the charging susceptance at each end)
    const y_shunt = C.make(0, line.B / 2);

    // Diagonal: add y_series + y_shunt at both ends
    Y[i][i] = C.add(Y[i][i], C.add(y_series, y_shunt));
    Y[j][j] = C.add(Y[j][j], C.add(y_series, y_shunt));

    // Off-diagonal: subtract y_series
    Y[i][j] = C.sub(Y[i][j], y_series);
    Y[j][i] = C.sub(Y[j][i], y_series);
  }

  return Y;
}

// Pretty-print Y as G and B matrices (real and imaginary parts)
function printYbus(Y) {
  const n = Y.length;
  const fmt = (x) => x.toFixed(6).padStart(11);

  console.log("\nG matrix (real part of Y):");
  for (let i = 0; i < n; i++) {
    let row = "";
    for (let j = 0; j < n; j++) row += fmt(Y[i][j].re);
    console.log(row);
  }

  console.log("\nB matrix (imaginary part of Y):");
  for (let i = 0; i < n; i++) {
    let row = "";
    for (let j = 0; j < n; j++) row += fmt(Y[i][j].im);
    console.log(row);
  }
}

window.buildYbus = buildYbus;
window.printYbus = printYbus;