// fault-location-study.js
// Fault location comparison study
//
// Calculates fault severity at every bus


function runFaultLocationStudy(
  system,
  zbus,
  loadFlowResult,
  options = {}
) {


  const faultType =
    options.faultType ||
    "Three Phase";


  const faultImpedance =
    options.faultImpedance || 0;



  const results = [];



  for (const bus of system.buses) {


    const fault =

      calculateFaultAnalysis(

        system,

        zbus,

        bus.id,

        loadFlowResult,

        {

          faultType,

          faultImpedance

        }

      );



    results.push({

      bus:

        bus.id,


      faultCurrent_pu:

        fault.faultCurrent_pu,


      faultMVA:

        fault.faultMVA,


      faultCurrent_kA:

        fault.faultCurrent_kA

    });


  }



  return results;

}





function printFaultLocationStudy(results) {


  console.log(
    "\nFAULT LOCATION STUDY"
  );


  console.log(
    "------------------------------------------------"
  );


  console.log(
    "Bus   Current(pu)   Fault MVA   Current(kA)"
  );



  for (const r of results) {


    console.log(

      `${r.bus}     ` +

      `${r.faultCurrent_pu.toFixed(4)}        ` +

      `${r.faultMVA.toFixed(2)}       ` +

      `${r.faultCurrent_kA.toFixed(4)}`

    );


  }

}



window.runFaultLocationStudy =
  runFaultLocationStudy;


window.printFaultLocationStudy =
  printFaultLocationStudy;