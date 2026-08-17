// DECCAN II — the resolver. PURE: no I/O, no randomness, no global state.
//
// THREE ARMIES contest the ground, not two. Everything is n-way:
//
//  1. Reveal. Cancellation is read off the revealed armies, simultaneously: each unit cancels
//     ONE unit of an arm it beats, in ANY other army — the strongest such. A unit that is
//     itself cancelled still cancels, so nothing depends on order.
//  2. A CANCELLED UNIT DOES NOT ACT. No strength, and its ability never fires.
//  3. Surviving abilities resolve together, reading what is left.
//  4. Total the survivors. The highest total takes the ground; armies level at the top all win.

import { beats } from "./cards.mjs";

// Cancellation across every army at once. Returns a parallel array of boolean arrays,
// true meaning that unit was cancelled.
export function cancelMasks(armies) {
  const all = [];
  armies.forEach((a, ai) => a.forEach((u, ui) => all.push({ u, ai, ui })));
  const dead = armies.map((a) => new Array(a.length).fill(false));
  // strongest cancellers considered first, purely for determinism: because each one takes the
  // strongest legal target, the outcome does not depend on this order
  for (const { u, ai } of [...all].sort((x, y) => y.u.s - x.u.s)) {
    let best = null;
    for (const t of all) {
      if (t.ai === ai || dead[t.ai][t.ui] || !beats(u.arm, t.u.arm)) continue;
      if (!best || t.u.s > best.u.s) best = t;
    }
    if (best) dead[best.ai][best.ui] = true;
  }
  return dead;
}

const pickBy = (units, better) => units.reduce((b, u) => (!b || better(u, b) ? u : b), null);

// The Sepoy doubles while alone in its army.
const value = (u, army) => (u.broker === "sepoy" && army.length === 1 ? u.s * 2 : u.s);

export function resolveBattle(raw) {
  let armies = raw.map((a) => a.map((u) => ({ ...u })));
  const dead = cancelMasks(armies);
  armies = armies.map((a, i) => a.filter((_, j) => !dead[i][j]));

  // ---- surviving abilities, targets read off what is left, applied together
  const others = (i) => armies.flatMap((a, j) => (j === i ? [] : a));
  const plan = [];
  armies.forEach((army, i) => {
    for (const u of army) {
      if (u.broker === "subhedar") {
        const t = pickBy(others(i), (x, b) => x.s < b.s);
        if (t) plan.push({ k: "kill", t });
      }
      if (u.broker === "spy") {
        const t = pickBy(others(i), (x, b) => x.s > b.s);
        if (t) plan.push({ k: "swap", u, t, i });
      }
    }
  });
  const swaps = [];
  for (const p of plan) if (p.k === "kill") p.t.dead = true;
  for (const p of plan) {
    if (p.k !== "swap" || p.u.dead || p.t.dead) continue;
    const mine = armies[p.i];
    const tj = armies.findIndex((a) => a.includes(p.t));
    if (tj < 0) continue;
    const mi = mine.indexOf(p.u), ti = armies[tj].indexOf(p.t);
    if (mi < 0 || ti < 0) continue;
    mine[mi] = p.t; armies[tj][ti] = p.u;
    // record the exchange so the caller can make it permanent if the rules say so
    swaps.push({ spy: p.u, taken: p.t, thief: p.u.owner, victim: p.t.owner });
  }
  armies = armies.map((a) => a.filter((u) => !u.dead));

  // ---- totals; the highest takes the ground, and armies level at the top all win
  const totals = armies.map((a) => a.reduce((s, u) => s + value(u, a), 0));
  const fielded = raw.map((a, i) => (a.length ? i : -1)).filter((i) => i >= 0);
  if (!fielded.length) return { armies, totals, swaps, winners: new Set() };
  const top = Math.max(...fielded.map((i) => totals[i]));
  return { armies, totals, swaps, winners: new Set(fielded.filter((i) => totals[i] === top)) };
}

// Points: each player in a winning army scores 1 for every surviving unit of theirs.
export function spoils(result) {
  const vp = new Map();
  for (const i of result.winners)
    for (const u of result.armies[i]) {
      if (u.owner === undefined) continue;
      vp.set(u.owner, (vp.get(u.owner) || 0) + 1);
    }
  return vp;
}
