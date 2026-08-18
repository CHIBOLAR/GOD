// GOD — the interactive engine.
//
// The batch model in `sim/game.mjs` plays a whole round inside one loop, taking every decision
// itself. An online game has to STOP at each decision and wait for a human. This file is that
// pause, and nothing else: every rule, every score, every settle is the model's own function,
// imported unchanged.
//
// ⚠️ THE RULE OF THIS FILE: it may re-order when decisions happen. It may NEVER decide anything
// the model decides. If a rule appears here that is not a call into `sim/`, it is a bug — the
// online game would then be a different game from the one the gates measured.
//
// The turn loop it mirrors (`playRound`, sim/game.mjs):
//
//   while (passStreak < n) {
//     m.offered.clear();
//     for (attempt = 0; attempt < NUM_ARMIES && !acted; attempt++) {
//       mv = choose(legalMoves(seat));
//       if (mv.pass) break;
//       if (joining && !accepts()) { m.offered.add(army); continue; }
//       commitUnit(); acted = true;
//     }
//     passStreak = acted ? 0 : passStreak + 1;
//     seat = (seat + 1) % n;
//   }

import { FACTIONS, VICTORY_TARGET } from "../sim/cards.mjs";
import {
  NUM_ARMIES, ARMY_CAP, MAX_PER_ARMY,
  makeRng, newGame, available, legalMoves, commitUnit,
  accepts, refusalLandsIn, scoreMove, choose, settleRound,
} from "../sim/game.mjs";

export const PHASE = {
  MUSTER: "muster",     // a seat is choosing a unit and an army, or passing
  OFFER: "offer",       // a leader is answering a blind offer
  RESOLVED: "resolved", // the round is settled; the client is showing the reveal
  OVER: "over",
};

// ---- creation ---------------------------------------------------------------
// Units need stable identity across the wire. The model works on object references, which do
// not survive JSON, so every card gets a uid the moment it enters a hand.
let uidSeq = 0;
const stamp = (u) => (u.uid ??= `u${++uidSeq}`);

export function createGame({ factions, seed = Date.now(), names = [] }) {
  const n = factions.length;
  if (n < 2 || n > 8) throw new Error(`player count must be 2-8, got ${n}`);
  for (const k of factions) {
    if (!FACTIONS.some((f) => f.key === k)) throw new Error(`unknown ruler: ${k}`);
  }
  const rnd = makeRng(seed >>> 0);
  const g = newGame(factions, VICTORY_TARGET[n], rnd);
  g.players.forEach((p, i) => { p.name = names[i] ?? `Seat ${i + 1}`; p.hand.forEach(stamp); });

  const s = {
    g, rnd, n, seed,
    phase: PHASE.MUSTER,
    toAct: g.start,
    attempt: 0,
    passStreak: 0,
    committed: 0,
    turns: new Array(n).fill(0),
    quiet: 0,
    pending: null,
    lastRound: null,
    end: null,
    winners: [],
    log: [],
  };
  beginRound(s);
  return s;
}

// ---- round and turn plumbing -------------------------------------------------
function beginRound(s) {
  const { g, n } = s;
  s.m = {
    armies: Array.from({ length: NUM_ARMIES }, () => []),
    leader: new Array(NUM_ARMIES).fill(null),
    armyOf: new Map(),
    offered: new Set(),
    used: [],
    pools: g.players.map((p) => available(p, g.round).map((u) => ({ arm: u.arm, s: u.s }))),
  };
  s.passStreak = 0;
  s.committed = 0;
  s.turns = new Array(n).fill(0);
  s.phase = PHASE.MUSTER;
  beginTurn(s, g.start);
}

// `m.offered` is cleared at the top of every turn in the model — a refusal closes an army for
// THIS TURN ONLY, and it reopens on the refused player's next lap.
function beginTurn(s, seat) {
  s.m.offered.clear();
  s.attempt = 0;
  s.pending = null;
  s.phase = PHASE.MUSTER;
  s.toAct = seat;
}

function endTurn(s, seat, acted) {
  if (acted) { s.passStreak = 0; s.committed++; s.turns[seat]++; }
  else s.passStreak++;
  const next = (seat + 1) % s.n;
  if (s.passStreak >= s.n) resolveRound(s);
  else beginTurn(s, next);
}

