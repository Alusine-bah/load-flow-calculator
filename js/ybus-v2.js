
 // ybus-v2.js
// Y-bus builder for PowerSystem V2
//
// Supports:
// - Transmission lines
// - Line charging susceptance
// - Line conductance
// - Independent bus shunts
// - Off-nominal transformer tap ratios
// - Phase-shifting transformers
//
// Per-unit convention:
// All branch impedances and admittances must be
// expressed on the common system base.
//
// Transformer tap:
// a = tapRatio * exp(j * phaseShift)
//
// Transformer shunt G + jB is connected on
// the secondary (to-bus) side.

var C_local;

if (typeof require !== "undefined") {
  ({ C: C_local } = require("./complex.js"));
} else if (typeof window !== "undefined") {
  C_local = window.C;
}


// ======================================
// YBUS BUILDER
// ======================================

function buildYbusV2(system) {

  if (
    !system ||
    !Array.isArray(system.buses) ||
    !Array.isArray(system.lines)
  ) {
    throw new Error("Invalid power system model.");
  }

  const n = system.buses.length;

  if (n === 0) {
    throw new Error("Power system contains no buses.");
  }

  const Y = [];

  // Initialize zero matrix.
  for (let i = 0; i < n; i++) {
    Y[i] = [];

    for (let j = 0; j < n; j++) {
      Y[i][j] = C_local.zero();
    }
  }


  // ======================================
  // BUS INDEX LOOKUP
  // ======================================

  const busIndex = new Map();

  for (let i = 0; i < n; i++) {

    const id = system.buses[i].id;

    if (busIndex.has(id)) {
      throw new Error(`Duplicate bus id ${id}.`);
    }

    busIndex.set(id, i);
  }


  // ======================================
  // HELPER: ADD BRANCH ADMITTANCE
  // ======================================

  function addBranch(i, j, Yii, Yij, Yji, Yjj) {

    Y[i][i] = C_local.add(Y[i][i], Yii);

    Y[i][j] = C_local.add(Y[i][j], Yij);

    Y[j][i] = C_local.add(Y[j][i], Yji);

    Y[j][j] = C_local.add(Y[j][j], Yjj);
  }


  // ======================================
  // 1. TRANSMISSION LINES
  // ======================================

  for (const line of system.lines) {

    const i = busIndex.get(line.from);
    const j = busIndex.get(line.to);

    if (i === undefined || j === undefined) {
      throw new Error(
        `Line ${line.from}-${line.to} references unknown bus.`
      );
    }

    if (i === j) {
      throw new Error(
        `Line ${line.from}-${line.to} connects a bus to itself.`
      );
    }

    if (
      !Number.isFinite(line.R) ||
      !Number.isFinite(line.X) ||
      !Number.isFinite(line.B || 0) ||
      !Number.isFinite(line.G || 0)
    ) {
      throw new Error(
        `Line ${line.from}-${line.to} has non-finite parameters.`
      );
    }

    if (line.R === 0 && line.X === 0) {
      throw new Error(
        `Invalid line impedance ${line.from}-${line.to}.`
      );
    }

    const Z = C_local.make(line.R, line.X);

    const ySeries = C_local.div(
      C_local.make(1, 0),
      Z
    );

    const yShunt = C_local.make(
      line.G || 0,
      (line.B || 0) / 2
    );

    const Yii = C_local.add(ySeries, yShunt);

    const Yjj = C_local.add(ySeries, yShunt);

    const Yij = C_local.neg(ySeries);

    const Yji = C_local.neg(ySeries);

    addBranch(i, j, Yii, Yij, Yji, Yjj);
  }


  // ======================================
  // 2. TRANSFORMERS
  // ======================================

  for (const transformer of (system.transformers || [])) {

    const i = busIndex.get(transformer.from);
    const j = busIndex.get(transformer.to);

    if (i === undefined || j === undefined) {
      throw new Error(
        `Transformer ${transformer.from}-${transformer.to} references unknown bus.`
      );
    }

    if (i === j) {
      throw new Error(
        `Transformer ${transformer.from}-${transformer.to} connects a bus to itself.`
      );
    }

    const R = transformer.R;
    const X = transformer.X;

    const tapRatio = transformer.tapRatio ?? 1.0;
    const phaseShift = transformer.phaseShift ?? 0;

    const G = transformer.G ?? 0;
    const B = transformer.B ?? 0;

    if (
      !Number.isFinite(R) ||
      !Number.isFinite(X) ||
      !Number.isFinite(tapRatio) ||
      !Number.isFinite(phaseShift) ||
      !Number.isFinite(G) ||
      !Number.isFinite(B)
    ) {
      throw new Error(
        `Transformer ${transformer.from}-${transformer.to} has non-finite parameters.`
      );
    }

    if (R === 0 && X === 0) {
      throw new Error(
        `Transformer ${transformer.from}-${transformer.to} has zero impedance.`
      );
    }

    if (tapRatio <= 0) {
      throw new Error(
        `Transformer ${transformer.from}-${transformer.to} has invalid tap ratio.`
      );
    }


    // Series impedance.

    const Z = C_local.make(R, X);

    const ySeries = C_local.div(
      C_local.make(1, 0),
      Z
    );


    // Complex tap ratio:
    //
    // a = t * exp(j theta)

    const theta = phaseShift * Math.PI / 180;

    const a = C_local.fromPolar(
      tapRatio,
      theta
    );

    const aConj = C_local.conj(a);

    const tapMagnitudeSquared =
      tapRatio * tapRatio;


    // Transformer series admittance:
    //
    // Yff = y / |a|²
    // Yft = -y / a*
    // Ytf = -y / a
    // Ytt = y

    const Yii = C_local.scale(
      ySeries,
      1 / tapMagnitudeSquared
    );

    const Yij = C_local.neg(
      C_local.div(ySeries, aConj)
    );

    const Yji = C_local.neg(
      C_local.div(ySeries, a)
    );

    let Yjj = ySeries;


    // Secondary-side transformer shunt.
    //
    // This is an explicit modelling convention.
    // G and B are not split between both sides.

    const yShunt = C_local.make(G, B);

    Yjj = C_local.add(
      Yjj,
      yShunt
    );

    addBranch(i, j, Yii, Yij, Yji, Yjj);
  }


  // ======================================
  // 3. INDEPENDENT BUS SHUNTS
  // ======================================

  for (const shunt of (system.shunts || [])) {

    const i = busIndex.get(shunt.busId);

    if (i === undefined) {
      throw new Error(
        `Shunt references unknown bus ${shunt.busId}.`
      );
    }

    const G = shunt.G || 0;
    const B = shunt.B || 0;

    if (
      !Number.isFinite(G) ||
      !Number.isFinite(B)
    ) {
      throw new Error(
        `Bus shunt at bus ${shunt.busId} has non-finite parameters.`
      );
    }

    const yShunt = C_local.make(G, B);

    Y[i][i] = C_local.add(
      Y[i][i],
      yShunt
    );
  }


  return Y;
}


// ======================================
// EXPORTS
// ======================================

if (typeof window !== "undefined") {
  window.buildYbusV2 = buildYbusV2;
}

if (
  typeof module !== "undefined" &&
  module.exports
) {
  module.exports = { buildYbusV2 };
}
