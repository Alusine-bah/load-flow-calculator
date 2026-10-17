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

---

# 6. AC Power Flow Solution Methods

## Method

The calculator solves the steady-state AC power-flow problem by determining bus voltage magnitudes and phase angles that satisfy the specified active and reactive power conditions at the buses.

For a bus \(i\), with:

\[
Y_{ij}=G_{ij}+jB_{ij}
\]

and voltage-angle difference:

\[
\theta_{ij}=\delta_i-\delta_j
\]

the calculated active-power injection is:

\[
P_i =
V_i
\sum_{j=1}^{n}
V_j
\left(
G_{ij}\cos\theta_{ij}
+
B_{ij}\sin\theta_{ij}
\right)
\]

and the calculated reactive-power injection is:

\[
Q_i =
V_i
\sum_{j=1}^{n}
V_j
\left(
G_{ij}\sin\theta_{ij}
-
B_{ij}\cos\theta_{ij}
\right)
\]

The power-flow solution determines the unknown voltage states while respecting the specified Slack, PV, and PQ bus quantities.

The calculator currently implements:

- Newton-Raphson power flow,
- Gauss-Seidel power flow.

Both methods solve the same AC network equations but use different numerical iteration procedures and convergence checks.

---

## 6.1 Newton-Raphson Power Flow

### Method

The Newton-Raphson method solves the nonlinear AC power-flow equations by repeatedly calculating the mismatch between specified and calculated bus powers and correcting the unknown voltage state variables.

For non-slack buses, the active-power mismatch is:

\[
\Delta P_i =
P_i^{specified}
-
P_i^{calculated}
\]

For PQ buses, the reactive-power mismatch is:

\[
\Delta Q_i =
Q_i^{specified}
-
Q_i^{calculated}
\]

The Newton-Raphson mismatch vector therefore contains:

- active-power mismatches for PV and PQ buses,
- reactive-power mismatches for PQ buses.

The slack-bus active and reactive powers are not specified mismatch equations because the slack bus supplies the balancing power required by the solved network.

The nonlinear correction equation is written as:

\[
J\Delta x=\Delta f
\]

where:

- \(J\) is the Jacobian matrix,
- \(\Delta f\) is the power-mismatch vector,
- \(\Delta x\) is the voltage-state correction vector.

The state corrections consist of:

- voltage-angle corrections for non-slack buses,
- voltage-magnitude corrections for PQ buses.

The Jacobian may be represented in block form as:

\[
J=
\begin{bmatrix}
\frac{\partial P}{\partial \delta}
&
\frac{\partial P}{\partial V}
\\
\frac{\partial Q}{\partial \delta}
&
\frac{\partial Q}{\partial V}
\end{bmatrix}
\]

After solving the linear correction system, the bus voltage states are updated and the power mismatches are recalculated.

Iteration continues until the maximum applicable active- or reactive-power mismatch is below the specified numerical convergence tolerance, or until the configured iteration limit is reached.

### Bus Treatment

During Newton-Raphson solution:

- the Slack bus retains its specified voltage magnitude and reference angle,
- PV buses retain their specified voltage magnitude while their voltage angles are solved,
- PQ buses have both voltage magnitude and voltage angle solved.

Reactive-power limit enforcement and automatic PV-to-PQ conversion are not currently implemented.

### Implementation

Newton-Raphson solver:

`js/newton.js`

Solver interface:

`js/newton-v2.js`

Main functions:

- `solveNewton()`
- `solveNewtonV2()`

### Validation

Newton-Raphson behavior is checked using:

- `test-newton-v2.js`
- `test-solver.js`
- `verify-residuals.js`
- `test-gs-vs-nr.js`

The validation strategy includes:

- convergence checks,
- recalculation of power-injection residuals from the converged voltages and Y-bus,
- comparison between the original and updated solver interfaces,
- comparison with the independently implemented Gauss-Seidel solution.

