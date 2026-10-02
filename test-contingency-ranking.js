// test-contingency-ranking.js
// Test N-1 contingency ranking


global.window = global;


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



const system =
  loadSystemV2("4bus");



system.lines[0].ratingMVA = 100;

system.lines[1].ratingMVA = 80;

system.lines[2].ratingMVA = 50;

system.lines[3].ratingMVA = 20;



const ranking =

  runContingencyRanking(
    system
  );



printContingencyRanking(
  ranking
);


console.log("PASS");