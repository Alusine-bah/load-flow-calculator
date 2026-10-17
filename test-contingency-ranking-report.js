// test-contingency-ranking-report.js
//
// Regression tests for the N-1 contingency ranking report.
//
// Verifies:
// - Existing 4-bus contingency ranking can be generated.
// - Thermal violation boundary is consistent with
//   contingency-thermal.js:
//       loading < 100%  -> not overload
//       loading >= 100% -> overload / thermal violation
//
// The test exits with a non-zero status if any assertion fails.


global.window = global;


// ============================================================
// Dependencies
// ============================================================

require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');


require('./js/ybus.js');

require('./js/results.js');


require('./js/newton.js');

require('./js/newton-v2.js');

require('./js/solver.js');


require('./js/units.js');

require('./js/line-flow.js');


require('./js/contingency.js');

require('./js/contingency-analysis.js');

require('./js/contingency-thermal.js');

require('./js/contingency-ranking.js');

require('./js/contingency-ranking-report.js');


// ============================================================
// Test helper
// ============================================================

let failures = 0;


function assert(
  condition,
  message
) {

  if (condition) {

    console.log(
      `PASS: ${message}`
    );

  }

  else {

    failures++;

    console.error(
      `FAIL: ${message}`
    );

  }

}


// ============================================================
// Existing 4-bus contingency ranking test
// ============================================================

const system =
  loadSystemV2(
    "4bus"
  );


system.lines[0].ratingMVA = 100;

system.lines[1].ratingMVA = 80;

system.lines[2].ratingMVA = 50;

system.lines[3].ratingMVA = 20;


const ranking =
  runContingencyRanking(
    system
  );


const report =
  createContingencyRankingReport(
    ranking
  );


printContingencyRankingReport(
  report
);


assert(
  Array.isArray(report),
  "Contingency ranking report is an array."
);


assert(
  report.length ===
    system.lines.length,
  "Report contains one entry for each N-1 line outage."
);


// ============================================================
// Thermal boundary regression helper
// ============================================================

function createSyntheticRankingItem(
  loadingPercent
) {

  return {

    outage:
      "TEST-1-2",

    score:
      0,

    status:
      "CONVERGED",

    converged:
      true,

    islanded:
      false,

    islandCount:
      1,

    islands:
      [[1, 2]],

    thermal: [

      {
        from:
          1,

        to:
          2,

        before:
          50,

        after:
          loadingPercent,

        status:
          loadingPercent >= 100
            ? "OVERLOAD"
            : "NORMAL"
      }

    ],

    impact: {

      voltageImpact:
        []

    }

  };

}


function createBoundaryReport(
  loadingPercent
) {

  return createContingencyRankingReport(
    [
      createSyntheticRankingItem(
        loadingPercent
      )
    ]
  )[0];

}


// ============================================================
// Thermal violation boundary tests
// ============================================================

console.log(
  "\nTHERMAL VIOLATION BOUNDARY TESTS"
);

console.log(
  "--------------------------------"
);


// ------------------------------------------------------------
// Below 100%
// ------------------------------------------------------------

const belowBoundary =
  createBoundaryReport(
    99.999
  );


assert(
  belowBoundary.violations.thermal === 0,
  "99.999% loading is not counted as a thermal violation."
);


assert(
  belowBoundary.reason ===
    "Minor impact",
  "99.999% loading does not produce a thermal-overload reason."
);


// ------------------------------------------------------------
// Exactly 100%
// ------------------------------------------------------------

const exactBoundary =
  createBoundaryReport(
    100
  );


assert(
  exactBoundary.violations.thermal === 1,
  "100.000% loading is counted as a thermal violation."
);


assert(
  exactBoundary.worstLine ===
    "1-2",
  "100.000% loading identifies line 1-2 as the maximum-loading line."
);


assert(
  exactBoundary.maximumOverload ===
    100,
  "100.000% loading is preserved as the maximum loading."
);


assert(
  exactBoundary.reason ===
    "Thermal overload 1-2 (100.00%)",
  "100.000% loading produces a thermal-overload reason."
);


// ------------------------------------------------------------
// Above 100%
// ------------------------------------------------------------

const aboveBoundary =
  createBoundaryReport(
    100.001
  );


assert(
  aboveBoundary.violations.thermal === 1,
  "100.001% loading is counted as a thermal violation."
);


assert(
  aboveBoundary.reason ===
    "Thermal overload 1-2 (100.00%)",
  "Loading above 100% continues to produce a thermal-overload reason."
);


// ============================================================
// Final summary
// ============================================================

console.log(
  "\n=============================================="
);

console.log(
  "CONTINGENCY RANKING REPORT TEST SUMMARY"
);

console.log(
  "=============================================="
);


if (failures === 0) {

  console.log(
    "PASS: All contingency ranking report tests passed."
  );

}

else {

  console.error(
    `FAIL: ${failures} contingency ranking report test(s) failed.`
  );

}


process.exitCode =
  failures === 0
    ? 0
    : 1;