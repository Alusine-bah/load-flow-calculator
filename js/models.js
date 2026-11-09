
// models.js
// Core power system data models for Load Flow Calculator V2
//
// Supports:
// - Buses
// - Transmission lines
// - Transformers
// - Generators
// - Independent bus shunts
//
// Transformer convention:
// R, X, G, B are per-unit values on system base.
// tapRatio is a positive off-nominal per-unit tap magnitude.
// phaseShift is in degrees.
// Transformer impedance is referred to the selected system base.


// ======================================
// BUS MODEL
// ======================================

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


// ======================================
// TRANSMISSION LINE MODEL
// ======================================

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


// ======================================
// TRANSFORMER MODEL
// ======================================

class Transformer {
  constructor({
    from,
    to,
    R = 0,
    X,
    tapRatio = 1.0,
    phaseShift = 0,
    ratingMVA = null,
    G = 0,
    B = 0
  }) {
    this.from = from;
    this.to = to;

    this.R = R;
    this.X = X;

    this.tapRatio = tapRatio;
    this.phaseShift = phaseShift;

    this.ratingMVA = ratingMVA;

    this.G = G;
    this.B = B;
  }
}


// ======================================
// GENERATOR MODEL
// ======================================

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


// ======================================
// SHUNT MODEL
// ======================================

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


// ======================================
// POWER SYSTEM MODEL
// ======================================

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
    this.transformers = [];
    this.generators = [];
    this.shunts = [];
  }


  // ----------------------------------
  // Add bus
  // ----------------------------------

  addBus(bus) {
    if (this.buses.some(b => b.id === bus.id)) {
      throw new Error(`Duplicate bus id ${bus.id}`);
    }

    this.buses.push(bus);
  }


  // ----------------------------------
  // Add transmission line
  // ----------------------------------

  addLine(line) {
    this.lines.push(line);
  }


  // ----------------------------------
  // Add transformer
  // ----------------------------------

  addTransformer(transformer) {
    this.transformers.push(transformer);
  }


  // ----------------------------------
  // Add generator
  // ----------------------------------

  addGenerator(generator) {
    this.generators.push(generator);
  }


  // ----------------------------------
  // Add independent shunt
  // ----------------------------------

  addShunt(shunt) {
    this.shunts.push(shunt);
  }


  // ----------------------------------
  // Number of buses
  // ----------------------------------

  get numberOfBuses() {
    return this.buses.length;
  }


  // ==================================
  // VALIDATION
  // ==================================

  validate() {

    const errors = [];

    // --------------------------------
    // Bus checks
    // --------------------------------

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

      if (
        !Number.isFinite(bus.baseKV) ||
        bus.baseKV <= 0
      ) {
        errors.push(
          `Invalid voltage base at bus ${bus.id}.`
        );
      }
    }


    // --------------------------------
    // Slack bus check
    // --------------------------------

    const slackCount =
      this.buses.filter(b => b.type === "Slack").length;

    if (slackCount === 0) {
      errors.push("No Slack bus defined.");
    }

    if (slackCount > 1) {
      errors.push("Multiple Slack buses defined.");
    }


    // --------------------------------
    // Line checks
    // --------------------------------

    for (const line of this.lines) {

      const fromExists =
        ids.has(line.from);

      const toExists =
        ids.has(line.to);

      if (!fromExists || !toExists) {
        errors.push(
          `Line ${line.from}-${line.to} references unknown bus.`
        );
      }

      if (
        !Number.isFinite(line.R) ||
        !Number.isFinite(line.X) ||
        !Number.isFinite(line.B) ||
        !Number.isFinite(line.G)
      ) {
        errors.push(
          `Line ${line.from}-${line.to} has non-finite parameters.`
        );
      }

      if (line.R === 0 && line.X === 0) {
        errors.push(
          `Line ${line.from}-${line.to} has zero impedance.`
        );
      }
    }


    // --------------------------------
    // Transformer checks
    // --------------------------------

    for (const transformer of this.transformers) {

      const fromExists =
        ids.has(transformer.from);

      const toExists =
        ids.has(transformer.to);

      if (!fromExists || !toExists) {
        errors.push(
          `Transformer ${transformer.from}-${transformer.to} references unknown bus.`
        );
      }

      if (transformer.from === transformer.to) {
        errors.push(
          `Transformer ${transformer.from}-${transformer.to} connects a bus to itself.`
        );
      }

      if (
        !Number.isFinite(transformer.R) ||
        !Number.isFinite(transformer.X) ||
        !Number.isFinite(transformer.tapRatio) ||
        !Number.isFinite(transformer.phaseShift) ||
        !Number.isFinite(transformer.G) ||
        !Number.isFinite(transformer.B)
      ) {
        errors.push(
          `Transformer ${transformer.from}-${transformer.to} has non-finite parameters.`
        );
      }

      if (
        transformer.R === 0 &&
        transformer.X === 0
      ) {
        errors.push(
          `Transformer ${transformer.from}-${transformer.to} has zero impedance.`
        );
      }

      if (transformer.tapRatio <= 0) {
        errors.push(
          `Transformer ${transformer.from}-${transformer.to} has invalid tap ratio.`
        );
      }

      if (
        transformer.ratingMVA !== null &&
        (
          !Number.isFinite(transformer.ratingMVA) ||
          transformer.ratingMVA <= 0
        )
      ) {
        errors.push(
          `Transformer ${transformer.from}-${transformer.to} has invalid MVA rating.`
        );
      }
    }


    // --------------------------------
    // Base checks
    // --------------------------------

    if (
      !Number.isFinite(this.baseMVA) ||
      this.baseMVA <= 0
    ) {
      errors.push("Base MVA must be positive.");
    }

    if (
      !Number.isFinite(this.baseKV) ||
      this.baseKV <= 0
    ) {
      errors.push("Base kV must be positive.");
    }


    return {
      valid: errors.length === 0,
      errors
    };
  }
}


// ======================================
// EXPORTS
// Browser + Node.js
// ======================================

if (typeof window !== "undefined") {

  window.Bus = Bus;
  window.Line = Line;
  window.Transformer = Transformer;
  window.Generator = Generator;
  window.Shunt = Shunt;
  window.PowerSystem = PowerSystem;

}

if (
  typeof module !== "undefined" &&
  module.exports
) {

  module.exports = {
    Bus,
    Line,
    Transformer,
    Generator,
    Shunt,
    PowerSystem
  };

}
