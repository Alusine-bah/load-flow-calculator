// ybus.js — construct the bus admittance matrix from line data
// Requires: complex.js (loaded first, provides window.C)
let C_local;

if (typeof require !== "undefined") {
  ({ C: C_local } = require("./complex.js"));
}
else if (typeof window !== "undefined") {
  C_local = window.C;
}

function buildYbus(system) {
  const n = system.buses.length;
  const Y = [];

  // Initialise Y as n×n complex zeros
  for (let i = 0; i < n; i++) {
    Y.push([]);
    for (let j = 0; j < n; j++) {
      Y[i].push(C_local.zero());
    }
  }

  // Accumulate contributions from each line
  for (const line of system.lines) {
    const i = line.from - 1;   // 0-based index
    const j = line.to - 1;

    // Series admittance y_ij = 1 / (R + jX)
    const Zseries = C_local.make(line.R, line.X);
    if (C_local.abs(Zseries) === 0) {
      throw new Error(`Line ${line.from}→${line.to} has zero impedance`);
    }
    const y_series = C_local.div(C_local.make(1, 0), Zseries);

    // Shunt admittance (half the charging susceptance at each end)
    const y_shunt = C_local.make(0, line.B / 2);

    // Diagonal: add y_series + y_shunt at both ends
    Y[i][i] = C_local.add(Y[i][i], C_local.add(y_series, y_shunt));
    Y[j][j] = C_local.add(Y[j][j], C_local.add(y_series, y_shunt));

    // Off-diagonal: subtract y_series
    Y[i][j] = C_local.sub(Y[i][j], y_series);
    Y[j][i] = C_local.sub(Y[j][i], y_series);
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

if (typeof window !== "undefined") {
  window.buildYbus = buildYbus;
  window.printYbus = printYbus;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildYbus, printYbus };
}