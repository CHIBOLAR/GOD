// DECCAN II — the whole game: THREE armies, alliances, and the recruit-on-defeat economy.
//
// Three armies instead of two is what opens the player count: 3 armies x 3 units = NINE slots,
// so eight players all get a post. It also turns the politics three-way, which is a different
// and richer negotiation than picking a side.
//
// Every player runs the SAME policy, so any asymmetry measured here is structural — it comes
// from the seat or the faction, not from one side playing better.

import { FACTIONS, BROKERS, ARMS, PREY, TIMING, beats } from "./cards.mjs";
import { resolveBattle, spoils } from "./battle.mjs";

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
export const NUM_ARMIES = Number(process.env.ARMIES || 2);
export const ARMY_CAP = Number(process.env.CAP || 3);
export const MAX_PER_ARMY = ARMY_CAP;
// A Spy's theft is PERMANENT: the two cards change owner for good. Measured as free —
// faction deviation 6.7 vs 7.0 — because a theft completes in only 12-31%% of games.
const PERMANENT_SWAP = process.env.PERMSWAP !== "0";

// ---- THE REFUSAL FORK (REFUSALFORK=1) ---------------------------------------------------
// Baseline: a refused unit simply does not join, and the offerer tries the other army or passes.
// Refusing is therefore nearly free, and the blind accept carries almost no read.
//
// Fork: A REFUSED UNIT LANDS IN THE OTHER ARMY INSTEAD. Refusing no longer makes the card go
// away — it re-aims it. "Accept me, or I strengthen the people you are fighting" becomes a real
// threat, and the blind accept turns into a two-sided read.
//
// ⚠️ THE MECHANIC ALONE WOULD BE UNTESTABLE, exactly as face-up Rockets was: if the leader's
// decision ignored the consequence, this lever would only add noise and the gates would measure
// nothing. So the DECISION moves with it — and it moves WITHOUT a new tuned constant. The leader
// keeps the same two probabilities; what changes is the board being compared. Baseline asks
// "is another army already bigger than mine?" The fork asks "would another army be bigger than
// mine ONCE MY REFUSAL LANDS THERE?" — a single increment, which is exactly what the rule adds.
const REFUSAL_FORK = process.env.REFUSALFORK === "1";

// ---- THE OFFER (BROKEROFFER=1) -----------------------------------------------------------
// Baseline: the supply is face down and a defeated player draws BLIND. Broker identity is
// therefore a 4-of-20 shuffle — unreadable, so any decision keyed to "do they hold X" is a
// gamble, not a deduction. That is why the scorch could not fork.
//
// The offer: THREE BROKERS LIE FACE UP FROM SETUP. A defeated player CHOOSES one of the three,
// and it is refilled at once. Two things change, and both feed deduction:
//   1. Taking is a CHOICE, made in public, that tells the table what you think you need.
//   2. Broker identity becomes KNOWN. Everyone watched you take it, so what you hold is
//      countable exactly like a Force — which is the property that makes a read possible.
const BROKER_OFFER = process.env.BROKEROFFER === "1";
const OFFER_SIZE = Number(process.env.OFFER || 3);

// Where a refusal would land, or undefined if there is nowhere legal — in which case the
// refusal is just a refusal and the baseline behaviour stands.
export function refusalLandsIn(m, seat, fromArmy) {
  if (!REFUSAL_FORK) return undefined;
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (a === fromArmy) continue;
    if (m.armies[a].length >= ARMY_CAP) continue;
    const members = new Set(m.armies[a].map((u) => u.owner));
    if (!members.has(seat) && members.size >= MAX_PER_ARMY) continue;
    return a;
  }
  return undefined;
}

export function newGame(factionKeys, target, rnd) {
  const supply = [];
  for (const b of BROKERS) for (let i = 0; i < b.copies; i++) supply.push({ ...b, isBroker: true });
  for (let i = supply.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [supply[i], supply[j]] = [supply[j], supply[i]];
  }
  // three face up from setup, before a single unit is committed
  const offer = BROKER_OFFER ? supply.splice(-OFFER_SIZE) : [];
  return {
    target, round: 0, start: 0, supply, offer,
    players: factionKeys.map((k, i) => {
      const f = FACTIONS.find((x) => x.key === k);
      return { seat: i, faction: f, vp: 0, hand: f.units.map((u) => ({ ...u, spent: false, rest: 0 })) };
    }),
  };
}

export const available = (p, round) => p.hand.filter((u) => !u.spent && u.rest <= round);

