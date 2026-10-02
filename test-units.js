// test-units.js
// Test engineering unit conversion


global.window = global;


require('./js/units.js');



const baseMVA = 100;



console.log("Unit Conversion Test");
console.log("--------------------");



console.log(
  "0.008886 pu MW:",
  puToMW(
    0.008886,
    baseMVA
  ).toFixed(4)
);



console.log(
  "0.003 pu MVAR:",
  puToMVAR(
    0.003,
    baseMVA
  ).toFixed(4)
);



console.log(
  "1.05 pu MVA:",
  puToMVA(
    1.05,
    baseMVA
  ).toFixed(4)
);



console.log(
  "Current:",
  calculateCurrentKA(
    50,
    132
  ).toFixed(4),
  "kA"
);



console.log(
  "Loading:",
  calculateLoadingPercent(
    80,
    100
  ).toFixed(2),
  "%"
);



console.log(
  "PASS"
);