A converged solver status alone is not treated as sufficient numerical verification; residual calculations are used to confirm that the resulting voltage state satisfies the modeled power-balance equations within the selected tolerance.

### Reference

- Saadat, H. *Power System Analysis*, Load Flow Analysis chapter.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.

---

## 6.2 Gauss-Seidel Power Flow

### Method

The Gauss-Seidel method solves the AC power-flow equations by sequentially updating bus voltage phasors.

For a PQ bus \(i\), the voltage update is based on the bus power equation and may be expressed as:

\[
V_i^{(k+1)}
=
\frac{1}{Y_{ii}}
\left[
\frac{P_i-jQ_i}
{\left(V_i^{(k)}\right)^*}
-
\sum_{j\neq i}
Y_{ij}V_j
\right]
\]

where the newest available bus-voltage values are used during each iteration.

This sequential use of updated values distinguishes the Gauss-Seidel procedure from a simultaneous fixed-point update.

For PV buses, the specified active power and voltage magnitude are retained while the reactive power required by the current voltage state is determined during the iterative calculation.

The resulting voltage phasor is adjusted to maintain the specified PV-bus voltage magnitude.

### Convergence

The implemented Gauss-Seidel solver monitors the change in complex bus voltage between successive iterations.

Iteration continues until the maximum voltage change is below the configured convergence tolerance, or until the configured iteration limit is reached.

This convergence criterion is different from the Newton-Raphson solver, which uses power mismatches as its primary convergence measure.

Therefore, agreement between converged Newton-Raphson and Gauss-Seidel solutions provides an additional independent numerical cross-check.

### Bus Treatment

During Gauss-Seidel solution:

- the Slack bus voltage remains fixed,
- PV buses retain their specified voltage magnitude,
- PQ-bus complex voltages are iteratively updated.

Reactive-power limit enforcement and automatic PV-to-PQ conversion are not currently implemented.

### Implementation

Gauss-Seidel solver:

`js/gaussseidel.js`

Solver interface:

`js/gaussseidel-v2.js`

Main functions:

- `solveGaussSeidel()`
- `solveGaussSeidelV2()`

### Validation

Gauss-Seidel behavior is checked using:

- `test-gaussseidel-v2.js`
- `test-gs-vs-nr.js`

The validation includes:

- convergence checks,
- comparison between solver implementations,
- comparison of solved bus voltage magnitudes and phase angles with Newton-Raphson results for the same system model.

Because Newton-Raphson and Gauss-Seidel use different numerical procedures, close agreement between their converged solutions provides useful cross-verification of the implemented AC power-flow equations.

### Reference

- Saadat, H. *Power System Analysis*, Load Flow Analysis chapter.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.

---

## 6.3 Current Solver Limitations

The present AC power-flow implementation does not currently include:

- generator reactive-power limits,
- automatic PV-to-PQ bus conversion,
- transformer off-nominal tap ratios,
- phase-shifting transformers,
- continuation power flow,
- fast-decoupled load flow.

These limitations must be considered when interpreting results for systems that require these modeling features.

---

# 7. Transmission Line Power Flow and Losses

## Method

After the AC power-flow solution has converged, the solved bus-voltage phasors are used to calculate the electrical power flowing through each modeled transmission branch.

For a branch connecting buses \(i\) and \(j\), the series impedance is:

\[
Z_{ij}=R_{ij}+jX_{ij}
\]

and the series admittance is:

\[
y_{ij}=\frac{1}{Z_{ij}}
\]

If the branch includes total charging susceptance \(B_{ij}\), half of the shunt charging is assigned to each terminal:

\[
y_{sh}=j\frac{B_{ij}}{2}
\]

The terminal current flowing from bus \(i\) toward bus \(j\) is:

\[
I_{ij}
=
(V_i-V_j)y_{ij}
+
V_i y_{sh}
\]

The current flowing from bus \(j\) toward bus \(i\) is:

