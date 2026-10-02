// test-line-rating.js
// Test line thermal loading analysis


global.window = global;


require('./js/complex.js');

require('./js/data.js');

require('./js/models.js');

require('./js/system-loader-v2.js');


require('./js/ybus.js');

require('./js/newton.js');


require('./js/results.js');

require('./js/newton-v2.js');

require('./js/solver.js');

require('./js/units.js');

require('./js/line-flow.js');

require('./js/line-rating.js');



const system = loadSystemV2("4bus");


// Add temporary ratings for testing

system.lines[0].ratingMVA = 100;

system.lines[1].ratingMVA = 80;

system.lines[2].ratingMVA = 50;

system.lines[3].ratingMVA = 20;



const result = solvePowerFlow(
  system,
  {
    method: "Newton-Raphson"
  }
);



const flows = calculateLineFlows(
  system,
  result
);



const ratings = analyzeLineRatings(
  system,
  flows
);



printLineRatings(ratings);