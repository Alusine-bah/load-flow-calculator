// test-models.js
// Basic test for Power System V2 data models

global.window = global;

require('./js/models.js');


const system = new PowerSystem({
  name: "Test 3 Bus System",
  baseMVA: 100,
  baseKV: 230
});


system.addBus(new Bus({
  id: 1,
  name: "Slack Bus",
  type: "Slack",
  V: 1.05,
  delta: 0
}));


system.addBus(new Bus({
  id: 2,
  name: "PV Generator Bus",
  type: "PV",
  V: 1.02,
  Pgen: 0.5
}));


system.addBus(new Bus({
  id: 3,
  name: "Load Bus",
  type: "PQ",
  Pload: 0.6,
  Qload: 0.3
}));


system.addLine(new Line({
  from: 1,
  to: 2,
  R: 0.01,
  X: 0.05,
  B: 0.02
}));


system.addLine(new Line({
  from: 2,
  to: 3,
  R: 0.02,
  X: 0.06,
  B: 0.03
}));


system.addShunt(new Shunt({
  busId: 3,
  B: 0.05
}));


console.log("System:", system.name);
console.log("Base MVA:", system.baseMVA);
console.log("Number of buses:", system.numberOfBuses);

console.log("\nBus details:");
system.buses.forEach(bus => {
  console.log(
    bus.id,
    bus.name,
    bus.type,
    "P injection:",
    bus.P_injected,
    "Q injection:",
    bus.Q_injected
  );
});


console.log("\nLines:");
console.log(system.lines);

console.log("\nShunts:");
console.log(system.shunts);