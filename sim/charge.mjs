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

export const NUM_ARMIES = Number(process.env.ARMIES || 2);

// ⚠️ A FULL BOARD CHARGES ITSELF, and this is not a tidying rule — it is what stops the game
// dying of hesitation. Nothing forced resolution, so a senior partner would sit on the charge
// waiting for a fatter harvest while everyone else shuffled units in and out of a board with no
// room. Measured at eight players: 201 turns across just 4.1 charges — six laps of the table
// between resolutions, of which 28% were withdrawals and 32% were passes.
// When every army is full there is nothing left to decide, so the armies charge.
const FORCED = process.env.FORCED !== "0";

// ---- DEFECTION (DEFECT=1) --------------------------------------------------------------------
// Move your WHOLE contingent from the army it stands in to another one. Your units may never be
// split across armies, so changing sides is all or nothing — which is what makes it a betrayal
// rather than a shuffle. The side you leave loses that strength and the side you join gains it,
// so it is a double swing where a withdrawal is only a single one.
//
// It costs your turn and nothing else. The price is paid in what it tells the table: the front
// is face up after a charge, so everyone watches you change sides and knows exactly what it did.
// ⚠️ ADOPTED, with its cost recorded. Defection improves completion (81% -> 85%) and seat
// fairness (3.2 -> 2.4) and costs faction deviation (4.0 -> 5.6), because a contingent that can
// change sides makes some rulers' arms worth more than others. The roster is tuned around it
// rather than the rule being dropped to protect a number. DEFECT=0 restores the old behaviour.
const DEFECT = process.env.DEFECT !== "0";
// How many units a Sepoy kills. Two is half the victory target from one card, so it is
// measured rather than assumed.
const SEPOY_SWINGS = Number(process.env.SEPOYSWINGS || 2);
export const ARMY_CAP = Number(process.env.CAP || 4);
export const MAX_PER_ARMY = ARMY_CAP;
// Four kills wins. Measured across 3-6: at four, every game from four players up reaches the
// target; higher targets only lengthen an already long game without improving fairness.
export const TARGET = Number(process.env.TARGET || 4);

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
// MARKET=0 restores the old blind draw from the supply.
export const MARKET_SIZE = Number(process.env.MARKET ?? 3);
export const PICK_ORDER = process.env.PICKORDER || "damage";

export function refillMarket(g) {
  while (g.market.length < MARKET_SIZE && g.supply.length) g.market.push(g.supply.pop());
}

// WHICH BROKER A PLAYER TAKES. ⚠️ D045: a choice the decision function ignores is untestable, so
// this is a real preference and not a coin flip — take the arm you are thinnest in, and break
// ties on strength. That makes the market measurably different from the blind draw it replaces.
export function chooseBroker(market, player) {
  const held = new Map();
  for (const u of player.hand) if (!u.spent) held.set(u.arm, (held.get(u.arm) || 0) + 1);
  let best = 0, bestKey = null;
  market.forEach((c, i) => {
    const key = [-(held.get(c.arm) || 0), c.s];
    if (!bestKey || key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) {
      best = i; bestKey = key;
    }
  });
  return best;
}

export function resolveCharge(armies) {
  const all = [];
  armies.forEach((a, ai) => a.forEach((u, ui) => all.push({ u, ai, ui })));
  const dead = armies.map((a) => new Array(a.length).fill(false));
  const kills = [];
  const pick = (k) => {
    let best = null;
    for (const t of all) {
      if (t.ai === k.ai || dead[t.ai][t.ui] || !beats(k.u.arm, t.u.arm)) continue;
      if (!best || t.u.s > best.u.s) best = t;
    }
    return best;
  };
  for (const k of [...all].sort((x, y) => y.u.s - x.u.s || x.ai - y.ai || x.ui - y.ui)) {
    // THE SEPOY CANCELS TWO. Everything else takes one target, strongest it can reach.
    const swings = k.u.broker === "sepoy" ? SEPOY_SWINGS : 1;
    for (let n = 0; n < swings; n++) {
      const t = pick(k);
      if (!t) break;
      dead[t.ai][t.ui] = true;
      kills.push({ by: k, hit: t });

    }
  }

  // ---- survivors act. Only what lives through the ring gets to do anything.
  const alive = (t) => !dead[t.ai][t.ui];
  const survivors = all.filter(alive);
  const others = (ai) => survivors.filter((t) => t.ai !== ai && alive(t));

  // WHICH SIDE WON. Not for points — points are kills, and that does not change. Winning decides
  // WHOSE ABILITY FIRES and who moves first next, which is what gives ON VICTORY and ON DEFEAT
  // their meaning back. Higher surviving strength takes it; level strength and nobody does.
  const strength = armies.map((a, ai) => a.reduce((n2, u, ui) => n2 + (dead[ai][ui] ? 0 : u.s), 0));
  const top = Math.max(...strength);
  const victors = strength.filter((x) => x === top).length === 1
    ? strength.indexOf(top) : -1;

  // THE SUBHEDAR kills the enemy's weakest survivor — but only ON VICTORY.
  for (const k of survivors) {
    if (k.u.broker !== "subhedar" || !alive(k) || k.ai !== victors) continue;
    const t = others(k.ai).reduce((b, x) => (!b || x.u.s < b.u.s ? x : b), null);
    if (t) { dead[t.ai][t.ui] = true; kills.push({ by: k, hit: t, ability: "subhedar" }); }
  }

  // THE SPY exchanges with the enemy's strongest survivor — permanently, so the two cards
  // change hands for the rest of the game. Recorded for the caller to carry out.
  // SULTAN ROCKETS burn on the way down — ON DEFEAT, they kill one surviving enemy.
  for (const k of survivors) {
    if (k.u.broker !== "rockets" || !alive(k) || victors < 0 || k.ai === victors) continue;
    const t = others(k.ai).reduce((b, x) => (!b || x.u.s > b.u.s ? x : b), null);
    if (t) { dead[t.ai][t.ui] = true; kills.push({ by: k, hit: t, ability: "rockets" }); }
  }

  const swaps = [];
  for (const k of survivors) {
    if (k.u.broker !== "spy" || !alive(k)) continue;
    const t = others(k.ai).reduce((b, x) => (!b || x.u.s > b.u.s ? x : b), null);
    if (t) swaps.push({ spy: k, taken: t });
  }
  return { dead, kills, swaps, victors };
}

