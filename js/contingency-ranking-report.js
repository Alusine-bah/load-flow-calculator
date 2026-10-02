// contingency-ranking-report.js
// Explanation layer for contingency ranking


function classifySeverity(score) {


  if (score >= 100) {

    return "CRITICAL";

  }


  if (score >= 20) {

    return "HIGH";

  }


  if (score >= 5) {

    return "MEDIUM";

  }


  return "NORMAL";

}





function findMaximumOverload(
  thermal
) {


  let max = 0;

  let line = null;



  for (const t of thermal) {


    if (
      t.after !== null &&
      t.after > max
    ) {


      max = t.after;

      line =
        `${t.from}-${t.to}`;

    }


  }



  return {

    value:
      max,

    line

  };

}





function findMaximumVoltageDrop(
  voltageImpact
) {


  let maxDrop = 0;

  let bus = null;



  for (const v of voltageImpact) {


    const drop =
      Math.abs(v.deltaV);



    if (drop > maxDrop) {


      maxDrop = drop;

      bus =
        v.bus;

    }


  }



  return {

    value:
      maxDrop,

    bus

  };

}





function createContingencyRankingReport(
  ranking
) {


  return ranking.map(

    (item,index)=>{


      const overload =
        findMaximumOverload(
          item.thermal
        );


      const voltage =
        findMaximumVoltageDrop(
          item.impact.voltageImpact
        );



      let reason =
        "Low impact";



      if (overload.value > 100) {


        reason =
          `Thermal overload ${overload.line}`;


      }

      else if (
        voltage.value > 0.05
      ) {


        reason =
          `Voltage drop Bus ${voltage.bus}`;


      }



      return {


        rank:
          index + 1,


        outage:
          item.outage,


        score:
          item.score,


        severity:
          classifySeverity(
            item.score
          ),


        reason,


        maximumOverload:
          overload.value,


        maximumVoltageDrop:
          voltage.value


      };


    }

  );

}





function printContingencyRankingReport(
  report
) {


  console.log(
    "\nCONTINGENCY SECURITY RANKING"
  );


  console.log(
    "--------------------------------"
  );


  console.log(
    "Rank Outage Score Severity Reason"
  );



  for (const r of report) {


    console.log(

      `${r.rank}    ` +

      `${r.outage}    ` +

      `${r.score.toFixed(3)}   ` +

      `${r.severity}   ` +

      `${r.reason}`

    );


  }


}



window.createContingencyRankingReport =
  createContingencyRankingReport;


window.printContingencyRankingReport =
  printContingencyRankingReport;