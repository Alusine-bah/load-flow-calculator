// data.js — default system definitions for the load flow calculator
// All quantities in per-unit unless noted. Base values are system-wide.

const SYSTEMS = {

  // ----------------------------------------------------------------
  // 4-bus system from Stevenson, Example 7.1 / Problem 7.x
  // Also used in Saadat Chapter 6 examples.
  // Bus types: 1 = Slack, 2 = PV, 3 = PQ, 4 = PQ
  // ----------------------------------------------------------------
  "4bus": {
    name: "4-bus (Stevenson)",
    baseMVA: 100,
    baseKV: 230,
    tol: 1e-9,
    maxIter: 30,

    buses: [
      // id, type, V (pu), delta (deg), Pgen, Qgen, Pload, Qload
      { id: 1, type: "Slack", V: 1.05, delta: 0.0, Pgen: 0.0, Qgen: 0.0, Pload: 0.0, Qload: 0.0 },
      { id: 2, type: "PV",    V: 1.02, delta: 0.0, Pgen: 0.5, Qgen: 0.0, Pload: 0.0, Qload: 0.0 },
      { id: 3, type: "PQ",    V: 1.00, delta: 0.0, Pgen: 0.0, Qgen: 0.0, Pload: 0.6, Qload: 0.3 },
      { id: 4, type: "PQ",    V: 1.00, delta: 0.0, Pgen: 0.0, Qgen: 0.0, Pload: 0.4, Qload: 0.2 },
    ],

    lines: [
      // from, to, R (pu), X (pu), B (pu)  — B is total shunt charging
      { from: 1, to: 2, R: 0.01008, X: 0.0504, B: 0.1024 },
      { from: 1, to: 3, R: 0.00744, X: 0.0372, B: 0.0774 },
      { from: 2, to: 4, R: 0.00744, X: 0.0372, B: 0.0774 },
      { from: 3, to: 4, R: 0.01272, X: 0.0636, B: 0.1292 },
    ],
  },

  // ----------------------------------------------------------------
  // IEEE 9-bus test system (standard, widely published)
  // Bus types: 1 = Slack, 2,3 = PV, 4..9 = PQ
  // ----------------------------------------------------------------
  "9bus": {
    name: "IEEE 9-bus",
    baseMVA: 100,
    baseKV: 345,
    tol: 1e-9,
    maxIter: 30,

    buses: [
      { id: 1, type: "Slack", V: 1.04,  delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.0,  Qload: 0.0  },
      { id: 2, type: "PV",    V: 1.025, delta: 0.0, Pgen: 1.63, Qgen: 0.0, Pload: 0.0,  Qload: 0.0  },
      { id: 3, type: "PV",    V: 1.025, delta: 0.0, Pgen: 0.85, Qgen: 0.0, Pload: 0.0,  Qload: 0.0  },
      { id: 4, type: "PQ",    V: 1.0,   delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.0,  Qload: 0.0  },
      { id: 5, type: "PQ",    V: 1.0,   delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 1.25, Qload: 0.50 },
      { id: 6, type: "PQ",    V: 1.0,   delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.90, Qload: 0.30 },
      { id: 7, type: "PQ",    V: 1.0,   delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.0,  Qload: 0.0  },
      { id: 8, type: "PQ",    V: 1.0,   delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 1.00, Qload: 0.35 },
      { id: 9, type: "PQ",    V: 1.0,   delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.0,  Qload: 0.0  },
    ],

   lines: [
 // from, to, R (pu), X (pu), B (pu), ratingMVA
// NOTE: ratingMVA values below are assumed demo thermal limits
// for educational analysis and are not authoritative IEEE 9-bus ratings.

  { from: 1, to: 4, R: 0.0,    X: 0.0576, B: 0.0,   ratingMVA: 250 },
  { from: 4, to: 5, R: 0.017,  X: 0.092,  B: 0.158, ratingMVA: 250 },
  { from: 5, to: 6, R: 0.039,  X: 0.170,  B: 0.358, ratingMVA: 150 },
  { from: 3, to: 6, R: 0.0,    X: 0.0586, B: 0.0,   ratingMVA: 300 },
  { from: 6, to: 7, R: 0.0119, X: 0.1008, B: 0.209, ratingMVA: 150 },
  { from: 7, to: 8, R: 0.0085, X: 0.072,  B: 0.149, ratingMVA: 150 },
  { from: 8, to: 2, R: 0.0,    X: 0.0625, B: 0.0,   ratingMVA: 300 },
  { from: 8, to: 9, R: 0.032,  X: 0.161,  B: 0.306, ratingMVA: 150 },
  { from: 9, to: 4, R: 0.01,   X: 0.085,  B: 0.176, ratingMVA: 150 },
],
  },

  // ----------------------------------------------------------------
  // IEEE 5-bus test system (canonical)
  // Bus types: 1 = Slack, 2 = PV, 3,4,5 = PQ
  // All values per unit on 100 MVA base.
  // Line charging B is the TOTAL shunt susceptance of each line
  // (ybus.js adds B/2 at each end).
  // ----------------------------------------------------------------
  "5bus": {
    name: "IEEE 5-bus",
    baseMVA: 100,
    baseKV: 230,
    tol: 1e-9,
    maxIter: 30,

    buses: [
      { id: 1, type: "Slack", V: 1.06, delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.0,  Qload: 0.0  },
      { id: 2, type: "PV",    V: 1.00, delta: 0.0, Pgen: 0.40, Qgen: 0.0, Pload: 0.20, Qload: 0.10 },
      { id: 3, type: "PQ",    V: 1.00, delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.45, Qload: 0.15 },
      { id: 4, type: "PQ",    V: 1.00, delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.40, Qload: 0.05 },
      { id: 5, type: "PQ",    V: 1.00, delta: 0.0, Pgen: 0.0,  Qgen: 0.0, Pload: 0.60, Qload: 0.10 },
    ],

    lines: [
      { from: 1, to: 2, R: 0.02, X: 0.06, B: 0.06 },
      { from: 1, to: 3, R: 0.08, X: 0.24, B: 0.05 },
      { from: 2, to: 3, R: 0.06, X: 0.18, B: 0.04 },
      { from: 2, to: 4, R: 0.06, X: 0.18, B: 0.04 },
      { from: 2, to: 5, R: 0.04, X: 0.12, B: 0.03 },
      { from: 3, to: 4, R: 0.01, X: 0.03, B: 0.02 },
      { from: 4, to: 5, R: 0.08, X: 0.24, B: 0.05 },
    ],
  },

};

// Deep clone helper — so each solver run gets a fresh, unmutated copy
function cloneSystem(sys) {
  return JSON.parse(JSON.stringify(sys));
}

window.SYSTEMS = SYSTEMS;
window.cloneSystem = cloneSystem;