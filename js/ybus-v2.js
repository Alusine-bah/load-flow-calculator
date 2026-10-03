// ybus-v2.js
// Y-bus builder for PowerSystem V2 model
//
// Includes:
// - Transmission line series impedance
// - Line charging susceptance (B/2)
// - Line conductance (G)
// - Independent bus shunts


function buildYbusV2(system) {


  if (
    !system ||
    !system.buses ||
    !system.lines
  ) {

    throw new Error(
      "Invalid power system model."
    );

  }



  const n =
    system.buses.length;



  const Y = [];



  for (let i = 0; i < n; i++) {

    Y[i] = [];

    for (let j = 0; j < n; j++) {

      Y[i][j] =
        C.zero();

    }

  }



  for (const line of system.lines) {


    const i =
      system.buses.findIndex(
        b =>
          b.id === line.from
      );


    const j =
      system.buses.findIndex(
        b =>
          b.id === line.to
      );



    if (i === -1 || j === -1) {

      throw new Error(
        "Line references unknown bus."
      );

    }



    const Z =
      C.make(
        line.R,
        line.X
      );



    if (
      line.R === 0 &&
      line.X === 0
    ) {

      throw new Error(
        `Invalid line impedance ${line.from}-${line.to}`
      );

    }



    const ySeries =
      C.div(
        C.make(1,0),
        Z
      );



    const yShunt =
      C.make(
        line.G || 0,
        (line.B || 0) / 2
      );



    // Diagonal terms

    Y[i][i] =
      C.add(
        Y[i][i],
        C.add(
          ySeries,
          yShunt
        )
      );



    Y[j][j] =
      C.add(
        Y[j][j],
        C.add(
          ySeries,
          yShunt
        )
      );



    // Off-diagonal terms

    Y[i][j] =
      C.sub(
        Y[i][j],
        ySeries
      );


    Y[j][i] =
      C.sub(
        Y[j][i],
        ySeries
      );

  }





  // Independent shunts

  for (
    const shunt of (system.shunts || [])
  ) {


    const i =
      system.buses.findIndex(
        b =>
          b.id === shunt.busId
      );



    if (i === -1) {

      throw new Error(
        "Shunt references unknown bus."
      );

    }



    const yShunt =
      C.make(
        shunt.G || 0,
        shunt.B || 0
      );



    Y[i][i] =
      C.add(
        Y[i][i],
        yShunt
      );

  }



  return Y;

}



window.buildYbusV2 =
  buildYbusV2;