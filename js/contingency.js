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


function getConnectedComponents(system) {

  const adjacency =
    new Map();


  for (const bus of system.buses) {

    adjacency.set(
      bus.id,
      []
    );

  }


  for (const line of system.lines) {

    if (
      adjacency.has(line.from) &&
      adjacency.has(line.to)
    ) {

      adjacency
        .get(line.from)
        .push(line.to);


      adjacency
        .get(line.to)
        .push(line.from);

    }

  }


  const visited =
    new Set();


  const components =
    [];


  for (const bus of system.buses) {

    if (
      visited.has(bus.id)
    ) {

      continue;

    }


    const component =
      [];


    const stack =
      [bus.id];


    while (
      stack.length > 0
    ) {

      const current =
        stack.pop();


      if (
        visited.has(current)
      ) {

        continue;

      }


      visited.add(current);

      component.push(current);


      const neighbours =
        adjacency.get(current) || [];


      for (
        const neighbour
        of neighbours
      ) {

        if (
          !visited.has(neighbour)
        ) {

          stack.push(neighbour);

        }

      }

    }


    components.push(
      component
    );

  }


  return components;

}





function detectIslanding(system) {

  const components =
    getConnectedComponents(
      system
    );


  return {

    islanded:
      components.length > 1,

    islandCount:
      components.length,

    islands:
      components

  };

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

const islanding =
  detectIslanding(
    outageSystem
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

  islanded:
    islanding.islanded,

  islandCount:
    islanding.islandCount,

  islands:
    islanding.islands,

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
window.getConnectedComponents =
  getConnectedComponents;


window.detectIslanding =
  detectIslanding;