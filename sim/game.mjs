// DECCAN II — the whole game: muster, battle, spoils, attrition.
//
// The round-robin and the matrix solver both look at a single battle. This is what they
// cannot see: the economy. Units are SPENT when committed, win or lose, so a faction is a
// life supply and the real question is not "which army is strongest" but "which points are
// worth paying for". LESSONS.md D1 — a battle-level metric cannot see the reward economy.
//
// Every player runs the SAME policy, so any asymmetry this measures is structural: it comes
// from the seat or the faction, not from one side playing better.

import { FACTIONS, byKey, ARMS, PREY, beats } from "./cards.mjs";
import { resolveBattle, resolveUncontested, spoils } from "./battle.mjs";

// ---- rng --------------------------------------------------------------------
export function makeRng(seed) {
  let x = seed >>> 0;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---- policy knobs -----------------------------------------------------------
// LESSONS.md: tune selection sharpness before tuning anything else.
const TEMPERATURE = 0.4;
const PASS_BASE = 1.6;       // the standing value of keeping a card in hand
const OWN_WEIGHT = 0.32;     // strength I expect this unit to actually contribute
const SILENCE_WEIGHT = 0.30; // enemy strength I expect this unit to shut down
const STRENGTH_COST = 0.06;  // spending a big unit costs more than spending a small one
const ALLY_TAX = 0.55;       // an ally in my army competes with me for the points
const BEHIND_BONUS = 0.6;    // answering an army that is visibly bigger than mine
const ARMY_CAP = 3;

// ---- state ------------------------------------------------------------------
export function newGame(factionKeys, target) {
  return {
    target, round: 0, start: 0,
    players: factionKeys.map((k, i) => {
      const f = byKey(k);
      return { seat: i, faction: f, hand: f.units.map((u) => ({ ...u, spent: false })), vp: 0 };
    }),
  };
}

const available = (p) => p.hand.filter((u) => !u.spent);

// ---- one turn's legal moves -------------------------------------------------
function legalMoves(g, seat, m) {
  const moves = [{ pass: true }];
  const units = available(g.players[seat]);
  if (!units.length) return moves;

  const mine = m.armyOf.get(seat);
  for (let a = 0; a < 2; a++) {
    if (mine !== undefined && mine !== a) continue;        // never both armies
    if (m.armies[a].length >= ARMY_CAP) continue;
    if (mine === undefined && m.leader[a] !== null && m.leader[a] !== seat
      && m.offeredThisTurn.has(a)) continue;               // one offer per army per turn
    for (const u of units) moves.push({ unit: u, army: a });
  }
  return moves;
}

// ---- how good does a move look ----------------------------------------------
// ⚠️ UNITS COMMIT FACE DOWN. This may read only PUBLIC information: how many units each army
// holds, whose they are, and which units each player has already burned. It must NOT look at
// an opposing card's type or strength.
//
// An earlier draft did exactly that, and the tell was unmistakable: the start player was the
// worst seat at every player count (2p split 36/64), because whoever moved second got to
// counter what they could see. Under an outright counter, perfect information is a landslide.
//
// A unit is worth two things: the strength it contributes if nothing silences it, and the
// enemy strength it silences by being on the table at all.
function scoreMove(g, seat, m, mv) {
  if (mv.pass) return PASS_BASE;
  const u = mv.unit;
  const foeArmy = m.armies[1 - mv.army];
  const myArmy = m.armies[mv.army];

  // five arms: each beats two and is beaten by two
  const killers = ARMS.filter((t) => beats(t, u.t));   // arms that cancel me
  const prey = PREY[u.t];                              // arms I cancel
  // each unit cancels only ONE enemy, so a second canceller of the same arm adds little
  const already = myArmy.filter((x) => prey.some((p) => PREY[x.t].includes(p))).length;

  let pSurvive = 1, expCancel = 0;
  for (const foe of foeArmy) {
    const pool = m.pools[foe.owner];
    if (!pool.length) continue;
    let nKill = 0, preySum = 0;
    for (const c of pool) {
      if (killers.includes(c.t)) nKill++;
      if (prey.includes(c.t)) preySum += c.s;
    }
    pSurvive *= 1 - nKill / pool.length;
    expCancel += preySum / pool.length;
  }
  expCancel /= 1 + already;      // diminishing: my other units already take some of these

  let s = OWN_WEIGHT * u.s * pSurvive
        + SILENCE_WEIGHT * expCancel
        - STRENGTH_COST * u.s;

  s -= ALLY_TAX * myArmy.filter((x) => x.owner !== seat).length;
  if (foeArmy.length > myArmy.length) s += BEHIND_BONUS;
  return s;
}

function pick(moves, scores, rnd) {
  const max = Math.max(...scores);
  const w = scores.map((x) => Math.exp((x - max) / TEMPERATURE));
  const total = w.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < moves.length; i++) if ((r -= w[i]) <= 0) return moves[i];
  return moves[moves.length - 1];
}