\[
I_{ji}
=
(V_j-V_i)y_{ij}
+
V_j y_{sh}
\]

The corresponding complex powers are:

\[
S_{ij}=V_i I_{ij}^{*}
\]

and:

\[
S_{ji}=V_j I_{ji}^{*}
\]

where \((\cdot)^*\) denotes the complex conjugate.

The real and reactive components are obtained from:

\[
S_{ij}=P_{ij}+jQ_{ij}
\]

and:

\[
S_{ji}=P_{ji}+jQ_{ji}
\]

These quantities describe the electrical power flow observed from each end of the branch.

---

## 7.1 Branch Losses

The net complex power absorbed by the modeled branch is calculated from the sum of the terminal complex powers:

\[
S_{loss,ij}
=
S_{ij}+S_{ji}
\]

Therefore:

\[
P_{loss,ij}
=
\operatorname{Re}(S_{loss,ij})
\]

and:

\[
Q_{loss,ij}
=
\operatorname{Im}(S_{loss,ij})
\]

The total system branch losses are obtained by summing the calculated branch losses across the modeled network.

Active-power loss represents real power dissipated by branch resistance.

Reactive-power balance is influenced by both branch series reactance and modeled line-charging susceptance. Therefore, reactive branch loss or absorption should not be interpreted in exactly the same way as resistive active-power loss.

---

## 7.2 Apparent Power

The apparent-power magnitude at each branch terminal is calculated from the corresponding complex power:

\[
|S_{ij}|
=
\sqrt{P_{ij}^{2}+Q_{ij}^{2}}
\]

and:

\[
|S_{ji}|
=
\sqrt{P_{ji}^{2}+Q_{ji}^{2}}
\]

Because the sending-end and receiving-end powers are generally different, branch loading assessment may need to consider both terminal values.

---

## 7.3 Engineering Unit Conversion

Internal load-flow calculations are performed primarily in per-unit quantities.

Where physical engineering units are required, per-unit power values are converted using the system apparent-power base.

For example:

\[
P_{MW}
=
P_{pu}S_{base}
\]

\[
Q_{MVAr}
=
Q_{pu}S_{base}
\]

and:

\[
S_{MVA}
=
|S_{pu}|S_{base}
\]

For a three-phase system, the base current associated with a voltage base \(V_{base}\) and apparent-power base \(S_{base}\) is:

\[
I_{base}
=
\frac{S_{base}}
{\sqrt{3}V_{base}}
\]

A per-unit current may therefore be converted using:

\[
I_{actual}
=
I_{pu}I_{base}
\]

Correct current conversion requires the appropriate voltage base for the location being analyzed.

---

## Implementation

Transmission-line flow calculations:

`js/line-flow.js`

Engineering-unit conversions:

`js/units.js`

Main functions include:

- `calculateLineFlows()`
- per-unit to MW conversion utilities,
- per-unit to MVAr conversion utilities,
- per-unit to MVA conversion utilities,
- current conversion utilities.

---

## Validation

Transmission-line power-flow calculations are checked using:

- `test-line-flow.js`
- `test-units.js`

The validation process includes:

- calculation of sending-end and receiving-end branch powers,
- branch-loss calculation,
- consistency of per-unit and engineering-unit conversions,
- use of converged bus voltages from the load-flow solution.

Line-flow results depend directly on the correctness of:

1. system branch data,
2. Y-bus/network modeling,
3. converged bus-voltage phasors,
4. system base quantities.

Therefore, transmission-line results are interpreted as downstream calculations of the verified load-flow state.

---

## Reference

- Saadat, H. *Power System Analysis*, transmission-line and load-flow analysis sections.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.

---

# 8. Thermal Line Loading and Rating Assessment

## Method

Thermal loading assessment compares the calculated apparent-power flow on each modeled branch with an assigned branch rating.

For a branch with thermal rating:

\[
S_{rated}
\]

the loading percentage is calculated as:

