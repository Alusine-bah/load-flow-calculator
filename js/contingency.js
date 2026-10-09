// contingency.js
// N-1 contingency analysis
//
// Simulates line outage
// Re-runs power flow
// Compares system impact



function clonePowerSystem(system) {


  return {

    name:
      system.name,

    baseMVA:
      system.baseMVA,

    baseKV:
      system.baseKV,


    buses:

      system.buses.map(
        b => ({...b})
      ),


    lines:

      system.lines.map(
        l => ({...l})
      )

  };

}





function removeLine(
  system,
  from,
  to
) {


  system.lines =
    system.lines.filter(

      line =>

      !(
        line.from === from &&
        line.to === to
      )

    );


  return system;

}





function analyzeContingency(
  system,
  outage,
  options = {}
) {


  const baseResult =
    solvePowerFlow(
      system,
      {
        method:
          options.method ||
          "Newton-Raphson"
      }
    );



  const outageSystem =
    clonePowerSystem(
      system
    );



  removeLine(

    outageSystem,

    outage.from,

    outage.to

  );



  const outageResult =
    solvePowerFlow(

      outageSystem,

      {
        method:
          options.method ||
          "Newton-Raphson"
      }

    );



 return {

    outage,

    system,

    outageSystem,

    baseResult,

    outageResult,

   converged:
  !!(
    outageResult &&
    outageResult.converged === true
  )

};

}





function printContingencyResult(
  result
) {


  console.log(
    "\nCONTINGENCY ANALYSIS"
  );


  console.log(
    "------------------------------"
  );


  console.log(

    "Outage:",

    `${result.outage.from}-${result.outage.to}`

  );


  console.log(

    "Base Converged:",

    result.baseResult.converged

  );


  console.log(

    "After Outage Converged:",

    result.outageResult.converged

  );


}





window.clonePowerSystem =
  clonePowerSystem;


window.removeLine =
  removeLine;


window.analyzeContingency =
  analyzeContingency;


window.printContingencyResult =
  printContingencyResult;