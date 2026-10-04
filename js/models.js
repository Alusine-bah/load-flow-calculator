// models.js
// Core power system data models for Load Flow Calculator v2

class Bus {
  constructor({
    id,
    name = "",
    type = "PQ",
    V = 1.0,
    delta = 0.0,
    Pgen = 0,
    Qgen = 0,
    Pload = 0,
    Qload = 0,
    baseKV = 1.0
  }) {
    this.id = id;
    this.name = name || `Bus ${id}`;
    this.type = type;

    this.V = V;
    this.delta = delta;

    this.Pgen = Pgen;
    this.Qgen = Qgen;

    this.Pload = Pload;
    this.Qload = Qload;

    this.baseKV = baseKV;
  }

  get P_injected() {
    return this.Pgen - this.Pload;
  }

  get Q_injected() {
    return this.Qgen - this.Qload;
  }
}


class Line {
  constructor({
    from,
    to,
    R = 0,
    X = 0,
    B = 0,
    G = 0,
    ratingMVA = null
  }) {
    this.from = from;
    this.to = to;

    this.R = R;
    this.X = X;

    this.B = B;
    this.G = G;

    this.ratingMVA = ratingMVA;
  }
}


class Generator {
  constructor({
    busId,
    P = 0,
    Vset = 1.0,
    Qmin = -1,
    Qmax = 1
  }) {
    this.busId = busId;
    this.P = P;
    this.Vset = Vset;

    this.Qmin = Qmin;
    this.Qmax = Qmax;
  }
}


class Shunt {
  constructor({
    busId,
    G = 0,
    B = 0
  }) {
    this.busId = busId;
    this.G = G;
    this.B = B;
  }
}


class PowerSystem {
  constructor({
    name = "Unnamed System",
    baseMVA = 100,
    baseKV = 1
  } = {}) {

    this.name = name;
    this.baseMVA = baseMVA;
    this.baseKV = baseKV;

    this.buses = [];
    this.lines = [];
    this.generators = [];
    this.shunts = [];
  }


  addBus(bus) {
    if (this.buses.some(b => b.id === bus.id)) {
      throw new Error(`Duplicate bus id ${bus.id}`);
    }

    this.buses.push(bus);
  }


  addLine(line) {
    this.lines.push(line);
  }


  addGenerator(generator) {
    this.generators.push(generator);
  }


  addShunt(shunt) {
    this.shunts.push(shunt);
  }


  get numberOfBuses() {
    return this.buses.length;
  }


  validate() {

    const errors = [];

    // ----------------------------
    // Bus checks
    // ----------------------------

    if (this.buses.length === 0) {
      errors.push("System has no buses.");
    }

    const ids = new Set();

    for (const bus of this.buses) {

      if (ids.has(bus.id)) {
        errors.push(`Duplicate bus id ${bus.id}`);
      }

      ids.add(bus.id);

      const allowedTypes = ["Slack", "PV", "PQ"];

      if (!allowedTypes.includes(bus.type)) {
        errors.push(
          `Invalid bus type ${bus.type} at bus ${bus.id}`
        );
      }

    }

    // ----------------------------
    // Slack bus check
    // ----------------------------

    const slackCount =
      this.buses.filter(b => b.type === "Slack").length;

    if (slackCount === 0) {
      errors.push("No Slack bus defined.");
    }

    if (slackCount > 1) {
      errors.push("Multiple Slack buses defined.");
    }

    // ----------------------------
    // Line checks
    // ----------------------------

    for (const line of this.lines) {

      const fromExists =
        this.buses.some(b => b.id === line.from);

      const toExists =
        this.buses.some(b => b.id === line.to);

      if (!fromExists || !toExists) {
        errors.push(
          `Line ${line.from}-${line.to} references unknown bus.`
        );
      }

      if (line.R === 0 && line.X === 0) {
        errors.push(
          `Line ${line.from}-${line.to} has zero impedance.`
        );
      }

    }

    // ----------------------------
    // Base checks
    // ----------------------------

    if (this.baseMVA <= 0) {
      errors.push("Base MVA must be positive.");
    }

    return {
      valid: errors.length === 0,
      errors
    };

  }

}   // <-- closes PowerSystem class


// ----------------------------
// Exports (Browser + Node.js)
// ----------------------------

if (typeof window !== "undefined") {
  window.Bus = Bus;
  window.Line = Line;
  window.Generator = Generator;
  window.Shunt = Shunt;
  window.PowerSystem = PowerSystem;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Bus,
    Line,
    Generator,
    Shunt,
    PowerSystem
  };
}