// ---- creation -----------------------------------------------------------------
export function newGame(factionKeys, rnd) {
  const supply = [];
  for (const b of BROKERS) for (let i = 0; i < b.copies; i++) supply.push({ ...b, isBroker: true });
  for (let i = supply.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [supply[i], supply[j]] = [supply[j], supply[i]];
  }
  const g = {
    supply, market: [], charge: 0, turn: 0, start: 0,
    armies: Array.from({ length: NUM_ARMIES }, () => []),
    leader: new Array(NUM_ARMIES).fill(null),
    players: factionKeys.map((k, i) => {
      const f = FACTIONS.find((x) => x.key === k);
      return { seat: i, faction: f, vp: 0, hand: f.units.map((u) => ({ ...u, spent: false })) };
    }),
  };
  refillMarket(g);            // the row is face up from the first turn, before anyone has lost
  return g;
}

const armyOf = (g, seat) => g.armies.findIndex((a) => a.some((c) => c.owner === seat));
// A withdrawn unit does NOT go straight back into the hand — it RECOVERS for one turn. Without
// that, pulling a unit home and dropping it somewhere else is free, and the front becomes a
// shuffling contest. `readyAt` is measured on the global turn clock, one full lap of the table.
const inHand = (p, g) =>
  p.hand.filter((u) => !u.spent && !u.onBoard && (u.readyAt ?? 0) <= g.turn);
export const recovering = (p, g) =>
  p.hand.filter((u) => !u.spent && !u.onBoard && (u.readyAt ?? 0) > g.turn);

// ---- what a player may do ------------------------------------------------------
export function legalActions(g, seat) {
  const acts = [{ pass: true }];
  const p = g.players[seat];
  const units = inHand(p, g);
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
  // ONE UNIT, ONE TURN — the rule the whole game runs on, and defection is not exempt.
  //
  // ⚠️ You may cross only when you are down to a SINGLE unit. Two units cannot both move (that
  // would be two actions in one turn) and one cannot move alone (that would leave you standing
  // in both armies, which no rule in this game allows). So betrayal takes PREPARATION: withdraw
  // until one unit remains, sit through its recovery, then cross. It is a plan, never a whim.
  if (DEFECT && mine >= 0 && g.armies[mine].filter((c) => c.owner === seat).length === 1) {
    const contingent = g.armies[mine].filter((c) => c.owner === seat);
    for (let a = 0; a < NUM_ARMIES; a++) {
      if (a === mine) continue;
      if (g.armies[a].length + contingent.length > ARMY_CAP) continue;
      const members = new Set(g.armies[a].map((c) => c.owner));
      if (!members.has(seat) && members.size >= MAX_PER_ARMY) continue;
      acts.push({ defect: contingent, from: mine, to: a });
    }
  }
  // only a senior partner may call it, and only with something to charge with
  if (mine >= 0 && g.leader[mine] === seat && g.armies[mine].length) acts.push({ charge: true });
  return acts;
}

