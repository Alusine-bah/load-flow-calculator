// complex.js — complex number arithmetic for power systems load flow
// Representation: { re: number, im: number }
// All angles in radians internally. Display converts to degrees.

const C = {
  // --- constructors ---
  make(re, im = 0) {
    return { re, im };
  },

  fromPolar(mag, angRad) {
    return { re: mag * Math.cos(angRad), im: mag * Math.sin(angRad) };
  },

  zero() {
    return { re: 0, im: 0 };
  },

  // --- basic arithmetic ---
  add(a, b) {
    return { re: a.re + b.re, im: a.im + b.im };
  },

  sub(a, b) {
    return { re: a.re - b.re, im: a.im - b.im };
  },

  mul(a, b) {
    return {
      re: a.re * b.re - a.im * b.im,
      im: a.re * b.im + a.im * b.re,
    };
  },

  div(a, b) {
    const denom = b.re * b.re + b.im * b.im;
    if (denom === 0) throw new Error("Complex division by zero");
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom,
    };
  },

  neg(a) {
    return { re: -a.re, im: -a.im };
  },

  conj(a) {
    return { re: a.re, im: -a.im };
  },

  // --- scalar ops ---
  scale(a, k) {
    return { re: a.re * k, im: a.im * k };
  },

  // --- magnitude and angle ---
  abs(a) {
    return Math.hypot(a.re, a.im);
  },

  angle(a) {
    return Math.atan2(a.im, a.re);
  },

  angleDeg(a) {
    return Math.atan2(a.im, a.re) * 180 / Math.PI;
  },

  // --- formatting helpers ---
  fmt(c, decimals = 4) {
    const re = c.re.toFixed(decimals);
    const im = c.im.toFixed(decimals);
    const sign = c.im >= 0 ? "+" : "-";
    return `${re} ${sign} j${Math.abs(c.im).toFixed(decimals)}`;
  },

  fmtPolar(c, decimals = 4) {
    const mag = Math.hypot(c.re, c.im).toFixed(decimals);
    const ang = (Math.atan2(c.im, c.re) * 180 / Math.PI).toFixed(decimals);
    return `${mag} ∠ ${ang}°`;
  },
};

// Attach to window so other scripts can use it
if (typeof window !== "undefined") {
  window.C = C;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { C };
}