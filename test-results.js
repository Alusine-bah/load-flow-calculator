// test-results.js
// Test common LoadFlowResult model


global.window = global;


require('./js/results.js');



const result = new LoadFlowResult({

  method: "Newton-Raphson",

  converged: true,

  iterations: 4

});



result.addBusResult({

  id: 1,

  type: "Slack",

  V: 1.04,

  delta_deg: 0,

  Pgen: 1.5,

  Qgen: 0.5,

  Pload: 0,

  Qload: 0

});



result.addBusResult({

  id: 2,

  type: "PQ",

  V: 0.98,

  delta_deg: -2.5,

  Pgen: 0,

  Qgen: 0,

  Pload: 1.0,

  Qload: 0.4

});



result.calculateSummary();



result.printSummary();



console.log("\nBus Results:");

console.log(result.buses);



console.log("\nPASS: Result model created successfully");