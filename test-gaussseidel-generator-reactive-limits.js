global.window = global;

require('./js/complex.js');
require('./js/models.js');
require('./js/ybus.js');
require('./js/ybus-v2.js');
require('./js/results.js');
require('./js/newton.js');
require('./js/newton-v2.js');
require('./js/gaussseidel-v2.js');
require('./js/solver.js');

const TOL = 1e-7;
let failures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function buildSystem(limits = null) {
  const system = new PowerSystem({
    name: 'Generator Reactive Limit Test',
    baseMVA: 100,
    baseKV: 230
  });

  system.addBus(new Bus({
    id: 1,
    name: 'Slack Bus',
    type: 'Slack',
    V: 1.04
  }));

  system.addBus(new Bus({
    id: 2,
    name: 'Generator Bus',
    type: 'PV',
    V: 1.02,
    Pgen: 0.5,
    Pload: 0.2,
    Qload: 0.3
  }));

  system.addLine(new Line({
    from: 1,
    to: 2,
    R: 0.02,
    X: 0.08,
    B: 0.04
  }));

  if (limits) {
    system.addGenerator(new Generator({
      busId: 2,
      Qmin: limits.Qmin,
      Qmax: limits.Qmax
    }));
  }

  return system;
}

function solveCase(label, limits, expectedLimit) {
  console.log(`\n--- ${label} ---`);

  const system = buildSystem(limits);
  const result = solvePowerFlow(system, {
    method: 'Gauss-Seidel'
  });

  assert(
    result && result.converged === true,
    `${label}: solution converged`
  );

  if (!result || result.converged !== true) {
    return;
  }

  const bus = result.buses.find(item => item.id === 2);
  const expectedQ = limits[expectedLimit];

  assert(Boolean(bus), `${label}: generator bus exists`);

  if (!bus) {
    return;
  }

  console.log(`Final bus type: ${bus.type}`);
  console.log(`Reactive generation: ${bus.Qgen.toFixed(10)} pu`);
  console.log(`Enforced limit: ${expectedQ.toFixed(10)} pu`);
  console.log(`Solved voltage: ${bus.V.toFixed(10)} pu`);

  assert(
    bus.type === 'PQ',
    `${label}: PV bus converted to PQ`
  );

  assert(
    Math.abs(bus.Qgen - expectedQ) <= TOL,
    `${label}: reactive generation equals the enforced limit`
  );

  assert(
    Math.abs(bus.Q_calc + bus.Qload - expectedQ) <= TOL,
    `${label}: solved reactive injection agrees with the enforced limit`
  );

  assert(
    Number.isFinite(bus.V) && bus.V > 0,
    `${label}: final bus voltage is physically positive and finite`
  );
}

console.log('==============================================');
console.log('GENERATOR REACTIVE-POWER LIMIT REGRESSION TEST');
console.log('==============================================');

const baseline = solvePowerFlow(buildSystem(), {
  method: 'Gauss-Seidel'
});

assert(
  baseline && baseline.converged === true,
  'Unconstrained baseline converged'
);

if (baseline && baseline.converged === true) {
  const pvBus = baseline.buses.find(bus => bus.id === 2);

  assert(
    pvBus && pvBus.type === 'PV',
    'Unconstrained generator bus remains PV'
  );

  if (pvBus && Number.isFinite(pvBus.Qgen)) {
    const qBase = pvBus.Qgen;

    console.log(`\nUnconstrained Q generation: ${qBase.toFixed(10)} pu`);

    solveCase(
      'Upper reactive-power limit',
      {
        Qmin: qBase - 0.5,
        Qmax: qBase - 0.05
      },
      'Qmax'
    );

    solveCase(
      'Lower reactive-power limit',
      {
        Qmin: qBase + 0.05,
        Qmax: qBase + 0.5
      },
      'Qmin'
    );
  } else {
    assert(false, 'Baseline PV reactive generation is finite');
  }
}

console.log('\n==============================================');
console.log('GENERATOR LIMIT TEST SUMMARY');
console.log('==============================================');

if (failures === 0) {
  console.log('PASS: All generator reactive-limit checks passed.');
} else {
  console.error(`FAIL: ${failures} generator reactive-limit check(s) failed.`);
}

process.exitCode = failures === 0 ? 0 : 1;
