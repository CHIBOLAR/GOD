// DECCAN — THE CHARGE. A rebuild of the round, not a variant of it.
//
// The ground is no longer won. There is no higher total, no victor, no defeat. There is a front
// line, and there is killing, and you are paid for what you kill.
//
//   · Units commit FACE DOWN into one of two armies and stand there.
//   · A SENIOR PARTNER may CALL THE CHARGE. Everything reveals, the ring fires once, the
//     cancelled die, and every survivor stays on the ground FACE UP.
//   · You take ONE VICTORY POINT for every enemy unit your units cancelled.
//   · Lose units in a charge and you recruit a Power Broker — the compensation is for
//     CASUALTIES now, not for defeat, because there is no defeat left to have.
//
// Two properties fall out of this and both are the point:
//
//   EQUILIBRIUM. After a charge every survivor is, by definition, unable to cancel anything
//   opposite it — or it would have. So the board goes quiet and stays quiet until someone
//   commits a fresh unit. Every commitment is therefore a deliberate act of violence.
//
//   TIMING IS THE GAME. Charge now against two hidden units for a small harvest, or wait while
//   both sides thicken and the killing gets bigger — knowing the enemy is arming too, and that
//   whoever calls it chooses the moment for everyone. This is Ra's auction call, and here it is
//   the central decision rather than a flourish.
//
// The board is capped, so it also jams: once both armies are full nobody can commit, and the
// charge is the only thing that clears room. Calling it is how the game breathes.

import { FACTIONS, BROKERS, ARMS, PREY, beats } from "./cards.mjs";

export const NUM_ARMIES = 2;
export const ARMY_CAP = Number(process.env.CAP || 4);
export const MAX_PER_ARMY = ARMY_CAP;
export const TARGET = Number(process.env.TARGET || 8);

// ---- policy knobs ------------------------------------------------------------
const TEMPERATURE = 0.4;
const PASS_BASE = 1.0;
const KILL_WEIGHT = 1.3;      // a kill is a point; this is the objective
const RISK_WEIGHT = 0.9;      // being cancelled costs a card and arms an enemy
const CHARGE_BASE = 0.4;
const SURVIVE_BONUS = 0.25;

export function makeRng(seed) {
  let x = seed >>> 0;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---- the ring, with the pairing kept ------------------------------------------
// WHO killed WHAT is now a RULE, not a display detail — the kill is the point. Strongest
// canceller first, each taking the strongest legal target, so the result never depends on order.
export function resolveCharge(armies) {
  const all = [];
  armies.forEach((a, ai) => a.forEach((u, ui) => all.push({ u, ai, ui })));
  const dead = armies.map((a) => new Array(a.length).fill(false));
  const kills = [];
  for (const k of [...all].sort((x, y) => y.u.s - x.u.s || x.ai - y.ai || x.ui - y.ui)) {
    let best = null;
    for (const t of all) {
      if (t.ai === k.ai || dead[t.ai][t.ui] || !beats(k.u.arm, t.u.arm)) continue;
      if (!best || t.u.s > best.u.s) best = t;
    }
    if (best) { dead[best.ai][best.ui] = true; kills.push({ by: k, hit: best }); }
  }
  return { dead, kills };
}

// ---- creation -----------------------------------------------------------------
export function newGame(factionKeys, rnd) {
  const supply = [];
  for (const b of BROKERS) for (let i = 0; i < b.copies; i++) supply.push({ ...b, isBroker: true });
  for (let i = supply.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [supply[i], supply[j]] = [supply[j], supply[i]];
  }
  return {
    supply, charge: 0, turn: 0, start: 0,
    armies: Array.from({ length: NUM_ARMIES }, () => []),
    leader: new Array(NUM_ARMIES).fill(null),
    players: factionKeys.map((k, i) => {
      const f = FACTIONS.find((x) => x.key === k);
      return { seat: i, faction: f, vp: 0, hand: f.units.map((u) => ({ ...u, spent: false })) };
    }),
  };
}

const armyOf = (g, seat) => g.armies.findIndex((a) => a.some((c) => c.owner === seat));
const inHand = (p) => p.hand.filter((u) => !u.spent && !u.onBoard);

// ---- what a player may do ------------------------------------------------------
export function legalActions(g, seat) {
  const acts = [{ pass: true }];
  const p = g.players[seat];
  const units = inHand(p);
  const mine = armyOf(g, seat);
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (mine >= 0 && mine !== a) continue;                 // your units never split
    if (g.armies[a].length >= ARMY_CAP) continue;
    const members = new Set(g.armies[a].map((c) => c.owner));
    if (!members.has(seat) && members.size >= MAX_PER_ARMY) continue;
    for (const u of units) acts.push({ unit: u, army: a });
  }
  // ⚠️ WITHDRAW IS WHAT STOPS THE BOARD JAMMING, and it is not optional.
  // After a charge every survivor is by definition unable to cancel anything opposite it — that
  // is the equilibrium the design wants. But equilibrium on a FULL board is deadlock: no kills
  // are possible and no new units can enter. Measured without this, roughly half of all games
  // stalled at every victory target. Pulling a standing unit home is the only way to reopen a
  // jammed front, so it costs a turn and nothing else.
  if (mine >= 0) {
    for (const c of g.armies[mine]) if (c.owner === seat) acts.push({ withdraw: c, army: mine });
  }
  // only a senior partner may call it, and only with something to charge with
  if (mine >= 0 && g.leader[mine] === seat && g.armies[mine].length) acts.push({ charge: true });
  return acts;
}

