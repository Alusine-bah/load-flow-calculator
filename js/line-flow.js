// line-flow.js
// Transmission line power flow analysis
//
// Calculates:
// - Current flow
// - Sending/receiving power
// - Losses
// - MVA flow
// - Current (kA)
// - Loading percentage


function calculateLineFlows(system, result) {


  const flows = [];


  const baseMVA = system.baseMVA;



  // Voltage base
  // If system baseKV is unavailable,
  // use line/bus baseKV


  const voltageKV = {};

  for (const bus of system.buses) {

    voltageKV[bus.id] =
      bus.baseKV || system.baseKV;

  }



  // Build voltage phasors

  const V = {};


  for (const bus of result.buses) {

    V[bus.id] = C.fromPolar(
      bus.V,
      bus.delta_deg * Math.PI / 180
    );

  }



  for (const line of system.lines) {


    const fromV = V[line.from];

    const toV = V[line.to];



    const Z = C.make(
      line.R,
      line.X
    );


    const ySeries = C.div(
      C.make(1, 0),
      Z
    );


    const yShunt = C.make(
      line.G,
      line.B / 2
    );



    // Current from side

    const I_from = C.add(

      C.mul(
        C.sub(fromV, toV),
        ySeries
      ),

      C.mul(
        fromV,
        yShunt
      )

    );



    // Current to side

    const I_to = C.add(

      C.mul(
        C.sub(toV, fromV),
        ySeries
      ),

      C.mul(
        toV,
        yShunt
      )

    );



    const S_from = C.mul(
      fromV,
      C.conj(I_from)
    );


    const S_to = C.mul(
      toV,
      C.conj(I_to)
    );



    const loss = C.add(
      S_from,
      S_to
    );



    // Apparent power

    const S_from_MVA =
      calculateMVA(
        S_from.re,
        S_from.im,
        baseMVA
      );


    const S_to_MVA =
      calculateMVA(
        S_to.re,
        S_to.im,
        baseMVA
      );



    // Current calculation

    const currentKA =
      calculateCurrentKA(
        S_from_MVA,
        voltageKV[line.from]
      );



    const loading =
      calculateLoadingPercent(
        S_from_MVA,
        line.ratingMVA
      );



    flows.push({

      from: line.from,

      to: line.to,


      I_from,

      I_to,


      P_from: S_from.re,

      Q_from: S_from.im,


      P_to: S_to.re,

      Q_to: S_to.im,


      P_loss: loss.re,

      Q_loss: loss.im,


      S_from_MVA,

      S_to_MVA,


      current_kA: currentKA,


      loading_percent: loading

    });


  }



  return flows;

}



window.calculateLineFlows =
  calculateLineFlows;