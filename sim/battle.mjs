// DECCAN II — the resolver. PURE: no I/O, no randomness, no global state.
//
// An ARMY is up to three units, in no order. A unit is { t, s, owner, broker? }.
// A Power Broker has t === null: it sits outside the counter ring, so it cancels nothing and
// nothing cancels it.
//
// Order of business, all read off the REVEALED armies so nothing depends on who acted first:
//   1. Power Broker abilities choose their targets, then all resolve together.
//   2. Arms cancel: each unit cancels ONE enemy unit of an arm it beats, strongest first.
//   3. Totals. Higher wins; level totals mean BOTH armies win.

import { beats } from "./cards.mjs";

const weakest = (army) => army.reduce((b, u) => (!b || u.s < b.s ? u : b), null);

// ---- 1. Power Broker abilities ----------------------------------------------
// Targets are chosen from the armies as revealed, then applied together, so two brokers
// aiming at the same unit do not depend on an ordering rule.
export function resolveAbilities(A, B) {
  const plan = [];
  const scan = (mine, foe) => {
    for (const u of mine) {
      if (u.broker === "archerbroker") { const t = weakest(foe); if (t) plan.push({ kind: "kill", t }); }
      if (u.broker === "spy") { const t = weakest(foe); if (t) plan.push({ kind: "swap", u, t }); }
      if (u.broker === "senapati") {
        const others = mine.filter((x) => x !== u);
        const t = weakest(others);
        if (t) plan.push({ kind: "copy", u, value: t.s });
      }
      // scout is information only: no battle effect
    }
  };
  scan(A, B); scan(B, A);

  for (const p of plan) if (p.kind === "copy") p.u.s = p.value;
  for (const p of plan) if (p.kind === "kill") p.t.dead = true;
  for (const p of plan) if (p.kind === "swap" && !p.u.dead && !p.t.dead) {
    const ai = A.indexOf(p.u), bi = B.indexOf(p.t);
    if (ai >= 0 && bi >= 0) { A[ai] = p.t; B[bi] = p.u; }
    else { const a2 = B.indexOf(p.u), b2 = A.indexOf(p.t); if (a2 >= 0 && b2 >= 0) { B[a2] = p.t; A[b2] = p.u; } }
  }
  return { A: A.filter((u) => !u.dead), B: B.filter((u) => !u.dead) };
}

// ---- 2. arms cancel ---------------------------------------------------------
export function cancelledFlags(army, foe) {
  const dead = new Array(army.length).fill(false);
  const order = foe.slice().sort((a, b) => b.s - a.s);
  for (const v of order) {
    if (!v.t) continue;                       // a broker has no arm and cancels nothing
    let best = -1;
    for (let i = 0; i < army.length; i++) {
      if (dead[i] || !army[i].t || !beats(v.t, army[i].t)) continue;
      if (best === -1 || army[i].s > army[best].s) best = i;
    }
    if (best !== -1) dead[best] = true;
  }
  return dead.map((d) => !d);
}

// ---- 3. the battle ----------------------------------------------------------
export function resolveBattle(rawA, rawB) {
  const A = rawA.map((u) => ({ ...u })), B = rawB.map((u) => ({ ...u }));
  const { A: a, B: b } = resolveAbilities(A, B);
  const fa = cancelledFlags(a, b), fb = cancelledFlags(b, a);
  const totalA = a.reduce((s, u, i) => s + (fa[i] ? u.s : 0), 0);
  const totalB = b.reduce((s, u, i) => s + (fb[i] ? u.s : 0), 0);
  return {
    armyA: a, armyB: b, totalA, totalB, countedA: fa, countedB: fb,
    winner: totalA > totalB ? "A" : totalB > totalA ? "B" : "both",
  };
}

export function resolveUncontested(army) {
  const a = army.map((u) => ({ ...u }));
  return { armyA: a, armyB: [], totalA: a.reduce((s, u) => s + u.s, 0), totalB: 0,
    countedA: a.map(() => true), countedB: [], winner: "A" };
}

// Each player in a winning army scores 1 point for every unit of theirs that counted.
export function spoils(result) {
  const vp = new Map();
  const award = (army, flags) => army.forEach((u, i) => {
    if (!flags[i] || u.owner === undefined) return;
    vp.set(u.owner, (vp.get(u.owner) || 0) + 1);
  });
  if (result.winner === "A" || result.winner === "both") award(result.armyA, result.countedA);
  if (result.winner === "B" || result.winner === "both") award(result.armyB, result.countedB);
  return vp;
}
