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

let failures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function buildSystem(generatorConfig) {
  const system = new PowerSystem({
    name: 'Invalid Generator Limit Test',
    baseMVA: 100,
    baseKV: 230
  });

  system.addBus(new Bus({
    id: 1,
    type: 'Slack',
    V: 1.04
  }));

  system.addBus(new Bus({
    id: 2,
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

  system.addGenerator(new Generator(generatorConfig));

  return system;
}

const cases = [
  {
    name: 'Minimum Q exceeds maximum Q',
    generator: { busId: 2, Qmin: 0.5, Qmax: -0.5 },
    expected: 'Invalid reactive-power limits'
  },
  {
    name: 'Qmin is NaN',
    generator: { busId: 2, Qmin: NaN, Qmax: 1 },
    expected: 'Invalid reactive-power limits'
  },
  {
    name: 'Qmax is Infinity',
    generator: { busId: 2, Qmin: -1, Qmax: Infinity },
    expected: 'Invalid reactive-power limits'
  },
  {
    name: 'Generator references a nonexistent bus',
    generator: { busId: 99, Qmin: -1, Qmax: 1 },
    expected: 'Generator references unknown bus 99'
  }
];

console.log('================================================');
console.log('GENERATOR REACTIVE-LIMIT INPUT VALIDATION TEST');
console.log('================================================');

for (const method of ['Newton-Raphson', 'Gauss-Seidel']) {
  console.log(`\n========== ${method} ==========`);

  for (const testCase of cases) {
    const result = solvePowerFlow(
      buildSystem(testCase.generator),
      { method }
    );

    const rejected =
      result &&
      result.success === false &&
      Array.isArray(result.errors) &&
      result.errors.length > 0;

    assert(
      rejected,
      `${testCase.name}: invalid input is rejected`
    );

    if (rejected) {
      const message = result.errors.join(' ');
      console.log(`Error received: ${message}`);

      assert(
        message.includes(testCase.expected),
        `${testCase.name}: clear validation message`
      );
    }
  }
}

console.log('\n================================================');
console.log('INPUT VALIDATION TEST SUMMARY');
console.log('================================================');

if (failures === 0) {
  console.log('PASS: All invalid-input checks passed.');
} else {
  console.error(`FAIL: ${failures} check(s) failed.`);
}

process.exitCode = failures === 0 ? 0 : 1;
