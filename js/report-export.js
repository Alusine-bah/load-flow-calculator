// report-export.js
// Export engineering reports into JSON and CSV formats


// ======================================
// JSON Export
// ======================================

function exportJSON(report) {

  return JSON.stringify(
    report,
    null,
    2
  );

}



// ======================================
// Bus CSV Export
// ======================================

function exportBusCSV(report) {


  let csv =
    "Bus,Voltage(pu),Angle(deg),P(MW),Q(MVAR)\n";



  for (const bus of report.buses) {


    csv +=

      `${bus.id},` +

      `${bus.voltage},` +

      `${bus.angle},` +

      `${bus.P_MW},` +

      `${bus.Q_MVAR}\n`;

  }



  return csv;

}



// ======================================
// Line CSV Export
// ======================================

function exportLineCSV(report) {


  let csv =

    "From,To,Loss(MW),Loss(MVAR),Flow(MVA),Current(kA)\n";



  for (const line of report.lines) {


    csv +=

      `${line.from},` +

      `${line.to},` +

      `${line.P_loss_MW},` +

      `${line.Q_loss_MVAR},` +

      `${line.flow_MVA},` +

      `${line.current_kA}\n`;

  }



  return csv;

}





window.exportJSON =
  exportJSON;


window.exportBusCSV =
  exportBusCSV;


window.exportLineCSV =
  exportLineCSV;