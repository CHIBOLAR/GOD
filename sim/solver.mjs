// DECCAN II — zero-sum matrix-game solver for a single faction matchup.
//
// Two players commit hidden, so a matchup is a matrix game, not an average over armies.
// Averaging every army against every army answers "how good is the average plan", which
// nobody plays. This solves for the EQUILIBRIUM VALUE: what the matchup is worth to the row
// faction when both sides play well.
//
// Payoff to the row player, per battle:
//     (my victory points) - (their victory points) - CARD_COST * (my units - their units)
//
// The card term is what stops the solver committing three units every time: units are a
// finite life supply (CHASSIS.md §5), so a point bought with three cards is worth less than
// the same point bought with two.

import { TYPES } from "./cards.mjs";

// A card is worth roughly (victory target / units per faction) victory points: ~7 over 12.
export const CARD_COST = 0.5;

// ---- compact encoding -------------------------------------------------------
// A unit is one integer: 0 = empty slot, otherwise (typeIndex+1)*16 + strength.
export const enc = (t, s) => (TYPES.indexOf(t) + 1) * 16 + s;
const typeOf = (u) => (u >> 4) - 1;
const strOf = (u) => u & 15;
// HORSE(0) beats GUNS(2) · GUNS(2) beats FOOT(1) · FOOT(1) beats HORSE(0)
const beats = (x, y) => (x + 2) % 3 === y;

function front(a, b) {
  if (a === 0 && b === 0) return 0;
  if (b === 0) return 1;
  if (a === 0) return -1;
  const ta = typeOf(a), tb = typeOf(b);
  if (beats(ta, tb)) return 1;
  if (beats(tb, ta)) return -1;
  const sa = strOf(a), sb = strOf(b);
  return sa > sb ? 1 : sb > sa ? -1 : 0;
}

// ---- strategies -------------------------------------------------------------
// Every legal placement of 1-3 units on Van/Centre/Rear, deduplicated: two units with the
// same type and strength are the same card as far as the battle is concerned.
export function strategies(units) {
  const have = new Map();
  for (const u of units) {
    const c = enc(u.t, u.s);
    have.set(c, (have.get(c) || 0) + 1);
  }
  const codes = [...have.keys()];
  const out = [];
  const slots = [0, 0, 0];
  const used = new Map();
  const walk = (i) => {
    if (i === 3) {
      if (slots.some((x) => x !== 0)) out.push([slots[0], slots[1], slots[2]]);
      return;
    }
    slots[i] = 0; walk(i + 1);
    for (const c of codes) {
      const n = used.get(c) || 0;
      if (n >= have.get(c)) continue;
      used.set(c, n + 1); slots[i] = c; walk(i + 1);
      used.set(c, n); slots[i] = 0;
    }
  };
  walk(0);
  return out;
}

// ---- payoff matrix ----------------------------------------------------------
export function payoffMatrix(SA, SB) {
  const n = SA.length, m = SB.length;
  const M = new Float32Array(n * m);
  const sizeA = SA.map((s) => s.filter((x) => x !== 0).length);
  const sizeB = SB.map((s) => s.filter((x) => x !== 0).length);
  for (let i = 0; i < n; i++) {
    const a = SA[i];
    for (let j = 0; j < m; j++) {
      const b = SB[j];
      const f0 = front(a[0], b[0]), f1 = front(a[1], b[1]), f2 = front(a[2], b[2]);
      let wa = 0, wb = 0;
      if (f0 === 1) wa++; else if (f0 === -1) wb++;
      if (f1 === 1) wa++; else if (f1 === -1) wb++;
      if (f2 === 1) wa++; else if (f2 === -1) wb++;
      let win = 0;                        // 1 = A takes the ground, -1 = B, 0 = nobody
      if (wa > wb) win = 1;
      else if (wb > wa) win = -1;
      else if (f1 === 1) win = 1;         // level: the Centre decides (D012)
      else if (f1 === -1) win = -1;
      M[i * m + j] = (win === 1 ? wa : 0) - (win === -1 ? wb : 0)
        - CARD_COST * (sizeA[i] - sizeB[j]);
    }
  }
  return M;
}

// ---- fictitious play --------------------------------------------------------
// Both players repeatedly best-respond to the opponent's empirical history. Converges to
// the value of a zero-sum game, and brackets it between a lower and an upper bound.
export function solve(M, n, m, iterations = 4000) {
  const rowPay = new Float64Array(n), colPay = new Float64Array(m);
  for (let k = 0; k < n; k++) rowPay[k] = M[k * m];
  for (let k = 0; k < m; k++) colPay[k] = M[k];

  let lower = -Infinity, upper = Infinity;
  for (let t = 1; t <= iterations; t++) {
    let bi = 0;
    for (let k = 1; k < n; k++) if (rowPay[k] > rowPay[bi]) bi = k;
    let bj = 0;
    for (let k = 1; k < m; k++) if (colPay[k] < colPay[bj]) bj = k;
    lower = Math.max(lower, colPay[bj] / t);
    upper = Math.min(upper, rowPay[bi] / t);
    for (let k = 0; k < n; k++) rowPay[k] += M[k * m + bj];
    for (let k = 0; k < m; k++) colPay[k] += M[bi * m + k];
  }
  return { value: (lower + upper) / 2, gap: upper - lower };
}

// Convenience: value of unitsA against unitsB.
export function matchup(unitsA, unitsB, iterations) {
  const SA = strategies(unitsA), SB = strategies(unitsB);
  return solve(payoffMatrix(SA, SB), SA.length, SB.length, iterations);
}
