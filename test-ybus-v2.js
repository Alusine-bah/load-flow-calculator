// test-ybus-v2.js
// Test Ybus generation using PowerSystem V2 model

global.window = global;

require('./js/complex.js');
require('./js/models.js');
require('./js/ybus-v2.js');


const system = new PowerSystem({
  name: "Ybus V2 Test System",
  baseMVA: 100,
  baseKV: 230
});


system.addBus(new Bus({
  id: 1,
  type: "Slack",
  V: 1.05
}));


system.addBus(new Bus({
  id: 2,
  type: "PQ"
}));


system.addBus(new Bus({
  id: 3,
  type: "PQ"
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


const Y = buildYbusV2(system);


console.log("\nYbus Matrix:\n");

for (let i = 0; i < Y.length; i++) {
  let row = "";

  for (let j = 0; j < Y[i].length; j++) {
    row += C.fmt(Y[i][j], 4).padEnd(20);
  }

  console.log(row);
}