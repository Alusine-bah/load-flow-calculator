\# Validation Plan



\## 1. Purpose



This document defines the validation strategy for the Load Flow Calculator.



The purpose of validation is to establish evidence that each implemented engineering calculation:



1\. represents the intended mathematical model,

2\. produces numerically correct results for that model,

3\. behaves consistently across supported test systems,

4\. agrees with independent calculations where possible,

5\. agrees with trustworthy published benchmark results where suitable reference data are available,

6\. reports limitations and unsupported conditions explicitly.



A successful software execution is not considered sufficient proof of engineering correctness.



Validation must distinguish between:



\- software execution,

\- numerical consistency,

\- mathematical correctness,

\- benchmark agreement,

\- physical model validity,

\- application-specific engineering acceptance.



\---



\# 2. Validation Philosophy



The project uses multiple independent validation layers.



No single validation method is sufficient for every engineering module.



The principal validation layers are:



1\. structural validation,

2\. equation-level validation,

3\. residual validation,

4\. independent-algorithm validation,

5\. benchmark validation,

6\. physical sanity checks,

7\. regression testing.



The strongest validation is obtained when several independent layers support the same result.



\---



\# 3. Validation Levels



\## 3.1 Level A — Structural Validation



Structural validation checks whether input data and model objects are constructed correctly.



Examples include:



\- bus IDs,

\- bus types,

\- branch connectivity,

\- number of buses,

\- number of branches,

\- base quantities,

\- branch parameters,

\- thermal ratings,

\- system-loader conversions.



Structural validation does not prove that the electrical calculation is correct.



Relevant tests include:



\- `test-models.js`

\- `test-loader-v2.js`



\---



\## 3.2 Level B — Mathematical Identity Validation



Mathematical identity validation checks equations that should satisfy an exact or near-exact numerical relationship.



Examples include:



\\\[

Y\_{bus}Z\_{bus}\\approx I

\\]



and consistency between two implementations of the same matrix or network-building operation.



Examples of relevant tests include:



\- `test-ybus-v2.js`

\- `test-ybus-comparison.js`

\- `test-matrix.js`

\- `test-matrix-inverse.js`

\- `test-zbus.js`



These tests verify numerical implementation consistency.



They do not automatically prove that the modeled electrical network corresponds to a published real or benchmark system.



\---



\## 3.3 Level C — Power-Flow Residual Validation



A converged AC power-flow result must satisfy the modeled power-balance equations.



For each non-slack bus:



\\\[

\\Delta P\_i

=

P\_i^{specified}

\-

P\_i^{calculated}

\\]



must approach zero.



For each PQ bus:



\\\[

\\Delta Q\_i

=

Q\_i^{specified}

\-

Q\_i^{calculated}

\\]



must approach zero.



Reactive-power mismatch is not imposed at PV buses because reactive power is an output of the PV-bus solution.



The slack bus is excluded from scheduled active- and reactive-power residual checks because its power injection is determined by the network solution.



The current residual acceptance tolerance is:



\\\[

|\\Delta P| < 10^{-8}\\ pu

\\]



for applicable non-slack buses, and:



\\\[

|\\Delta Q| < 10^{-8}\\ pu

\\]



for PQ buses.



Current implementation:



`verify-residuals.js`



\### Current validation gap



The present `verify-residuals.js` execution path performs the automated residual check on the `4bus` system only.



Before the project claims automated residual validation across all built-in systems, this test must be extended to include at least:



\- `4bus`

\- `5bus`

\- `9bus`



\---



\# 4. Independent Solver Cross-Validation



The project contains two numerically different AC power-flow solution methods:



\- Newton-Raphson,

\- Gauss-Seidel.



Newton-Raphson uses a Jacobian-based correction procedure.



Gauss-Seidel uses sequential complex-voltage iteration.



Because the algorithms are different, close agreement between their converged solutions provides useful independent cross-validation.



The current comparison test is:



`test-gs-vs-nr.js`



The current comparison tolerances are:



\\\[

|\\Delta V| < 10^{-8}\\ pu

\\]



and:



\\\[

|\\Delta \\delta| < 10^{-6}\\ degrees

\\]



The test currently compares:



\- `4bus`

