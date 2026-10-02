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
}


window.Bus = Bus;
window.Line = Line;
window.Generator = Generator;
window.Shunt = Shunt;
window.PowerSystem = PowerSystem;