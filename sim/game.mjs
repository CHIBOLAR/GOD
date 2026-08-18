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
const ALLY_TAX = 0.5;        // an ally who can out-commit me takes my point outright
// What being the army's largest contributor is worth. It is the ONLY route to a point, so this
// is not a flavour knob — it is the policy's objective. CONTRIB=0 restores the old blind policy
// for comparison.
const CONTRIB_WEIGHT = Number(process.env.CONTRIB ?? 1.2);
// The policy must know HOW POINTS ARE AWARDED or every measurement of an alliance rule is noise
// — the same trap D045 records. Under SPOILS=contributors every contributor to a winning army
// scores, so the FIRST unit you put in earns the point and later ones add nothing to scoring.
const SHARE_ALL = process.env.SPOILS !== "largest";
const BEHIND_BONUS = 0.6;    // answering an army that is visibly bigger
export const NUM_ARMIES = Number(process.env.ARMIES || 2);
export const ARMY_CAP = Number(process.env.CAP || 4);
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

// ---- HOLD THE GROUND (GARRISON=1) --------------------------------------------------------
// Baseline: a winning army's units all come home after a round. So winning costs nothing, and
// no commitment is ever agonising — the opposite of every good auction game, where the resource
// you spend is the resource you score and spending it hurts.
//
// The rule: SURVIVING UNITS STAY ON THE GROUND. They do not return to hand. The army cap is
// still THREE, so a held ground cannot grow into an unbeatable stack — it gets FULLER, which
// locks the holder out of their own army. Cancelled units still come home; lose the ground and
// EVERYTHING in that army burns, standing units included.
//
// Two consequences make it work rather than snowball:
//   1. A STANDING UNIT NEVER COUNTS AS CONTRIBUTION. The point goes to whoever commits most
//      units THIS round, so holding earns nothing — the holder must keep spending to keep
//      scoring, and an opportunist who takes the last slot out-contributes them and steals it.
//   2. SENIORITY CHANGES HANDS. The first to commit is senior partner; after a win the partner
//      with the greatest surviving STRENGTH becomes senior. Seniority controls admission, so
//      allying into someone's ground can be a takeover — you arrive a guest and leave the
//      landlord. Points and control are deliberately measured differently: units for one,
//      strength for the other.
const GARRISON = process.env.GARRISON !== "0";

// ---- RELIEF IN PLACE (FOLD=1) --------------------------------------------------------------
// One action, once per turn: pull one of your STANDING units back and put another in its place.
// The field keeps its size, so this is not an escape from a collapsing ground — it is how you
// IMPROVE what stands on one. Swap a Rifleman out for an Elephant.
//
// THE COST IS TEMPO, NOT MATERIAL. The unit pulled back returns to hand RESTING — gone for the
// remainder of the round — and the move costs your whole turn. Charging a card instead was
// considered and rejected on the numbers: attrition is already the tightest pressure in the game
// (a lost ground burns everything standing on it, and at two players 7% of games already end by
// exhaustion), so another permanent sink pushes more games to die of attrition rather than on the
// target. Tempo also reuses `rest`, which players already understand from recovery.
//
// FOLDBURN=1 restores the material cost — additionally burn your cheapest card. If relief fires
// on more than roughly a fifth of turns, tempo was too cheap and the burn is the right price.
//
// ⚠️ WHEN THERE IS A SACRIFICE IT IS ALWAYS THE CHEAPEST AVAILABLE CARD. Burning anything dearer
// is strictly dominated — a sacrificed card has no effect beyond being spent — so the generator
// only offers the weakest, which keeps the move space at (standing x replacements) rather than
// cubing it, without removing any choice a rational player would make.
// ---- WITHDRAW (WITHDRAW=1) -----------------------------------------------------------------
// On your turn, pull ONE of your units out of an army back to hand. You then FORFEIT any claim
// to that ground's point this round. One rule, everyone, winner or loser — no special cases.
//
// It polices itself. If you are the largest contributor, withdrawing throws away a point you
// were winning, so you will not. If you are behind you were scoring nothing anyway, so leaving
// costs only the turn — which makes this precisely the loser's move, and that is what folding is.
// Under GARRISON it is the release valve: a holder watching a ground turn can bleed out one unit
// a turn instead of losing everything at once, paying for it by scoring nothing there.
//
// This is the half of "folding pays" that contribution scoring did not already cover. Standing
// pat when ahead banks the point; withdrawing when behind is how you stop paying for a lost
// fight. Taj Mahal has both, and until now we had only the first.
const WITHDRAW = process.env.WITHDRAW !== "0";

