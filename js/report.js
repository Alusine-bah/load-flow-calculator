// report.js
// Load flow engineering report generator


function createLoadFlowReport(
  system,
  result,
  lineFlows = null,
  voltageReport = null
) {


  const report = {


    // ======================================
    // System information
    // ======================================

    system: {

      name: system.name,

      baseMVA: system.baseMVA,

      numberOfBuses:
        system.buses.length,

      numberOfLines:
        system.lines.length

    },



    // ======================================
    // Solver information
    // ======================================

    solver: {

      method: result.method,

      converged:
        result.converged,

      iterations:
        result.iterations

    },



    // ======================================
    // Bus results
    // ======================================

    buses: result.buses.map(
      bus => ({

        id: bus.id,

        type: bus.type,

        voltage:
          bus.V,

        angle:
          bus.delta_deg,

        P:
          bus.P_calc,

        Q:
          bus.Q_calc

      })
    ),



    // ======================================
    // Line flow results
    // ======================================

    lines:
      lineFlows || [],



    // ======================================
    // Voltage analysis
    // ======================================

    voltage:

      voltageReport || null

  };



  return report;

}





function printLoadFlowReport(report) {


  console.log("\nPOWER FLOW REPORT");

  console.log("==================\n");



  console.log("SYSTEM");

  console.log("------------------");

  console.log(
    "Name:",
    report.system.name
  );


  console.log(
    "Base MVA:",
    report.system.baseMVA
  );


  console.log(
    "Buses:",
    report.system.numberOfBuses
  );


  console.log(
    "Lines:",
    report.system.numberOfLines
  );



  console.log("\nSOLVER");

  console.log("------------------");


  console.log(
    "Method:",
    report.solver.method
  );


  console.log(
    "Converged:",
    report.solver.converged
  );


  console.log(
    "Iterations:",
    report.solver.iterations
  );



  console.log("\nBUS RESULTS");

  console.log("------------------");


  console.log(
    "Bus   V(pu)   Angle(deg)"
  );



  for (const bus of report.buses) {


    console.log(

      `${bus.id}     ` +

      `${bus.voltage.toFixed(4)}   ` +

      `${bus.angle.toFixed(4)}`

    );

  }



  if (report.lines) {


    console.log("\nLINE FLOWS");

    console.log("------------------");



    for (const line of report.lines) {


      console.log(

        `${line.from} -> ${line.to}  ` +

        `Loss=${line.P_loss.toFixed(6)}`

      );

    }

  }



  if (report.voltage) {


    console.log("\nVOLTAGE SUMMARY");

    console.log("------------------");


    console.log(

      "Minimum Voltage Bus:",

      report.voltage.minimumVoltage.id

    );


    console.log(

      "Maximum Voltage Bus:",

      report.voltage.maximumVoltage.id

    );


  }


}



window.createLoadFlowReport =
  createLoadFlowReport;


window.printLoadFlowReport =
  printLoadFlowReport;