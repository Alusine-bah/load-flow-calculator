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

function buildSystem(generators = []) {
  const system = new PowerSystem({
    name: 'Multiple Generator Reactive Limit Test',
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

  for (const limits of generators) {
    system.addGenerator(new Generator({
      busId: 2,
      Qmin: limits.Qmin,
      Qmax: limits.Qmax
    }));
  }

  return system;
}

function solve(method, generators = []) {
  return solvePowerFlow(buildSystem(generators), { method });
}

function runLimitCase(method, label, generators, limitKey) {
  console.log(`\n--- ${method}: ${label} ---`);

  const result = solve(method, generators);

  assert(
    result && result.converged === true,
    `${label}: solution converged`
  );

  if (!result || !result.converged) return;

  const bus = result.buses.find(item => item.id === 2);
  const expectedQ = generators.reduce(
    (sum, generator) => sum + generator[limitKey],
    0
  );

  assert(Boolean(bus), `${label}: generator bus exists`);

  if (!bus) return;

  console.log(`Final bus type: ${bus.type}`);
  console.log(`Expected aggregate limit: ${expectedQ.toFixed(10)} pu`);
  console.log(`Reported Q generation: ${bus.Qgen.toFixed(10)} pu`);
  console.log(`Solved voltage: ${bus.V.toFixed(10)} pu`);

  assert(
    bus.type === 'PQ',
    `${label}: PV bus converted to PQ`
  );

  assert(
    Math.abs(bus.Qgen - expectedQ) <= TOL,
    `${label}: Q generation equals the sum of generator limits`
  );

  assert(
    Math.abs(bus.Q_calc + bus.Qload - expectedQ) <= TOL,
    `${label}: solved injection agrees with aggregate Q limit`
  );

  assert(
    Number.isFinite(bus.V) && bus.V > 0,
    `${label}: voltage is finite and positive`
  );
}

console.log('================================================');
console.log('MULTIPLE-GENERATOR REACTIVE LIMIT REGRESSION TEST');
console.log('================================================');

for (const method of ['Newton-Raphson', 'Gauss-Seidel']) {
  console.log(`\n========== ${method} ==========`);

  const baseline = solve(method);

  assert(
    baseline && baseline.converged === true,
    `${method}: unconstrained baseline converged`
  );

  if (!baseline || !baseline.converged) continue;

  const pvBus = baseline.buses.find(bus => bus.id === 2);

  assert(
    pvBus && pvBus.type === 'PV',
    `${method}: unconstrained generator bus remains PV`
  );

  if (!pvBus || !Number.isFinite(pvBus.Qgen)) {
    assert(false, `${method}: baseline reactive generation is finite`);
    continue;
  }

  const qBase = pvBus.Qgen;

  console.log(`Baseline Q generation: ${qBase.toFixed(10)} pu`);

  // Two generators whose combined Qmax is qBase - 0.05 pu.
  const upperLimits = [
    { Qmin: qBase - 0.30, Qmax: qBase - 0.03 },
    { Qmin: -1.00, Qmax: -0.02 }
  ];

  runLimitCase(
    method,
    'Aggregated upper limit',
    upperLimits,
    'Qmax'
  );

  // Two generators whose combined Qmin is qBase + 0.05 pu.
  const lowerLimits = [
    { Qmin: qBase + 0.02, Qmax: qBase + 0.30 },
    { Qmin: 0.03, Qmax: 0.20 }
  ];

  runLimitCase(
    method,
    'Aggregated lower limit',
    lowerLimits,
    'Qmin'
  );
}

console.log('\n================================================');
console.log('MULTIPLE-GENERATOR TEST SUMMARY');
console.log('================================================');

if (failures === 0) {
  console.log('PASS: All multiple-generator limit checks passed.');
} else {
  console.error(`FAIL: ${failures} check(s) failed.`);
}

process.exitCode = failures === 0 ? 0 : 1;
