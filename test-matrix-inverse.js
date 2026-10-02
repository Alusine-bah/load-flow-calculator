// test-matrix-inverse.js
// Validate complex matrix inverse


global.window = global;


require('./js/complex.js');
require('./js/matrix.js');
require('./js/matrix-inverse.js');


// Test matrix

const A = [

  [
    C.make(1, 2),
    C.make(3, 1)
  ],

  [
    C.make(2, -1),
    C.make(4, 3)
  ]

];


console.log("\nMatrix A:");
Matrix.print(A);


// Calculate inverse

const Ainv = inverseMatrix(A);


console.log("\nInverse A^-1:");
Matrix.print(Ainv);


// Multiply A * Ainv

const result = Matrix.multiply(
  A,
  Ainv
);


console.log("\nA * A^-1:");

Matrix.print(result);


// Compare with identity

const I = Matrix.identity(2);


const error = Matrix.maxDifference(
  result,
  I
);


console.log(
  "\nMaximum error:",
  error.toExponential(3)
);


console.log(
  error < 1e-10
    ? "PASS: Inverse calculation is correct"
    : "FAIL: Inverse calculation error"
);