// results.js
// Common result model for all load flow methods


class LoadFlowResult {

  constructor({
    method = "",
    converged = false,
    iterations = 0,
    buses = [],
    convergenceHistory = []
  } = {}) {

    this.method = method;

    this.converged = converged;

    this.iterations = iterations;

    this.buses = buses;

    this.convergenceHistory = convergenceHistory;


    this.summary = {

      totalGeneration: {
        P: 0,
        Q: 0
      },

      totalLoad: {
        P: 0,
        Q: 0
      },

      losses: {
        P: 0,
        Q: 0
      }

    };

  }


  addBusResult(busResult) {

    this.buses.push(busResult);

  }


  calculateSummary() {

    let Pgen = 0;
    let Qgen = 0;

    let Pload = 0;
    let Qload = 0;


    for (const bus of this.buses) {

      Pgen += bus.Pgen || 0;
      Qgen += bus.Qgen || 0;

      Pload += bus.Pload || 0;
      Qload += bus.Qload || 0;

    }


    this.summary.totalGeneration = {
      P: Pgen,
      Q: Qgen
    };


    this.summary.totalLoad = {
      P: Pload,
      Q: Qload
    };


    this.summary.losses = {

      P: Pgen - Pload,

      Q: Qgen - Qload

    };

  }


  printSummary() {

    console.log("\nLoad Flow Result");
    console.log("-------------------------");

    console.log(
      "Method:",
      this.method
    );

    console.log(
      "Converged:",
      this.converged
    );

    console.log(
      "Iterations:",
      this.iterations
    );


    console.log("\nPower Summary");

    console.log(
      "Generation P:",
      this.summary.totalGeneration.P
    );

    console.log(
      "Load P:",
      this.summary.totalLoad.P
    );

    console.log(
      "Loss P:",
      this.summary.losses.P
    );

  }

}


window.LoadFlowResult = LoadFlowResult;