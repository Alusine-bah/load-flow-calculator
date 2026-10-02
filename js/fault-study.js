// fault-study.js
// Fault severity comparison study
//
// Compares fault current and fault MVA
// for different fault impedance values


function runFaultSeverityStudy(
  system,
  zbus,
  faultBus,
  loadFlowResult,
  impedanceList = []
) {


  const results = [];



  for (const Zf of impedanceList) {


    const fault =

      calculateFaultAnalysis(

        system,

        zbus,

        faultBus,

        loadFlowResult,

        {
          faultType: "Three Phase",
          faultImpedance: Zf
        }

      );



    results.push({

      faultImpedance:
        Zf,

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





function printFaultSeverityStudy(results) {


  console.log(
    "\nFAULT SEVERITY STUDY"
  );


  console.log(
    "------------------------------------------------"
  );


  console.log(
    "Zf(pu)   Current(pu)   Fault MVA   Current(kA)"
  );



  for (const r of results) {


    console.log(

      `${r.faultImpedance.toFixed(4)}     ` +

      `${r.faultCurrent_pu.toFixed(4)}        ` +

      `${r.faultMVA.toFixed(2)}       ` +

      `${r.faultCurrent_kA.toFixed(4)}`

    );


  }


}



window.runFaultSeverityStudy =
  runFaultSeverityStudy;


window.printFaultSeverityStudy =
  printFaultSeverityStudy;