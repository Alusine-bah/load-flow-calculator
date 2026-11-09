// test-ybus-v2-regression.js
// Numerical regression test for Y-Bus V2.

global.window = global;

require('./js/complex.js');
require('./js/models.js');
require('./js/ybus-v2.js');

const system = new PowerSystem({
  name: "Ybus V2 Regression Test",
  baseMVA: 100,
  baseKV: 230
});

system.addBus(new Bus({ id: 1, type: "Slack" }));
system.addBus(new Bus({ id: 2, type: "PQ" }));
system.addBus(new Bus({ id: 3, type: "PQ" }));

system.addLine(new Line({
  from: 1, to: 2,
  R: 0.01, X: 0.05, B: 0.02
}));

system.addLine(new Line({
  from: 2, to: 3,
  R: 0.02, X: 0.06, B: 0.03
}));

system.addShunt(new Shunt({
  busId: 3,
  B: 0.05
}));

const Y = buildYbusV2(system);

const expected = [
  [
    { re: 3.846153846153846, im: -19.22076923076923 },
    { re: -3.846153846153846, im: 19.23076923076923 },
    { re: 0, im: 0 }
  ],
  [
    { re: -3.846153846153846, im: 19.23076923076923 },
    { re: 8.846153846153847, im: -34.205769230769235 },
    { re: -5, im: 15 }
  ],
  [
    { re: 0, im: 0 },
    { re: -5, im: 15 },
    { re: 5, im: -14.935 }
  ]
];

const TOL = 1e-9;
let failures = 0;

for (let i = 0; i < Y.length; i++) {
  for (let j = 0; j < Y.length; j++) {
    const actual = Y[i][j];
    const target = expected[i][j];

    const error = Math.hypot(
      actual.re - target.re,
      actual.im - target.im
    );

    if (error > TOL) {
      failures++;
      console.error(
        `FAIL Y[${i}][${j}]: error=${error}`
      );
    }
  }
}

if (failures > 0) {
  console.error(`FAILED: ${failures} matrix element(s).`);
  process.exit(1);
}

console.log("PASS: All 9 Y-Bus elements match expected values.");
console.log("Tolerance:", TOL);
