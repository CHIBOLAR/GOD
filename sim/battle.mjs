// DECCAN II — the resolver. PURE: no I/O, no randomness, no global state.
//
// This is the ONLY implementation of the battle rules. sim/rr.mjs, sim/factions.mjs and
// sim/seats.mjs all call it, so they cannot drift apart — the failure that put the old
// project's engine two full versions behind its own rulebook.
//
// An ARMY is exactly three slots: [Van, Centre, Rear]. A slot holds a unit or null.
// A unit is { t, s, owner? } — type, printed strength, and optionally who committed it.

import { BEATS } from "./cards.mjs";

export const VAN = 0, CENTRE = 1, REAR = 2;
export const FRONT_NAMES = ["Van", "Centre", "Rear"];

// Decide one front. Returns 1 (a wins), -1 (b wins) or 0 (nobody).
//
//   * an empty slot has strength 0 and loses to any unit
//   * a countered unit loses whatever its strength      <- the counter cycle
//   * otherwise the higher strength wins
//   * equal strength, neither countering: nobody wins the front
export function resolveFront(a, b) {
  if (!a && !b) return 0;
  if (!b) return 1;
  if (!a) return -1;
  if (BEATS[a.t] === b.t) return 1;
  if (BEATS[b.t] === a.t) return -1;
  if (a.s > b.s) return 1;
  if (b.s > a.s) return -1;
  return 0;
}

// Resolve a whole battle.
// Returns { fronts, wonA, wonB, winner } where winner is "A", "B" or null.
export function resolveBattle(armyA, armyB) {
  const fronts = [0, 1, 2].map((f) => resolveFront(armyA[f] || null, armyB[f] || null));
  const wonA = fronts.filter((r) => r === 1).length;
  const wonB = fronts.filter((r) => r === -1).length;

  let winner = null;
  if (wonA > wonB) winner = "A";
  else if (wonB > wonA) winner = "B";
  // level on fronts: the Centre is the decisive ground (DECISIONS.md D012)
  else if (fronts[CENTRE] === 1) winner = "A";
  else if (fronts[CENTRE] === -1) winner = "B";

  return { fronts, wonA, wonB, winner };
}

// An uncontested army takes the ground, winning every front it filled (CHASSIS.md §4.1).
export function resolveUncontested(army) {
  const fronts = [0, 1, 2].map((f) => (army[f] ? 1 : 0));
  return { fronts, wonA: fronts.filter((r) => r === 1).length, wonB: 0, winner: "A" };
}

// Victory points, per player, for one resolved battle.
// "Each player in the army that took the ground scores 1 point for every front they
// personally won." Losing armies score nothing.
export function spoils(result, armyA, armyB) {
  const vp = new Map();
  const award = (army, side) => {
    for (let f = 0; f < 3; f++) {
      const u = army[f];
      if (!u || u.owner === undefined) continue;
      if (result.fronts[f] !== side) continue;
      vp.set(u.owner, (vp.get(u.owner) || 0) + 1);
    }
  };
  if (result.winner === "A") award(armyA, 1);
  if (result.winner === "B") award(armyB, -1);
  return vp;
}
