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

---

# 9. Voltage Profile Assessment

## Method

Voltage-profile assessment evaluates the solved bus-voltage magnitudes after completion of the AC power-flow calculation.

For each bus \(i\), the calculated voltage magnitude is expressed in per unit as:

\[
V_i
\]

The voltage deviation relative to the nominal per-unit reference of \(1.0\) pu is calculated as:

\[
\Delta V_i(\%)
=
(V_i-1.0)\times100
\]

A positive value indicates a voltage magnitude above \(1.0\) pu, while a negative value indicates a voltage magnitude below \(1.0\) pu.

The analysis also identifies:

- minimum bus-voltage magnitude,
- maximum bus-voltage magnitude,
- average bus-voltage magnitude,
- buses outside the configured assessment limits.

---

## 9.1 Voltage Limits

The voltage-profile analysis uses a configurable lower voltage limit:

\[
V_{min}
\]

and upper voltage limit:

\[
V_{max}
\]

The current default values implemented in the project are:

\[
V_{min}=0.95\ pu
\]

and:

\[
V_{max}=1.05\ pu
\]

A bus is classified according to:

\[
V_i < V_{min}
\]

as:

`LOW VOLTAGE`

and:

\[
V_i > V_{max}
\]

as:

`HIGH VOLTAGE`

Otherwise, the bus is classified as:

`NORMAL`

These limits are configurable analysis thresholds.

The default values used by the software must not be interpreted as universal transmission-system operating limits.

Actual acceptable voltage ranges depend on factors including:

- applicable grid codes,
- utility operating criteria,
- nominal voltage level,
- planning requirements,
- operating condition,
- equipment requirements.

Therefore, an engineering study intended for a specific network should use voltage limits appropriate to that system and its governing requirements.

---

## 9.2 Minimum and Maximum Voltage

The minimum-voltage bus is determined from:

\[
V_{minimum}
=
\min(V_1,V_2,\ldots,V_n)
\]

The maximum-voltage bus is determined from:

\[
V_{maximum}
=
\max(V_1,V_2,\ldots,V_n)
\]

These quantities provide a direct indication of the most extreme voltage magnitudes in the solved network state.

---

## 9.3 Average Voltage

The arithmetic average of the solved bus-voltage magnitudes is calculated as:

\[
V_{average}
=
\frac{1}{n}
\sum_{i=1}^{n}V_i
\]

where \(n\) is the number of buses included in the solved result.

The average voltage is a descriptive network summary.

It must not be used alone to determine whether all individual bus voltages satisfy applicable operating requirements.

---

## 9.4 Relationship to Power Flow

Voltage-profile analysis is a downstream assessment of the converged AC power-flow solution.

The calculated voltage profile depends on:

1. network topology,
2. branch impedance and charging data,
3. bus generation and load,
4. bus classifications,
5. voltage setpoints,
6. Y-bus construction,
7. numerical convergence of the power-flow solution.

Therefore, voltage-profile assessment does not independently solve the electrical network.

It evaluates voltage quantities obtained from the solved network state.

---

## 9.5 Interpretation of Voltage Deviation

The voltage-deviation quantity:

\[
\Delta V_i(\%)
=
(V_i-1.0)\times100
\]

is a deviation from the nominal per-unit reference.

It is different from a change in voltage between two operating conditions.

For example, contingency voltage change may instead be evaluated using:

\[
\Delta V_i^{cont}
=
V_i^{post}
-
V_i^{base}
\]

These two quantities must not be interpreted as equivalent:

- nominal voltage deviation compares a solved voltage with \(1.0\) pu,
- contingency voltage deviation compares two solved operating states.

---

## Implementation

Voltage-profile analysis:

`js/voltage-analysis.js`

Main function:

- `analyzeVoltageProfile()`

Report output:

- `printVoltageProfile()`

The implementation permits alternative voltage limits to be supplied through analysis options.

If no alternative values are supplied, the current defaults are:

- minimum voltage: `0.95 pu`
- maximum voltage: `1.05 pu`

---

## Validation

Voltage-profile analysis is exercised using:

- `test-voltage-analysis.js`

The calculation operates on bus voltages produced by the power-flow solver and verifies the analysis and reporting path for the modeled test system.

The voltage-profile calculation should be distinguished from validation of the underlying AC power-flow solution.

Solver correctness is assessed separately using the numerical and residual verification methods documented in Section 6.

---

## Current Limitation

The present voltage-profile assessment applies general configurable per-unit limits.

It does not automatically select voltage limits according to:

- regional grid code,
- utility-specific operating criteria,
- transmission voltage class,
- emergency operating state,
- equipment-specific requirements.

Application-specific voltage limits must therefore be supplied or justified separately when the calculator is used for a particular engineering study.

---

## Reference

- Saadat, H. *Power System Analysis*.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.

Specific acceptable voltage limits for an actual transmission network should be obtained from the applicable grid code, system operator, utility criteria, or other governing engineering requirement.

---

# 10. N-1 Contingency Analysis