\- `5bus`

\- `9bus`



A comparison passes only when both solvers converge and the maximum voltage-magnitude and voltage-angle differences remain below the defined tolerances.



Independent-solver agreement is strong evidence of numerical consistency.



However, two solvers can still agree on an incorrectly modeled system.



Therefore, independent-solver agreement must be supplemented by network-model and benchmark validation.



\---



\# 5. Published Benchmark Validation



\## Objective



Where trustworthy published data are available, calculated results should be compared against an independently published benchmark solution.



A benchmark is acceptable only when the following are sufficiently clear:



\- bus data,

\- branch data,

\- per-unit base,

\- transformer assumptions,

\- shunt assumptions,

\- bus classifications,

\- generator setpoints,

\- load values,

\- reference solution.



A published result must not be used as an authoritative validation target when the accompanying network data are incomplete, inconsistent, or ambiguous.



\---



\## 5.1 Benchmark Comparison Quantities



Where available, comparison should include:



\- bus voltage magnitude,

\- bus voltage angle,

\- active-power generation,

\- reactive-power generation,

\- branch active-power flow,

\- branch reactive-power flow,

\- active-power loss,

\- reactive-power balance where meaningful.



The benchmark comparison should report both:



\\\[

Error\_{absolute}

=

|x\_{calc}-x\_{ref}|

\\]



and, where appropriate:



\\\[

Error\_{relative}

=

\\frac{|x\_{calc}-x\_{ref}|}{|x\_{ref}|}

\\]



Relative error should not be used when the reference quantity is zero or sufficiently close to zero.



\---



\## 5.2 Benchmark Provenance



Every benchmark used for validation should record:



\- source title,

\- author or organization,

\- publication year,

\- edition where applicable,

\- example or test-system identifier,

\- relevant page or table where available,

\- exact network data used,

\- any conversion or interpretation required.



Benchmark provenance should be recorded in:



`REFERENCES.md`



and verified numerical comparison results should be recorded in:



`REFERENCE.md`



\---



\# 6. Current Benchmark Status



\## 6.1 Four-Bus System



The four-bus system currently has:



\- Newton-Raphson solution,

\- Gauss-Seidel solution,

\- solver cross-comparison,

\- residual verification,

\- Y-bus checks.



A trustworthy external benchmark with fully matched system data should remain part of the formal validation target.



Status:



`PARTIALLY VALIDATED`



\---



\## 6.2 Five-Bus System



The five-bus system currently has:



\- Newton-Raphson solution,

\- Gauss-Seidel solution,

\- solver cross-comparison.



A previously considered published source contained incomplete or inconsistent network information and therefore is not treated as authoritative validation evidence.



A new trustworthy benchmark source with matching network data is required.



Status:



`INTERNAL CROSS-VALIDATION ONLY`



\---



\## 6.3 Nine-Bus System



The nine-bus system currently has:



\- Newton-Raphson solution,

\- Gauss-Seidel solution,

\- solver cross-comparison,

\- Y-bus comparison tests.



The exact provenance and version of the implemented nine-bus dataset must be verified before published reference results are used as authoritative comparison values.



The project should avoid describing the dataset as an IEEE-issued standard unless that description is supported by the verified source.



Status:



`INTERNAL CROSS-VALIDATION; EXTERNAL PROVENANCE VERIFICATION REQUIRED`



\---



\# 7. Y-Bus Validation



Y-bus validation should verify:



1\. branch series admittance,

2\. line-charging contribution,

3\. diagonal elements,

4\. off-diagonal elements,

5\. symmetry where applicable to the modeled passive network,

6\. matrix dimensions,

7\. bus-index mapping.



Relevant tests:



\- `test-ybus-v2.js`

\- `test-ybus-comparison.js`



Required validation evidence should include at least one manually or independently calculated Y-bus case.



Status:



`IMPLEMENTED; EXTERNAL REFERENCE TRACEABILITY TO BE STRENGTHENED`



\---



\# 8. Newton-Raphson Validation



Newton-Raphson validation should include:



\- convergence on supported systems,

\- correct Slack/PV/PQ treatment,

\- mismatch reduction,

\- Jacobian consistency,

\- residual satisfaction,

