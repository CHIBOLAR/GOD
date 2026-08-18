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
import { cancelMasks } from "../sim/battle.mjs";
import { beats } from "../sim/cards.mjs";
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
    // THE READ. Poker solves "what is this player doing" with a HUD of public behaviour —
    // how often they enter a pot, how aggressive, how often they re-raise. Every number here
    // is likewise derived from PUBLIC information only (STATE_INVENTORY §0), so showing it
    // leaks nothing: how much they commit, how often they sit back, how they answer offers.
    stats: Array.from({ length: n }, () => ({
      commits: 0, passes: 0, strength: 0, rounds: 0, sitOuts: 0,
      offersMade: 0, offersTaken: 0, offersRefused: 0, refusedBy: 0, burned: 0, won: 0,
    })),
  };
  beginRound(s);
  return s;
}

const nm = (s, i) => s.g.players[i].name;
const note = (s, text, kind = "info") => {
  s.log.push({ round: s.g.round, text, kind });
  if (s.log.length > 200) s.log.shift();
};

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


// DISPLAY ONLY. cancelMasks says WHICH units died; a player also wants to know WHAT killed them,
// so this mirrors the same selection (strongest canceller first, strongest legal target) to
// recover the pairing. It never feeds a rule — the outcome always comes from battle.mjs.
function killPairs(armies) {
  const all = [];
  armies.forEach((a, ai) => a.forEach((u, ui) => all.push({ u, ai, ui })));
  const dead = armies.map((a) => new Array(a.length).fill(false));
  const pairs = [];
  for (const k of [...all].sort((x, y) => y.u.s - x.u.s)) {
    let best = null;
    for (const t of all) {
      if (t.ai === k.ai || dead[t.ai][t.ui] || !beats(k.u.arm, t.u.arm)) continue;
      if (!best || t.u.s > best.u.s) best = t;
    }
    if (best) { dead[best.ai][best.ui] = true; pairs.push({ by: k, hit: best }); }
  }
  return pairs;
}

