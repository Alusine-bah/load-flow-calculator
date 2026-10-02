// units.js
// Engineering unit conversion utilities for power system analysis
//
// Converts:
// pu power  -> MW / MVAR / MVA
// current   -> kA
// line flow -> loading percentage


// ======================================
// Per-unit power conversion
// ======================================

function puToMW(pu, baseMVA) {

  return pu * baseMVA;

}



function puToMVAR(pu, baseMVA) {

  return pu * baseMVA;

}



function puToMVA(pu, baseMVA) {

  return pu * baseMVA;

}



// ======================================
// Current calculation
// ======================================
//
// I(kA) = S(MVA) / (sqrt(3) * V(kV))


function calculateCurrentKA(
  mva,
  voltageKV
) {


  return (
    mva /
    (Math.sqrt(3) * voltageKV)
  );

}



// ======================================
// Line loading
// ======================================
//
// Loading % = Actual MVA / Rating MVA * 100


function calculateLoadingPercent(
  actualMVA,
  ratingMVA
) {


  if (!ratingMVA) {

    return null;

  }


  return (
    actualMVA /
    ratingMVA *
    100
  );

}



// ======================================
// Complex power magnitude
// ======================================

function calculateMVA(
  P,
  Q,
  baseMVA
) {


  const puMVA = Math.sqrt(
    P * P +
    Q * Q
  );


  return puMVA * baseMVA;

}



window.puToMW = puToMW;

window.puToMVAR = puToMVAR;

window.puToMVA = puToMVA;

window.calculateCurrentKA = calculateCurrentKA;

window.calculateLoadingPercent = calculateLoadingPercent;

window.calculateMVA = calculateMVA;