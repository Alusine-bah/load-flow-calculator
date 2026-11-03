// test-newton-slack-bus-order.js
// Verify Newton-Raphson works when Slack bus is not first.

global.window = global;

// Load dependencies
require('./js/complex.js');
require('./js/data.js');
require('./js/models.js');
require('./js/system-loader-v2.js');
require('./js/ybus.js');
require('./js/newton.js');
require('./js/ybus-v2.js');
require('./js/results.js');
require('./js/newton-v2.js');

const TOL_V = 1e-8;
const TOL_ANGLE = 1e-7;

function runTest() {
  console.log('\n===== Slack Bus Ordering Test =====');

  // Original system
  const original = loadSystemV2('4bus');
  const reordered = loadSystemV2('4bus');

  // Identify actual Slack bus
  const slackIndex = reordered.buses.findIndex(
    bus => bus.type === 'Slack'
  );

  if (slackIndex < 0) {
    throw new Error('No Slack bus found.');
  }

  // Reverse bus ordering
  reordered.buses.reverse();

  const newSlackIndex = reordered.buses.findIndex(
    bus => bus.type === 'Slack'
  );

  console.log('Original Slack index:', slackIndex);
  console.log('Reordered Slack index:', newSlackIndex);

  if (newSlackIndex === 0) {
    throw new Error('Test invalid: Slack bus is still first.');
  }

  // Solve both systems
  const resultOriginal = solveNewtonV2(original);
  const resultReordered = solveNewtonV2(reordered);

  if (!resultOriginal.converged || !resultReordered.converged) {
    throw new Error('One or both solutions failed to converge.');
  }

  let maxDV = 0;
  let maxDA = 0;

  // Compare results using bus IDs, not array positions
  for (const busA of resultOriginal.buses) {
    const busB = resultReordered.buses.find(
      bus => bus.id === busA.id
    );

    if (!busB) {
      throw new Error(`Missing bus ${busA.id} in reordered results.`);
    }

    maxDV = Math.max(maxDV, Math.abs(busA.V - busB.V));

    maxDA = Math.max(
      maxDA,
      Math.abs(busA.delta_deg - busB.delta_deg)
    );
  }

  console.log('Original converged:', resultOriginal.converged);
  console.log('Reordered converged:', resultReordered.converged);
  console.log('Maximum voltage difference:', maxDV.toExponential(3));
  console.log('Maximum angle difference:', maxDA.toExponential(3));

  const pass = maxDV < TOL_V && maxDA < TOL_ANGLE;

  console.log(
    pass
      ? 'PASS: Newton-Raphson is independent of Slack bus position.'
      : 'FAIL: Results differ after bus reordering.'
  );

  return pass;
}

try {
  process.exit(runTest() ? 0 : 1);
} catch (error) {
  console.error('FAIL:', error.message);
  process.exit(1);
}
