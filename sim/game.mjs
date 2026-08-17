// DECCAN II — the whole game, WITH ALLIANCES.
//
// Everything else in sim/ measures a two-player duel. This is the only model that contains
// what the game actually is: several players, two armies, units from up to three players in
// each, per-player scoring inside a shared army, and the recruit-on-defeat economy.
//
// Every player runs the SAME policy, so any asymmetry measured here is structural — it comes
// from the seat or the faction, not from one side playing better.

import { FACTIONS, BROKERS, ARMS, PREY, beats } from "./cards.mjs";
import { resolveBattle, resolveUncontested } from "./battle.mjs";

export function makeRng(seed) {
  let x = seed >>> 0;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---- policy knobs -----------------------------------------------------------
const TEMPERATURE = 0.4;
const PASS_BASE = 1.5;       // the standing value of keeping a card in hand
const OWN_WEIGHT = 0.30;     // strength I expect to actually contribute
const CANCEL_WEIGHT = 0.28;  // enemy strength I expect to cancel
const COST = 0.05;           // spending a big unit costs more than a small one
const ALLY_TAX = 0.5;        // an ally in my army races me for the points
const BEHIND_BONUS = 0.6;    // answering an army that is visibly bigger
const ARMY_CAP = 3;
const MAX_PER_ARMY = 3;      // at most three players per army

export function newGame(factionKeys, target, rnd) {
  const supply = [];
  for (const b of BROKERS) for (let i = 0; i < b.copies; i++) supply.push({ ...b, isBroker: true });
  for (let i = supply.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [supply[i], supply[j]] = [supply[j], supply[i]];
  }
  return {
    target, round: 0, start: 0, supply,
    players: factionKeys.map((k, i) => {
      const f = FACTIONS.find((x) => x.key === k);
      return { seat: i, faction: f, vp: 0, hand: f.units.map((u) => ({ ...u, spent: false, rest: 0 })) };
    }),
  };
}

const available = (p, round) => p.hand.filter((u) => !u.spent && u.rest <= round);

function legalMoves(g, seat, m) {
  const moves = [{ pass: true }];
  const units = available(g.players[seat], g.round);
  if (!units.length) return moves;
  const mine = m.armyOf.get(seat);
  for (let a = 0; a < 2; a++) {
    if (mine !== undefined && mine !== a) continue;            // never both armies
    if (m.armies[a].length >= ARMY_CAP) continue;
    const members = new Set(m.armies[a].map((u) => u.owner));
    if (!members.has(seat) && members.size >= MAX_PER_ARMY) continue;
    if (mine === undefined && m.leader[a] !== null && m.leader[a] !== seat
      && m.offered.has(a)) continue;                           // one offer per army per turn
    for (const u of units) moves.push({ unit: u, army: a });
  }
  return moves;
}

// ⚠️ Units commit FACE DOWN. This may read only public information: army sizes, whose units
// they are, what each player has already burned, and whatever a Siege Elephant has revealed.
function scoreMove(g, seat, m, mv) {
  if (mv.pass) return PASS_BASE;
  const u = mv.unit;
  const foe = m.armies[1 - mv.army], mineArmy = m.armies[mv.army];
  const killers = ARMS.filter((t) => beats(t, u.arm));
  const prey = PREY[u.arm];

  let pSurvive = 1, expCancel = 0;
  for (const f of foe) {
    if (f.revealed) {                                    // a known card is judged exactly
      if (beats(f.arm, u.arm)) pSurvive = 0;
      if (prey.includes(f.arm)) expCancel = Math.max(expCancel, f.s);
      continue;
    }
    const pool = m.pools[f.owner];
    if (!pool.length) continue;
    let nKill = 0, preySum = 0, nPrey = 0;
    for (const c of pool) {
      if (killers.includes(c.arm)) nKill++;
      if (prey.includes(c.arm)) { preySum += c.s; nPrey++; }
    }
    pSurvive *= 1 - nKill / pool.length;
    if (nPrey) expCancel = Math.max(expCancel, preySum / pool.length);
  }

  let s = OWN_WEIGHT * u.s * pSurvive + CANCEL_WEIGHT * expCancel - COST * u.s;
  s -= ALLY_TAX * new Set(mineArmy.filter((x) => x.owner !== seat).map((x) => x.owner)).size;
  if (foe.length > mineArmy.length) s += BEHIND_BONUS;
  return s;
}

function pick(moves, scores, rnd) {
  const max = Math.max(...scores);
  const w = scores.map((x) => Math.exp((x - max) / TEMPERATURE));
  const tot = w.reduce((a, b) => a + b, 0);
  let r = rnd() * tot;
  for (let i = 0; i < moves.length; i++) if ((r -= w[i]) <= 0) return moves[i];
  return moves[moves.length - 1];
}

// A leader judges an offer BLIND — the unit is face down, so this cannot look at the card.
function accepts(m, army, rnd) {
  const mineN = m.armies[army].length, foeN = m.armies[1 - army].length;
  return rnd() < (foeN >= mineN ? 0.75 : 0.35);
}

export function playRound(g, rnd) {
  const n = g.players.length;
  const m = {
    armies: [[], []], leader: [null, null], armyOf: new Map(), offered: new Set(),
    pools: g.players.map((p) => available(p, g.round).map((u) => ({ arm: u.arm, s: u.s }))),
  };
  let passStreak = 0, seat = g.start, committed = 0;
  const turns = new Array(n).fill(0);

  while (passStreak < n) {
    m.offered.clear();
    let acted = false;
    for (let attempt = 0; attempt < 2 && !acted; attempt++) {
      const moves = legalMoves(g, seat, m);
      const mv = pick(moves, moves.map((x) => scoreMove(g, seat, m, x)), rnd);
      if (mv.pass) break;
      const joining = m.armyOf.get(seat) === undefined
        && m.leader[mv.army] !== null && m.leader[mv.army] !== seat;
      if (joining && !accepts(m, mv.army, rnd)) { m.offered.add(mv.army); continue; }
      mv.unit.rest = g.round + 1;
      const card = {
        arm: mv.unit.arm, s: mv.unit.s,
        broker: mv.unit.isBroker ? mv.unit.key : undefined,
        owner: seat, ref: mv.unit, army: mv.army, revealed: !!mv.unit.faceUp,
      };
      m.armies[mv.army].push(card);
      if (m.leader[mv.army] === null) m.leader[mv.army] = seat;
      m.armyOf.set(seat, mv.army);
      if (card.broker === "siege") {                    // deploys face up, reveals one enemy
        const hidden = m.armies[1 - mv.army].filter((x) => !x.revealed);
        if (hidden.length) hidden[Math.floor(rnd() * hidden.length)].revealed = true;
      }
      acted = true; committed++; turns[seat]++;
    }
    passStreak = acted ? 0 : passStreak + 1;
    seat = (seat + 1) % n;
  }

  const fielded = [0, 1].filter((a) => m.armies[a].length);
  let result = null;
  const winners = new Set(), losers = new Set();
  if (fielded.length === 2) {
    result = resolveBattle(m.armies[0], m.armies[1]);
    if (result.winner === "both") { winners.add(0); winners.add(1); }
    else {
      const w = result.winner === "A" ? 0 : 1;
      winners.add(w); losers.add(1 - w);
    }
  } else if (fielded.length === 1) {
    result = resolveUncontested(m.armies[fielded[0]]);
    winners.add(fielded[0]);
  }

  // ---- spoils: 1 point per SURVIVING unit of yours in a winning army
  const awarded = new Map();
  if (result) {
    for (const u of [...(result.armyA || []), ...(result.armyB || [])]) {
      if (u.owner === undefined || !winners.has(u.army)) continue;
      awarded.set(u.owner, (awarded.get(u.owner) || 0) + 1);
    }
    for (const [p, v] of awarded) g.players[p].vp += v;
  }

  // ---- the economy: the victorious recover, the defeated burn and recruit
  // A surviving Senapati in a beaten army kills the winner's recovering units instead.
  const subhedarFired = result
    ? [...(result.armyA || []), ...(result.armyB || [])]
      .some((u) => u.broker === "subhedar" && losers.has(u.army))
    : false;
  const recruited = new Map();
  for (const a of fielded) {
    const won = winners.has(a);
    for (const u of m.armies[a]) {
      if (won && !subhedarFired) u.ref.rest = g.round + 2;   // recovers, sits out a round
      else u.ref.spent = true;                                // gone for good
    }
    if (won) continue;
    for (const p of new Set(m.armies[a].map((u) => u.owner))) {
      const card = g.supply.pop();
      if (!card) continue;
      g.players[p].hand.push({ ...card, spent: false, rest: g.round + 1 });
      recruited.set(p, (recruited.get(p) || 0) + 1);
    }
  }

  g.round++;
  g.start = (g.start + 1) % n;
  return {
    committed, turns, awarded, recruited, result, subhedarFired,
    allied: m.armies.filter((a) => new Set(a.map((u) => u.owner)).size > 1).length,
  };
}

export function playGame(factionKeys, target, seed) {
  const rnd = makeRng(seed);
  const g = newGame(factionKeys, target, rnd);
  const n = g.players.length;
  const st = {
    rounds: 0, commits: new Array(n).fill(0), satOut: new Array(n).fill(0),
    recruits: new Array(n).fill(0), alliedRounds: 0, subhedar: 0, supplyUsed: 0,
  };
  let quiet = 0;

  for (let guard = 0; guard < 300; guard++) {
    const r = playRound(g, rnd);
    st.rounds++;
    for (let i = 0; i < n; i++) {
      st.commits[i] += r.turns[i];
      if (r.turns[i] === 0) st.satOut[i]++;
      st.recruits[i] += r.recruited.get(i) || 0;
    }
    if (r.allied) st.alliedRounds++;
    if (r.subhedarFired) st.subhedar++;
    quiet = r.committed === 0 ? quiet + 1 : 0;
    if (quiet >= 2) { st.end = "quiet"; break; }
    if (Math.max(...g.players.map((p) => p.vp)) >= target) { st.end = "target"; break; }
    if (g.players.every((p) => available(p, g.round).length === 0)) { st.end = "dry"; break; }
  }
  if (!st.end) st.end = "guard";
  st.supplyUsed = 25 - g.supply.length;
  const top = Math.max(...g.players.map((p) => p.vp));
  st.winners = g.players.filter((p) => p.vp === top).map((p) => p.seat);
  st.vp = g.players.map((p) => p.vp);
  return st;
}
