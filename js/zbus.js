// zbus.js
// Zbus calculation from Ybus inverse


function calculateZbus(system) {

  const Ybus = buildYbusV2(system);

  const Zbus = inverseMatrix(Ybus);

  return Zbus;
}


window.calculateZbus = calculateZbus;