// fault-analysis.js
// Fault analysis framework using Zbus
//
// Current supported calculation:
// Three Phase Fault
//
// Future:
// Single Line to Ground
// Line to Line
// Double Line to Ground
//
// Equation:
// If = Vprefault / (Zth + Zf)



function calculateFaultCurrent(
  zbus,
  faultBus,
  prefaultVoltage = C.make(1, 0),
  faultImpedance = 0
) {


  const Zth =
    zbus[faultBus][faultBus];


  const Zf =
    C.make(
      faultImpedance,
      0
    );


  const denominator =
    C.add(
      Zth,
      Zf
    );


  const Ifault =
    C.div(
      prefaultVoltage,
      denominator
    );


  return Ifault;

}





function getPrefaultVoltage(
  result,
  faultBus
) {


  if (!result || !result.buses) {

    return C.make(1, 0);

  }



  const bus =
    result.buses.find(
      b => b.id === faultBus
    );



  if (!bus) {

    return C.make(1, 0);

  }



  return C.fromPolar(

    bus.V,

    bus.delta_deg *
    Math.PI / 180

  );

}





function calculateFaultAnalysis(
  system,
  zbus,
  faultBus,
  loadFlowResult = null,
  options = {}
) {


  const baseMVA =
    system.baseMVA;


  const baseKV =
    system.baseKV;



  const faultType =
    options.faultType ||
    "Three Phase";



  let prefaultVoltage;



  if (options.prefaultVoltage) {


    prefaultVoltage =
      options.prefaultVoltage;


  }

  else {


    prefaultVoltage =
      getPrefaultVoltage(
        loadFlowResult,
        faultBus
      );

  }



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


    faultType,


    bus:
      faultBus,


    faultImpedance,


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
    "\nFAULT ANALYSIS REPORT"
  );


  console.log(
    "------------------------------"
  );



  console.log(
    "Fault Type:",
    result.faultType
  );



  console.log(
    "Fault Bus:",
    result.bus
  );



  console.log(
    "Fault Impedance:",
    result.faultImpedance.toFixed(4),
    "pu"
  );



  console.log(
    "Pre-fault Voltage:",
    C.abs(
      result.prefaultVoltage
    ).toFixed(4),
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