export function commit(g, seat, unit, army) {
  unit.onBoard = true;
  const card = { owner: seat, arm: unit.arm, s: unit.s, ref: unit,
    broker: unit.isBroker ? unit.key : undefined, revealed: !!unit.faceUp };
  g.armies[army].push(card);
  if (g.leader[army] === null) g.leader[army] = seat;
  return card;
}

// ---- the charge -----------------------------------------------------------------
export function charge(g) {
  const { dead, kills } = resolveCharge(g.armies);

  // paid for what you killed
  const scored = new Map();
  for (const { by, hit } of kills) {
    g.players[by.u.owner].vp += 1;
    scored.set(by.u.owner, (scored.get(by.u.owner) || 0) + 1);
  }

  // the cancelled burn; everything else stands, now face up
  const lost = new Map();
  for (let a = 0; a < NUM_ARMIES; a++) {
    const keep = [];
    g.armies[a].forEach((c, i) => {
      if (dead[a][i]) {
        c.ref.spent = true; c.ref.onBoard = false;
        lost.set(c.owner, (lost.get(c.owner) || 0) + 1);
      } else { c.revealed = true; keep.push(c); }
    });
    g.armies[a] = keep;
    if (!keep.length) g.leader[a] = null;
    else if (!keep.some((c) => c.owner === g.leader[a])) {
      // seniority passes to the greatest surviving strength, as before
      const by = new Map();
      for (const c of keep) by.set(c.owner, (by.get(c.owner) || 0) + c.s);
      g.leader[a] = [...by.entries()].sort((x, y) => y[1] - x[1])[0][0];
    }
  }

  // BROKERS FOR CASUALTIES. Compensation is for losses now, not for defeat — one per player
  // per charge, so the player being killed most is armed fastest. Same rubber band, new hook.
  const recruited = new Map();
  for (const [seat] of lost) {
    const card = g.supply.pop();
    if (!card) continue;
    g.players[seat].hand.push({ ...card, spent: false });
    recruited.set(seat, 1);
  }

  g.charge++;
  return { kills, scored, lost, recruited };
}

