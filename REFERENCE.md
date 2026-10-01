\# Reference values and verification



This file records the load-flow solutions our solver produces, and

how we know they are correct.



\## Verification standard



We do NOT rely on any textbook's published reference values as the

primary standard of correctness, because during development we found

that (a) my own recollection of textbook values was wrong, and

(b) a widely-cited PDF reference table for the IEEE 5-bus system

turned out to be inconsistent with the accompanying line-data table.



Instead, correctness is defined by three independent tests:



1\. \*\*Residual test.\*\* At the converged solution, recompute Pcalc and

&#x20;  Qcalc from the Y-bus and the converged bus voltages, and compare

&#x20;  against the scheduled Psch and Qsch at every bus where an equation

&#x20;  is defined (all non-slack buses). The test passes if every

&#x20;  residual is below 1e-8 p.u. The slack bus is excluded because its

&#x20;  injection is not scheduled.



2\. \*\*Independent-algorithm test.\*\* Solve the same system with two

&#x20;  completely different algorithms: Newton-Raphson (Jacobian-based,

&#x20;  quadratic convergence) in `js/newton.js`, and Gauss-Seidel (direct

&#x20;  complex-voltage iteration, no derivatives) in `js/gaussseidel.js`.

&#x20;  The two must agree to better than 1e-8 p.u. in voltage magnitude

&#x20;  and 1e-6 degrees in angle.



3\. \*\*Physical sanity.\*\* PQ bus voltages lie between slack and PV

&#x20;  setpoints as the network topology demands; angles are monotone

&#x20;  along radial paths; line losses are positive.



Both (1) and (2) currently pass on all systems in `js/data.js`. The

verification script is `test-gs-vs-nr.js`; the residual check for a

single system is `verify-residuals.js`.



\## Verified solutions



All values in per-unit on a 100 MVA base. Angles in degrees.



\### 4-bus (Stevenson / Saadat style)



| Bus | Type  |  V      |   Angle |

|-----|-------|---------|---------|

| 1   | Slack | 1.050000|  0.00000|

| 2   | PV    | 1.020000|  0.43077|

| 3   | PQ    | 1.031907| -0.90692|

| 4   | PQ    | 1.020324| -0.55742|



NR: 3 iterations. GS: 22 iterations. Max |dV| between solvers:

8.9e-12 p.u.



Note: an earlier version of this file (never written) would have

claimed PQ bus voltages must be below the PV setpoint (1.02). That

was a heuristic, not a theorem. For this network, the true solution

puts buses 3 and 4 slightly above 1.02 because the PV bus injects

0.5 p.u. into a short, low-impedance network whose loads don't

dominate. The solver has always reported the true answer.



\### IEEE 9-bus (standard)



| Bus | Type  |  V      |   Angle |

|-----|-------|---------|---------|

| 1   | Slack | 1.040000|  0.00000|

| 2   | PV    | 1.025000|  6.36246|

| 3   | PV    | 1.025000| -0.36438|

| 4   | PQ    | 1.038755| -2.12454|

| 5   | PQ    | 1.001767| -6.43979|

| 6   | PQ    | 1.023457| -3.08589|

| 7   | PQ    | 1.034325| -0.85056|

| 8   | PQ    | 1.029754|  0.82374|

| 9   | PQ    | 1.048492| -1.24320|



NR: 4 iterations. GS: 180 iterations. Max |dV|: 4.3e-10 p.u.



\### IEEE 5-bus



Data in `data.js` under key `"5bus"`. Bus 2 is PV, buses 3-5 are PQ.



| Bus | Type  |  V      |   Angle |

|-----|-------|---------|---------|

| 1   | Slack | 1.060000|  0.00000|

| 2   | PV    | 1.000000| -2.06123|

| 3   | PQ    | 0.987247| -4.63669|

| 4   | PQ    | 0.984132| -4.95702|

| 5   | PQ    | 0.971696| -5.76495|



NR: 3 iterations. GS: 70 iterations. Max |dV|: 2.6e-10 p.u.



\*\*Data caveat.\*\* The published reference table we tried to compare

against (from a PDF titled "Load Flow Analysis of IEEE 5 Bus Simulink

Model") lists different bus voltages. That comparison is not

authoritative because the PDF's own line-data table lists only 4 of

the 7 lines required to make the network connected, and its bus-data

table is garbled in text extraction. The values above are the true

solution for the data in `data.js`, verified by two independent

solvers.



\## Summary



The load-flow calculator's NR and GS solvers are verified to be

correct on the systems currently defined in `data.js`. The

verification does not depend on any textbook reference value.

Textbook references are useful for cross-checking \*when\* their

accompanying data is complete and trustworthy, which in our

experience has not always been the case.

