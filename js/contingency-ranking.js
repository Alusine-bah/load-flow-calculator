// contingency-ranking.js
// N-1 contingency severity ranking
//
// Ranks all possible line outages


function calculateSeverityScore(
  impact,
  thermalImpact
) {


  let score = 0;



  // Voltage penalty

  for (const v of impact.voltageImpact) {


    const drop =
      Math.abs(v.deltaV);



    score +=
      drop * 100;


  }



  // Loss penalty

  score +=

    Math.abs(
      impact.lossImpact.change
    ) * 100;



  // Thermal penalty

  for (const line of thermalImpact) {


    if (
      line.after !== null &&
      line.after > 100
    ) {


      score +=
        (line.after - 100);


    }


  }



  return score;

}





function runContingencyRanking(
  system,
  options = {}
) {


  const results = [];



  for (
    const outageLine of system.lines
  ) {


    const contingency =

      analyzeContingency(

        system,

        {
          from:
            outageLine.from,

          to:
            outageLine.to

        }

      );



    const impact =

      analyzeContingencyImpact(

        contingency

      );



    const thermal =

      calculateThermalImpact(

        system,

        contingency.baseResult,

        contingency.outageSystem,

        contingency.outageResult

      );



    const score =

      calculateSeverityScore(

        impact,

        thermal

      );



    results.push({

      outage:

        `${outageLine.from}-${outageLine.to}`,

      score,


      impact,


      thermal

    });


  }



  results.sort(

    (a,b)=>

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
    "Rank   Outage   Score"
  );



  let rank = 1;



  for (const r of results) {


    console.log(

      `${rank}      ` +

      `${r.outage}      ` +

      `${r.score.toFixed(3)}`

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