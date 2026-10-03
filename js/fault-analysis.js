// fault-analysis.js
// Fault analysis framework using Zbus
//
// Supported:
// - Three Phase Fault
//
// Future:
// - SLG fault
// - LL fault
// - LLG fault
//
// Equation:
// If = Vprefault / (Zth + Zf)



function getZbusIndex(
  system,
  faultBus
) {

  if (!system || !system.buses) {

    throw new Error(
      "System bus data is unavailable."
    );

  }


  const index =
    system.buses.findIndex(
      bus =>
        bus.id === faultBus
    );


  if (index === -1) {

    throw new Error(
      "Fault bus " +
      faultBus +
      " does not exist."
    );

  }


  return index;

}





// Get voltage level of faulted bus
// Fallback to system baseKV

function getFaultBusKV(
  system,
  faultBus
) {


  const bus =
    system.buses.find(
      b =>
        b.id === faultBus
    );


  if (!bus) {

    throw new Error(
      "Fault bus voltage data unavailable."
    );

  }



  return (

    bus.baseKV ||

    system.baseKV ||

    1

  );

}





function calculateFaultCurrent(
  zbus,
  system,
  faultBus,
  prefaultVoltage = C.make(1,0),
  faultImpedance = 0
) {


  const index =
    getZbusIndex(
      system,
      faultBus
    );



  if (
    !zbus ||
    !zbus[index] ||
    !zbus[index][index]
  ) {

    throw new Error(
      "Invalid Zbus matrix or bus index."
    );

  }



  const Zth =
    zbus[index][index];



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



  return C.div(
    prefaultVoltage,
    denominator
  );

}





function getPrefaultVoltage(
  result,
  faultBus
) {


  if (
    !result ||
    !result.buses
  ) {

    return C.make(
      1,
      0
    );

  }



  const bus =
    result.buses.find(
      b =>
        b.id === faultBus
    );



  if (!bus) {

    throw new Error(
      "Prefault voltage bus not found."
    );

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



  const faultKV =
    getFaultBusKV(
      system,
      faultBus
    );



  const faultType =
    options.faultType ||
    "Three Phase";



  let prefaultVoltage;



  if (
    options.prefaultVoltage
  ) {

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

      system,

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

      faultKV

    );



  return {

    faultType,


    bus:
      faultBus,


    faultKV,


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





function printFaultReport(
  result
) {


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
    "Fault Voltage:",
    result.faultKV,
    "kV"
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