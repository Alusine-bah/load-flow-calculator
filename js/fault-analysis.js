// fault-analysis.js
// Three phase short circuit fault analysis using Zbus
//
// Calculates:
// - Fault current in pu
// - Fault current in kA
// - Fault MVA
// - Bus voltage during fault


function calculateFaultCurrent(
  zbus,
  faultBus,
  prefaultVoltage = 1,
  faultImpedance = 0
) {


  const Zth =
    zbus[faultBus][faultBus];



  const denominator =
    C.add(
      Zth,
      C.make(
        faultImpedance,
        0
      )
    );



  const Ifault =
    C.div(
      C.make(
        prefaultVoltage,
        0
      ),
      denominator
    );



  return Ifault;

}





function calculateFaultAnalysis(
  system,
  zbus,
  faultBus,
  options = {}
) {


  const baseMVA =
    system.baseMVA;



  const baseKV =
    system.baseKV;



  const prefaultVoltage =
    options.prefaultVoltage || 1;



  const faultImpedance =
    options.faultImpedance || 0;



  const Ifault =
    calculateFaultCurrent(
      zbus,
      faultBus,
      prefaultVoltage,
      faultImpedance
    );



  const IfaultMagnitude =
    C.abs(
      Ifault
    );



  const faultMVA =
    IfaultMagnitude *
    baseMVA;



  const currentKA =
    calculateCurrentKA(
      faultMVA,
      baseKV
    );



  return {


    bus:
      faultBus,


    prefaultVoltage,


    faultCurrent_pu:
      IfaultMagnitude,


    faultMVA,


    faultCurrent_kA:
      currentKA,


    currentComplex:
      Ifault

  };

}





function printFaultReport(result) {


  console.log(
    "\nTHREE PHASE FAULT REPORT"
  );


  console.log(
    "------------------------------"
  );


  console.log(
    "Fault Bus:",
    result.bus
  );


  console.log(
    "Pre-fault Voltage:",
    result.prefaultVoltage.toFixed(4),
    "pu"
  );


  console.log(
    "Fault Current:",
    result.faultCurrent_pu.toFixed(4),
    "pu"
  );


  console.log(
    "Fault MVA:",
    result.faultMVA.toFixed(2),
    "MVA"
  );


  console.log(
    "Fault Current:",
    result.faultCurrent_kA.toFixed(4),
    "kA"
  );

}



window.calculateFaultCurrent =
  calculateFaultCurrent;


window.calculateFaultAnalysis =
  calculateFaultAnalysis;


window.printFaultReport =
  printFaultReport;