// ---- WHAT A BOT SAYS IT IS ------------------------------------------------------------------
// A declaration is only worth making if it cannot be read, so this is a mixed strategy: silence,
// truth, and one specific lie, chosen at random every time.
//
// THE LIE IS DERIVED FROM THE RING, not invented. If you claim arm Y, opponents counter by
// deploying the arms that KILL Y — the two before it. You want those to be arms your REAL unit
// kills — the two after it. Solving killers(Y) = prey(X) gives Y = X + 3. So a bot holding an
// Elephant claims Horseman: the table brings Riflemen and Cannons to deal with the horse, and
// the Elephant eats both.
//
// ⚠️ THE GATES CANNOT MEASURE ANY OF THIS. Nothing in the policy READS a declaration, so a claim
// changes no simulated decision and the numbers will not move a hair — the same untestability
// trap recorded in D045. This is a human-facing rule, and only a table can price it.
export function declarationFor(unit, rnd) {
  const r = rnd();
  if (r < 0.35) return null;                                   // say nothing
  if (r < 0.65) return unit.arm;                               // the truth
  return ARMS[(ARMS.indexOf(unit.arm) + 3) % 5];               // the trap
}

export const boardFull = (g) => g.armies.every((a) => a.length >= ARMY_CAP);

// `claim` is what the player SAYS this unit is. It may be a lie. It is attached to the card and
// dies with the charge — a bluff is true or false in the moment it is called, and keeping a
// ledger of past lies would turn a read into bookkeeping.
export function commit(g, seat, unit, army, claim = null) {
  unit.onBoard = true;
  const card = { owner: seat, arm: unit.arm, s: unit.s, ref: unit, claim,
    broker: unit.isBroker ? unit.key : undefined, revealed: !!unit.faceUp };
  g.armies[army].push(card);
  if (g.leader[army] === null) g.leader[army] = seat;
  // THE SIEGE ELEPHANT LOOKS on deployment — one enemy unit turns face up for the whole table.
  if (card.broker === "siege") {
    const hidden = g.armies.flatMap((a, i) => (i === army ? [] : a)).filter((c) => !c.revealed);
    if (hidden.length) hidden[0].revealed = true;
  }
  return card;
}

