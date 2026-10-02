// report.js
// Engineering load flow report generator
// Includes line flow and thermal loading analysis


function createLoadFlowReport(
  system,
  result,
  lineFlows = null,
  voltageReport = null,
  lineRatings = null
) {


  const baseMVA = system.baseMVA;



  return {


    system: {

      name: system.name,

      baseMVA: baseMVA,

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

        id: bus.id,

        type: bus.type,

        voltage: bus.V,

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
      ? lineFlows.map(line => ({

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
      : [],



    lineRatings:

      lineRatings || [],



    voltage:

      voltageReport || null

  };

}





function printLoadFlowReport(report) {



  console.log(
    "\nPOWER FLOW ENGINEERING REPORT"
  );

  console.log(
    "==============================\n"
  );



  console.log("SYSTEM");

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





  console.log("\nBUS VOLTAGE RESULTS");

  console.log("------------------------------");


  console.log(
    "Bus   V(pu)   Angle(deg)   P(MW)     Q(MVAR)"
  );



  for (const bus of report.buses) {


    console.log(

      `${bus.id}     ` +
      `${bus.voltage.toFixed(4)}   ` +
      `${bus.angle.toFixed(4)}   ` +
      `${bus.P_MW.toFixed(4)}   ` +
      `${bus.Q_MVAR.toFixed(4)}`

    );

  }





  console.log("\nLINE FLOW DETAILS");

  console.log("------------------------------");


  console.log(
    "Line   Loss(MW)   Loss(MVAR)   Flow(MVA)   Current(kA)"
  );



  for (const line of report.lines) {


    console.log(

      `${line.from}-${line.to}   ` +
      `${line.P_loss_MW.toFixed(4)}      ` +
      `${line.Q_loss_MVAR.toFixed(4)}      ` +
      `${line.flow_MVA.toFixed(4)}      ` +
      `${line.current_kA.toFixed(4)}`

    );

  }





  console.log("\nLINE THERMAL LOADING");

  console.log("------------------------------");


  console.log(
    "Line   Flow(MVA)   Rating(MVA)   Loading   Status"
  );



  for (const line of report.lineRatings) {


    console.log(

      `${line.from}-${line.to}   ` +

      `${line.flow_MVA.toFixed(2)}        ` +

      `${line.rating_MVA || "N/A"}          ` +

      `${
        line.loading_percent === null
        ? "N/A"
        : line.loading_percent.toFixed(2) + "%"
      }     ` +

      `${line.status}`

    );

  }





  if (report.voltage) {


    console.log("\nVOLTAGE SUMMARY");

    console.log("------------------------------");


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