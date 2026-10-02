// matrix.js
// Complex matrix operations for Load Flow Calculator V2


const Matrix = {


  // Create rows x cols zero matrix

  zeros(rows, cols) {

    const A = [];

    for (let i = 0; i < rows; i++) {

      A[i] = [];

      for (let j = 0; j < cols; j++) {

        A[i][j] = C.zero();

      }
    }

    return A;
  },


  // Create identity matrix

  identity(n) {

    const I = Matrix.zeros(n, n);

    for (let i = 0; i < n; i++) {
      I[i][i] = C.make(1, 0);
    }

    return I;
  },


  // Deep copy

  clone(A) {

    return A.map(row =>
      row.map(x => C.make(x.re, x.im))
    );

  },


  // Matrix dimensions

  size(A) {

    return {
      rows: A.length,
      cols: A[0].length
    };

  },


  // Matrix addition

  add(A, B) {

    const r = A.length;
    const c = A[0].length;

    const R = Matrix.zeros(r, c);


    for (let i = 0; i < r; i++) {

      for (let j = 0; j < c; j++) {

        R[i][j] = C.add(
          A[i][j],
          B[i][j]
        );

      }
    }


    return R;
  },


  // Matrix subtraction

  subtract(A, B) {

    const r = A.length;
    const c = A[0].length;

    const R = Matrix.zeros(r, c);


    for (let i = 0; i < r; i++) {

      for (let j = 0; j < c; j++) {

        R[i][j] = C.sub(
          A[i][j],
          B[i][j]
        );

      }
    }


    return R;
  },


  // Matrix multiplication

  multiply(A, B) {

    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;


    const R = Matrix.zeros(rows, cols);


    for (let i = 0; i < rows; i++) {

      for (let j = 0; j < cols; j++) {

        let sum = C.zero();


        for (let k = 0; k < inner; k++) {

          sum = C.add(
            sum,
            C.mul(A[i][k], B[k][j])
          );

        }


        R[i][j] = sum;

      }
    }


    return R;
  },


  // Transpose

  transpose(A) {

    const rows = A.length;
    const cols = A[0].length;


    const T = Matrix.zeros(cols, rows);


    for (let i = 0; i < rows; i++) {

      for (let j = 0; j < cols; j++) {

        T[j][i] = C.make(
          A[i][j].re,
          A[i][j].im
        );

      }
    }


    return T;
  },


  // Conjugate transpose (Hermitian)

  conjugateTranspose(A) {

    const T = Matrix.transpose(A);


    for (let i = 0; i < T.length; i++) {

      for (let j = 0; j < T[i].length; j++) {

        T[i][j] = C.conj(T[i][j]);

      }
    }


    return T;
  },


  // Maximum element difference

  maxDifference(A, B) {

    let max = 0;


    for (let i = 0; i < A.length; i++) {

      for (let j = 0; j < A[i].length; j++) {

        const d = Math.max(

          Math.abs(
            A[i][j].re - B[i][j].re
          ),

          Math.abs(
            A[i][j].im - B[i][j].im
          )

        );


        if (d > max) {
          max = d;
        }

      }
    }


    return max;
  },


  // Display matrix

  print(A) {

    for (const row of A) {

      console.log(
        row.map(
          x => C.fmt(x,4)
        ).join("   ")
      );

    }

  }


};


window.Matrix = Matrix;