function resolveRound(s) {
  const { g } = s;
  const roundNo = g.round;

  // Snapshot BEFORE the settle. `resolveBattle` returns only survivors, so a client that wants
  // to stage the reveal — face up, then strike the cancelled, then total — needs the full
  // committed board and the cancellation mask. `resolveBattle` copies its input, so reading
  // m.armies here is safe and shows exactly what was on the ground.
  const committedBoard = s.m.armies.map((a) =>
    a.map((u) => ({ owner: u.owner, arm: u.arm, s: u.s, broker: u.broker, revealed: !!u.revealed })));
  const dead = cancelMasks(s.m.armies);

  const pairs = killPairs(s.m.armies);
  const armyName = (i) => (i ? "II" : "I");
  const say = (u) => `${u.arm[0] + u.arm.slice(1).toLowerCase()} ${u.s}`;

  const summary = settleRound(g, s.m, s.rnd);

  // ---- narrate the battle, so nothing ever happens silently
  if (summary.fielded) {
    for (const { by, hit } of pairs) {
      note(s, `${say(by.u)} (${nm(s, by.u.owner)}) cancels ${say(hit.u)} (${nm(s, hit.u.owner)})`, "kill");
    }
    if (summary.result) {
      const t = summary.result.totals;
      const w = [...summary.result.winners].map(armyName).join(" and ");
      note(s, `Army I totals ${t[0] ?? 0}, Army II totals ${t[1] ?? 0} — Army ${w} takes the ground`, "ground");
    }
    if (summary.rocketsFired) note(s, `SULTAN ROCKETS — the winners recover nothing, their army burns`, "rockets");
    for (const [p, v] of summary.awarded) {
      s.stats[p].won += v;
      note(s, `${nm(s, p)} was the largest contributor and takes ${v} point${v === 1 ? "" : "s"}`, "score");
    }
    for (const [p, v] of summary.recruited) {
      const got = g.players[p].hand[g.players[p].hand.length - 1];
      note(s, `${nm(s, p)} was defeated and recruits ${got && got.name ? got.name : "a Power Broker"}`, "recruit");
    }
  } else {
    note(s, `nothing was committed — the round passes`, "info");
  }
  for (let i = 0; i < s.n; i++) {
    s.stats[i].rounds++;
    if (s.turns[i] === 0) s.stats[i].sitOuts++;
    s.stats[i].burned = g.players[i].hand.filter((u) => u.spent).length;
  }

  s.lastRound = {
    round: roundNo,
    board: committedBoard,
    dead,
    // slot indices travel with the pairing so a client can stage the reveal one kill at a time,
    // in order, rather than striking everything at once — the player has to be able to see WHY
    kills: pairs.map(({ by, hit }) => ({
      by: { ...by.u, army: by.ai, slot: by.ui },
      hit: { ...hit.u, army: hit.ai, slot: hit.ui },
    })),
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
      s.stats[seat].passes++;
      note(s, `${nm(s, seat)} passes`);
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
        s.stats[seat].offersMade++;
        note(s, `${nm(s, seat)} sends a unit into Army ${action.army ? "II" : "I"} — ${nm(s, s.toAct)} must answer blind`, "offer");
      } else {
        commitUnit(s.g, s.m, seat, unit, action.army, s.rnd);
        s.stats[seat].commits++; s.stats[seat].strength += unit.s;
        note(s, `${nm(s, seat)} commits to Army ${action.army ? "II" : "I"}`, "commit");
        endTurn(s, seat, true);
      }
      break;
    }

    case "accept": {
      const { from, uid, army } = s.pending;
      const unit = s.g.players[from].hand.find((u) => u.uid === uid);
      commitUnit(s.g, s.m, from, unit, army, s.rnd);
      s.stats[from].commits++; s.stats[from].strength += unit.s;
      s.stats[seat].offersTaken++;
      note(s, `${nm(s, seat)} accepts ${nm(s, from)} into Army ${army ? "II" : "I"}`, "accept");
      s.pending = null;
      endTurn(s, from, true);
      break;
    }

    case "refuse": {
      const { from, uid, army } = s.pending;
      s.m.offered.add(army);
      s.stats[seat].offersRefused++; s.stats[from].refusedBy++;
      note(s, `${nm(s, seat)} refuses ${nm(s, from)} — Army ${army ? "II" : "I"} is closed to them this turn`, "refuse");
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
// ⚠️ `rest` alone CANNOT tell "on the ground right now" from "recovering". A unit committed
// this round is set to rest = round + 1, and a unit that WON last round is set to rest + 2 and
// then the round advances — so both read as round + 1 at view time. The board is the only
// reliable discriminator, so it is passed in. Getting this wrong showed every recovering unit
// as "committed", which is why recovery looked like it never happened.
function handState(u, round, onBoard) {
  if (u.spent) return "burned";
  if (onBoard.has(u)) return "committed";
  if (u.rest <= round) return "ready";
  return "recovering";
}

export function view(s, seat) {
  const { g } = s;
  const round = g.round;
  const showFaces = s.phase === PHASE.RESOLVED || s.phase === PHASE.OVER;
  const onBoard = new Set(s.m.armies.flat().map((c) => c.ref));

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
      state: handState(u, round, onBoard),
      returns: u.spent || u.rest <= round || onBoard.has(u) ? undefined : u.rest,
    })),
    offer: s.pending ? { from: s.pending.from, army: s.pending.army } : null,
    actions: legalActions(s, seat),
    reveal: showFaces ? s.lastRound : null,
    kills: showFaces && s.lastRound ? s.lastRound.kills : null,
    log: s.log.slice(-60),
    // the HUD: public behaviour only, so it can be shown for every seat
    stats: s.stats.map((st) => ({ ...st,
      aggression: st.rounds ? +(st.strength / st.rounds).toFixed(1) : 0,
      entered: st.rounds ? Math.round(100 * (st.rounds - st.sitOuts) / st.rounds) : 0,
    })),
    supplyLeft: g.supply.length,
  };
}