## Method

N-1 contingency analysis evaluates the response of the modeled power system after the removal of one transmission branch at a time.

For each candidate branch outage, the analysis:

1. solves the intact base-case network,
2. creates a copy of the network model,
3. removes the selected branch,
4. checks the remaining network topology for islanding,
5. solves the post-contingency network,
6. compares the post-contingency state with the base case,
7. evaluates voltage and thermal impacts,
8. assigns a contingency status and ranking result.

The present implementation considers single transmission-branch outages.

It does not currently perform automatic N-1 simulation of generators, transformers, shunts, or other equipment categories.

---

## 10.1 Branch Outage Simulation

For a contingency involving branch \(i-j\), that branch is removed from the copied system model:

\[
\mathcal{L}_{post}
=
\mathcal{L}_{base}
-
\{(i,j)\}
\]

where:

- \(\mathcal{L}_{base}\) is the set of modeled branches in the intact system,
- \(\mathcal{L}_{post}\) is the branch set after the outage.

The AC power-flow calculation is then executed on the modified network.

The base and post-contingency states are retained separately so that their electrical quantities can be compared.

---

## 10.2 Islanding Detection

Removing a branch can separate the network into multiple electrically disconnected components.

The implementation represents the post-contingency network as a graph:

- buses are graph nodes,
- remaining transmission branches are graph edges.

Connected components are identified from the resulting topology.

If the number of connected components is greater than one:

\[
N_{components} > 1
\]

the contingency is classified as an islanding event.

The analysis records:

- whether islanding occurred,
- the number of islands,
- the bus identifiers contained within each island.

Topology assessment is kept separate from numerical power-flow convergence.

An islanding event is therefore not interpreted merely as a large numerical severity score.

It is reported explicitly as:

`ISLANDED`

---

## 10.3 Post-Contingency Convergence Status

After the selected branch is removed, the power-flow solver attempts to solve the modified network.

A contingency is classified according to the following status logic:

### ISLANDED

The network has separated into more than one connected component.

### FAILED

The network is not classified as islanded, but the post-contingency power-flow solution does not converge successfully.

### CONVERGED

The post-contingency network remains connected and the power-flow solution converges successfully.

These status categories distinguish:

- topology failure,
- numerical solution failure,
- successfully solved contingencies.

This distinction is important because a power-flow convergence failure and physical network islanding are not the same condition.

---

## 10.4 Voltage Impact

For each bus \(i\), the contingency voltage change is calculated as:

\[
\Delta V_i
=
V_i^{post}
-
V_i^{base}
\]

where:

- \(V_i^{base}\) is the intact-system voltage magnitude,
- \(V_i^{post}\) is the voltage magnitude after the selected outage.

This quantity represents the change caused by the contingency.

It is different from the nominal voltage deviation described in Section 9:

\[
V_i-1.0
\]

The current contingency-ranking report treats:

\[
|\Delta V_i| > 0.05\ pu
\]

as a project-level voltage-impact threshold.

This value is currently an internal analysis rule.

It must not be interpreted as a universal utility, IEEE, NERC, or grid-code voltage criterion unless separately justified by an applicable engineering requirement.

---

## 10.5 Active-Power Loss Impact

The total active-power branch loss is calculated for both the base and post-contingency states.

The contingency loss change is:

\[
\Delta P_{loss}
=
P_{loss}^{post}
-
P_{loss}^{base}
\]

A positive value indicates increased calculated active-power loss after the outage.

A negative value indicates reduced calculated active-power loss.

Loss variation is used as one component of the current contingency comparison metric.

---

## 10.6 Thermal Impact

For contingencies with a usable post-contingency solution, branch loading is recalculated after the outage.

For a rated branch:

\[
Loading_{post}(\%)
=
\frac{S_{post}}{Rating_{MVA}}
\times100
\]

The thermal-impact module records:

- pre-contingency loading,
- post-contingency loading,
- outage status,
- warning or overload status.

The removed branch itself is reported as:

`OUTAGE`

The current thermal-impact implementation uses project-defined status thresholds:

- loading below \(90\%\): `NORMAL`,
- loading from \(90\%\) up to the overload boundary: `WARNING`,
- loading at or above approximately \(100\%\): `OVERLOAD`.

These labels are application-level reporting rules.

The physical validity of the result still depends on the provenance of the assigned branch rating, as described in Section 8.

---

## 10.7 Contingency Severity Score

The project currently computes a numerical contingency severity score for comparison and ordering of contingencies.

For a converged contingency, the score combines:

1. absolute bus-voltage changes,
2. absolute change in active-power losses,
3. thermal loading above \(100\%\).

The implemented comparison metric can be summarized as:

\[
Score
=
100
\sum_i
|\Delta V_i|
+
100
|\Delta P_{loss}|
+
\sum_k
\max(0,Loading_k-100)
\]

where:

- \(\Delta V_i\) is the bus-voltage magnitude change in per unit,
- \(\Delta P_{loss}\) is the active-power loss change in per unit,
- \(Loading_k\) is the post-contingency loading percentage of branch \(k\).