function resolveRound(s) {
  const { g } = s;
  const roundNo = g.round;
  const summary = settleRound(g, s.m, s.rnd);

  s.lastRound = {
    round: roundNo,
    armies: summary.result ? summary.result.armies : [],
    totals: summary.result ? summary.result.totals : [],
    winners: summary.result ? [...summary.result.winners] : [],
    swaps: summary.result ? summary.result.swaps.length : 0,
    rocketsFired: summary.rocketsFired,
    awarded: [...summary.awarded],
    recruited: [...summary.recruited],
    committed: s.committed,
    fielded: summary.fielded,
  };

  g.round++;
  g.start = (g.start + 1) % s.n;
  s.quiet = s.committed === 0 ? s.quiet + 1 : 0;

  // any card recruited during the settle needs a uid before it can be sent to a client
  for (const p of g.players) p.hand.forEach(stamp);

  s.phase = PHASE.RESOLVED;
  s.toAct = null;
  s.end = endCondition(s);
  if (s.end) {
    const top = Math.max(...g.players.map((p) => p.vp));
    s.winners = g.players.filter((p) => p.vp === top).map((p) => p.seat);
  }
}

// Exactly the three conditions in playGame, in the same order.
function endCondition(s) {
  const { g } = s;
  if (Math.max(...g.players.map((p) => p.vp)) >= g.target) return "target";
  if (s.quiet >= 2) return "quiet";
  if (g.players.every((p) => available(p, g.round).length === 0)) return "dry";
  return null;
}

// ---- actions ----------------------------------------------------------------
// The move space is exactly the model's: pass, or a unit into an army. There is no "offer"
// action — a commitment BECOMES an offer from board state alone.
export function legalActions(s, seat) {
  if (s.phase === PHASE.OFFER) {
    return seat === s.toAct ? [{ type: "accept" }, { type: "refuse" }] : [];
  }
  if (s.phase === PHASE.RESOLVED) return [{ type: "continue" }];
  if (s.phase === PHASE.OVER || seat !== s.toAct) return [];

  return legalMoves(s.g, seat, s.m).map((mv) =>
    mv.pass
      ? { type: "pass" }
      : {
          type: "commit",
          uid: mv.unit.uid,
          army: mv.army,
          // true when this commitment will be answered blind by another player
          offer: s.m.armyOf.get(seat) === undefined
            && s.m.leader[mv.army] !== null && s.m.leader[mv.army] !== seat,
        });
}

export function apply(s, seat, action) {
  const legal = legalActions(s, seat);
  const ok = legal.some((a) => a.type === action.type
    && (a.type !== "commit" || (a.uid === action.uid && a.army === action.army)));
  if (!ok) throw new Error(`illegal action for seat ${seat}: ${JSON.stringify(action)}`);

  switch (action.type) {
    case "pass":
      s.log.push({ t: "pass", seat });
      endTurn(s, seat, false);
      break;

    case "commit": {
      const unit = s.g.players[seat].hand.find((u) => u.uid === action.uid);
      const joining = s.m.armyOf.get(seat) === undefined
        && s.m.leader[action.army] !== null && s.m.leader[action.army] !== seat;
      if (joining) {
        // hand the decision to the army's leader; the unit stays face down to them
        s.pending = { from: seat, uid: unit.uid, army: action.army };
        s.phase = PHASE.OFFER;
        s.toAct = s.m.leader[action.army];
        s.log.push({ t: "offer", seat, army: action.army, to: s.toAct });
      } else {
        commitUnit(s.g, s.m, seat, unit, action.army, s.rnd);
        s.log.push({ t: "commit", seat, army: action.army });
        endTurn(s, seat, true);
      }
      break;
    }

    case "accept": {
      const { from, uid, army } = s.pending;
      const unit = s.g.players[from].hand.find((u) => u.uid === uid);
      commitUnit(s.g, s.m, from, unit, army, s.rnd);
      s.log.push({ t: "accept", seat, from, army });
      s.pending = null;
      endTurn(s, from, true);
      break;
    }

    case "refuse": {
      const { from, uid, army } = s.pending;
      s.m.offered.add(army);
      s.log.push({ t: "refuse", seat, from, army });
      // REFUSAL_FORK is built but not adopted; refusalLandsIn returns undefined at baseline.
      const lands = refusalLandsIn(s.m, from, army);
      s.pending = null;
      if (lands !== undefined) {
        const unit = s.g.players[from].hand.find((u) => u.uid === uid);
        commitUnit(s.g, s.m, from, unit, lands, s.rnd);
        endTurn(s, from, true);
        break;
      }
      // The refused player's turn CONTINUES: the other army, or a pass.
      //
      // ⚠️ PARITY: do NOT short-circuit to endTurn when only `pass` remains legal. The model's
      // loop re-enters and calls choose() even when pass is the only move, consuming an RNG
      // draw. Ending the turn here instead skips that draw, offsets the stream by one, and every
      // later decision in the game diverges. Caught by web/parity.mjs — 2p was identical and
      // divergence grew with player count, because more players means more offers means more
      // refusals. The turn ends only when the attempts run out, exactly as the for-loop does.
      s.attempt++;
      if (s.attempt >= NUM_ARMIES) { endTurn(s, from, false); break; }
      s.phase = PHASE.MUSTER;
      s.toAct = from;
      break;
    }

    case "continue":
      if (s.end) s.phase = PHASE.OVER;
      else beginRound(s);
      break;

    default:
      throw new Error(`unknown action ${action.type}`);
  }
  return s;
}

