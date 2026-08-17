// DECCAN II — zero-sum matrix-game solver for a single faction matchup.
//
// Both players commit hidden, so a matchup is a matrix game, not an average over armies.
// Averaging every army against every army answers "how good is the average plan", which
// nobody plays. This solves for the EQUILIBRIUM VALUE: what the matchup is worth to the row
// faction when both sides play well.
//
// Payoff to the row player, per battle:
//     (my victory points) - (their victory points) - CARD_COST * (my units - their units)
//
// The card term is what stops the solver committing three units every time: units are a
// finite life supply, so a point bought with three cards is worth less than one bought with
// two. Victory points are per unit that COUNTED, and level totals mean both armies score.

import { ARMS, beatsIdx } from "./cards.mjs";

// A card is worth roughly (victory target / units per faction) victory points: ~6 over 12.
export const CARD_COST = 0.5;

// ---- compact encoding -------------------------------------------------------
// A unit is one integer: (typeIndex)*16 + strength. An army is a sorted array of 1-3 of them.
export const enc = (t, s) => ARMS.indexOf(t) * 16 + s;
const typeOf = (u) => u >> 4;
const strOf = (u) => u & 15;
// Each unit cancels ONE enemy unit of an arm it beats — the strongest still standing.
// Armies are at most three units, so this is done directly rather than with counts.
function score(army, foe) {
  const s = army.map(strOf), t = army.map(typeOf);
  const dead = new Array(army.length).fill(false);
  const order = foe.slice().sort((a, b) => strOf(b) - strOf(a));
  for (const v of order) {
    const vt = typeOf(v);
    let best = -1;
    for (let i = 0; i < army.length; i++) {
      if (dead[i] || !beatsIdx(vt, t[i])) continue;
      if (best === -1 || s[i] > s[best]) best = i;
    }
    if (best !== -1) dead[best] = true;
  }
  let total = 0, live = 0;
  for (let i = 0; i < army.length; i++) if (!dead[i]) { total += s[i]; live++; }
  return [total, live];
}

// ---- strategies -------------------------------------------------------------
// Every legal army of 1-3 units, deduplicated: two units of the same type and strength are
// the same card as far as the battle is concerned. No ordering — there are no positions.
export function strategies(units) {
  const have = new Map();
  for (const u of units) {
    const c = enc(u.t, u.s);
    have.set(c, (have.get(c) || 0) + 1);
  }
  const codes = [...have.keys()].sort((a, b) => a - b);
  const out = [];
  const cur = [];
  const walk = (i) => {
    if (cur.length) out.push([...cur]);
    if (cur.length === 3 || i === codes.length) return;
    for (let j = i; j < codes.length; j++) {
      const c = codes[j];
      const used = cur.filter((x) => x === c).length;
      if (used >= have.get(c)) continue;
      cur.push(c); walk(j); cur.pop();
    }
  };
  walk(0);
  return out;
}

// ---- payoff matrix ----------------------------------------------------------
export function payoffMatrix(SA, SB) {
  const n = SA.length, m = SB.length;
  const M = new Float32Array(n * m);
  for (let i = 0; i < n; i++) {
    const a = SA[i], na = a.length;
    for (let j = 0; j < m; j++) {
      const b = SB[j];
      const [ta, la] = score(a, b);
      const [tb, lb] = score(b, a);
      // level totals: BOTH armies win, so both score their counted units
      const vpA = ta >= tb ? la : 0;
      const vpB = tb >= ta ? lb : 0;
      M[i * m + j] = vpA - vpB - CARD_COST * (na - b.length);
    }
  }
  return M;
}

// ---- fictitious play --------------------------------------------------------
// Both players repeatedly best-respond to the opponent's empirical history. Converges to the
// value of a zero-sum game, and brackets it between a lower and an upper bound.
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

export function matchup(unitsA, unitsB, iterations) {
  const SA = strategies(unitsA), SB = strategies(unitsB);
  return solve(payoffMatrix(SA, SB), SA.length, SB.length, iterations);
}