For a non-converged contingency, the current implementation assigns:

\[
Score=1000
\]

as an internal comparison value.

This value is not a physical quantity and is not an industry-standard contingency performance index.

The severity score is therefore a project heuristic used for relative sorting and reporting.

It must not be presented as an IEEE, NERC, IEC, utility, or universally accepted security index.

---

## 10.8 Ranking Order

The current ranking procedure gives priority to contingency status before comparing the numerical severity score.

The ordering is:

1. `ISLANDED`
2. `FAILED`
3. `CONVERGED`

Within the same status category, contingencies with larger numerical scores are ranked ahead of contingencies with smaller scores.

This approach intentionally prevents an islanding event from being treated as merely another numerical voltage or thermal deviation.

---

## 10.9 Severity Classification

For successfully converged contingencies, the current reporting layer classifies the heuristic severity score using project-defined ranges.

The implemented categories are:

\[
Score \geq 100
\]

`CRITICAL`

\[
20 \leq Score < 100
\]

`HIGH`

\[
5 \leq Score < 20
\]

`MEDIUM`

\[
Score < 5
\]

`NORMAL`

These thresholds are internal project classification rules.

They are not currently derived from a verified external transmission-planning standard.

They are intended only to provide consistent relative categorization within the application.

---

## 10.10 Violation Reporting

The contingency report identifies the most significant calculated effects for converged cases.

Reported quantities include:

- maximum post-contingency branch loading,
- maximum bus-voltage change,
- number of voltage-impact violations,
- number of thermal violations,
- worst affected bus,
- worst affected branch,
- human-readable reason for the ranking.

For islanded or failed contingencies, voltage and thermal violation fields may be unavailable because a normal connected post-contingency operating state has not been established.

These conditions are reported primarily through their topology or solver status.

---

## Implementation

Core contingency simulation:

`js/contingency.js`

Voltage and loss impact analysis:

`js/contingency-analysis.js`

Thermal impact analysis:

`js/contingency-thermal.js`

Contingency ranking:

`js/contingency-ranking.js`

Ranking and explanation report:

`js/contingency-ranking-report.js`

Main functions include:

- `analyzeContingency()`
- `getConnectedComponents()`
- `detectIslanding()`
- `analyzeContingencyImpact()`
- `calculateVoltageImpact()`
- `calculateLossImpact()`
- `calculateThermalImpact()`
- `calculateSeverityScore()`
- `getContingencyStatus()`
- `runContingencyRanking()`
- `createContingencyRankingReport()`

---

## Validation

The current contingency-analysis path is exercised using:

- `test-contingency.js`
- `test-contingency-ranking.js`
- `test-contingency-ranking-report.js`

The existing tests exercise:

- single-line outage simulation,
- post-outage power-flow calculation,
- voltage impact,
- loss impact,
- thermal impact,
- contingency ranking,
- ranking-report generation.

Islanding behavior has also been exercised during development on outages that separate the modeled network.

A dedicated automated islanding regression test should be maintained so that topology detection remains independently verifiable as the code evolves.

---

## 10.11 Current Limitations

The present contingency-analysis implementation has several important limitations.

### Equipment Scope

Automatic contingency enumeration currently focuses on transmission-line outages.

It does not yet provide equivalent automatic enumeration for:

- generator outages,
- transformer outages,
- shunt-device outages,
- bus outages,
- multiple simultaneous outages.

### Islanded Power Flow

The current implementation detects islanding, but it does not perform a complete multi-island power-flow solution with independent slack/reference treatment and generation-load balancing inside every island.

Therefore, islanding detection should be interpreted primarily as a topology-security result.

### Severity Metric

The numerical severity score and the `NORMAL`, `MEDIUM`, `HIGH`, and `CRITICAL` thresholds are project heuristics.

They require separate engineering justification before being used for formal utility planning or operating decisions.

### Voltage Threshold

The current contingency voltage-change threshold of \(0.05\) pu is a project analysis threshold.

It is not automatically linked to the absolute voltage limits used in Section 9.

### Thermal Ratings

Post-contingency overload conclusions are only as authoritative as the branch ratings supplied to the model.

Demo or assumed ratings must not be treated as published system limits.

### Model Fidelity

Contingency results inherit the current network-model limitations described elsewhere in this document, including the absence of detailed transformer tap, phase-shifting, generator reactive-limit, and other advanced equipment models.

---

## Reference

- Wood, A. J., Wollenberg, B. F., and Sheblé, G. B. *Power Generation, Operation, and Control*, security-analysis concepts.
- Saadat, H. *Power System Analysis*.
- Grainger, J. J., and Stevenson, W. D. *Power System Analysis*.

Formal N-1 planning criteria, allowable post-contingency voltage ranges, emergency thermal ratings, and security-performance requirements should be taken from the applicable system operator, utility, grid code, or verified reliability standard before this application is used for a specific operational or planning study.