// ---- the bot ----------------------------------------------------------------
// Every decision goes through the model's own scorer and chooser, so a bot in the online game
// plays exactly the policy the 12,000-game gates were run against.
export function botAction(s, seat) {
  if (s.phase === PHASE.RESOLVED) return { type: "continue" };
  if (s.phase === PHASE.OFFER && seat === s.toAct) {
    const army = s.pending.army;
    const lands = refusalLandsIn(s.m, s.pending.from, army);
    return accepts(s.m, army, s.rnd, lands) ? { type: "accept" } : { type: "refuse" };
  }
  if (s.phase !== PHASE.MUSTER || seat !== s.toAct) return null;

  const moves = legalMoves(s.g, seat, s.m);
  const mv = choose(moves, moves.map((x) => scoreMove(s.g, seat, s.m, x)), s.rnd);
  if (mv.pass) return { type: "pass" };
  return { type: "commit", uid: mv.unit.uid, army: mv.army };
}

// ---- the per-seat view -------------------------------------------------------
// Enforces STATE_INVENTORY §0 and §9. A card's face is sent ONLY if the viewer owns it or the
// card is `revealed` (a face-up broker, or a unit a Siege Elephant looked at).
function handState(u, round) {
  if (u.spent) return "burned";
  if (u.rest <= round) return "ready";
  return u.rest === round + 1 ? "committed" : "recovering";
}

export function view(s, seat) {
  const { g } = s;
  const round = g.round;
  const showFaces = s.phase === PHASE.RESOLVED || s.phase === PHASE.OVER;

  const card = (c) => {
    const open = showFaces || c.owner === seat || c.revealed;
    return {
      owner: c.owner, revealed: !!c.revealed,
      ...(open ? { arm: c.arm, s: c.s, broker: c.broker } : {}),
    };
  };

  return {
    you: seat,
    round,
    target: g.target,
    phase: s.phase,
    toAct: s.toAct,
    end: s.end,
    winners: s.winners,
    armies: s.m.armies.map((a, i) => ({
      index: i,
      leader: s.m.leader[i],
      units: a.map(card),
      count: a.length,
      full: a.length >= ARMY_CAP,
      members: [...new Set(a.map((u) => u.owner))],
      // ⚠️ totals are a strength leak and exist only once the armies are face up
      ...(showFaces && s.lastRound ? { total: s.lastRound.totals[i] } : {}),
    })),
    players: g.players.map((p) => ({
      seat: p.seat,
      name: p.name,
      ruler: p.faction.name,
      vp: p.vp,
      army: s.m.armyOf.get(p.seat) ?? null,
      ready: available(p, round).length,
      inHand: p.hand.filter((u) => !u.spent).length,
      // burned piles are public (§0)
      burned: p.hand.filter((u) => u.spent).map((u) => ({ arm: u.arm, s: u.s, broker: u.key })),
      sittingOut: available(p, round).length === 0,
    })),
    hand: g.players[seat].hand.map((u) => ({
      uid: u.uid, arm: u.arm, s: u.s, broker: u.isBroker ? u.key : undefined,
      name: u.isBroker ? u.name : undefined,
      text: u.isBroker ? u.text : undefined,
      when: u.isBroker ? u.when : undefined,
      state: handState(u, round),
      returns: u.spent || u.rest <= round ? undefined : u.rest,
    })),
    offer: s.pending ? { from: s.pending.from, army: s.pending.army } : null,
    actions: legalActions(s, seat),
    reveal: showFaces ? s.lastRound : null,
    supplyLeft: g.supply.length,
  };
}