// A leader judges an offer blind — units are face down, so this cannot look at the card.
function accepts(m, army, rnd) {
  const mineN = m.armies[army].length, foeN = m.armies[1 - army].length;
  return rnd() < (foeN >= mineN ? 0.7 : 0.3);
}

// ---- a round ----------------------------------------------------------------
export function playRound(g, rnd, policy) {
  const n = g.players.length;
  const m = {
    armies: [[], []],
    leader: [null, null],
    armyOf: new Map(),
    offeredThisTurn: new Set(),
    // what each player still held when the round opened — public, since every unit ever
    // committed was revealed at a battle. This is the belief a face-down card is judged on.
    pools: g.players.map((p) => available(p).map((u) => ({ t: u.t, s: u.s }))),
  };

  let passStreak = 0, seat = g.start, committed = 0;
  const turnsTaken = new Array(n).fill(0);

  while (passStreak < n) {
    m.offeredThisTurn.clear();
    let acted = false;
    // a turn may involve two offers: refused by one leader, you may try the other army
    for (let attempt = 0; attempt < 2 && !acted; attempt++) {
      const moves = legalMoves(g, seat, m);
      const random = policy && policy[seat] === "random";
      const scores = random
        ? moves.map(() => 0)
        : moves.map((x) => scoreMove(g, seat, m, x));
      const mv = pick(moves, scores, rnd);
      if (mv.pass) break;
      const needsLeave = m.armyOf.get(seat) === undefined
        && m.leader[mv.army] !== null && m.leader[mv.army] !== seat;
      if (needsLeave && !accepts(m, mv.army, rnd)) {
        m.offeredThisTurn.add(mv.army);       // refused; the turn is not over
        continue;
      }
      mv.unit.spent = true;
      m.armies[mv.army].push({ t: mv.unit.t, s: mv.unit.s, owner: seat });
      if (m.leader[mv.army] === null) m.leader[mv.army] = seat;
      m.armyOf.set(seat, mv.army);
      acted = true; committed++; turnsTaken[seat]++;
    }
    passStreak = acted ? 0 : passStreak + 1;
    seat = (seat + 1) % n;
  }

  const fielded = [0, 1].filter((a) => m.armies[a].length);
  let result = null;
  if (fielded.length === 2) result = resolveBattle(m.armies[0], m.armies[1]);
  else if (fielded.length === 1) {
    const a = fielded[0];
    const r = resolveUncontested(m.armies[a]);
    result = a === 0 ? r
      : { totalA: 0, totalB: r.totalA, countedA: [], countedB: r.countedA, winner: "B" };
  }

  const awarded = result ? spoils(result, m.armies[0], m.armies[1]) : new Map();
  for (const [p, v] of awarded) g.players[p].vp += v;

  g.round++;
  g.start = (g.start + 1) % n;
  return { committed, turnsTaken, awarded, result, armies: m.armies };
}

// ---- a whole game -----------------------------------------------------------
export function playGame(factionKeys, target, seed, opts = {}) {
  const rnd = makeRng(seed);
  const g = newGame(factionKeys, target);
  const n = g.players.length;
  const stats = {
    rounds: 0, commits: new Array(n).fill(0), satOut: new Array(n).fill(0),
    sizes: [0, 0, 0, 0], both: 0, battles: 0,
  };

  for (let guard = 0; guard < 200; guard++) {
    const r = playRound(g, rnd, opts.policy);
    stats.rounds++;
    for (let i = 0; i < n; i++) {
      stats.commits[i] += r.turnsTaken[i];
      if (r.turnsTaken[i] === 0) stats.satOut[i]++;
    }
    for (const a of r.armies) if (a.length) stats.sizes[a.length]++;
    if (r.result) { stats.battles++; if (r.result.winner === "both") stats.both++; }
    if (r.committed === 0) { stats.end = "quiet"; break; }
    if (Math.max(...g.players.map((p) => p.vp)) >= target) { stats.end = "target"; break; }
    if (g.players.every((p) => available(p).length === 0)) { stats.end = "dry"; break; }
  }
  if (!stats.end) stats.end = "guard";

  const top = Math.max(...g.players.map((p) => p.vp));
  stats.winners = g.players.filter((p) => p.vp === top).map((p) => p.seat);
  stats.vp = g.players.map((p) => p.vp);
  return stats;
}
