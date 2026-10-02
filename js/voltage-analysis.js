// voltage-analysis.js
// Voltage profile analysis for LoadFlowResult


function analyzeVoltageProfile(result, options = {}) {


  const minLimit =
    options.minVoltage || 0.95;


  const maxLimit =
    options.maxVoltage || 1.05;



  const buses = [];



  let minBus = null;

  let maxBus = null;


  let totalVoltage = 0;



  for (const bus of result.buses) {


    const voltage = bus.V;


    const deviation =
      (voltage - 1.0) * 100;



    let status = "NORMAL";


    if (voltage < minLimit) {

      status = "LOW VOLTAGE";

    }


    else if (voltage > maxLimit) {

      status = "HIGH VOLTAGE";

    }



    const data = {

      id: bus.id,

      type: bus.type,

      V: voltage,

      delta_deg: bus.delta_deg,

      deviation_percent: deviation,

      status: status

    };



    buses.push(data);



    totalVoltage += voltage;



    if (
      minBus === null ||
      voltage < minBus.V
    ) {

      minBus = data;

    }



    if (
      maxBus === null ||
      voltage > maxBus.V
    ) {

      maxBus = data;

    }

  }



  return {

    buses: buses,


    minimumVoltage: minBus,


    maximumVoltage: maxBus,


    averageVoltage:
      totalVoltage / buses.length,


    limits: {

      min: minLimit,

      max: maxLimit

    }

  };

}



function printVoltageProfile(report) {


  console.log("\nVoltage Profile Report");

  console.log("----------------------\n");



  console.log(
    "Bus   Voltage(pu)   Angle(deg)   Status"
  );


  console.log(
    "----------------------------------------"
  );



  for (const bus of report.buses) {


    console.log(

      `${bus.id.toString().padEnd(5)}` +

      `${bus.V.toFixed(4).padEnd(14)}` +

      `${bus.delta_deg.toFixed(4).padEnd(13)}` +

      `${bus.status}`

    );

  }



  console.log("\nMinimum Voltage:");

  console.log(

    `Bus ${report.minimumVoltage.id} = ` +

    `${report.minimumVoltage.V.toFixed(4)} pu`

  );



  console.log("\nMaximum Voltage:");

  console.log(

    `Bus ${report.maximumVoltage.id} = ` +

    `${report.maximumVoltage.V.toFixed(4)} pu`

  );



  console.log("\nAverage Voltage:");

  console.log(

    `${report.averageVoltage.toFixed(4)} pu`

  );

}



window.analyzeVoltageProfile = analyzeVoltageProfile;

window.printVoltageProfile = printVoltageProfile;