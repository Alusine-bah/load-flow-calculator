// contingency-ranking-report.js
// Explanation layer for contingency ranking
//
// NOTE:
// The current severity score is a heuristic comparison metric.
// It is not an industry-standard contingency performance index.


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





function findMaximumLoading(
  thermal
) {

  let max = 0;

  let line = null;


  for (const t of thermal) {

    if (
      t.after !== null &&
      Number.isFinite(t.after) &&
      t.after > max
    ) {

      max =
        t.after;

      line =
        `${t.from}-${t.to}`;
    }

  }


  return {

    value:
      max,

    line:
      line

  };
}





function findMaximumVoltageDeviation(
  voltageImpact
) {

  let maxDeviation = 0;

  let bus = null;


  for (const v of voltageImpact) {

    const deviation =
      Math.abs(
        v.deltaV
      );


    if (deviation > maxDeviation) {

      maxDeviation =
        deviation;

      bus =
        v.bus;
    }

  }


  return {

    value:
      maxDeviation,

    bus:
      bus

  };
}





function determineReason(
  severity,
  maximumLoading,
  maximumVoltageDeviation
) {

  // ------------------------------------------------
  // NORMAL
  // ------------------------------------------------

  if (severity === "NORMAL") {

    return "Minor impact";
  }


  // ------------------------------------------------
  // Thermal violation
  // ------------------------------------------------

  if (
    maximumLoading.value > 100 &&
    maximumLoading.line !== null
  ) {

    return (
      `Thermal overload ${maximumLoading.line} ` +
      `(${maximumLoading.value.toFixed(2)}%)`
    );
  }


  // ------------------------------------------------
  // Voltage deviation
  // ------------------------------------------------

  if (
    maximumVoltageDeviation.value > 0.05 &&
    maximumVoltageDeviation.bus !== null
  ) {

    return (
      `Voltage deviation Bus ` +
      `${maximumVoltageDeviation.bus} ` +
      `(${maximumVoltageDeviation.value.toFixed(4)} pu)`
    );
  }


  // ------------------------------------------------
  // Remaining severity levels
  // ------------------------------------------------

  if (severity === "MEDIUM") {

    return "Moderate system impact";
  }


  if (severity === "HIGH") {

    return "High combined system impact";
  }


  if (severity === "CRITICAL") {

    return "Critical combined system impact";
  }


  return "Minor impact";
}





function createContingencyRankingReport(
  ranking
) {

  return ranking.map(

    (item, index) => {

      const severity =
        classifySeverity(
          item.score
        );


      const maximumLoading =
        findMaximumLoading(
          item.thermal
        );


      const maximumVoltageDeviation =
        findMaximumVoltageDeviation(
          item.impact.voltageImpact
        );


      const reason =
        determineReason(
          severity,
          maximumLoading,
          maximumVoltageDeviation
        );


      return {

        rank:
          index + 1,


        outage:
          item.outage,


        score:
          item.score,


        severity:
          severity,


        reason:
          reason,


        // Kept for compatibility with the current browser UI.
        // This value represents the maximum post-contingency
        // line loading percentage.
        maximumOverload:
          maximumLoading.value,


        // Kept for compatibility with the current browser UI.
        // This is the maximum absolute voltage change.
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