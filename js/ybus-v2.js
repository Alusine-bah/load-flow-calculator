// ybus-v2.js
// Y-bus builder for PowerSystem V2 model

function buildYbusV2(system) {

  const n = system.buses.length;

  const Y = [];

  for (let i = 0; i < n; i++) {
    Y[i] = [];

    for (let j = 0; j < n; j++) {
      Y[i][j] = C.zero();
    }
  }


  // Add transmission lines

  for (const line of system.lines) {

    const i = system.buses.findIndex(
      b => b.id === line.from
    );

    const j = system.buses.findIndex(
      b => b.id === line.to
    );


    const Z = C.make(line.R, line.X);

    const ySeries = C.div(
      C.make(1,0),
      Z
    );


    const yShunt = C.make(
      line.G,
      line.B / 2
    );


    Y[i][i] = C.add(
      Y[i][i],
      C.add(ySeries, yShunt)
    );


    Y[j][j] = C.add(
      Y[j][j],
      C.add(ySeries, yShunt)
    );


    Y[i][j] = C.sub(
      Y[i][j],
      ySeries
    );


    Y[j][i] = C.sub(
      Y[j][i],
      ySeries
    );

  }


  // Add independent shunts

  for (const shunt of system.shunts) {

    const i = system.buses.findIndex(
      b => b.id === shunt.busId
    );


    const yShunt = C.make(
      shunt.G,
      shunt.B
    );


    Y[i][i] = C.add(
      Y[i][i],
      yShunt
    );

  }


  return Y;
}


window.buildYbusV2 = buildYbusV2;