// ---- BETRAYAL (BETRAY=1) --------------------------------------------------------------------
// On your turn, move ONE of your committed units from the army it is in to the other one. The
// side you abandon loses that strength and the side you join gains it — a double swing, where
// withdrawing is only a single one.
//
// The price is the same as withdrawing: you FORFEIT any claim to the ground you walked away
// from. What you may still take is a share of the one you defected to.
//
// ⚠️ The obvious degenerate line is "join whoever looks strongest, late". What stops it is that
// armies are BLIND — you are reading unit counts, not cards, so defecting is a bet rather than
// a calculation. Whether that is enough is exactly what the measurement is for.
const BETRAY = process.env.BETRAY === "1";

// ---- CALL THE CHARGE (CHARGE=1) --------------------------------------------------------------
// A SENIOR PARTNER may end the muster on their turn. The armies charge as they stand.
//
// Ra gives a player the power to call the auction, which turns TIMING into a resource; GOD had
// none — the muster simply stopped when everyone ran out of things to do, so nobody ever chose
// the moment. Under CAPTURE scoring the choice bites hard, because the pot IS the enemy's
// committed units: strike at three against two and you win easily for two points; wait for four
// against four and the prize doubles while the enemy arms to take it from you.
const CHARGE = process.env.CHARGE === "1";

// ---- RUINED (ELIMINATED=1) ---------------------------------------------------------------
// When a player has NO UNITS LEFT ANYWHERE, every other player takes 2 VP.
//
// Knizia's rule for auctions is that a player who overbids must "hurt themselves and be limited
// by the system" rather than be eliminated outright — High Society does it by disqualifying
// whoever spent the most, so you can win every auction and still lose. GOD had NOTHING here:
// burning your whole hand cost you only the ability to act, which is idleness, not a penalty.
//
// This is the same idea without removing anyone from the table: ruin yourself and you hand the
// room points. Units STANDING on the ground still count as yours, so ruin takes genuine total
// attrition — it cannot be manufactured cheaply the way "lose one unit alone" could.
const ELIMINATED = process.env.ELIMINATED === "1";
export let st_ruined = 0;
export let st_charged = 0;
export let st_betrayed = 0;
export let st_withdrew = 0;
const FOLD = process.env.FOLD === "1";
const FOLD_BURN = process.env.FOLDBURN === "1";
export let st_relieved = 0, st_actions = 0;
export const resetRelief = () => { st_relieved = 0; st_actions = 0; st_withdrew = 0; st_betrayed = 0; st_charged = 0; st_ruined = 0; };
export const HOLDS_GROUND = GARRISON;

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
    ruined: new Set(),                                    // players with nothing left at all
    held: Array.from({ length: NUM_ARMIES }, () => []),   // units standing on the ground
    senior: new Array(NUM_ARMIES).fill(null),             // who admits newcomers
    players: factionKeys.map((k, i) => {
      const f = FACTIONS.find((x) => x.key === k);
      return { seat: i, faction: f, vp: 0, hand: f.units.map((u) => ({ ...u, spent: false, rest: 0 })) };
    }),
  };
}

export const available = (p, round) => p.hand.filter((u) => !u.spent && !u.held && u.rest <= round);

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
  if (CHARGE && mine !== undefined && m.leader[mine] === seat && m.armies[mine].length) {
    moves.push({ charge: true, army: mine });
  }
  if (BETRAY && mine !== undefined) {
    for (const c of m.armies[mine].filter((x) => x.owner === seat)) {
      for (let a = 0; a < NUM_ARMIES; a++) {
        if (a === mine) continue;
        if (m.armies[a].length >= ARMY_CAP) continue;
        const members = new Set(m.armies[a].map((x) => x.owner));
        if (!members.has(seat) && members.size >= MAX_PER_ARMY) continue;
        moves.push({ betray: c, from: mine, to: a });
      }
    }
  }
  if (WITHDRAW && mine !== undefined) {
    for (const c of m.armies[mine].filter((x) => x.owner === seat)) {
      moves.push({ withdraw: c, army: mine });
    }
  }
  if (FOLD && mine !== undefined && units.length >= (FOLD_BURN ? 2 : 1)) {
    const standing = m.armies[mine].filter((c) => c.owner === seat);
    const give = FOLD_BURN ? units.reduce((lo, u) => (u.s < lo.s ? u : lo), units[0]) : null;
    for (const c of standing) {
      for (const put of units) {
        if (put === give) continue;
        moves.push({ relieve: c, give, put, army: mine });
      }
    }
  }
  return moves;
}