// ---- the policy ------------------------------------------------------------------
// It must value the thing that scores: kills. Committing is worth what it is likely to kill,
// less what it is likely to lose to. Charging is worth the harvest already on the table.
function expectedKills(g, seat, arm, army) {
  const prey = PREY[arm];
  let n = 0;
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (a === army) continue;
    for (const c of g.armies[a]) {
      if (c.revealed ? prey.includes(c.arm) : prey.length / 5) n += c.revealed ? 1 : 0.4;
    }
  }
  return Math.min(1, n);                        // a unit cancels at most one thing
}
function expectedRisk(g, seat, arm, army) {
  const killers = ARMS.filter((t) => beats(t, arm));
  let n = 0;
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (a === army) continue;
    for (const c of g.armies[a]) n += c.revealed ? (killers.includes(c.arm) ? 1 : 0) : 0.4;
  }
  return Math.min(1, n);
}

export function score(g, seat, act) {
  if (act.pass) return PASS_BASE;
  if (act.charge) {
    // what the charge would actually harvest for me, right now
    const { kills } = resolveCharge(g.armies);
    let mine = 0, lose = 0;
    for (const { by, hit } of kills) {
      if (by.u.owner === seat) mine++;
      if (hit.u.owner === seat) lose++;
    }
    return CHARGE_BASE + KILL_WEIGHT * mine - RISK_WEIGHT * lose;
  }
  if (act.withdraw) {
    // worth it when the unit is doing nothing where it stands — it can kill nothing and nothing
    // is about to kill it — because then it is a card locked up for no return
    const k = expectedKills(g, seat, act.withdraw.arm, act.army);
    const r = expectedRisk(g, seat, act.withdraw.arm, act.army);
    const full = g.armies[act.army].length >= ARMY_CAP;
    return PASS_BASE - 0.2 + (full ? 0.6 : 0) + 0.5 * (1 - k) - 0.4 * (1 - r);
  }
  const k = expectedKills(g, seat, act.unit.arm, act.army);
  const r = expectedRisk(g, seat, act.unit.arm, act.army);
  return KILL_WEIGHT * k - RISK_WEIGHT * r + SURVIVE_BONUS * (1 - r) - 0.02 * act.unit.s;
}

function choose(acts, scores, rnd) {
  const max = Math.max(...scores);
  const w = scores.map((x) => Math.exp((x - max) / TEMPERATURE));
  const tot = w.reduce((a, b) => a + b, 0);
  let r = rnd() * tot;
  for (let i = 0; i < acts.length; i++) if ((r -= w[i]) <= 0) return acts[i];
  return acts[acts.length - 1];
}

// ---- a whole game -----------------------------------------------------------------
export function playGame(factionKeys, seed) {
  const rnd = makeRng(seed);
  const g = newGame(factionKeys, rnd);
  const n = g.players.length;
  let seat = 0, idle = 0, charges = 0, turns = 0;

  for (let guard = 0; guard < 4000; guard++) {
    const acts = legalActions(g, seat);
    const act = choose(acts, acts.map((a) => score(g, seat, a)), rnd);
    turns++;
    if (act.pass) idle++;
    else {
      idle = 0;
      if (act.charge) { charge(g); charges++; }
      else if (act.withdraw) {
        const a = g.armies[act.army];
        a.splice(a.indexOf(act.withdraw), 1);
        act.withdraw.ref.onBoard = false;
        if (!a.length) g.leader[act.army] = null;
      } else commit(g, seat, act.unit, act.army);
    }
    if (Math.max(...g.players.map((p) => p.vp)) >= TARGET) break;
    if (idle >= n * 2) break;                     // nobody can or will do anything
    seat = (seat + 1) % n;
  }
  const top = Math.max(...g.players.map((p) => p.vp));
  return {
    vp: g.players.map((p) => p.vp),
    winners: g.players.filter((p) => p.vp === top).map((p) => p.seat),
    charges, turns, end: top >= TARGET ? "target" : "stall",
    supplyLeft: g.supply.length,
  };
}
