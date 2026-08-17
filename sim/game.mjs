// DECCAN II — the whole game: muster, battle, spoils, attrition.
//
// The round-robin and the matrix solver both look at a single battle. This is what they
// cannot see: the economy. Units are SPENT when committed, win or lose, so a faction is a
// life supply and the real question is not "which army is strongest" but "which points are
// worth paying for". LESSONS.md D1 — a battle-level metric cannot see the reward economy.
//
// Every player runs the SAME policy, so any asymmetry this measures is structural: it comes
// from the seat or the faction, not from one side playing better.

import { FACTIONS, byKey } from "./cards.mjs";
import { resolveFront, resolveBattle, resolveUncontested, spoils, CENTRE } from "./battle.mjs";

// ---- rng --------------------------------------------------------------------
export function makeRng(seed) {
  let x = seed >>> 0;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---- policy knobs -----------------------------------------------------------
// LESSONS.md: tune selection sharpness before tuning anything else.
const TEMPERATURE = 0.35;
const PASS_BASE = 0.9;      // the standing value of keeping a card in hand
const WIN_FRONT = 2.0;      // taking a front we can see we win
const LOSE_FRONT = -1.2;    // walking into a front we can see we lose
const OPEN_FRONT = 1.0;     // an unopposed front, which may yet be answered
const STRENGTH_COST = 0.09; // spending a big unit costs more than spending a small one
const ALLY_TAX = 0.5;       // an ally in my army competes with me for the points

// ---- state ------------------------------------------------------------------
export function newGame(factionKeys, target) {
  return {
    target,
    round: 0,
    start: 0,
    players: factionKeys.map((k, i) => {
      const f = byKey(k);
      return { seat: i, faction: f, hand: f.units.map((u) => ({ ...u, spent: false })), vp: 0 };
    }),
  };
}

const available = (p) => p.hand.filter((u) => !u.spent);

// ---- one turn's legal moves -------------------------------------------------
// A move is { pass } or { unit, army, front }.
function legalMoves(g, seat, m) {
  const moves = [{ pass: true }];
  const p = g.players[seat];
  const units = available(p);
  if (!units.length) return moves;

  const mine = m.armyOf.get(seat);
  const targets = [];
  for (let a = 0; a < 2; a++) {
    if (mine !== undefined && mine !== a) continue;          // never both armies
    if (m.armies[a].every((s) => s !== null)) continue;      // full
    if (mine === undefined && m.leader[a] !== null && m.leader[a] !== seat) {
      if (m.offeredThisTurn.has(a)) continue;                // one offer per army per turn
    }
    targets.push(a);
  }
  for (const a of targets)
    for (let f = 0; f < 3; f++) {
      if (m.armies[a][f]) continue;
      for (const u of units) moves.push({ unit: u, army: a, front: f });
    }
  return moves;
}

// ---- how good does a move look ----------------------------------------------
// ⚠️ UNITS COMMIT FACE DOWN. This function may read only PUBLIC information: which fronts
// are occupied, whose card sits on each, and which units each player has already burned in
// earlier rounds. It must NOT look at an opposing card's type or strength.
//
// An earlier draft did exactly that, and the tell was unmistakable — the start player was
// the worst seat at every player count (2p split 36/64), because whoever moved second got to
// counter what they could see. Under the counter cycle, perfect information is a landslide.
function scoreMove(g, seat, m, mv) {
  if (mv.pass) return PASS_BASE;
  const foe = m.armies[1 - mv.army][mv.front];
  let s = -STRENGTH_COST * mv.unit.s;
  if (!foe) s += OPEN_FRONT;
  else {
    // Face down. We know whose card it is and what they had left when the round began,
    // so we judge against that hand evenly.
    const pool = m.pools[foe.owner];
    let w = 0, l = 0;
    for (const c of pool) {
      const r = resolveFront(mv.unit, c);
      if (r === 1) w++; else if (r === -1) l++;
    }
    s += (WIN_FRONT * w + LOSE_FRONT * l) / (pool.length || 1);
  }
  // the Centre decides a level ground, so it is worth a little more than the wings
  if (mv.front === CENTRE) s += 0.35;
  // an army already holding somebody else's units pays me less per card
  const allies = m.armies[mv.army].filter((u) => u && u.owner !== seat).length;
  s -= ALLY_TAX * allies;
  // pressure: being behind on bodies in a contested battle is worth answering
  const mineN = m.armies[mv.army].filter(Boolean).length;
  const foeN = m.armies[1 - mv.army].filter(Boolean).length;
  if (foeN > mineN) s += 0.7;
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
  const mineN = m.armies[army].filter(Boolean).length;
  const foeN = m.armies[1 - army].filter(Boolean).length;
  return rnd() < (foeN >= mineN ? 0.7 : 0.3);
}

// ---- a round ----------------------------------------------------------------
export function playRound(g, rnd, log) {
  const m = {
    armies: [[null, null, null], [null, null, null]],
    leader: [null, null],
    armyOf: new Map(),
    offeredThisTurn: new Set(),
    // what each player still held when the round opened — public, since every unit that has
    // ever been committed was revealed at a battle. This is the belief a face-down card is
    // judged against.
    pools: g.players.map((p) => available(p).map((u) => ({ t: u.t, s: u.s }))),
  };
  const n = g.players.length;
  let passStreak = 0, seat = g.start, committed = 0;
  const turnsTaken = new Array(n).fill(0);

  while (passStreak < n) {
    m.offeredThisTurn.clear();
    let acted = false;
    // a turn may involve two offers: refused by one leader, you may try the other army
    for (let attempt = 0; attempt < 2 && !acted; attempt++) {
      const moves = legalMoves(g, seat, m);
      const mv = pick(moves, moves.map((x) => scoreMove(g, seat, m, x)), rnd);
      if (mv.pass) break;
      const needsLeave = m.armyOf.get(seat) === undefined
        && m.leader[mv.army] !== null && m.leader[mv.army] !== seat;
      if (needsLeave && !accepts(m, mv.army, rnd)) {
        m.offeredThisTurn.add(mv.army);       // refused; the turn is not over
        continue;
      }
      mv.unit.spent = true;
      m.armies[mv.army][mv.front] = { t: mv.unit.t, s: mv.unit.s, owner: seat };
      if (m.leader[mv.army] === null) m.leader[mv.army] = seat;
      m.armyOf.set(seat, mv.army);
      acted = true; committed++; turnsTaken[seat]++;
    }
    passStreak = acted ? 0 : passStreak + 1;
    seat = (seat + 1) % n;
  }

  // --- battle
  const fielded = [0, 1].filter((a) => m.armies[a].some(Boolean));
  let result = null;
  if (fielded.length === 2) result = resolveBattle(m.armies[0], m.armies[1]);
  else if (fielded.length === 1) {
    const a = fielded[0];
    const r = resolveUncontested(m.armies[a]);
    result = a === 0 ? r : { ...r, fronts: r.fronts.map((x) => -x), winner: "B", wonA: 0, wonB: r.wonA };
  }

  let awarded = new Map();
  if (result) {
    awarded = spoils(result, m.armies[0], m.armies[1]);
    for (const [p, v] of awarded) g.players[p].vp += v;
  }

  g.round++;
  g.start = (g.start + 1) % n;
  if (log) log({ armies: m.armies, result, awarded, committed, turnsTaken });
  return { committed, turnsTaken, result, awarded };
}

// ---- a whole game -----------------------------------------------------------
export function playGame(factionKeys, target, seed) {
  const rnd = makeRng(seed);
  const g = newGame(factionKeys, target);
  const n = g.players.length;
  const stats = { rounds: 0, commits: new Array(n).fill(0), satOut: new Array(n).fill(0), quiet: 0 };

  for (let guard = 0; guard < 200; guard++) {
    const r = playRound(g, rnd);
    stats.rounds++;
    for (let i = 0; i < n; i++) {
      stats.commits[i] += r.turnsTaken[i];
      if (r.turnsTaken[i] === 0) stats.satOut[i]++;
    }
    if (r.committed === 0) { stats.quiet++; stats.end = "quiet"; break; }
    const top = Math.max(...g.players.map((p) => p.vp));
    if (top >= target) { stats.end = "target"; break; }
    if (g.players.every((p) => available(p).length === 0)) { stats.end = "dry"; break; }
  }
  if (!stats.end) stats.end = "guard";

  const top = Math.max(...g.players.map((p) => p.vp));
  stats.winners = g.players.filter((p) => p.vp === top).map((p) => p.seat);
  stats.vp = g.players.map((p) => p.vp);
  stats.factions = factionKeys;
  return stats;
}
