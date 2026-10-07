// contingency-ranking.js
// N-1 contingency severity ranking
//
// Ranks all possible line outages
// Includes power-flow convergence failure handling


function calculateSeverityScore(
  impact,
  thermalImpact,
  converged = true
) {


  // ------------------------------------------------
  // Failed power flow
  // ------------------------------------------------

  if (!converged) {

    return 1000;

  }



  let score = 0;



  // ------------------------------------------------
  // Voltage deviation penalty
  // ------------------------------------------------

  for (const v of impact.voltageImpact) {


    const deviation =
      Math.abs(v.deltaV);


    score +=
      deviation * 100;


  }



  // ------------------------------------------------
  // Loss variation penalty
  // ------------------------------------------------

  score +=

    Math.abs(
      impact.lossImpact.change
    ) * 100;



  // ------------------------------------------------
  // Thermal overload penalty
  // ------------------------------------------------

  for (const line of thermalImpact) {


    if (
      line.after !== null &&
      line.after > 100
    ) {


      score +=
        line.after - 100;


    }


  }



  return score;

}





function runContingencyRanking(
  system,
  options = {}
) {


  const results = [];



  for (const outageLine of system.lines) {


    const contingency =
      analyzeContingency(

        system,

        {
          from:
            outageLine.from,

          to:
            outageLine.to
        },

        options

      );



    const impact =
      analyzeContingencyImpact(
        contingency
      );



    let thermal = [];



    // Calculate thermal impact only
    // if the post-contingency power flow converged

    if (contingency.converged) {


      thermal =
        calculateThermalImpact(

          system,

          contingency.baseResult,

          contingency.outageSystem,

          contingency.outageResult

        );


    }



    const score =
      calculateSeverityScore(

        impact,

        thermal,

        contingency.converged

      );



    results.push({

      outage:

        `${outageLine.from}-${outageLine.to}`,


      score,


      converged:

        contingency.converged,


      impact,


      thermal

    });


  }



  results.sort(

    (a,b) =>

      b.score - a.score

  );



  return results;

}




function printContingencyRanking(
  results
) {


  console.log(
    "\nCONTINGENCY SEVERITY RANKING"
  );


  console.log(
    "------------------------------"
  );


  console.log(
    "Rank   Outage   Score   Status"
  );



  let rank = 1;



  for (const r of results) {


    console.log(

      `${rank}      ` +

      `${r.outage}      ` +

      `${r.score.toFixed(3)}      ` +

      `${r.converged ? "OK" : "FAILED"}`

    );


    rank++;

  }


}





window.calculateSeverityScore =
  calculateSeverityScore;


window.runContingencyRanking =
  runContingencyRanking;


window.printContingencyRanking =
  printContingencyRanking;