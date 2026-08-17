// DECCAN II — the resolver. PURE: no I/O, no randomness, no global state.
//
//  1. Reveal. Cancellation is read off the REVEALED armies, simultaneously: each unit cancels
//     ONE enemy unit of an arm it beats, taking the strongest such. Nothing depends on order,
//     and a unit that is itself cancelled still cancels.
//  2. A CANCELLED UNIT DOES NOT ACT. It contributes no strength and its ability never fires.
//  3. Surviving abilities resolve together, targets read off what is left.
//  4. Total the survivors. Higher total wins; level totals mean BOTH armies win.

import { beats } from "./cards.mjs";

// Which of `army` are cancelled by `foe`. Each foe unit takes the strongest legal target, so
// the result does not depend on the order they are considered in.
export function cancelMask(army, foe) {
  const dead = new Array(army.length).fill(false);
  for (const v of [...foe].sort((a, b) => b.s - a.s)) {
    let best = -1;
    for (let i = 0; i < army.length; i++) {
      if (dead[i] || !beats(v.arm, army[i].arm)) continue;
      if (best === -1 || army[i].s > army[best].s) best = i;
    }
    if (best !== -1) dead[best] = true;
  }
  return dead;
}

const weakest = (a) => a.reduce((b, u) => (!b || u.s < b.s ? u : b), null);
const strongest = (a) => a.reduce((b, u) => (!b || u.s > b.s ? u : b), null);

// The Sepoy doubles while alone in its army.
const value = (u, army) => (u.broker === "sepoy" && army.length === 1 ? u.s * 2 : u.s);

export function resolveBattle(rawA, rawB) {
  let A = rawA.map((u) => ({ ...u }));
  let B = rawB.map((u) => ({ ...u }));

  // 1-2. simultaneous cancellation; a cancelled unit is out and never acts
  const da = cancelMask(A, B), db = cancelMask(B, A);
  A = A.filter((_, i) => !da[i]);
  B = B.filter((_, i) => !db[i]);

  // 3. surviving abilities, targets read off what is left, applied together
  const plan = [];
  const scan = (mine, foe) => {
    for (const u of mine) {
      if (u.broker === "slinger") { const t = weakest(foe); if (t) plan.push({ k: "kill", t }); }
      if (u.broker === "spy") { const t = strongest(foe); if (t) plan.push({ k: "swap", u, t }); }
    }
  };
  scan(A, B); scan(B, A);
  for (const p of plan) if (p.k === "kill") p.t.dead = true;
  for (const p of plan) {
    if (p.k !== "swap" || p.u.dead || p.t.dead) continue;
    const i = A.indexOf(p.u), j = B.indexOf(p.t);
    if (i >= 0 && j >= 0) { A[i] = p.t; B[j] = p.u; continue; }
    const i2 = B.indexOf(p.u), j2 = A.indexOf(p.t);
    if (i2 >= 0 && j2 >= 0) { B[i2] = p.t; A[j2] = p.u; }
  }
  A = A.filter((u) => !u.dead);
  B = B.filter((u) => !u.dead);

  // 4. totals
  const totalA = A.reduce((s, u) => s + value(u, A), 0);
  const totalB = B.reduce((s, u) => s + value(u, B), 0);
  return {
    armyA: A, armyB: B, totalA, totalB,
    winner: totalA > totalB ? "A" : totalB > totalA ? "B" : "both",
  };
}

export function resolveUncontested(army) {
  const a = army.map((u) => ({ ...u }));
  return { armyA: a, armyB: [], totalA: a.reduce((s, u) => s + value(u, a), 0), totalB: 0, winner: "A" };
}

// Each player in a winning army scores 1 point per surviving unit of theirs.
export function spoils(result) {
  const vp = new Map();
  const award = (army) => army.forEach((u) => {
    if (u.owner === undefined) return;
    vp.set(u.owner, (vp.get(u.owner) || 0) + 1);
  });
  if (result.winner === "A" || result.winner === "both") award(result.armyA);
  if (result.winner === "B" || result.winner === "both") award(result.armyB);
  return vp;
}
