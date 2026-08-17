// DECCAN II — the resolver. PURE: no I/O, no randomness, no global state.
//
// This is the ONLY implementation of the battle rules. Every other module calls it, so they
// cannot drift apart — the failure that put the old project's engine two full versions behind
// its own rulebook.
//
// An ARMY is up to three units, in no order. A unit is { t, s, owner? }.
//
// ⚠️ THERE ARE NO POSITIONS. An earlier draft split the ground into three fronts and compared
// them one at a time. Measured, that structure was carrying none of the balance — fronts alone
// moved the card-value spread 53.9 -> 46.0, while the counter cycle moved it 46.0 -> 11.0.
// See DECISIONS.md D022.

import { ARMS, beats } from "./cards.mjs";

// ---- cancellation -----------------------------------------------------------
// EACH of your units cancels ONE enemy unit of an arm it beats — always the strongest one
// still standing. Cancellation is simultaneous: both sides are read off the revealed armies,
// so a unit that is itself cancelled still cancels.
//
// ⚠️ THE ONE-FOR-ONE CAP IS LOAD-BEARING. An earlier draft let one card cancel EVERY enemy
// unit of its prey arm; with only three arms, one of each then cancelled the whole enemy army
// and the cheapest rainbow won 100% of the time. See DECISIONS.md D022 and D023.
export function cancelledFlags(army, foe) {
  const live = army.filter(Boolean);
  const dead = new Array(live.length).fill(false);
  // strongest cancellers resolve first only so the choice is deterministic; because every
  // canceller takes the strongest legal target, the outcome does not depend on this order.
  const order = foe.filter(Boolean).slice().sort((a, b) => b.s - a.s);
  for (const v of order) {
    let best = -1;
    for (let i = 0; i < live.length; i++) {
      if (dead[i] || !beats(v.t, live[i].t)) continue;
      if (best === -1 || live[i].s > live[best].s) best = i;
    }
    if (best !== -1) dead[best] = true;
  }
  return dead.map((d) => !d);      // true = this unit COUNTS
}

export const counted = (army, foe) => cancelledFlags(army, foe);

export function armyStrength(army, foe) {
  const live = army.filter(Boolean);
  const flags = cancelledFlags(live, foe);
  return live.reduce((s, u, i) => s + (flags[i] ? u.s : 0), 0);
}

// winner is "A", "B" or "both" — level totals mean BOTH armies win.
export function resolveBattle(armyA, armyB) {
  const a = armyA.filter(Boolean), b = armyB.filter(Boolean);
  const fa = cancelledFlags(a, b), fb = cancelledFlags(b, a);
  const totalA = a.reduce((s, u, i) => s + (fa[i] ? u.s : 0), 0);
  const totalB = b.reduce((s, u, i) => s + (fb[i] ? u.s : 0), 0);
  return {
    totalA, totalB, countedA: fa, countedB: fb,
    winner: totalA > totalB ? "A" : totalB > totalA ? "B" : "both",
  };
}

// An unopposed army wins, and nothing is there to cancel it.
export function resolveUncontested(army) {
  const a = army.filter(Boolean);
  return {
    totalA: a.reduce((s, u) => s + u.s, 0), totalB: 0,
    countedA: a.map(() => true), countedB: [], winner: "A",
  };
}

// "Each player in a winning army scores 1 point for every unit of theirs that counted."
// A cancelled unit fought for nothing and scores nothing.
export function spoils(result, armyA, armyB) {
  const vp = new Map();
  const award = (army, flags) => {
    army.filter(Boolean).forEach((u, i) => {
      if (!flags[i] || u.owner === undefined) return;
      vp.set(u.owner, (vp.get(u.owner) || 0) + 1);
    });
  };
  if (result.winner === "A" || result.winner === "both") award(armyA, result.countedA);
  if (result.winner === "B" || result.winner === "both") award(armyB, result.countedB);
  return vp;
}
