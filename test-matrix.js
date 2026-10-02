// test-matrix.js
// Basic validation of complex matrix operations


global.window = global;


require('./js/complex.js');
require('./js/matrix.js');


// Create two matrices

const A = [
  [
    C.make(1, 2),
    C.make(3, 4)
  ],
  [
    C.make(5, 6),
    C.make(7, 8)
  ]
];


const B = [
  [
    C.make(1, 0),
    C.make(1, 0)
  ],
  [
    C.make(1, 0),
    C.make(1, 0)
  ]
];


console.log("\nMatrix A:");
Matrix.print(A);


console.log("\nMatrix B:");
Matrix.print(B);


// Addition

const add = Matrix.add(A, B);

console.log("\nA + B:");
Matrix.print(add);


// Multiplication

const mul = Matrix.multiply(A, B);

console.log("\nA x B:");
Matrix.print(mul);


// Identity

console.log("\nIdentity Matrix:");

Matrix.print(
  Matrix.identity(3)
);


// Transpose

console.log("\nTranspose of A:");

Matrix.print(
  Matrix.transpose(A)
);


// Conjugate transpose

console.log("\nConjugate transpose of A:");

Matrix.print(
  Matrix.conjugateTranspose(A)
);


// Check multiplication with identity

const AI = Matrix.multiply(
  A,
  Matrix.identity(2)
);


console.log("\nMaximum difference A - A*I:");

console.log(
  Matrix.maxDifference(A, AI)
);