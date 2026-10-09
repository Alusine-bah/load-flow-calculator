// contingency-ranking-report.js
// Explanation layer for N-1 contingency ranking
//
// Provides:
// - Severity classification
// - Worst voltage deviation
// - Worst thermal loading
// - Violation summary
// - Human-readable reason
//
// NOTE:
// Severity score remains a heuristic comparison metric.
// It is not an industry-standard performance index.



function classifySeverity(
  score,
  converged = true
) {

  if (!converged) {
    return "FAILED";
  }


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





function findMaximumLoading(
  thermal = []
) {

  let max = null;

  let line = null;


  for (const t of thermal) {


    if (
      t.after !== null &&
      Number.isFinite(t.after) &&
      t.after > 100
    ) {


      if (
        max === null ||
        t.after > max
      ) {

        max = t.after;

        line =
          `${t.from}-${t.to}`;

      }

    }

  }


  return {

    value:max,

    line:line

  };

}





function findMaximumVoltageDeviation(
  voltageImpact = []
) {


  let max = null;

  let bus = null;


  for (const v of voltageImpact) {


    const deviation =
      Math.abs(v.deltaV);



    if (
      max === null ||
      deviation > max
    ) {


      max =
        deviation;


     bus =
deviation > 0.05
?
v.bus
:
null;

    }

  }



  return {

 value:
   max,

 bus:
   max !== null && max > 0.05
   ?
   bus
   :
   null

};

}





function countVoltageViolations(
  voltageImpact = []
) {


  let count = 0;


  for (const v of voltageImpact) {


    if (
      Math.abs(v.deltaV) > 0.05
    ) {

      count++;

    }

  }


  return count;

}





function countThermalViolations(
  thermal = []
) {


  let count = 0;


  for (const t of thermal) {


    if (
      t.after !== null &&
      t.after > 100
    ) {

      count++;

    }

  }


  return count;

}





function determineReason(
  severity,
  maximumLoading,
  maximumVoltageDeviation,
  violations
) {



  if (severity === "FAILED") {

    return "Power flow failed to converge";

  }




  if (
    violations.thermal > 0 &&
    maximumLoading.line !== null
  ) {


    return (

      `Thermal overload ${maximumLoading.line} ` +

      `(${maximumLoading.value.toFixed(2)}%)`

    );

  }





  if (
    violations.voltage > 0 &&
    maximumVoltageDeviation.bus !== null
  ) {


    return (

      `Voltage deviation Bus ${maximumVoltageDeviation.bus} ` +

      `(${maximumVoltageDeviation.value.toFixed(4)} pu)`

    );

  }





  if (severity === "HIGH") {

    return "High combined system impact";

  }



  if (severity === "MEDIUM") {

    return "Moderate system impact";

  }



  return "Minor impact";

}





function createContingencyRankingReport(
  ranking
) {


  return ranking.map(

    (item,index)=>{


      const rank =
        index + 1;



      if (
        item.converged === false
      ) {


        return {


          rank,


          outage:
            item.outage,


          score:
            item.score,


          converged:false,


          severity:"FAILED",


          reason:
            "Power flow failed to converge",


          violations:{
            voltage:null,
            thermal:null
          },


          worstBus:null,

          worstLine:null,


          maximumOverload:null,


          maximumVoltageDrop:null


        };


      }





      const maximumLoading =

        findMaximumLoading(
          item.thermal
        );





      const maximumVoltageDeviation =

        findMaximumVoltageDeviation(

          item.impact.voltageImpact

        );





      const violations = {


        voltage:

          countVoltageViolations(

            item.impact.voltageImpact

          ),


        thermal:

          countThermalViolations(

            item.thermal

          )

      };





      const severity =

        classifySeverity(

          item.score,

          true

        );





      return {


        rank,


        outage:
          item.outage,


        score:
          item.score,


        converged:true,


        severity,


        reason:

          determineReason(

            severity,

            maximumLoading,

            maximumVoltageDeviation,

            violations

          ),



        violations,



        worstBus:

          maximumVoltageDeviation.bus,



        worstLine:

          maximumLoading.line,



        maximumOverload:

          maximumLoading.value,



        maximumVoltageDrop:

          maximumVoltageDeviation.value


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


  for (const r of report) {


    console.log(

      `${r.rank} ${r.outage} ` +

      `${r.severity} ` +

      `Score=${r.score.toFixed(3)} ` +

      `${r.reason}`

    );


  }

}



// ------------------------------------------------
// Create N-1 contingency summary
// ------------------------------------------------

function createContingencySummary(
  report
) {

  const summary = {

    total:
      report.length,


    failed:
      0,

    critical:
      0,

    high:
      0,

    medium:
      0,

    normal:
      0,


    worstOverall:
      null,


    worstOverallScore:
      -Infinity,


    worstConverged:
      null,


    worstConvergedScore:
      -Infinity,


    worstReason:
      null

};



  for (const r of report) {


    switch(r.severity) {


      case "FAILED":

        summary.failed++;

        break;


      case "CRITICAL":

        summary.critical++;

        break;


      case "HIGH":

        summary.high++;

        break;


      case "MEDIUM":

        summary.medium++;

        break;


      case "NORMAL":

        summary.normal++;

        break;

    }




   // Worst overall contingency

if (
  r.score > summary.worstOverallScore
) {

  summary.worstOverallScore =
    r.score;

  summary.worstOverall =
    r.outage;

  summary.worstReason =
    r.reason;

}



// Worst converged contingency

if (
  r.converged === true &&
  r.score > summary.worstConvergedScore
) {

  summary.worstConvergedScore =
    r.score;

  summary.worstConverged =
    r.outage;

}


  }



  return summary;

}





function printContingencySummary(
  summary
) {

  console.log(
    "\nN-1 SECURITY SUMMARY"
  );

  console.log(
    "------------------------------"
  );

  console.log(
    "Total contingencies:",
    summary.total
  );

  console.log(
    "FAILED:",
    summary.failed
  );

  console.log(
    "CRITICAL:",
    summary.critical
  );

  console.log(
    "HIGH:",
    summary.high
  );

  console.log(
    "MEDIUM:",
    summary.medium
  );

  console.log(
    "NORMAL:",
    summary.normal
  );

  console.log(
    "\nWorst overall:",
    summary.worstOverall
  );

  console.log(
    "Worst overall score:",
    Number.isFinite(summary.worstOverallScore)
      ? summary.worstOverallScore.toFixed(3)
      : "N/A"
  );

  console.log(
    "Reason:",
    summary.worstReason
  );

  console.log(
    "\nWorst converged:",
    summary.worstConverged
  );

  console.log(
    "Worst converged score:",
    Number.isFinite(summary.worstConvergedScore)
      ? summary.worstConvergedScore.toFixed(3)
      : "N/A"
  );

}

window.createContingencyRankingReport =
  createContingencyRankingReport;


window.printContingencyRankingReport =
  printContingencyRankingReport;

window.createContingencySummary =
  createContingencySummary;


window.printContingencySummary =
  printContingencySummary;