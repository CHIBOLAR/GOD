// GOD — the interactive engine for THE CHARGE.
//
// `sim/charge.mjs` plays a whole game in one loop, taking every decision itself. An online game
// has to STOP at each decision and wait for a human. This file is that pause and nothing else.
//
// ⚠️ THE RULE OF THIS FILE: it may re-order WHEN decisions happen. It may NEVER decide anything
// the model decides. Every rule, every score, every resolution is `sim/`'s own function. If a
// rule appears here that is not a call into sim/, the online game is a different game from the
// one the gates measured.

import { FACTIONS } from "../sim/cards.mjs";
import {
  NUM_ARMIES, ARMY_CAP, MAX_PER_ARMY, TARGET,
  makeRng, newGame, legalActions as modelActions, score, commit, charge, boardFull,
} from "../sim/charge.mjs";

export const PHASE = {
  PLAY: "play",       // a seat is choosing an action
  CHARGE: "charge",   // the armies have met; the client is showing it
  OVER: "over",
};

// Units need stable identity across the wire — the model works on object references, which do
// not survive JSON.
let uidSeq = 0;
const stamp = (u) => (u.uid ??= `u${++uidSeq}`);

export function createGame({ factions, seed = Date.now(), names = [] }) {
  const n = factions.length;
  if (n < 2 || n > 8) throw new Error(`player count must be 2-8, got ${n}`);
  for (const k of factions) {
    if (!FACTIONS.some((f) => f.key === k)) throw new Error(`unknown ruler: ${k}`);
  }
  const rnd = makeRng(seed >>> 0);
  const g = newGame(factions, rnd);
  g.players.forEach((p, i) => { p.name = names[i] ?? `Seat ${i + 1}`; p.hand.forEach(stamp); });

  return {
    g, rnd, n, seed,
    phase: PHASE.PLAY,
    toAct: 0,
    idle: 0,
    lastCharge: null,
    end: null,
    winners: [],
    log: [],
    stats: Array.from({ length: n }, () => ({
      deploys: 0, withdraws: 0, charges: 0, holds: 0, kills: 0, losses: 0,
    })),
  };
}

const nm = (s, i) => s.g.players[i].name;
const note = (s, text, kind = "info") => {
  s.log.push({ charge: s.g.charge, text, kind });
  if (s.log.length > 200) s.log.shift();
};
const armyName = (i) => ["I", "II", "III", "IV"][i] ?? String(i + 1);

// ---- actions -----------------------------------------------------------------
// The move space is the model's, translated to wire form. `uid` identifies a card in hand;
// `card` identifies one already standing on the ground.
export function legalActions(s, seat) {
  if (s.phase === PHASE.CHARGE) return [{ type: "continue" }];
  if (s.phase === PHASE.OVER || seat !== s.toAct) return [];
  return modelActions(s.g, seat).map((a) =>
    a.pass ? { type: "hold" }
    : a.charge ? { type: "charge" }
    : a.withdraw ? { type: "withdraw", card: a.withdraw.ref.uid, army: a.army }
    : { type: "deploy", uid: a.unit.uid, army: a.army });
}

function endTurn(s, acted) {
  s.idle = acted ? 0 : s.idle + 1;

  // ⚠️ A FULL BOARD CHARGES ITSELF — the model's rule, not a convenience. Waiting on a board
  // with no room was 150 of the old 206 turns per game.
  if (boardFull(s.g)) doCharge(s, null);

  if (Math.max(...s.g.players.map((p) => p.vp)) >= TARGET) return finish(s, "target");
  if (s.idle >= s.n * 2) return finish(s, "stall");
  if (s.phase !== PHASE.CHARGE) s.toAct = (s.toAct + 1) % s.n;
}

function finish(s, end) {
  s.end = end;
  const top = Math.max(...s.g.players.map((p) => p.vp));
  s.winners = s.g.players.filter((p) => p.vp === top).map((p) => p.seat);
  if (s.phase !== PHASE.CHARGE) s.phase = PHASE.OVER;
}

function doCharge(s, seat) {
  const before = s.g.armies.map((a) => a.map((c) => ({
    owner: c.owner, arm: c.arm, s: c.s, broker: c.broker, revealed: c.revealed })));
  const r = charge(s.g);

  for (const { by, hit } of r.kills) {
    s.stats[by.u.owner].kills++;
    s.stats[hit.u.owner].losses++;
    note(s, `${by.u.arm[0]}${by.u.s} (${nm(s, by.u.owner)}) cancels ` +
      `${hit.u.arm[0]}${hit.u.s} (${nm(s, hit.u.owner)})`, "kill");
  }
  for (const [p, v] of r.scored) note(s, `${nm(s, p)} takes ${v} point${v === 1 ? "" : "s"}`, "score");
  for (const [p] of r.recruited) note(s, `${nm(s, p)} lost units and recruits a Power Broker`, "recruit");
  if (!r.kills.length) note(s, `the charge falls on nothing — no unit could reach another`, "info");

  s.g.players.forEach((p) => p.hand.forEach(stamp));
  s.lastCharge = {
    n: s.g.charge, before,
    kills: r.kills.map(({ by, hit }) => ({
      by: { owner: by.u.owner, arm: by.u.arm, s: by.u.s, army: by.ai, slot: by.ui },
      hit: { owner: hit.u.owner, arm: hit.u.arm, s: hit.u.s, army: hit.ai, slot: hit.ui },
    })),
    scored: [...r.scored], lost: [...r.lost], recruited: [...r.recruited],
    calledBy: seat,
  };
  s.phase = PHASE.CHARGE;
}

