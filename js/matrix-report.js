// matrix-report.js
// Reporting utilities for complex matrices


function printMatrixRectangular(A, title = "Matrix") {

  console.log(`\n${title} (Rectangular Form)\n`);

  for (const row of A) {

    console.log(
      row
        .map(x => C.fmt(x, 5))
        .join("   ")
    );

  }
}



function printMatrixPolar(A, title = "Matrix") {

  console.log(`\n${title} (Polar Form)\n`);

  for (const row of A) {

    console.log(
      row
        .map(x => C.fmtPolar(x, 5))
        .join("   ")
    );

  }
}



function matrixSummary(A, title = "Matrix") {

  const rows = A.length;
  const cols = A[0].length;


  let nonZero = 0;


  for (let i = 0; i < rows; i++) {

    for (let j = 0; j < cols; j++) {

      if (C.abs(A[i][j]) > 1e-12) {
        nonZero++;
      }

    }
  }


  const total = rows * cols;

  const density = (nonZero / total) * 100;


  let symmetric = true;


  if (rows === cols) {

    for (let i = 0; i < rows; i++) {

      for (let j = 0; j < cols; j++) {

        const diff = Math.max(

          Math.abs(
            A[i][j].re - A[j][i].re
          ),

          Math.abs(
            A[i][j].im - A[j][i].im
          )

        );


        if (diff > 1e-12) {
          symmetric = false;
        }

      }
    }

  } else {

    symmetric = false;

  }


  console.log(`\n${title} Summary`);
  console.log("--------------------");
  console.log(`Size       : ${rows} x ${cols}`);
  console.log(`Non-zero   : ${nonZero} / ${total}`);
  console.log(`Density    : ${density.toFixed(2)} %`);
  console.log(`Symmetric  : ${symmetric}`);

}



window.printMatrixRectangular = printMatrixRectangular;
window.printMatrixPolar = printMatrixPolar;
window.matrixSummary = matrixSummary;