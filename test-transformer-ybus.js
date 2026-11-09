
// test-transformer-ybus.js
// Independent numerical regression test for transformer Ybus.

global.window = global;

const { C } = require("./js/complex.js");
const {
  Bus,
  Transformer,
  PowerSystem
} = require("./js/models.js");

const { buildYbusV2 } = require("./js/ybus-v2.js");

const TOL = 1e-10;

function assertComplex(actual, expected, label) {
  const error = Math.hypot(
    actual.re - expected.re,
    actual.im - expected.im
  );

  console.log(
    label + ": error = " + error.toExponential(3)
  );

  if (error > TOL) {
    throw new Error(
      label + " failed. Expected " +
      C.fmt(expected, 10) +
      ", received " +
      C.fmt(actual, 10)
    );
  }
}


// ======================================
// Test transformer
// ======================================

const system = new PowerSystem({
  name: "Transformer Ybus Regression",
  baseMVA: 100,
  baseKV: 230
});

system.addBus(new Bus({
  id: 1,
  type: "Slack"
}));

system.addBus(new Bus({
  id: 2,
  type: "PQ"
}));

system.addTransformer(new Transformer({
  from: 1,
  to: 2,
  R: 0.01,
  X: 0.05,
  tapRatio: 1.05,
  phaseShift: 10,
  ratingMVA: 100
}));


// ======================================
// Calculate Ybus
// ======================================

const Y = buildYbusV2(system);


// ======================================
// Independent expected values
// ======================================

const Z = C.make(0.01, 0.05);

const y = C.div(
  C.make(1, 0),
  Z
);

const a = C.fromPolar(
  1.05,
  10 * Math.PI / 180
);

const expected = [
  [
    C.scale(y, 1 / (1.05 * 1.05)),
    C.neg(C.div(y, C.conj(a)))
  ],
  [
    C.neg(C.div(y, a)),
    y
  ]
];


// ======================================
// Compare all four elements
// ======================================

console.log("\n===== Transformer Ybus Test =====");

assertComplex(Y[0][0], expected[0][0], "Yff");
assertComplex(Y[0][1], expected[0][1], "Yft");
assertComplex(Y[1][0], expected[1][0], "Ytf");
assertComplex(Y[1][1], expected[1][1], "Ytt");

console.log("\nPASS: All transformer Ybus elements match.");
console.log("Tolerance:", TOL);