\- comparison with Gauss-Seidel,

\- comparison with published benchmark values.



Relevant tests:



\- `test-newton-v2.js`

\- `test-solver.js`

\- `verify-residuals.js`

\- `test-gs-vs-nr.js`



Required improvement:



Extend residual validation to all built-in benchmark systems.



Status:



`STRONG INTERNAL VALIDATION; EXTERNAL BENCHMARK VALIDATION INCOMPLETE`



\---



\# 9. Gauss-Seidel Validation



Gauss-Seidel validation should include:



\- convergence on supported systems,

\- Slack-bus treatment,

\- PV-bus voltage-magnitude enforcement,

\- PQ-bus voltage updating,

\- convergence-criterion behavior,

\- comparison with Newton-Raphson.



Relevant tests:



\- `test-gaussseidel-v2.js`

\- `test-gs-vs-nr.js`



Because Gauss-Seidel and Newton-Raphson use different numerical algorithms, agreement between their final solutions is an important independent verification mechanism.



Status:



`STRONG INTERNAL CROSS-VALIDATION`



\---



\# 10. Line-Flow and Loss Validation



Transmission-line flow validation should verify:



\- sending-end current,

\- receiving-end current,

\- sending-end complex power,

\- receiving-end complex power,

\- active-power loss,

\- reactive-power balance,

\- MVA magnitude,

\- engineering-unit conversion.



Relevant tests:



\- `test-line-flow.js`

\- `test-units.js`



Additional validation should confirm network-wide active-power balance:



\\\[

P\_{generation}

\-

P\_{load}

\-

P\_{loss}

\\approx 0

\\]



within an appropriate numerical tolerance.



Status:



`IMPLEMENTED; SYSTEM-WIDE POWER-BALANCE REGRESSION SHOULD BE FORMALIZED`



\---



\# 11. Thermal Loading Validation



Thermal-loading validation should verify:



\\\[

Loading(\\%)

=

\\frac{S\_{actual}}{S\_{rated}}

\\times100

\\]



Relevant tests:



\- `test-line-rating.js`

\- `test-contingency.js`



Validation must distinguish between:



\- correctness of the loading calculation,

\- correctness of the supplied branch rating.



A mathematically correct loading percentage does not prove that the rating itself is authoritative.



Demo or assumed thermal ratings must remain clearly identified.



Status:



`CALCULATION LOGIC VALIDATED; RATING PROVENANCE INCOMPLETE`



\---



\# 12. Voltage-Profile Validation



Voltage-profile validation should verify:



\- minimum voltage,

\- maximum voltage,

\- average voltage,

\- nominal voltage deviation,

\- LOW/NORMAL/HIGH classification,

\- configurable limits.



Relevant test:



\- `test-voltage-analysis.js`



The current default limits of:



\\\[

0.95\\ pu

\\]



and:



\\\[

1.05\\ pu

\\]



are application defaults.



Validation of the software logic must remain separate from engineering justification of those limits for a specific network.



Status:



`CALCULATION LOGIC TESTED; APPLICATION-SPECIFIC LIMIT JUSTIFICATION REQUIRED`



\---



\# 13. Contingency Analysis Validation



N-1 contingency validation should cover:



\- branch removal,

\- preservation of base-case data,

\- post-contingency network construction,

\- post-contingency power-flow solution,

\- voltage impact,

\- loss impact,

\- thermal impact,

\- islanding detection,

\- convergence failure handling,

\- ranking order,

\- reporting.



Relevant tests:



\- `test-contingency.js`

\- `test-contingency-ranking.js`

\- `test-contingency-ranking-report.js`



\---



\## 13.1 Islanding Validation



A dedicated automated regression test should verify known islanding and non-islanding outages.



The test should confirm:



\- islanded flag,

\- number of connected components,

\- bus membership of each island,

\- status reported as `ISLANDED`.



Current status:



`FUNCTION IMPLEMENTED; DEDICATED REGRESSION TEST REQUIRED`



\---



\## 13.2 Contingency Severity Metric



The current numerical contingency score and severity categories are project heuristics.



Validation can prove that the software calculates the heuristic as designed.



Validation cannot establish the heuristic as an industry-standard security index without separate engineering evidence.



