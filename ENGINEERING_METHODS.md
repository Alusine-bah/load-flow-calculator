# Engineering Methods

## 1. Scope and Design Philosophy

This document describes the engineering methods implemented in the Load Flow Calculator.

The objective of this project is to provide a transparent power system analysis tool where each calculation can be traced to:

- an established engineering method,
- a mathematical formulation,
- a documented assumption,
- and a verification procedure.

The software separates the implementation into three main layers:

1. Calculation layer

   - Numerical algorithms and electrical network models.

2. Analysis layer

   - Voltage assessment,
   - contingency analysis,
   - fault studies,
   - and other engineering evaluations.

3. Reporting layer

   - Presentation and export of calculated results.

The implementation prioritizes reproducibility, transparency, and verification rather than relying only on comparison with published numerical values.

---

# 2. Network Representation

## Method

The power system is represented using buses and modeled transmission branches.

Each bus contains:

- bus number,
- bus type,
- voltage magnitude,
- voltage angle,
- generation,
- load.

Each modeled transmission branch currently contains:

- sending bus,
- receiving bus,
- resistance,
- reactance,
- charging susceptance,
- optional thermal rating.

The current implementation focuses on transmission branch modeling. Other components, such as transformers, shunt compensation devices, and phase-shifting transformers, are not currently modeled.

## Implementation

System definitions:

`js/data.js`

Object conversion:

`js/system-loader-v2.js`

## Reference

- Saadat, H. *Power System Analysis*.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.

---

# 3. Per-Unit System

## Method

All electrical quantities in the calculator are represented using the per-unit system unless otherwise specified.

The base impedance is:

\[
Z_{base}=\frac{V_{base}^{2}}{S_{base}}
\]

where:

- \(V_{base}\) is the voltage base,
- \(S_{base}\) is the apparent power base.

The calculator uses a system-wide apparent power base. Voltage bases are defined according to the modeled network voltage level.

The per-unit system allows electrical parameters from different voltage and power levels to be represented using a common reference system.

## Implementation

Base values:

`js/data.js`

Unit conversion utilities:

`js/units.js`

## Reference

- Saadat, H. *Power System Analysis*, Per-Unit System chapter.

---

# 4. Bus Classification

## Method

The calculator uses the standard AC power-flow bus classification.

## Slack Bus

Known quantities:

- voltage magnitude,
- voltage angle.

Calculated quantities:

- active power,
- reactive power.

The slack bus provides the reference voltage angle and balances the system power mismatch.

---

## PV Bus

Known quantities:

- active power injection,
- voltage magnitude.

Calculated quantities:

- voltage angle,
- reactive power.

Reactive power limit enforcement and automatic PV-to-PQ bus switching are not currently implemented in the solver.

---

## PQ Bus

Known quantities:

- active power injection,
- reactive power injection.

Calculated quantities:

- voltage magnitude,
- voltage angle.

---

## Implementation

Bus definitions:

`js/data.js`

Bus model:

`js/models.js`

## Validation

Bus classification and solver behavior are verified using:

- `test-models.js`
- `test-newton-v2.js`
- `test-gaussseidel-v2.js`
- `verify-residuals.js`

## Reference

- Saadat, H. *Power System Analysis*, Load Flow Analysis chapter.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.

---

# 5. Bus Admittance Matrix (Y-bus)

## Method

The bus admittance matrix represents the electrical relationship between bus voltage phasors and current injection phasors.

The network equation is:

\[
I_{bus}=Y_{bus}V_{bus}
\]

where:

- \(I_{bus}\) is the bus current injection vector,
- \(V_{bus}\) is the bus voltage vector,
- \(Y_{bus}\) is the bus admittance matrix.

The Y-bus matrix forms the electrical network foundation for load-flow calculations and other power system studies.

---

## Mathematical Formulation

For a branch connecting buses \(i\) and \(j\), the series impedance is:

\[
Z_{ij}=R_{ij}+jX_{ij}
\]

The series admittance is:

\[
y_{ij}=\frac{1}{Z_{ij}}
\]

For transmission line charging, the shunt admittance is divided equally between both ends:

\[
y_{sh}=j\frac{B_{ij}}{2}
\]

The diagonal elements of the Y-bus matrix are calculated by summing connected branch admittances:

\[
Y_{ii}=\sum(y_{ij}+y_{sh})
\]

The off-diagonal elements represent the negative mutual admittance between connected buses:

\[
Y_{ij}=-y_{ij}
\]

For buses without direct electrical connection:

\[
Y_{ij}=0
\]

---

## Implementation

Y-bus construction:

`js/ybus.js`

Updated implementation:

`js/ybus-v2.js`

Main functions:

- `buildYbus()`
- `buildYbusV2()`

---

## Validation

Y-bus implementation is verified using:

- `test-ybus-v2.js`
- `test-ybus-comparison.js`

Validation includes comparison of calculated Y-bus elements against known reference values for selected benchmark systems.

---

## Reference

- Saadat, H. *Power System Analysis*, Load Flow Analysis chapter.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.
- Stevenson, W. D. *Elements of Power System Analysis*.