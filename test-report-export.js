// test-report-export.js
// Test report export functions


global.window = global;



require('./js/report-export.js');



const sampleReport = {


  buses: [

    {
      id: 1,
      voltage: 1.05,
      angle: 0,
      P_MW: 50,
      Q_MVAR: 20
    },

    {
      id: 2,
      voltage: 1.02,
      angle: -1,
      P_MW: -40,
      Q_MVAR: -15
    }

  ],



  lines: [

    {
      from: 1,
      to: 2,
      P_loss_MW: 0.5,
      Q_loss_MVAR: -2,
      flow_MVA: 60,
      current_kA: 0.15
    }

  ]

};



console.log("\nJSON EXPORT\n");

console.log(
  exportJSON(sampleReport)
);



console.log("\nBUS CSV\n");

console.log(
  exportBusCSV(sampleReport)
);



console.log("\nLINE CSV\n");

console.log(
  exportLineCSV(sampleReport)
);


console.log("PASS");