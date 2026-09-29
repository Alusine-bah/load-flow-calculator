# Notation and Conventions

This document defines every sign, symbol, and base used in the
calculator. A student reading the code or the UI should never have to
guess what a quantity means.

## Power system sign convention

- **Generation is positive.** `Pgen > 0` means the bus injects real
  power into the network.
- **Load is positive.** `Pload > 0` means the bus draws real power from
  the network.
- **Net injection** at bus i is `P_inj[i] = Pgen[i] - Pload[i]`.
- Same convention for reactive power Q.

## Per-unit system

- System-wide base: `S_base` in MVA (same for the entire network).
- Base voltage `V_base` is defined per voltage level. For the examples
  here, all buses are at the same nominal kV, so a single `V_base` is
  used.
- Base impedance: `Z_base = V_base^2 / S_base` (with V in kV and S in
  MVA, Z is in ohms).
- All R, X, B, P, Q, V magnitudes in this tool are **per-unit** unless
  a label says otherwise.

## Bus types

- **Slack (reference) bus:** V magnitude and angle are both specified.
  P and Q are computed. Exactly one per system.
- **PV (generator) bus:** V magnitude and P injection are specified.
  Q injection and angle are computed.
- **PQ (load) bus:** P and Q injections are specified. V magnitude and
  angle are computed.

## Angles

- Angle reference is the slack bus. `delta_slack = 0` by definition.
- Internal computation is in radians. The UI displays degrees.
- Positive angle means the bus voltage leads the slack bus.

## Y-bus sign convention

- Series admittance of a line: `y_ij = 1 / (R + jX)`. For an inductive
  line, Im(y_ij) < 0.
- Shunt admittance from charging: `y_sh = j * B / 2` at each end of
  the line.
- Diagonal: `Y[i][i] = sum over lines of (y_ij + y_sh)`.
- Off-diagonal: `Y[i][j] = -y_ij` if i and j are connected, else 0.
- With this convention, `sum_j Y[i][j] * V[j] = I[i]` (current injected
  into bus i).

## Solver parameters

- Convergence tolerance: `max|dP|, max|dQ| < tol` at all PQ and PV
  buses.
- Default tolerance: `1e-9 pu`.
- Default max iterations: 30.
- If the solver does not converge within max iterations, the result is
  **not** reported as a solution.

## Verification

This project distinguishes two levels of verification:

1. **Textbook-verified** -- the result matches a value published in a
   citable textbook to within 4 decimal places.

2. **Cross-checked** -- the result is verified by agreement between two
   independent methods (for example, Newton-Raphson vs Gauss-Seidel)
   to better than 1e-9 pu.

The 4-bus system is verified at both levels:

- Y-bus off-diagonal entries match Stevenson Example 7.1 to 4 decimal
  places.
- NR and GS solver outputs agree to better than 1e-9 pu on bus
  voltages, angles, and line flows.

The 9-bus system is verified only by cross-check (NR vs GS).

## References

See REFERENCES.md for the full list of sources.
