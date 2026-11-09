
// test-transformer-newton.js
// Newton-Raphson transformer integration test

global.window = global;

// Dependencies
require('./js/complex.js');
require('./js/models.js');
require('./js/ybus.js');
require('./js/ybus-v2.js');
require('./js/newton.js');
require('./js/results.js');
require('./js/newton-v2.js');

const {
  Bus,
  Transformer,
  PowerSystem
} = require('./js/models.js');

const {
  solveNewtonV2
} = require('./js/newton-v2.js');


// ======================================
// CREATE TEST POWER SYSTEM
// ======================================

const system = new PowerSystem({
  name: "Two Bus Transformer Test",
  baseMVA: 100,
  baseKV: 230
});


// Slack bus
system.addBus(new Bus({
  id: 1,
  type: "Slack",
  V: 1.0,
  delta: 0,
  baseKV: 230
}));


// Load bus
system.addBus(new Bus({
  id: 2,
  type: "PQ",
  V: 1.0,
  delta: 0,
  Pload: 0.5,
  Qload: 0.2,
  baseKV: 230
}));


// ======================================
// ADD TRANSFORMER
// ======================================

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
// VALIDATE SYSTEM
// ======================================

const validation = system.validate();

if (!validation.valid) {
  throw new Error(
    "System validation failed: " +
    validation.errors.join("; ")
  );
}


// ======================================
// RUN NEWTON-RAPHSON
// ======================================

const result = solveNewtonV2(system);


// ======================================
// VERIFY RESULTS
// ======================================

if (!result) {
  throw new Error("No load flow result returned.");
}

if (!result.converged) {
  throw new Error("Newton-Raphson did not converge.");
}

if (result.buses.length !== 2) {
  throw new Error("Expected results for exactly two buses.");
}

for (const bus of result.buses) {

  if (
    !Number.isFinite(bus.V) ||
    !Number.isFinite(bus.delta_deg)
  ) {
    throw new Error(
      "Invalid voltage result at bus " + bus.id
    );
  }

}


// ======================================
// DISPLAY RESULTS
// ======================================

console.log("\nTRANSFORMER NEWTON-RAPHSON TEST");

console.log("--------------------------------");

console.log("Converged:", result.converged);

console.log("Iterations:", result.iterations);

console.log("Base MVA:", result.baseMVA);

console.log("\nBus Results:");

for (const bus of result.buses) {

  console.log(
    `Bus ${bus.id}: ` +
    `V = ${bus.V.toFixed(6)} pu, ` +
    `Angle = ${bus.delta_deg.toFixed(6)} degrees`
  );

}

console.log("\nPASS: Newton-Raphson transformer integration test.");