Therefore two different questions must remain separate:



1\. Does the software calculate the project metric correctly?

2\. Is the metric appropriate for a particular planning or operating application?



The first can be software-tested.



The second requires external engineering justification.



\---



\# 14. Z-Bus Validation



The current Z-bus implementation calculates:



\\\[

Z\_{bus}=Y\_{bus}^{-1}

\\]



The numerical inversion test verifies:



\\\[

Y\_{bus}Z\_{bus}\\approx I

\\]



Relevant test:



\- `test-zbus.js`



The current automated test requires the maximum difference from the identity matrix to remain below:



\\\[

10^{-10}

\\]



for the tested systems.



This verifies matrix inversion.



It does not prove that the load-flow Y-bus is the correct short-circuit network model.



Status:



`NUMERICAL MATRIX VALIDATION STRONG; SHORT-CIRCUIT MODEL VALIDATION INCOMPLETE`



\---



\# 15. Fault-Analysis Validation



Relevant tests:



\- `test-fault-analysis.js`

\- `test-fault-study.js`

\- `test-fault-location-study.js`

\- `test-zbus.js`



The existing fault tests currently demonstrate:



\- successful calculation execution,

\- Z-bus usage,

\- fault-bus handling,

\- prefault-voltage use,

\- fault-impedance variation,

\- fault-location variation,

\- output generation.



These tests are primarily software-path and internal-consistency tests.



They are not yet sufficient external engineering validation of the calculated fault current.



\---



\## 15.1 Required Fault Benchmark



Before the fault module is considered formally validated, at least one trusted short-circuit benchmark should be implemented with independently known:



\- source impedances,

\- transformer impedances,

\- generator reactances where applicable,

\- prefault voltage,

\- fault type,

\- fault impedance,

\- expected fault current.



Calculated results should then be compared against the published or independently derived result.



Status:



`EXTERNAL BENCHMARK REQUIRED`



\---



\# 16. Engineering Unit Validation



Unit conversions should be validated independently of the main network solver.



Relevant test:



\- `test-units.js`



Required checks include:



\\\[

P\_{MW}=P\_{pu}S\_{base}

\\]



\\\[

Q\_{MVAr}=Q\_{pu}S\_{base}

\\]



\\\[

S\_{MVA}=S\_{pu}S\_{base}

\\]



and:



\\\[

I\_{kA}

=

\\frac{S\_{MVA}}

{\\sqrt{3}V\_{kV}}

\\]



Validation must use known hand-calculated examples.



Particular attention is required when multiple voltage bases are present.



Status:



`BASIC UNIT TESTING IMPLEMENTED; MULTI-VOLTAGE MODEL SUPPORT REQUIRES REVIEW`



\---



\# 17. Regression Testing



Every correction to an engineering algorithm should include or update an automated regression test.



A regression test should:



1\. define the input explicitly,

2\. define the expected result or invariant,

3\. define the tolerance,

4\. fail automatically when the condition is violated,

5\. return a non-zero process exit code on failure where practical.



Console output containing the word `PASS` is useful for humans but should not be the only mechanism determining automated test success.



\---



\# 18. Numerical Tolerance Policy



Numerical tolerances must be associated with the quantity being tested.



A single tolerance should not automatically be applied to every type of engineering result.



Current established project tolerances include:



\### Power-flow residual



\\\[

10^{-8}\\ pu

\\]



\### Newton-Raphson vs Gauss-Seidel voltage magnitude



\\\[

10^{-8}\\ pu

\\]



\### Newton-Raphson vs Gauss-Seidel voltage angle



\\\[

10^{-6}\\ degrees

\\]



\### Z-bus inversion identity check



\\\[

10^{-10}

\\]



These tolerances describe current software validation criteria.



They are not physical power-system operating limits.



Any future tolerance must document:



\- quantity,

\- units,

\- purpose,

\- justification.



\---



\# 19. Physical Sanity Checks



Physical sanity checks may be useful as secondary diagnostics but must not replace equation-based validation.



Acceptable examples include:



\- finite voltage magnitudes,

\- finite voltage angles,

\- finite line flows,

\- non-negative resistive active-power loss within numerical tolerance,

