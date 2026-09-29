# References

Every default system and every verification claim in this project must
trace to a citable source. This file lists them.

## Textbooks

1. **Grainger, J. J., & Stevenson, W. D.** *Power System Analysis*.
   McGraw-Hill.
   - Chapter 9, power-flow example: source of the 4-bus line data
     (R, X, B) and the reference Newton-Raphson solution.

2. **Stevenson, W. D.** *Elements of Power System Analysis*. McGraw-Hill.
   - Example 7.1: source of the reactance-only 4-bus Y-bus used
     for off-diagonal verification.

3. **Saadat, H.** *Power System Analysis*. McGraw-Hill.
   - Chapter 6: source of per-unit conversion methodology and the
     Newton-Raphson formulation.

## Standards

4. **IEEE 9-bus test system.** Original data published in:
   - Anderson, P. M., & Fouad, A. A. *Power System Control and
     Stability*. Iowa State University Press.
   - Also reproduced in many course notes; we use the version with
     line data as given in the standard.

## Verification anchors

| Verification                   | Source                     | Value         |
|--------------------------------|----------------------------|---------------|
| 4-bus Y-bus off-diagonal imag  | Stevenson Ex. 7.1          | +j19.0786     |
| 4-bus power-flow solution      | Grainger & Stevenson Ch. 9 | (to be pasted)|
| 9-bus power-flow solution      | NR / GS cross-check        | agreement to 9.9e-11 |
