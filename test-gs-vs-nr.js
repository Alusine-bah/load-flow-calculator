// test-gs-vs-nr.js
// Independent cross-check: run Newton-Raphson and Gauss-Seidel
// on the same power system and compare bus voltages and angles.

global.window = global;

// Load modules
require('./js/complex.js');
require('./js/data.js');
require('./js/ybus.js');
require('./js/newton.js');
require('./js/gaussseidel.js');


const VOLT_TOL = 1e-8;
const ANGLE_TOL = 1e-6;


function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


function compare(systemName) {

  console.log(`\n========== ${systemName} ==========`);


  if (!global.SYSTEMS || !global.SYSTEMS[systemName]) {
    console.error(`System "${systemName}" not found.`);
    return false;
  }


  const baseSystem = clone(global.SYSTEMS[systemName]);


  // Separate copies for independent solving
  const nrSys = clone(baseSystem);
  const gsSys = clone(baseSystem);


  // Iteration limits
  nrSys.maxIter = 30;
  gsSys.maxIter = 2000;


  const nr = global.solveNewton(nrSys);
  const gs = global.solveGaussSeidel(gsSys);


  if (!nr || !nr.converged) {
    console.error('Newton-Raphson failed to converge.');
    return false;
  }


  if (!gs || !gs.converged) {
    console.error('Gauss-Seidel failed to converge.');
    return false;
  }


  console.log(`NR converged in ${nr.iterations} iterations.`);
  console.log(`GS converged in ${gs.iterations} iterations.`);


  console.log(
    '\nBus |   NR V    |   GS V    |   dV      | NR Ang   | GS Ang   | dAng'
  );

  console.log(
    '----|-----------|-----------|-----------|----------|----------|----------'
  );


  let maxDV = 0;
  let maxDA = 0;


  const count = Math.min(
    nr.busResults.length,
    gs.busResults.length
  );


  for (let i = 0; i < count; i++) {

    const nrBus = nr.busResults[i];
    const gsBus = gs.busResults[i];


    const dV = Math.abs(nrBus.V - gsBus.V);
    const dA = Math.abs(
      nrBus.delta_deg - gsBus.delta_deg
    );


    maxDV = Math.max(maxDV, dV);
    maxDA = Math.max(maxDA, dA);


    console.log(
      `${String(nrBus.id).padEnd(3)} | ` +
      `${nrBus.V.toFixed(6).padEnd(9)} | ` +
      `${gsBus.V.toFixed(6).padEnd(9)} | ` +
      `${dV.toExponential(2).padEnd(9)} | ` +
      `${nrBus.delta_deg.toFixed(5).padEnd(8)} | ` +
      `${gsBus.delta_deg.toFixed(5).padEnd(8)} | ` +
      `${dA.toExponential(2)}`
    );
  }


  console.log(
    `\nMax |dV| = ${maxDV.toExponential(3)} p.u.`
  );

  console.log(
    `Max |dAngle| = ${maxDA.toExponential(3)} degrees`
  );


  const pass =
    maxDV < VOLT_TOL &&
    maxDA < ANGLE_TOL;


  console.log(
    pass
      ? 'PASS: NR and GS solutions match within tolerance.'
      : 'FAIL: NR and GS solutions differ.'
  );


  return pass;
}



// Run tests
const results = [
  compare('4bus'),
  compare('9bus'),
  compare('5bus')
];


const allPassed = results.every(Boolean);


// Allow console output to finish
setTimeout(() => {
  process.exit(allPassed ? 0 : 1);
}, 100);