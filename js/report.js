// report.js
// Engineering report generator
// Includes:
// - Load flow results
// - Line flow
// - Thermal loading
// - Fault analysis
// - Fault studies


function createLoadFlowReport(
  system,
  result,
  lineFlows = null,
  voltageReport = null,
  lineRatings = null,
  faultReport = null,
  faultLocationStudy = null,
  faultSeverityStudy = null
) {


  const baseMVA =
    system.baseMVA;



  return {


    system: {

      name:
        system.name,

      baseMVA,

      numberOfBuses:
        system.buses.length,

      numberOfLines:
        system.lines.length

    },



    solver: {

      method:
        result.method,

      converged:
        result.converged,

      iterations:
        result.iterations

    },



    buses:

      result.buses.map(bus => ({

        id:
          bus.id,

        type:
          bus.type,

        voltage:
          bus.V,

        angle:
          bus.delta_deg,


        P_MW:
          puToMW(
            bus.P_calc,
            baseMVA
          ),


        Q_MVAR:
          puToMVAR(
            bus.Q_calc,
            baseMVA
          )

      })),



    lines:

      lineFlows
      ?
      lineFlows.map(line => ({

        from:
          line.from,

        to:
          line.to,

        P_loss_MW:
          puToMW(
            line.P_loss,
            baseMVA
          ),

        Q_loss_MVAR:
          puToMVAR(
            line.Q_loss,
            baseMVA
          ),

        flow_MVA:
          line.S_from_MVA,

        current_kA:
          line.current_kA

      }))
      :
      [],



    lineRatings:
      lineRatings || [],



    fault:
      faultReport || null,



    faultLocation:
      faultLocationStudy || [],



    faultSeverity:
      faultSeverityStudy || [],



    voltage:
      voltageReport || null

  };

}





function printLoadFlowReport(report) {


  console.log(
    "\nPOWER FLOW ENGINEERING REPORT"
  );

  console.log(
    "=============================="
  );



  console.log("\nSYSTEM");

  console.log("------------------------------");


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

  console.log("------------------------------");


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





  console.log("\nLINE THERMAL LOADING");

  console.log("------------------------------");


  for (const line of report.lineRatings) {

    console.log(
      `${line.from}-${line.to}  ` +
      `${line.loading_percent.toFixed(2)}%  ` +
      `${line.status}`
    );

  }





  if (report.fault) {


    console.log("\nFAULT ANALYSIS");

    console.log("------------------------------");


    console.log(
      "Fault Type:",
      report.fault.faultType
    );


    console.log(
      "Fault Bus:",
      report.fault.bus
    );


    console.log(
      "Fault Current:",
      report.fault.faultCurrent_pu.toFixed(4),
      "pu"
    );


    console.log(
      "Fault MVA:",
      report.fault.faultMVA.toFixed(2),
      "MVA"
    );

  }





  if (report.faultLocation.length) {


    console.log("\nFAULT LOCATION STUDY");

    console.log("------------------------------");


    console.log(
      "Bus   Fault MVA   Current(kA)"
    );



    for (const f of report.faultLocation) {


      console.log(

        `${f.bus}     ` +

        `${f.faultMVA.toFixed(2)}       ` +

        `${f.faultCurrent_kA.toFixed(4)}`

      );

    }

  }





  if (report.faultSeverity.length) {


    console.log("\nFAULT SEVERITY STUDY");

    console.log("------------------------------");


    console.log(
      "Zf(pu)   Fault MVA   Current(kA)"
    );



    for (const f of report.faultSeverity) {


      console.log(

        `${f.faultImpedance.toFixed(4)}     ` +

        `${f.faultMVA.toFixed(2)}       ` +

        `${f.faultCurrent_kA.toFixed(4)}`

      );

    }

  }

}



window.createLoadFlowReport =
  createLoadFlowReport;


window.printLoadFlowReport =
  printLoadFlowReport;