// ---- the charge -----------------------------------------------------------------
export function charge(g) {
  const { dead, kills, swaps, victors } = resolveCharge(g.armies);

  // paid for what you killed
  const scored = new Map();
  for (const { by, hit } of kills) {
    g.players[by.u.owner].vp += 1;
    scored.set(by.u.owner, (scored.get(by.u.owner) || 0) + 1);
  }

  // the cancelled burn; everything else stands, now face up
  const lost = new Map(), lostStr = new Map();
  for (let a = 0; a < NUM_ARMIES; a++) {
    const keep = [];
    g.armies[a].forEach((c, i) => {
      if (dead[a][i]) {
        c.ref.spent = true; c.ref.onBoard = false;
        lost.set(c.owner, (lost.get(c.owner) || 0) + 1);
        lostStr.set(c.owner, (lostStr.get(c.owner) || 0) + c.s);
      } else { c.revealed = true; keep.push(c); }
    });
    g.armies[a] = keep;
    if (!keep.length) g.leader[a] = null;
    else {
      // SENIORITY PASSES TO THE GREATEST SURVIVING STRENGTH. Ties keep the incumbent.
      //
      // ⚠️ This used to reassign ONLY when the incumbent had no survivors left, which is not the
      // rule — it let a senior partner reduced to a Warrior 1 keep command over an ally standing
      // with an Elephant 9. Command is the right to call the charge, so the wrong holder is a
      // real advantage handed to whoever happened to deploy first, forever.
      const by = new Map();
      for (const c of keep) by.set(c.owner, (by.get(c.owner) || 0) + c.s);
      const top = Math.max(...by.values());
      g.leader[a] = by.get(g.leader[a]) === top ? g.leader[a]
        : [...by.entries()].filter(([, v]) => v === top).sort((x, y) => x[0] - y[0])[0][0];
    }
  }

  // BROKERS FOR CASUALTIES. Compensation is for losses now, not for defeat — one per player
  // per charge, so the player being killed most is armed fastest. Same rubber band, new hook.
  // ⚠️ EVERY CASUALTY IS PAID, and the alternatives were both measured and rejected.
  // Paying only the heaviest loser per charge keeps the supply comfortable (10.8 of 15 left)
  // but concentrates the compensation and the rulers diverge: deviation 4.0 -> 6.1. Raising the
  // supply instead is worse again, because brokers are strong cards and more of them in
  // circulation widens the gap (4.9 at 15, 5.5 at 20, 6.6 at 25). A broad, even rubber band is
  // what holds the eight rulers together, and the price is a supply that finishes nearly spent.
  // ---- THE MARKET. Three brokers face up, and casualties CHOOSE. -------------------------
  // Compensation used to be a blind draw, which made the strongest cards in the game a lottery
  // paid to the people already losing. A face-up row of three turns it into a decision everyone
  // at the table can see coming, and gives SENIORITY A SECOND JOB — until now it decided only
  // who may call the charge.
  //
  // THE BIGGEST LOSER CHOOSES FIRST. Brokers are compensation, so the order runs on what you
  // LOST, never on what survived.
  //
  // ⚠️ Ordering by seniority was tried and is wrong, for a reason worth keeping written down:
  // seniority is greatest SURVIVING strength, so it hands the pick of the row to the casualty
  // who was hurt least, and a player wiped out entirely has nothing left and picks last. That
  // points the rubber band backwards.
  //
  // MOST UNITS LOST, then GREATEST STRENGTH LOST, then seat order. The tiebreak is not a detail:
  // most casualties lose exactly one unit, so strength-lost is what actually decides most picks,
  // and losing an Elephant 9 should outrank losing a Warrior 1.
  // PICKORDER=senior and PICKORDER=turn restore the alternatives for measurement.
  const recruited = new Map();
  const order = [...lost.keys()];
  if (PICK_ORDER === "damage") {
    order.sort((x, y) => lost.get(y) - lost.get(x)
      || (lostStr.get(y) || 0) - (lostStr.get(x) || 0) || x - y);
  } else if (PICK_ORDER === "senior") {
    const str = new Map();
    for (const a of g.armies) for (const c of a) str.set(c.owner, (str.get(c.owner) || 0) + c.s);
    order.sort((x, y) => (str.get(y) || 0) - (str.get(x) || 0) || x - y);
  }
  for (const seat of order) {
    if (!MARKET_SIZE) {                      // MARKET=0 restores the old blind draw
      const card = g.supply.pop();
      if (!card) continue;
      g.players[seat].hand.push({ ...card, spent: false });
      recruited.set(seat, card.broker);
      continue;
    }
    if (!g.market.length) break;             // three a charge, and no more
    const i = chooseBroker(g.market, g.players[seat]);
    const [card] = g.market.splice(i, 1);
    g.players[seat].hand.push({ ...card, spent: false });
    recruited.set(seat, card.broker);
  }
  refillMarket(g);

  // the Spy's exchange: the two cards change owner for good
  for (const { spy, taken } of swaps) {
    if (!g.armies[spy.ai].includes(spy.u) || !g.armies[taken.ai].includes(taken.u)) continue;
    const i = g.armies[spy.ai].indexOf(spy.u), j = g.armies[taken.ai].indexOf(taken.u);
    const a = spy.u.owner, b = taken.u.owner;
    spy.u.owner = b; taken.u.owner = a;
    g.armies[spy.ai][i] = taken.u; g.armies[taken.ai][j] = spy.u;
  }

  g.victors = victors;              // the winning side moves first next
  g.charge++;
  return { kills, scored, lost, recruited, swaps, victors };
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
  if (act.defect) {
    // worth it when the side you are joining can kill more of what is opposite it than the side
    // you are leaving — the whole contingent moves, so the swing is counted twice
    let here = 0, there = 0;
    for (const c of act.defect) {
      here += expectedKills(g, seat, c.arm, act.from) - expectedRisk(g, seat, c.arm, act.from);
      there += expectedKills(g, seat, c.arm, act.to) - expectedRisk(g, seat, c.arm, act.to);
    }
    return PASS_BASE - 0.3 + KILL_WEIGHT * (there - here);
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
    turns++; g.turn++;
    if (act.pass) idle++;
    else {
      idle = 0;
      if (act.charge) { charge(g); charges++; }
      else if (act.defect) {
        const from = g.armies[act.from], to = g.armies[act.to];
        for (const c of act.defect) { from.splice(from.indexOf(c), 1); to.push(c); }
        if (!from.length) g.leader[act.from] = null;
        else if (g.leader[act.from] === seat) {
          const by = new Map();
          for (const c of from) by.set(c.owner, (by.get(c.owner) || 0) + c.s);
          g.leader[act.from] = [...by.entries()].sort((x, y) => y[1] - x[1])[0][0];
        }
        if (g.leader[act.to] === null) g.leader[act.to] = seat;
      }
      else if (act.withdraw) {
        const a = g.armies[act.army];
        a.splice(a.indexOf(act.withdraw), 1);
        act.withdraw.ref.onBoard = false;
        act.withdraw.ref.readyAt = g.turn + n;      // recovers for one turn
        if (!a.length) g.leader[act.army] = null;
      } else commit(g, seat, act.unit, act.army);
    }
    // the board is full and nobody can add anything: the armies charge whether anyone meant it or not
    if (FORCED && boardFull(g)) { charge(g); charges++; }
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
    market: g.market.map((c) => ({ broker: c.broker, name: c.name, arm: c.arm, s: c.s, text: c.text })),
  };
}
