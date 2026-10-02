// contingency-thermal.js
// N-1 contingency thermal impact analysis
//
// Compares:
// - Line loading before outage
// - Line loading after outage
// - Outage status



function calculateThermalImpact(
  baseSystem,
  baseResult,
  outageSystem,
  outageResult
) {


  const baseFlows =
    calculateLineFlows(
      baseSystem,
      baseResult
    );



  const outageFlows =
    calculateLineFlows(
      outageSystem,
      outageResult
    );



  const impact = [];



  for (const baseLine of baseSystem.lines) {



    const baseFlow =
      baseFlows.find(

        f =>

        f.from === baseLine.from &&
        f.to === baseLine.to

      );



    if (!baseFlow) {

      continue;

    }



    const outageLine =
      outageSystem.lines.find(

        line =>

        line.from === baseLine.from &&
        line.to === baseLine.to

      );



    const result = {


      from:
        baseLine.from,


      to:
        baseLine.to,


      rating:
        baseLine.ratingMVA || null,


      before:
        null,


      after:
        null,


      status:
        "NORMAL"

    };





    // Before contingency loading

    if (baseLine.ratingMVA) {


      result.before =

        (
          baseFlow.S_from_MVA /
          baseLine.ratingMVA
        ) * 100;

    }





    // Line removed during contingency

    if (!outageLine) {


      result.status =
        "OUTAGE";


      impact.push(result);


      continue;

    }





    // After contingency loading

    const outageFlow =
      outageFlows.find(

        f =>

        f.from === outageLine.from &&
        f.to === outageLine.to

      );



    if (
      outageFlow &&
      outageLine.ratingMVA
    ) {


      result.after =

        (
          outageFlow.S_from_MVA /
          outageLine.ratingMVA
        ) * 100;



      if (result.after >= 100) {


        result.status =
          "OVERLOAD";


      }

      else if (result.after >= 90) {


        result.status =
          "WARNING";


      }


    }



    impact.push(result);


  }



  return impact;

}





function printThermalImpact(
  results
) {


  console.log(
    "\nCONTINGENCY THERMAL IMPACT"
  );


  console.log(
    "------------------------------"
  );


  console.log(
    "Line   Before   After   Status"
  );



  for (const line of results) {


    console.log(

      `${line.from}-${line.to}   ` +

      `${

        line.before === null

        ?

        "N/A"

        :

        line.before.toFixed(2) + "%"

      }   ` +

      `${

        line.after === null

        ?

        line.status === "OUTAGE"
          ? "OUTAGE"
          : "N/A"

        :

        line.after.toFixed(2) + "%"

      }   ` +

      `${line.status}`

    );


  }


}





window.calculateThermalImpact =
  calculateThermalImpact;


window.printThermalImpact =
  printThermalImpact;