// Walk one unit across to the other army. The ground you left is forfeit; the one you join is not.
export function betrayWith(g, m, seat, mv) {
  const from = m.armies[mv.from], to = m.armies[mv.to];
  const i = from.indexOf(mv.betray);
  if (i < 0) return false;
  from.splice(i, 1);
  for (const c of from) if (c.owner === seat) c.forfeit = true;   // no claim where you deserted
  mv.betray.garrison = false;                                     // it moved; it is not standing
  mv.betray.forfeit = false;
  mv.betray.army = mv.to;
  to.push(mv.betray);
  if (m.leader[mv.to] === null) m.leader[mv.to] = seat;
  if (!from.some((c) => c.owner === seat)) m.armyOf.set(seat, mv.to);
  else m.armyOf.set(seat, mv.to);           // your units may not be split across two armies
  st_betrayed++;
  return true;
}

// Pull one unit out and go home with it. The forfeit is recorded on the CARD, not the player,
// because a player may hold units in only one army — so marking the army's cards is enough.
export function withdrawUnit(g, m, seat, mv) {
  const army = m.armies[mv.army];
  const i = army.indexOf(mv.withdraw);
  if (i < 0) return false;
  mv.withdraw.ref.held = false;
  mv.withdraw.ref.rest = g.round + 1;     // home, but not back out again this round
  army.splice(i, 1);
  // forfeit: nothing this player still has here may count toward the point
  for (const c of army) if (c.owner === seat) c.forfeit = true;
  m.forfeited ||= new Set();
  m.forfeited.add(seat);
  if (!army.some((c) => c.owner === seat)) m.armyOf.delete(seat);   // out entirely; free to move
  st_withdrew++;
  return true;
}

// Pull `relieve` back to hand RESTING, optionally burn `give`, and put `put` in the freed slot.
export function relieveUnit(g, m, seat, mv, rnd) {
  const army = m.armies[mv.army];
  const i = army.indexOf(mv.relieve);
  if (i < 0) return null;
  mv.relieve.ref.held = false;
  mv.relieve.ref.rest = g.round + 1;      // back in hand, but gone for the rest of this round
  if (mv.give) mv.give.spent = true;      // FOLDBURN only: burned for good
  army.splice(i, 1);
  st_relieved++;
  const card = commitUnit(g, m, seat, mv.put, mv.army, rnd ?? m.__rnd ?? (() => 0.5));
  return card;
}

// ⚠️ Units commit FACE DOWN. Public information only: army sizes, whose units they are, what
// each player has already burned, and anything a Siege Elephant has revealed.
// How many units each player has in an army, and how many the best rival has. Contribution is
// counted in UNITS, and it is the only route to a point, so the policy has to see it.
function standing(army, seat) {
  let mine = 0;
  const others = new Map();
  for (const x of army) {
    if (x.owner === seat) mine++;
    else others.set(x.owner, (others.get(x.owner) || 0) + 1);
  }
  return { mine, others, best: others.size ? Math.max(...others.values()) : 0 };
}

