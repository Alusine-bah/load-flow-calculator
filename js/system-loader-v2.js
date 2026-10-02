// system-loader-v2.js
// Convert existing SYSTEMS data into PowerSystem V2 objects

function loadSystemV2(name) {

  const source = window.SYSTEMS[name];

  if (!source) {
    throw new Error(`System "${name}" not found`);
  }


  const system = new PowerSystem({
    name: source.name,
    baseMVA: source.baseMVA,
    baseKV: source.baseKV
  });


  // Convert buses

  for (const bus of source.buses) {

    system.addBus(new Bus({
      id: bus.id,
      type: bus.type,
      V: bus.V,
      delta: bus.delta,

      Pgen: bus.Pgen,
      Qgen: bus.Qgen,

      Pload: bus.Pload,
      Qload: bus.Qload,

      baseKV: source.baseKV
    }));

  }


  // Convert lines

  for (const line of source.lines) {

    system.addLine(new Line({
      from: line.from,
      to: line.to,

      R: line.R,
      X: line.X,
      B: line.B,

      G: line.G || 0
    }));

  }


  return system;
}


window.loadSystemV2 = loadSystemV2;