// test-line-flow.js
// Test line flow calculation and power balance


global.window = global;


// ======================================
// Load dependencies
// ======================================

require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');


require('./js/ybus.js');

require('./js/newton.js');


require('./js/results.js');

require('./js/newton-v2.js');

require('./js/solver.js');

require('./js/units.js');

require('./js/line-flow.js');



// ======================================
// Solve system
// ======================================

const system = loadSystemV2("4bus");


const result = solvePowerFlow(
  system,
  {
    method: "Newton-Raphson"
  }
);



// ======================================
// Calculate line flows
// ======================================

const flows = calculateLineFlows(
  system,
  result
);



console.log("\nLine Flow Results\n");



for (const f of flows) {


  console.log(
    `${f.from} -> ${f.to}`
  );


  console.log(
    "P from:",
    f.P_from.toFixed(6)
  );


  console.log(
    "Q from:",
    f.Q_from.toFixed(6)
  );


  console.log(
    "P to:",
    f.P_to.toFixed(6)
  );


  console.log(
    "Q to:",
    f.Q_to.toFixed(6)
  );


  console.log(
    "P loss:",
    f.P_loss.toFixed(6)
  );


  console.log(
    "Sending MVA:",
    f.S_from_MVA.toFixed(4)
  );


  console.log(
    "Current kA:",
    f.current_kA.toFixed(4)
  );


  console.log(
    "Loading %:",
    f.loading_percent === null
      ? "N/A"
      : f.loading_percent.toFixed(2)
  );


  console.log("----------------");

}



// ======================================
// Total line losses
// ======================================

let totalLineLoss = 0;


for (const f of flows) {

  totalLineLoss += f.P_loss;

}



console.log(
  "Total line P loss:",
  totalLineLoss.toFixed(6)
);



// ======================================
// Power balance validation
// ======================================

let totalInjectedP = 0;


for (const bus of result.buses) {

  totalInjectedP += bus.P_calc;

}



const systemLoss = totalInjectedP;



console.log(
  "System calculated P loss:",
  systemLoss.toFixed(6)
);



console.log(
  "Difference:",
  Math.abs(
    totalLineLoss - systemLoss
  ).toExponential(3)
);