// gaussseidel-v2.js
// Adapter between PowerSystem V2 model and existing Gauss-Seidel solver


function solveGaussSeidelV2(powerSystem) {

  const system = {
    name: powerSystem.name,
    baseMVA: powerSystem.baseMVA,
    baseKV: powerSystem.baseKV,

    tol: 1e-9,
    maxIter: 2000,

    buses: [],
    lines: []
  };


  // Convert buses

  for (const bus of powerSystem.buses) {

    system.buses.push({

      id: bus.id,
      type: bus.type,

      V: bus.V,
      delta: bus.delta,

      Pgen: bus.Pgen,
      Qgen: bus.Qgen,

      Pload: bus.Pload,
      Qload: bus.Qload

    });

  }


  // Convert lines

  for (const line of powerSystem.lines) {

    system.lines.push({

      from: line.from,
      to: line.to,

      R: line.R,
      X: line.X,
      B: line.B

    });

  }


  return solveGaussSeidel(system);
}


window.solveGaussSeidelV2 = solveGaussSeidelV2;