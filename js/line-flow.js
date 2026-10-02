// line-flow.js
// Calculate transmission line power flow from LoadFlowResult
//
// Calculates:
// - Sending end current
// - Receiving end current
// - Sending end power
// - Receiving end power
// - Line losses
//
// Uses π-model line parameters


function calculateLineFlows(system, result) {


  const flows = [];



  // Build voltage phasors from solved result

  const V = {};


  for (const bus of result.buses) {

    V[bus.id] = C.fromPolar(
      bus.V,
      bus.delta_deg * Math.PI / 180
    );

  }



  // Process every line

  for (const line of system.lines) {


    const fromV = V[line.from];

    const toV = V[line.to];



    // Line impedance

    const Z = C.make(
      line.R,
      line.X
    );



    const ySeries = C.div(
      C.make(1, 0),
      Z
    );



    // π model shunt

    const yShunt = C.make(
      line.G,
      line.B / 2
    );



    // Current from sending bus to receiving bus

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



    // Current from receiving bus to sending bus

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



    // Complex power S = V * I*

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

      Q_loss: loss.im

    });

  }



  return flows;

}



window.calculateLineFlows = calculateLineFlows;