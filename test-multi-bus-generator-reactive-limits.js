global.window = global;

require('./js/complex.js');
require('./js/models.js');
require('./js/ybus.js');
require('./js/ybus-v2.js');
require('./js/results.js');
require('./js/newton.js');
require('./js/newton-v2.js');
require('./js/gaussseidel.js');
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
    name: 'Multiple PV Bus Reactive Limit Test',
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
    name: 'Generator Bus 2',
    type: 'PV',
    V: 1.02,
    Pgen: 0.5,
    Pload: 0.2,
    Qload: 0.3
  }));

  system.addBus(new Bus({
    id: 3,
    name: 'Generator Bus 3',
    type: 'PV',
    V: 1.01,
    Pgen: 0.4,
    Pload: 0.1,
    Qload: 0.2
  }));

  system.addLine(new Line({
    from: 1, to: 2,
    R: 0.02, X: 0.08, B: 0.04
  }));

  system.addLine(new Line({
    from: 1, to: 3,
    R: 0.025, X: 0.09, B: 0.03
  }));

  system.addLine(new Line({
    from: 2, to: 3,
    R: 0.03, X: 0.10, B: 0.02
  }));

  for (const generator of generators) {
    system.addGenerator(new Generator(generator));
  }

  return system;
}

function solve(method, generators = []) {
  return solvePowerFlow(buildSystem(generators), { method });
}

console.log('================================================');
console.log('MULTI-BUS GENERATOR REACTIVE LIMIT TEST');
console.log('================================================');

for (const method of ['Newton-Raphson', 'Gauss-Seidel']) {
  console.log(`\n========== ${method} ==========`);

  const baseline = solve(method);

  assert(
    baseline && baseline.converged === true,
    `${method}: unconstrained system converged`
  );

  if (!baseline || !baseline.converged) continue;

  const baselineBuses = [2, 3].map(id =>
    baseline.buses.find(bus => bus.id === id)
  );

  assert(
    baselineBuses.every(
      bus => bus && bus.type === 'PV' &&
        Number.isFinite(bus.Qgen)
    ),
    `${method}: both generator buses have valid baseline results`
  );

  if (!baselineBuses.every(
    bus => bus && Number.isFinite(bus.Qgen)
  )) continue;

  // Force both PV buses beyond their upper Q limits.
  const generators = baselineBuses.map(bus => ({
    busId: bus.id,
    Qmin: bus.Qgen - 0.5,
    Qmax: bus.Qgen - 0.02
  }));

  const result = solve(method, generators);

  assert(
    result && result.converged === true,
    `${method}: constrained system converged`
  );

  if (!result || !result.converged) continue;

  for (const generator of generators) {
    const bus = result.buses.find(
      item => item.id === generator.busId
    );

    const label = `${method}: bus ${generator.busId}`;

    assert(Boolean(bus), `${label}: result exists`);

    if (!bus) continue;

    console.log(
      `${label}: type=${bus.type}, ` +
      `Qgen=${bus.Qgen.toFixed(10)} pu, ` +
      `Qmax=${generator.Qmax.toFixed(10)} pu`
    );

    assert(
      bus.type === 'PQ',
      `${label}: PV bus converted to PQ`
    );

    assert(
      Math.abs(bus.Qgen - generator.Qmax) <= TOL,
      `${label}: upper reactive limit enforced`
    );

    assert(
      Math.abs(bus.Q_calc + bus.Qload - generator.Qmax) <= TOL,
      `${label}: solved injection matches its limit`
    );

    assert(
      Number.isFinite(bus.V) && bus.V > 0,
      `${label}: voltage is finite and positive`
    );
  }
}

console.log('\n================================================');
console.log('MULTI-BUS TEST SUMMARY');
console.log('================================================');

if (failures === 0) {
  console.log('PASS: All multi-bus reactive-limit checks passed.');
} else {
  console.error(`FAIL: ${failures} check(s) failed.`);
}

process.exitCode = failures === 0 ? 0 : 1;