export function scoreMove(g, seat, m, mv) {
  if (mv.pass) {
    // ⚠️ PASSING CAN BE THE SCORING MOVE. Under contribution scoring, a player who already
    // leads their army's contribution banks the point by doing nothing — adding another unit
    // cannot improve a lead they already hold. Without this the policy commits units it has no
    // reason to spend, which is the Taj Mahal "fold and keep what you earned" decision.
    const a = m.armyOf.get(seat);
    if (a === undefined) return PASS_BASE;
    const st = standing(m.armies[a], seat);
    const scoring = SHARE_ALL ? st.mine > 0 : st.mine > st.best;
    return PASS_BASE + (scoring ? CONTRIB_WEIGHT * 0.6 : 0);
  }
  if (mv.charge) {
    // Charge when you are ahead on the ground and the prize already justifies it. Waiting is
    // only worth it while the enemy is still smaller than you — every unit they add enriches
    // the pot but also buys them the ground.
    const mineN = m.armies[mv.army].length;
    const foe = Math.max(...m.armies.map((a, i) => (i === mv.army ? 0 : a.length)));
    return PASS_BASE + (mineN > foe ? 0.9 + 0.3 * foe : -1.5);
  }
  if (mv.betray) {
    // Worth it when the army you are leaving is losing and the one you are joining is not.
    const here = m.armies[mv.from].length, there = m.armies[mv.to].length + 1;
    const gain = there - here;
    return PASS_BASE - 0.3 + OWN_WEIGHT * mv.betray.s * (gain > 0 ? 1 : 0)
      + (gain > 0 ? CONTRIB_WEIGHT * 0.4 : -1.5);
  }
  if (mv.withdraw) {
    // Leaving is worth it only when you are NOT winning the point here: a leader who withdraws
    // throws away what they were about to score. Value is the unit saved, less the forfeit.
    // WITHDRAW DOES TWO DIFFERENT JOBS and they must be scored differently.
    //  · FOLDING — leaving a contest you are losing. Worthless once every contributor scores,
    //    because staying pays; so a scoring position is never folded.
    //  · RECOVERY — taking back a unit STANDING on the ground under GARRISON. Nothing else can
    //    do this: otherwise a unit only ever comes home by losing the ground. Worth the forfeit
    //    when the card is dear, because you get it back for every future round.
    const st = standing(m.armies[mv.army], seat);
    // ⚠️ HAVING A UNIT HERE IS NOT THE SAME AS SCORING. You are paid only if this army WINS the
    // ground. Treating any commitment as a guaranteed point made the policy refuse to fold out
    // of a fight it was losing — which is precisely when folding is right, because the point was
    // never coming and the units burn with the army.
    const biggest = Math.max(...m.armies.map((a, i) => (i === mv.army ? 0 : a.length)));
    const losing = biggest > m.armies[mv.army].length;
    const wouldScore = SHARE_ALL ? st.mine > 0 : st.mine > st.best;
    if (mv.withdraw.garrison) {
      // RECOVERY: pay this round's point, regain a locked card for every round after.
      return PASS_BASE - 0.2 + OWN_WEIGHT * mv.withdraw.s
        - (wouldScore && !losing ? CONTRIB_WEIGHT * 0.6 : 0);
    }
    // FOLDING: only foolish when the ground looks winnable and you are in line to be paid.
    if (wouldScore && !losing) return -3;
    return PASS_BASE - 0.4 + OWN_WEIGHT * mv.withdraw.s * (losing ? 1 : 0.3);
  }
  if (mv.relieve) {
    // Worth it when what goes in is dearer than what comes out, less the tempo of losing the
    // pulled unit for the rest of the round — and less the burned card when FOLDBURN is on.
    // Reuses the commit weights, so relief introduces no new tuned constant.
    const gain = mv.put.s - mv.relieve.s;
    let v = OWN_WEIGHT * gain - COST * mv.relieve.s;
    if (mv.give) v -= COST * mv.give.s * 3;
    return gain > 0 ? v : v - 2;
  }
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

  // ---- CONTRIBUTION: the only way to score --------------------------------------------------
  // The ground pays one point to the army's largest contributor by units committed, ties share.
  // Strength wins the ground; COUNT wins the point. A policy blind to this optimises the wrong
  // quantity entirely — it was written for one-point-per-surviving-unit and never updated.
  const st = standing(mineArmy, seat);
  const after = st.mine + 1;
  s += CONTRIB_WEIGHT * (SHARE_ALL ? (st.mine === 0 ? 1 : 0)
    : after > st.best ? 1 : after === st.best ? 0.5 : 0);

  // ⚠️ An ally is not a flat cost, as ALLY_TAX assumed. An ally who out-commits you takes the
  // WHOLE point — and one who cannot is close to free, because they add strength for nothing.
  // So the penalty applies only to allies who match or beat your count once this unit is down.
  // When every contributor is paid, an ally is not a rival for the point at all — they are
  // free strength. The tax applies only when a single contributor takes it.
  if (!SHARE_ALL) s -= ALLY_TAX * [...st.others.values()].filter((n) => n >= after).length;

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
    awarded = spoils(result, m.leader);
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
    // Survivors, by REFERENCE: resolveBattle works on copies, so identity has to come from .ref
    const survRefs = new Set((result && result.armies[a] ? result.armies[a] : []).map((x) => x.ref));
    const stay = [];
    for (const u of m.armies[a]) {
      if (!won || rocketsFired) { u.ref.spent = true; u.ref.held = false; continue; }
      if (GARRISON && survRefs.has(u.ref)) {
        u.ref.held = true;                                  // stands on the ground, out of hand
        u.garrison = true;                                  // and never counts as contribution
        u.claim = undefined;
        stay.push(u);
      } else {
        u.ref.held = false;
        u.ref.rest = g.round + 2;                           // driven off; home after a round
      }
    }
    if (GARRISON) {
      g.held[a] = stay;
      // SENIORITY: the partner with the greatest surviving STRENGTH admits newcomers from now on.
      // Deliberately a different measure from contribution, so control and points can diverge.
      if (stay.length) {
        const by = new Map();
        for (const u of stay) by.set(u.owner, (by.get(u.owner) || 0) + u.s);
        let top = -1, who = null;
        for (const [owner, str] of by) if (str > top) { top = str; who = owner; }
        g.senior[a] = who;
      } else g.senior[a] = null;
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

// THE MUSTER, built once and shared. The online engine used to construct this itself, which is
// exactly the kind of duplication that lets the two drift apart.
export function newMuster(g) {
  const m = {
    armies: Array.from({ length: NUM_ARMIES }, () => []),
    leader: new Array(NUM_ARMIES).fill(null),
    armyOf: new Map(), offered: new Set(), used: [],
    pools: null,
  };
  if (GARRISON) {
    for (let a = 0; a < NUM_ARMIES; a++) {
      for (const c of g.held[a]) {
        m.armies[a].push(c);
        m.armyOf.set(c.owner, a);          // your units are on the ground; you are in this army
      }
      if (g.held[a].length) m.leader[a] = g.senior[a] ?? g.held[a][0].owner;
    }
  }
  m.pools = g.players.map((p) => available(p, g.round).map((u) => ({ arm: u.arm, s: u.s })));
  return m;
}

export function playRound(g, rnd) {
  const n = g.players.length;
  const m = newMuster(g);
  let passStreak = 0, seat = g.start, committed = 0, charged = false;
  const turns = new Array(n).fill(0);

  while (passStreak < n && !charged) {
    m.offered.clear();
    let acted = false;
    for (let attempt = 0; attempt < NUM_ARMIES && !acted; attempt++) {
      const moves = legalMoves(g, seat, m);
      const mv = choose(moves, moves.map((x) => scoreMove(g, seat, m, x)), rnd);
      if (mv.pass) break;
      st_actions++;
      if (mv.charge) { st_charged++; charged = true; acted = true; turns[seat]++; break; }
      if (mv.betray) { betrayWith(g, m, seat, mv); acted = true; turns[seat]++; break; }
      if (mv.withdraw) { withdrawUnit(g, m, seat, mv); acted = true; turns[seat]++; break; }
      if (mv.relieve) { relieveUnit(g, m, seat, mv, rnd); acted = true; turns[seat]++; break; }
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

  if (GARRISON) for (let a = 0; a < NUM_ARMIES; a++) {
    if (!fielded.includes(a)) { g.held[a] = []; g.senior[a] = null; }
  }

  // ---- ruin: a player with nothing left anywhere pays the whole table
  if (ELIMINATED) {
    for (const p of g.players) {
      if (g.ruined.has(p.seat)) continue;
      if (p.hand.some((u) => !u.spent)) continue;          // still has something, held or in hand
      g.ruined.add(p.seat);
      st_ruined++;
      for (const q of g.players) if (q.seat !== p.seat) q.vp += 2;
    }
  }

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