export function legalMoves(g, seat, m) {
  const moves = [{ pass: true }];
  const units = available(g.players[seat], g.round);
  if (!units.length) return moves;
  const mine = m.armyOf.get(seat);
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (mine !== undefined && mine !== a) continue;          // only ever one army
    if (m.armies[a].length >= ARMY_CAP) continue;
    const members = new Set(m.armies[a].map((u) => u.owner));
    if (!members.has(seat) && members.size >= MAX_PER_ARMY) continue;
    if (mine === undefined && m.leader[a] !== null && m.leader[a] !== seat
      && m.offered.has(a)) continue;                         // one offer per army per turn
    for (const u of units) moves.push({ unit: u, army: a });
  }
  return moves;
}

// ⚠️ Units commit FACE DOWN. Public information only: army sizes, whose units they are, what
// each player has already burned, and anything a Siege Elephant has revealed.
export function scoreMove(g, seat, m, mv) {
  if (mv.pass) return PASS_BASE;
  const u = mv.unit;
  const mineArmy = m.armies[mv.army];
  const foes = m.armies.flatMap((a, i) => (i === mv.army ? [] : a));
  const killers = ARMS.filter((t) => beats(t, u.arm));
  const prey = PREY[u.arm];

  let pSurvive = 1, expCancel = 0;
  for (const f of foes) {
    if (f.revealed) {
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
  const biggest = Math.max(...m.armies.map((a, i) => (i === mv.army ? 0 : a.length)));
  if (biggest > mineArmy.length) s += BEHIND_BONUS;
  return s;
}

export function choose(moves, scores, rnd) {
  const max = Math.max(...scores);
  const w = scores.map((x) => Math.exp((x - max) / TEMPERATURE));
  const tot = w.reduce((a, b) => a + b, 0);
  let r = rnd() * tot;
  for (let i = 0; i < moves.length; i++) if ((r -= w[i]) <= 0) return moves[i];
  return moves[moves.length - 1];
}

// A leader judges an offer BLIND — the unit is face down.
// `forkArmy`, when set, is where this refusal would land: the leader is choosing between
// "the card joins me" and "the card joins them", not between "the card joins me" and nothing.
export function accepts(m, army, rnd, forkArmy) {
  const mineN = m.armies[army].length;
  let biggest = Math.max(...m.armies.map((a, i) => (i === army ? 0 : a.length)));
  if (forkArmy !== undefined) biggest = Math.max(biggest, m.armies[forkArmy].length + 1);
  return rnd() < (biggest >= mineN ? 0.75 : 0.35);
}

// One commit path, used both by a normal commit and by a refusal that lands elsewhere, so a
// re-aimed unit is a unit in every respect — it leads an empty army, it fires a Siege Elephant.
export function commitUnit(g, m, seat, unit, army, rnd) {
  unit.rest = g.round + 1;
  const card = {
    arm: unit.arm, s: unit.s,
    broker: unit.isBroker ? unit.key : undefined,
    owner: seat, ref: unit, army, revealed: !!unit.faceUp,
  };
  m.armies[army].push(card);
  if (m.leader[army] === null) m.leader[army] = seat;
  m.armyOf.set(seat, army);
  if (card.broker === "siege") {                        // face up, reveals one enemy unit
    const hidden = m.armies.flatMap((a, i) => (i === army ? [] : a)).filter((x) => !x.revealed);
    if (hidden.length) hidden[Math.floor(rnd() * hidden.length)].revealed = true;
  }
  if (card.broker) (m.used[seat] ||= new Set()).add(card.broker);
  return card;
}

// Which of the face-up brokers a defeated player takes. A blind draw needs no judgement; an
// open offer does, and modelling it as random would measure the mechanic while missing the
// decision — the mistake that made the face-up Rockets run uninformative.
// No new constants: this is the SAME survival estimate scoreMove already uses, applied to the
// three cards on the table. A broker is worth its strength times the chance it lives.
// ---- what a broker is WORTH, in expected points -------------------------------------------
// The first version of this scored strength x survival, which is blind to what a card DOES and
// therefore ranked the printed 2 last by construction. It reported the Subhedar as the least
// wanted broker when the Subhedar is in fact the highest-marginal card in the set.
//
// GROUND is MEASURED, by enumerating every broker in every army of 1-3 against every enemy army
// of 1-3 and comparing it with its own arm's Force unit (the "+1 shadow", D029). These are the
// marginal shifts in taking the ground, as fractions:
const GROUND = { siege: 0.004, rockets: 0.004, spy: -0.068, sepoy: 0.100, subhedar: 0.121 };
//
// ⚠️ OFF-AXIS is NOT measured and CANNOT be, because the ground metric is blind to it: the Siege
// Elephant trades in information, the Rockets in denying a winner their recovery, the Spy in
// permanent card advantage across the whole game. These three numbers are STATED JUDGEMENTS,
// in the same unit (expected points), and they are the assumptions this model rests on:
//   siege   0.25  one blind commit turned into an informed one; a commit is worth ~1 point
//   rockets 0.35  fires on a loss (~50%), burning ~2.0 recovering units (the measured mean army
//                 size), each worth ~1 future point to an opponent — denial, so discounted
//   spy     0.40  D036 measures a theft completing in 12-31% of games; when it lands it is two
//                 cards of swing for the rest of the game
// They are env-tunable ON PURPOSE, so the pick rates below can be sensitivity-tested rather
// than believed. If a conclusion moves when these move, it is an assumption, not a finding.
const OFFAXIS = {
  siege: Number(process.env.V_SIEGE ?? 0.25),
  rockets: Number(process.env.V_ROCKETS ?? 0.35),
  spy: Number(process.env.V_SPY ?? 0.40),
  sepoy: 0, subhedar: 0,                        // these two pay in ground; GROUND already has them
};

function pickFromOffer(g, seat) {
  let best = 0, bestScore = -Infinity;
  for (let i = 0; i < g.offer.length; i++) {
    const b = g.offer[i];
    let pSurvive = 1;
    for (const f of g.players) {
      if (f.seat === seat) continue;
      const pool = available(f, g.round);
      if (!pool.length) continue;
      pSurvive *= 1 - pool.filter((c) => beats(c.arm, b.arm)).length / pool.length;
    }
    // A card scores a point if it survives in a winning army; GROUND shifts that chance.
    // The off-axis part also needs the card to live — EXCEPT ON DEPLOY, which beats the ring.
    // The timing keyword is doing real work here, not just wording the card.
    const live = b.when === TIMING.DEPLOY ? 1 : pSurvive;
    const sc = pSurvive * (0.5 + (GROUND[b.key] || 0)) + live * (OFFAXIS[b.key] || 0);
    if (sc > bestScore) { bestScore = sc; best = i; }
  }
  return best;
}

export let st_swaps = 0;
export const resetSwaps = () => { st_swaps = 0; };
// How often a refusal was actually RE-AIMED rather than simply declined. If this is near zero
// the lever is inert and any gate movement is noise, not the rule.
export let st_reaimed = 0, st_offers = 0;
export const resetReaimed = () => { st_reaimed = 0; st_offers = 0; };
// Which brokers actually get recruited. Blind draw must come out uniform; if the OFFER comes
// out uniform too, the choice is inert and the lever is only cosmetics.
export const st_taken = new Map();
export const resetTaken = () => st_taken.clear();
// THE SETTLE STEP, extracted so the online engine resolves a round with the SAME code the
// gates measure. Does not advance the round or the start player - the caller owns that.
export function settleRound(g, m, rnd) {
  const fielded = m.armies.map((a, i) => (a.length ? i : -1)).filter((i) => i >= 0);
  let result = null, awarded = new Map();
  if (fielded.length) {
    result = resolveBattle(m.armies);
    awarded = spoils(result);
    for (const [p, v] of awarded) g.players[p].vp += v;
  }

  // ---- a Spy's theft: PERMANENT if enabled. The two cards change owner for good, each
  // joining the other player's deck. Otherwise the swap lasts only the battle.
  if (result) st_swaps += result.swaps.length;
  if (PERMANENT_SWAP && result) {
    for (const sw of result.swaps) {
      const thief = g.players[sw.thief], victim = g.players[sw.victim];
      const iSpy = thief.hand.indexOf(sw.spy.ref), iTaken = victim.hand.indexOf(sw.taken.ref);
      if (iSpy < 0 || iTaken < 0) continue;
      thief.hand.splice(iSpy, 1); victim.hand.splice(iTaken, 1);
      thief.hand.push(sw.taken.ref); victim.hand.push(sw.spy.ref);
      sw.spy.ref.owner = sw.victim; sw.taken.ref.owner = sw.thief;
      sw.spy.army = sw.taken.army;                 // each follows its new army's fate
      sw.taken.army = sw.spy.army;
    }
  }

  // ---- the economy: winners recover, the defeated burn and each recruits one broker
  const rocketsFired = result
    ? result.armies.some((a, i) => !result.winners.has(i) && a.some((u) => u.broker === "rockets"))
    : false;
  const recruited = new Map();
  for (const a of fielded) {
    const won = result.winners.has(a);
    for (const u of m.armies[a]) {
      if (won && !rocketsFired) u.ref.rest = g.round + 2;   // recovers, sits out a round
      else u.ref.spent = true;                              // gone for good
    }
    if (won) continue;
    for (const p of new Set(m.armies[a].map((u) => u.owner))) {
      let card;
      if (BROKER_OFFER) {
        if (!g.offer.length) continue;                    // offer exhausted, nothing to take
        card = g.offer.splice(pickFromOffer(g, p), 1)[0];
        const refill = g.supply.pop();
        if (refill) g.offer.push(refill);                 // topped straight back up to three
      } else {
        card = g.supply.pop();
        if (!card) continue;
      }
      st_taken.set(card.key, (st_taken.get(card.key) || 0) + 1);
      g.players[p].hand.push({ ...card, spent: false, rest: g.round + 1 });
      recruited.set(p, (recruited.get(p) || 0) + 1);
    }
  }
  return { fielded, result, awarded, recruited, rocketsFired };
}

export function playRound(g, rnd) {
  const n = g.players.length;
  const m = {
    armies: Array.from({ length: NUM_ARMIES }, () => []),
    leader: new Array(NUM_ARMIES).fill(null),
    armyOf: new Map(), offered: new Set(), used: [],
    pools: g.players.map((p) => available(p, g.round).map((u) => ({ arm: u.arm, s: u.s }))),
  };
  let passStreak = 0, seat = g.start, committed = 0;
  const turns = new Array(n).fill(0);

  while (passStreak < n) {
    m.offered.clear();
    let acted = false;
    for (let attempt = 0; attempt < NUM_ARMIES && !acted; attempt++) {
      const moves = legalMoves(g, seat, m);
      const mv = choose(moves, moves.map((x) => scoreMove(g, seat, m, x)), rnd);
      if (mv.pass) break;
      const joining = m.armyOf.get(seat) === undefined
        && m.leader[mv.army] !== null && m.leader[mv.army] !== seat;
      // A refused unit either vanishes (baseline) or lands in the other army (REFUSAL_FORK).
      let into = mv.army;
      if (joining) {
        st_offers++;
        const lands = refusalLandsIn(m, seat, mv.army);
        if (!accepts(m, mv.army, rnd, lands)) {
          m.offered.add(mv.army);
          if (lands === undefined) continue;              // nowhere to land: an ordinary refusal
          into = lands; st_reaimed++;                     // re-aimed at the other army
        }
      }
      commitUnit(g, m, seat, mv.unit, into, rnd);
      acted = true; committed++; turns[seat]++;
    }
    passStreak = acted ? 0 : passStreak + 1;
    seat = (seat + 1) % n;
  }

  const { fielded, result, awarded, recruited, rocketsFired } = settleRound(g, m, rnd);

  g.round++;
  g.start = (g.start + 1) % n;
  return {
    committed, turns, awarded, recruited, result, rocketsFired, used: m.used,
    fielded: fielded.length,
    allied: m.armies.filter((a) => new Set(a.map((u) => u.owner)).size > 1).length,
  };
}

export function playGame(factionKeys, target, seed) {
  const rnd = makeRng(seed);
  const g = newGame(factionKeys, target, rnd);
  const n = g.players.length;
  const supplySize = BROKERS.reduce((s, b) => s + b.copies, 0);
  const st = {
    rounds: 0, commits: new Array(n).fill(0), satOut: new Array(n).fill(0),
    recruits: new Array(n).fill(0), alliedRounds: 0, rockets: 0, supplyUsed: 0, armiesSum: 0,
    used: Array.from({ length: n }, () => new Set()),
  };
  let quiet = 0;

  for (let guard = 0; guard < 300; guard++) {
    const r = playRound(g, rnd);
    st.rounds++; st.armiesSum += r.fielded;
    for (let i = 0; i < n; i++) {
      st.commits[i] += r.turns[i];
      if (r.turns[i] === 0) st.satOut[i]++;
      st.recruits[i] += r.recruited.get(i) || 0;
      for (const k of (r.used[i] || [])) st.used[i].add(k);
    }
    if (r.allied) st.alliedRounds++;
    if (r.rocketsFired) st.rockets++;
    quiet = r.committed === 0 ? quiet + 1 : 0;
    if (quiet >= 2) { st.end = "quiet"; break; }
    if (Math.max(...g.players.map((p) => p.vp)) >= target) { st.end = "target"; break; }
    if (g.players.every((p) => available(p, g.round).length === 0)) { st.end = "dry"; break; }
  }
  if (!st.end) st.end = "guard";
  // cards face up in the offer are not yet recruited, so they do not count as drawn
  st.supplyUsed = supplySize - g.supply.length - g.offer.length;
  const top = Math.max(...g.players.map((p) => p.vp));
  st.winners = g.players.filter((p) => p.vp === top).map((p) => p.seat);
  st.vp = g.players.map((p) => p.vp);
  return st;
}