export function apply(s, seat, action) {
  const legal = legalActions(s, seat);
  const ok = legal.some((a) => a.type === action.type
    && (a.type !== "deploy" || (a.uid === action.uid && a.army === action.army))
    && (a.type !== "withdraw" || a.card === action.card));
  if (!ok) throw new Error(`illegal action for seat ${seat}: ${JSON.stringify(action)}`);

  switch (action.type) {
    case "hold":
      s.stats[seat].holds++;
      note(s, `${nm(s, seat)} holds`);
      endTurn(s, false);
      break;

    case "deploy": {
      const unit = s.g.players[seat].hand.find((u) => u.uid === action.uid);
      commit(s.g, seat, unit, action.army);
      s.stats[seat].deploys++;
      note(s, `${nm(s, seat)} deploys into Army ${armyName(action.army)}`, "deploy");
      endTurn(s, true);
      break;
    }

    case "withdraw": {
      const a = s.g.armies[action.army];
      const i = a.findIndex((c) => c.ref.uid === action.card);
      const [card] = a.splice(i, 1);
      card.ref.onBoard = false;
      if (!a.length) s.g.leader[action.army] = null;
      s.stats[seat].withdraws++;
      note(s, `${nm(s, seat)} withdraws from Army ${armyName(action.army)}`, "withdraw");
      endTurn(s, true);
      break;
    }

    case "charge": {
      s.stats[seat].charges++;
      note(s, `${nm(s, seat)} CALLS THE CHARGE`, "charge");
      doCharge(s, seat);
      if (Math.max(...s.g.players.map((p) => p.vp)) >= TARGET) finish(s, "target");
      break;
    }

    case "continue":
      if (s.end) s.phase = PHASE.OVER;
      else { s.phase = PHASE.PLAY; s.toAct = (s.toAct + 1) % s.n; }
      break;

    default:
      throw new Error(`unknown action ${action.type}`);
  }
  return s;
}

// ---- the bot -----------------------------------------------------------------
// Every decision goes through the model's own scorer, so a bot online plays the policy the
// gates were run against.
export function botAction(s, seat) {
  if (s.phase === PHASE.CHARGE) return { type: "continue" };
  if (s.phase !== PHASE.PLAY || seat !== s.toAct) return null;
  const acts = modelActions(s.g, seat);
  const scores = acts.map((a) => score(s.g, seat, a));
  // the model's softmax, inlined so the temperature stays with the policy that owns it
  const max = Math.max(...scores);
  const w = scores.map((x) => Math.exp((x - max) / 0.4));
  const tot = w.reduce((a, b) => a + b, 0);
  let r = s.rnd() * tot, pick = acts[acts.length - 1];
  for (let i = 0; i < acts.length; i++) if ((r -= w[i]) <= 0) { pick = acts[i]; break; }
  return pick.pass ? { type: "hold" }
    : pick.charge ? { type: "charge" }
    : pick.withdraw ? { type: "withdraw", card: pick.withdraw.ref.uid, army: pick.army }
    : { type: "deploy", uid: pick.unit.uid, army: pick.army };
}

// ---- the per-seat view --------------------------------------------------------
// A face-down unit shows only its owner. A unit that has survived a charge is face up to
// everyone, and so is a Power Broker that deploys face up.
export function view(s, seat) {
  const showAll = s.phase === PHASE.CHARGE || s.phase === PHASE.OVER;
  const card = (c) => {
    const open = showAll || c.revealed || c.owner === seat;
    return { owner: c.owner, revealed: !!c.revealed, id: c.ref.uid,
      ...(open ? { arm: c.arm, s: c.s, broker: c.broker } : {}) };
  };
  return {
    you: seat,
    charge: s.g.charge,
    target: TARGET,
    cap: ARMY_CAP,
    phase: s.phase,
    toAct: s.toAct,
    end: s.end,
    winners: s.winners,
    armies: s.g.armies.map((a, i) => ({
      index: i, name: armyName(i),
      leader: s.g.leader[i],
      units: a.map(card),
      count: a.length,
      full: a.length >= ARMY_CAP,
      members: [...new Set(a.map((u) => u.owner))],
    })),
    players: s.g.players.map((p) => ({
      seat: p.seat, name: p.name, ruler: p.faction.name, vp: p.vp,
      army: s.g.armies.findIndex((a) => a.some((c) => c.owner === p.seat)),
      inHand: p.hand.filter((u) => !u.spent && !u.onBoard).length,
      lost: p.hand.filter((u) => u.spent).length,
      ...s.stats[p.seat],
    })),
    hand: s.g.players[seat].hand.map((u) => ({
      uid: u.uid, arm: u.arm, s: u.s,
      broker: u.isBroker ? u.key : undefined,
      name: u.isBroker ? u.name : undefined,
      text: u.isBroker ? u.text : undefined,
      state: u.spent ? "dead" : u.onBoard ? "standing" : "ready",
    })),
    reveal: showAll ? s.lastCharge : null,
    log: s.log.slice(-60),
    supplyLeft: s.g.supply.length,
    actions: legalActions(s, seat),
  };
}