\- expected response to deliberately increased load,

\- expected reduction in fault current when positive fault resistance is increased.



Physical sanity rules must not be stated as universal laws unless they are mathematically or physically justified.



For example, the project should not assume universally that:



\- every PQ voltage must be below every generator voltage,

\- voltage angles must always decrease monotonically through an arbitrary meshed network,

\- reactive branch power absorption must always be positive.



Such assumptions depend on system conditions and network modeling.



\---



\# 20. Test Reproducibility



Every formal validation result should be reproducible from repository contents.



A validation record should identify:



\- Git commit,

\- system dataset,

\- solver,

\- solver tolerance,

\- maximum iterations,

\- reference source where applicable,

\- validation script,

\- numerical result,

\- pass/fail criterion.



Reference values should not be manually copied into documentation without preserving their source and modeling assumptions.



\---



\# 21. Validation Evidence Categories



Engineering claims should use the following evidence categories.



\## INTERNALLY VERIFIED



The calculation satisfies mathematical invariants, residual tests, or independent implementation comparisons inside this repository.



\## EXTERNALLY BENCHMARKED



The result has been compared with a trustworthy external source using matching system data and assumptions.



\## ASSUMPTION-DEPENDENT



The calculation is mathematically valid, but the result depends on an assumed parameter such as a demo thermal rating or analysis threshold.



\## HEURISTIC



The quantity is a project-designed scoring or classification rule without an authoritative external standard currently supporting it.



\## NOT YET VALIDATED



The feature exists but lacks sufficient numerical, benchmark, or physical-model validation.



These categories should be used to prevent internal software testing from being confused with external engineering validation.



\---



\# 22. Current High-Priority Validation Gaps



The highest-priority validation tasks are:



1\. extend `verify-residuals.js` to the 5-bus and 9-bus systems,

2\. verify the exact external provenance of each built-in benchmark dataset,

3\. establish at least one complete published AC power-flow benchmark,

4\. formalize system-wide active-power balance tests,

5\. add a dedicated islanding regression test,

6\. reconcile contingency overload boundary handling,

7\. verify branch-rating provenance or retain explicit demo labels,

8\. validate fault analysis against a proper short-circuit benchmark,

9\. review the use of the load-flow Y-bus for fault calculations,

10\. verify voltage-base propagation through browser input and engineering-unit conversion,

11\. verify multi-voltage and transformer modeling limitations,

12\. consolidate automated tests into a repeatable test runner.



\---



\# 23. Validation Exit Criteria



A calculation module should not be described as fully validated until:



1\. its mathematical formulation is documented,

2\. its implementation is traceable to source code,

3\. automated tests exist,

4\. numerical tolerances are defined,

5\. applicable mathematical invariants pass,

6\. independent cross-validation exists where feasible,

7\. at least one trustworthy external benchmark is passed where such a benchmark is required,

8\. assumptions are documented,

9\. limitations are documented,

10\. regression tests protect verified behavior.



For advanced engineering use, external benchmark validation is especially important.



Internal agreement between algorithms is necessary evidence, but it is not by itself sufficient proof that the physical system model is correct.



\---



\# 24. Validation Workflow for Future Changes



Every future engineering feature should follow this sequence:



\\\[

Theory

\\rightarrow

Implementation

\\rightarrow

Unit\\ Test

\\rightarrow

Invariant/Residual\\ Test

\\rightarrow

Independent\\ Check

\\rightarrow

Published\\ Benchmark

\\rightarrow

Regression\\ Test

\\rightarrow

Documentation

\\]



If a published benchmark is unavailable, that limitation must be recorded rather than replaced with an unsupported claim of validation.



\---



\# 25. Related Documentation



Engineering equations and implementation methods:



`ENGINEERING\_METHODS.md`



Current calculated reference values and verification notes:



`REFERENCE.md`



Bibliographic and source registry:



`REFERENCES.md`



Notation, sign conventions, and unit conventions:



`NOTATION.md`



This validation plan should be updated whenever:



\- a new engineering module is introduced,

\- a new benchmark is added,

\- a validation tolerance changes,

\- a previously assumed quantity becomes externally verified,

\- a known validation gap is resolved.

