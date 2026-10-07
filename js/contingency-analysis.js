// contingency-analysis.js
// N-1 contingency impact analysis
//
// Compares:
// - Voltage deviation
// - System losses


function calculateVoltageImpact(
  baseResult,
  outageResult
) {


  const impact = [];


  // Handle failed contingency solution

  if (
    !outageResult ||
    !outageResult.buses
  ) {

    return impact;

  }



  for (
    let i = 0;
    i < baseResult.buses.length;
    i++
  ) {


    const baseBus =
      baseResult.buses[i];


    const outageBus =
      outageResult.buses[i];



    impact.push({

      bus:
        baseBus.id,


      before:
        baseBus.V,


      after:
        outageBus.V,


      deltaV:
        outageBus.V - baseBus.V

    });


  }



  return impact;

}





function calculateLossImpact(
  system,
  baseResult,
  outageSystem,
  outageResult
) {


  // Failed outage solution

  if (
    !outageResult ||
    !outageResult.buses
  ) {

    return {

      before: 0,

      after: 0,

      change: 0

    };

  }



  const baseFlows =
    calculateLineFlows(
      system,
      baseResult
    );



  const outageFlows =
    calculateLineFlows(
      outageSystem,
      outageResult
    );



  let baseLoss = 0;

  let outageLoss = 0;



  for (const line of baseFlows) {

    baseLoss += line.P_loss;

  }



  for (const line of outageFlows) {

    outageLoss += line.P_loss;

  }



  return {


    before:
      baseLoss,


    after:
      outageLoss,


    change:
      outageLoss - baseLoss

  };

}





function analyzeContingencyImpact(
  contingencyResult
) {


  const voltageImpact =

    calculateVoltageImpact(

      contingencyResult.baseResult,

      contingencyResult.outageResult

    );



  const lossImpact =

    calculateLossImpact(

      contingencyResult.system,

      contingencyResult.baseResult,

      contingencyResult.outageSystem,

      contingencyResult.outageResult

    );



  return {


    outage:
      contingencyResult.outage,


    converged:
      contingencyResult.converged,


    voltageImpact,


    lossImpact

  };

}





function printContingencyImpact(
  result
) {


  console.log(
    "\nCONTINGENCY IMPACT REPORT"
  );


  console.log(
    "------------------------------"
  );


  console.log(
    "Outage:",
    `${result.outage.from}-${result.outage.to}`
  );



  console.log(
    "\nVOLTAGE IMPACT"
  );


  console.log(
    "Bus   Before   After   Delta"
  );



  for (
    const v of result.voltageImpact
  ) {


    console.log(

      `${v.bus}     ` +

      `${v.before.toFixed(4)}   ` +

      `${v.after.toFixed(4)}   ` +

      `${v.deltaV.toFixed(5)}`

    );

  }



  console.log(
    "\nLOSS IMPACT"
  );


  console.log(
    "Before Loss:",
    result.lossImpact.before.toFixed(6)
  );


  console.log(
    "After Loss:",
    result.lossImpact.after.toFixed(6)
  );


  console.log(
    "Change:",
    result.lossImpact.change.toFixed(6)
  );

}





window.calculateVoltageImpact =
  calculateVoltageImpact;


window.calculateLossImpact =
  calculateLossImpact;


window.analyzeContingencyImpact =
  analyzeContingencyImpact;


window.printContingencyImpact =
  printContingencyImpact;