\[
Loading(\%)=
\frac{S_{actual}}{S_{rated}}
\times 100
\]

where \(S_{actual}\) is the apparent-power magnitude used for the loading assessment.

Because the apparent power can differ between the two terminals of a branch, the implementation may evaluate the branch using the larger terminal apparent-power magnitude.

A branch is considered overloaded when:

\[
Loading(\%) > 100
\]

This comparison represents a rating-based screening calculation and does not by itself reproduce the detailed conductor thermal calculations used to establish an actual transmission-line ampacity.

---

## 8.1 Branch Rating

The branch rating is represented in MVA.

Where a branch rating is available, the calculated branch apparent power is compared with the specified rating.

The loading calculation is:

\[
Loading(\%)=
\frac{S_{MVA}}{Rating_{MVA}}
\times 100
\]

where:

- \(S_{MVA}\) is the calculated apparent-power magnitude,
- \(Rating_{MVA}\) is the assigned branch rating.

A value below \(100\%\) indicates that the calculated loading is below the assigned rating.

A value above \(100\%\) indicates that the calculated apparent power exceeds the assigned rating.

---

## 8.2 Rating Interpretation

The thermal-rating calculation depends directly on the quality and provenance of the branch rating data.

The current project contains branch ratings that may be used for demonstration and analysis purposes.

These values must not automatically be interpreted as authoritative ratings for a published benchmark system unless an external source for those ratings has been verified.

In particular, demo or assumed `ratingMVA` values are used only to exercise:

- loading calculations,
- overload detection,
- contingency thermal assessment,
- reporting behavior.

Therefore, thermal-loading results must be interpreted as:

\[
\text{Calculated network flow}
+
\text{assigned rating assumption}
\]

rather than as independently validated physical conductor temperature limits.

---

## 8.3 Thermal Status

The loading result may be classified according to whether the assigned thermal rating has been exceeded.

The fundamental overload condition is:

\[
Loading(\%) > 100
\]

The \(100\%\) threshold follows directly from the definition of the assigned rating.

Any additional severity categories or ranking thresholds used elsewhere in the application are project-level analysis rules unless separately supported by a documented engineering standard or published reference.

They must not be represented as universal transmission-system operating limits without such support.

---

## 8.4 Relationship to Power Flow

Thermal loading is a downstream calculation.

The result depends on:

1. the modeled branch parameters,
2. the Y-bus representation,
3. the converged bus-voltage solution,
4. the calculated branch complex power,
5. the assigned branch rating.

Therefore, an incorrect load-flow solution or incorrect branch rating will directly affect the calculated thermal-loading percentage.

---

## Implementation

Thermal rating analysis:

`js/line-rating.js`

Engineering-unit and loading utilities:

`js/units.js`

Contingency thermal analysis:

`js/contingency-thermal.js`

Relevant functions include:

- `analyzeLineRatings()`
- `calculateThermalImpact()`
- loading and MVA conversion utilities.

---

## Validation

Thermal-loading calculations are checked using:

- `test-line-rating.js`
- `test-contingency.js`

The validation includes:

- apparent-power conversion to MVA,
- comparison against assigned branch ratings,
- loading percentage calculation,
- overload detection,
- post-contingency thermal-loading assessment.

The validation verifies the implemented calculation logic.

It does not independently establish that every rating value in the project represents an externally validated physical transmission-line limit.

---

## Current Limitation

The project does not currently calculate dynamic or physical conductor ampacity from parameters such as:

- conductor type,
- conductor temperature,
- ambient temperature,
- wind speed,
- solar heating,
- sag limits,
- weather conditions.

Thermal assessment is therefore based on assigned MVA ratings rather than a detailed physical thermal model.

---

## Reference

- Saadat, H. *Power System Analysis*, transmission-line power-flow concepts.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.

Specific branch-rating values used in benchmark or demonstration systems require separate source verification before being described as authoritative system ratings.