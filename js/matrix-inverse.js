// matrix-inverse.js
// Complex matrix inverse using Gauss-Jordan elimination


function inverseMatrix(A) {

  const n = A.length;


  if (A.some(row => row.length !== n)) {
    throw new Error("Matrix inverse requires a square matrix");
  }


  // Create augmented matrix [A | I]

  const M = [];

  for (let i = 0; i < n; i++) {

    M[i] = [];

    for (let j = 0; j < n; j++) {
      M[i][j] = C.make(
        A[i][j].re,
        A[i][j].im
      );
    }


    for (let j = 0; j < n; j++) {

      M[i][n + j] = (
        i === j
          ? C.make(1,0)
          : C.make(0,0)
      );

    }
  }


  // Gauss-Jordan elimination

  for (let col = 0; col < n; col++) {


    // Find pivot

    let pivot = col;

    let max = C.abs(M[pivot][col]);


    for (let row = col + 1; row < n; row++) {

      const value = C.abs(
        M[row][col]
      );


      if (value > max) {
        max = value;
        pivot = row;
      }

    }


    if (max < 1e-12) {
      throw new Error(
        "Matrix is singular and cannot be inverted"
      );
    }


    // Swap rows if needed

    if (pivot !== col) {

      const temp = M[pivot];
      M[pivot] = M[col];
      M[col] = temp;

    }


    // Normalize pivot row

    const pivotValue = M[col][col];


    for (let j = 0; j < 2*n; j++) {

      M[col][j] = C.div(
        M[col][j],
        pivotValue
      );

    }


    // Eliminate other rows

    for (let row = 0; row < n; row++) {

      if (row === col) continue;


      const factor = M[row][col];


      for (let j = 0; j < 2*n; j++) {

        M[row][j] = C.sub(
          M[row][j],
          C.mul(
            factor,
            M[col][j]
          )
        );

      }

    }

  }


  // Extract inverse part

  const inverse = Matrix.zeros(n,n);


  for (let i = 0; i < n; i++) {

    for (let j = 0; j < n; j++) {

      inverse[i][j] = M[i][n+j];

    }

  }


  return inverse;
}


window.inverseMatrix = inverseMatrix;