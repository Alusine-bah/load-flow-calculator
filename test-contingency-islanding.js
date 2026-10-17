// test-contingency-islanding.js
//
// Dedicated regression test for N-1 islanding detection.
//
// Verifies:
// - known islanding outages,
// - number of connected components,
// - membership of isolated buses,
// - a known non-islanding outage,
// - preservation of the original system model.
//
// The test fails with a non-zero exit code if any assertion fails.

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

require('./js/contingency.js');


// ============================================================
// Test helpers
// ============================================================

let failures = 0;


function assert(condition, message) {

  if (condition) {

    console.log(`PASS: ${message}`);

  }

  else {

    failures++;

    console.error(`FAIL: ${message}`);

  }

}


function sorted(values) {

  return [...values].sort(
    (a, b) => a - b
  );

}


function componentContainsExactly(
  components,
  expectedBuses
) {

  const expected =
    sorted(expectedBuses);


  return components.some(
    component => {

      const actual =
        sorted(component);

      if (
        actual.length !==
        expected.length
      ) {

        return false;

      }


      return actual.every(
        (bus, index) =>
          bus === expected[index]
      );

    }
  );

}


function runTopologyCase(
  baseSystem,
  outage,
  expected
) {

  console.log(
    `\n========== OUTAGE ${outage.from}-${outage.to} ==========`
  );


  const outageSystem =
    clonePowerSystem(baseSystem);


  const originalLineCount =
    baseSystem.lines.length;


  removeLine(
    outageSystem,
    outage.from,
    outage.to
  );


  assert(
    outageSystem.lines.length ===
      originalLineCount - 1,
    'Exactly one branch is removed from the contingency copy.'
  );


  assert(
    baseSystem.lines.length ===
      originalLineCount,
    'Original system branch list remains unchanged.'
  );


  const islanding =
    detectIslanding(
      outageSystem
    );


  console.log(
    'Detected components:',
    JSON.stringify(
      islanding.islands
    )
  );


  assert(
    islanding.islanded ===
      expected.islanded,
    `islanded flag is ${expected.islanded}.`
  );


  assert(
    islanding.islandCount ===
      expected.islandCount,
    `island count is ${expected.islandCount}.`
  );


  if (
    expected.isolatedBus !==
    undefined
  ) {

    assert(
      componentContainsExactly(
        islanding.islands,
        [expected.isolatedBus]
      ),
      `Bus ${expected.isolatedBus} forms a one-bus island.`
    );

  }


  if (
    expected.allBusesConnected ===
    true
  ) {

    assert(
      islanding.islands.length === 1 &&
      islanding.islands[0].length ===
        baseSystem.buses.length,
      'All buses remain in one connected component.'
    );

  }


  return islanding;
}


// ============================================================
// Load the 9-bus network
// ============================================================

const system =
  loadSystemV2('9bus');


assert(
  system.buses.length === 9,
  '9-bus system contains 9 buses.'
);


assert(
  system.lines.length === 9,
  '9-bus system contains 9 modeled branches.'
);


// ============================================================
// Known islanding outages
//
// In the current 9-bus topology:
//
// 1-4 isolates bus 1
// 3-6 isolates bus 3
// 8-2 isolates bus 2
// ============================================================

runTopologyCase(
  system,
  {
    from: 1,
    to: 4
  },
  {
    islanded: true,
    islandCount: 2,
    isolatedBus: 1
  }
);


runTopologyCase(
  system,
  {
    from: 3,
    to: 6
  },
  {
    islanded: true,
    islandCount: 2,
    isolatedBus: 3
  }
);


runTopologyCase(
  system,
  {
    from: 8,
    to: 2
  },
  {
    islanded: true,
    islandCount: 2,
    isolatedBus: 2
  }
);


// ============================================================
// Known non-islanding outage
//
// Removing 4-5 leaves an alternative path through:
// 4-9-8-7-6-5
// ============================================================

runTopologyCase(
  system,
  {
    from: 4,
    to: 5
  },
  {
    islanded: false,
    islandCount: 1,
    allBusesConnected: true
  }
);


// ============================================================
// Full contingency-object regression
// ============================================================

console.log(
  '\n========== ANALYZE CONTINGENCY CHECK =========='
);


const analyzed =
  analyzeContingency(
    system,
    {
      from: 1,
      to: 4
    }
  );


assert(
  analyzed.islanded === true,
  'analyzeContingency reports outage 1-4 as islanded.'
);


assert(
  analyzed.islandCount === 2,
  'analyzeContingency reports two islands for outage 1-4.'
);


assert(
  componentContainsExactly(
    analyzed.islands,
    [1]
  ),
  'analyzeContingency records bus 1 as the isolated island.'
);


// ============================================================
// Final summary
// ============================================================

console.log(
  '\n=============================================='
);

console.log(
  'CONTINGENCY ISLANDING REGRESSION SUMMARY'
);

console.log(
  '=============================================='
);


if (failures === 0) {

  console.log(
    'PASS: All islanding regression checks passed.'
  );

}

else {

  console.error(
    `FAIL: ${failures} islanding regression check(s) failed.`
  );

}


process.exitCode =
  failures === 0
    ? 0
    : 1;