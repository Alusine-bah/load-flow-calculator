// contingency-ranking.js
// N-1 contingency severity ranking
//
// Ranks all possible line outages
// Distinguishes:
// - CONVERGED
// - FAILED
// - ISLANDED
//
// NOTE:
// Severity score is a heuristic comparison metric.
// Topology status is kept separate from the numeric score.



function calculateSeverityScore(
  impact,
  thermalImpact,
  converged = true
) {


  // ------------------------------------------------
  // Non-converged power flow
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





function getContingencyStatus(
  contingency
) {


  if (
    contingency.islanded === true
  ) {

    return "ISLANDED";

  }


  if (
    contingency.converged !== true
  ) {

    return "FAILED";

  }


  return "CONVERGED";

}





function getStatusPriority(
  status
) {


  if (
    status === "ISLANDED"
  ) {

    return 3;

  }


  if (
    status === "FAILED"
  ) {

    return 2;

  }


  return 1;

}





function runContingencyRanking(
  system,
  options = {}
) {


  const results =
    [];



  for (
    const outageLine
    of system.lines
  ) {


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



    const status =
      getContingencyStatus(
        contingency
      );



    const impact =
      analyzeContingencyImpact(
        contingency
      );



    let thermal =
      [];



    // ------------------------------------------------
    // Calculate thermal impact only when
    // post-contingency power flow converged
    // ------------------------------------------------

    if (
      contingency.converged === true
    ) {


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


      status,


      converged:
        contingency.converged,


      islanded:
        contingency.islanded === true,


      islandCount:
        contingency.islandCount || 1,


      islands:
        contingency.islands || [],


      impact,


      thermal

    });

  }



  // ------------------------------------------------
  // Ranking order
  //
  // 1. ISLANDED
  // 2. FAILED
  // 3. CONVERGED
  //
  // Within the same status, higher score ranks first.
  // ------------------------------------------------

  results.sort(

    (a, b) => {


      const priorityDifference =

        getStatusPriority(b.status) -
        getStatusPriority(a.status);


      if (
        priorityDifference !== 0
      ) {

        return priorityDifference;

      }


      return (
        b.score -
        a.score
      );

    }

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
    "--------------------------------"
  );


  console.log(
    "Rank   Outage   Score   Status"
  );



  let rank =
    1;



  for (const r of results) {


    console.log(

      `${rank}      ` +

      `${r.outage}      ` +

      `${r.score.toFixed(3)}      ` +

      `${r.status}`

    );


    rank++;

  }

}





window.calculateSeverityScore =
  calculateSeverityScore;


window.getContingencyStatus =
  getContingencyStatus;


window.runContingencyRanking =
  runContingencyRanking;


window.printContingencyRanking =
  printContingencyRanking;