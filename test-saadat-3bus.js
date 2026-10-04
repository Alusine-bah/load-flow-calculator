// test-saadat-3bus.js
const {PowerSystem, Bus, Line} = require('./js/models.js');
const {solvePowerFlow} = require('./js/solver.js');

const s = new PowerSystem({name: 'Saadat 3-bus', baseMVA: 100});

// Buses
s.addBus(new Bus({id: 1, type: 'Slack', V: 1.05, delta: 0}));
s.addBus(new Bus({id: 2, type: 'PQ',    V: 1.00, delta: 0, Pload: 400, Qload: 250}));
s.addBus(new Bus({id: 3, type: 'PV',    V: 1.04, delta: 0, Pgen: 200}));

// Lines
s.addLine(new Line({from: 1, to: 2, R: 0.02,   X: 0.04,  B: 0}));
s.addLine(new Line({from: 1, to: 3, R: 0.01,   X: 0.03,  B: 0}));
s.addLine(new Line({from: 2, to: 3, R: 0.0125, X: 0.025, B: 0}));

// Solve with Newton-Raphson
const r = solvePowerFlow(s, {method: 'Newton-Raphson'});

console.log('converged:', r.converged, 'iters:', r.iterations);
console.log();
console.log('Bus  |V|      δ(°)      P_calc    Q_calc    Pgen     Qgen');
console.log('-----|--------|---------|---------|---------|--------|--------');
r.buses.forEach(b => {
  console.log(
    `  ${b.id}  | ${b.V.toFixed(4)} | ${b.delta_deg.toFixed(3).padStart(7)} | ` +
    `${b.P_calc.toFixed(2).padStart(7)} | ${b.Q_calc.toFixed(2).padStart(7)} | ` +
    `${b.Pgen.toFixed(2).padStart(6)} | ${b.Qgen.toFixed(2).padStart(6)}`
  );
});
console.log();
console.log('Losses:', r.summary.losses);