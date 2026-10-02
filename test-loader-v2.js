// test-loader-v2.js
// Test conversion from data.js SYSTEMS to PowerSystem V2 model

global.window = global;

require('./js/complex.js');
require('./js/data.js');
require('./js/models.js');
require('./js/system-loader-v2.js');


const system = loadSystemV2("4bus");


console.log("System name:", system.name);
console.log("Base MVA:", system.baseMVA);

console.log("\nNumber of buses:", system.buses.length);
console.log("Number of lines:", system.lines.length);


console.log("\nBus summary:");

for (const bus of system.buses) {
  console.log(
    bus.id,
    bus.type,
    "P:",
    bus.P_injected,
    "Q:",
    bus.Q_injected
  );
}


console.log("\nFirst line:");

console.log(system.lines[0]);