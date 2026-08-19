// DECCAN — THE SIMPLE MODEL. Damage, and three cards that break it.
//
// ⚠️ THERE IS NO RING. Nothing "beats" anything. A unit deals its VALUE as damage to ONE
// enemy unit of its choosing, and a unit dies when the damage on it reaches its value. That
// is the whole combat system: value is what you deal and value is what you survive.
//
//   ELEPHANT 5 · CANNON 4 · RIFLEMAN 3 · HORSEMAN 2 · WARRIOR 1 · SPY 1 · SCOUT 1 · SLINGER 1
//
// ONLY THREE ABILITIES EXIST IN THE GAME, and all three are printed on value-1 units:
//
//   COMMANDER  strikes at the value of the HIGHEST ENEMY UNIT on the ground.
//   SPY        exchanges itself with the highest surviving enemy unit. PERMANENT.
//   SCOUT      turns one hidden enemy unit face up.
//
// They are units like any other: they can be targeted, and they die to a single blow from
// anything.
//
// ⚠️ THERE IS NO SURVIVAL TEST. THE BATTLE IS ONE SIMULTANEOUS REVEAL: every blow and every
// ability lands at the same instant, so a unit does not have to live through the charge to use
// what is printed on it, any more than an Elephant has to live to land its five.
//
// This was measured the other way round first, and it is why the rule matters. Gated behind a
// survival test, a value-1 unit lives through 15% of charges at three players and 5% at six
// — every attacker can finish a 1 and almost none can finish an Elephant, so all the spare
// damage lands on the small cards. The Spy and the Scout resolved 0.05 times per game: not weak
// cards, cards that did not exist. Simultaneous, they resolve 1.2-2.8 times, and the signature
// gate goes from a 7.0 warn to a 4.5 pass.
//
// ⚠️ THE COMMANDER IS THE WHOLE BALANCE, and it is a BRAKE, not a weapon. Without the ring, raw
// value is strictly better, and it is measurable: over nine-card decks spanning totals 9 to
// 41, win rate ran 0.42 -> 2.74 monotonically. The Commander is the answer that SCALES — it
// strikes at exactly the size of the problem opposite it, so the bigger the enemy's Elephant,
// the bigger their answer, and a cheap deck can still fight an expensive one.
//
// ⚠️ IT COPIES THE BLOW, NOT THE BODY. Its durability stays 1 — anything kills it. Letting it
// copy durability too would make it BECOME an Elephant for one point of printed value, and
// printed value is the exact quantity every deck in the roster is balanced on. One big blow,
// and it dies to a Warrior.
//
// ⚠️ It copies your OWN army's best in an earlier draft of this idea, and that is the wrong
// card: amplifying a strong army deepens the one imbalance the numbers actually show, and it is
// dead weight in a weak army — useless precisely when its owner needs it.
//
// Commanders do not copy Commanders, or two of them opposite each other define each other.
//
// Everything else is unchanged from THE CHARGE: two armies, deploy face down, withdraw, defect,
// a senior partner calls the charge, ONE VICTORY POINT PER ENEMY UNIT KILLED, four to win —
// except that WINNING UNITS STAND and LOSING UNITS RECOVER. Nothing is ever destroyed.
//
// Standalone by design: it imports nothing from cards.mjs, because that file is the roster and
// the broker supply and the point here is to have neither.

export const RING = [];                              // kept only so nothing reads it as truth
// ⚠️ HORSE BEFORE FOOT. The list is in VALUE order, and under AGILITY value order IS the order
// of battle — so the Horseman must sit BELOW the Warrior or a man on foot strikes before a man
// on a horse. That single word "agility" is what re-cut this: the number was called STRENGTH, so
// nothing objected to a Warrior 2 and a Horseman 3; the moment it also decides who moves first,
// the Horseman is the light, quick, fragile one and the Warrior is the one who stands.
export const TYPES = (process.env.TYPES ||
  "ELEPHANT,CANNON,RIFLEMAN,WARRIOR,HORSEMAN,SPY,SCOUT,COMMANDER").split(",");
// ⚠️ THE LADDER STARTS AT TWO, AND THE REASON IS THE CHEAPEST BODY — the HORSEMAN now, the
// Warrior when this was written. At 5,4,3,2,1 the cheapest fighter was printed at 1, the same
// number as the Spy, Scout and Commander, and measured 0.433 kills per appearance against the
// Scout's 0.438. It was not a weak card, it was THE SAME CARD with less written on it, and no
// deck had a reason to hold one. Lifting the mains to 6,5,4,3,2 separates the cheapest fighter
// from the ability units: 0.486 against 0.353, and signature deviation on the placeholder roster
// fell 6.9 -> 5.6 with no cost in pace.
// The Commander is unaffected either way — it copies the enemy's best rather than carrying a
// number, so it measures 0.712 under both ladders. The brake does not need retuning when the
// mains do.
export const VALUE = Object.fromEntries(
  (process.env.VALUE || "6,5,4,3,2,1,1,1").split(",").map((v, i) => [TYPES[i], Number(v)]));
// the three abilities, by unit type. Everything else is a body with a number on it.
// ⚠️ ABILITIES CAN BE SWITCHED OFF ONE AT A TIME, so "does this card's ability matter?" is a
// measurement rather than an opinion. OFF=SPY,SCOUT,COMMANDER disables any subset; the unit
// stays in the game as a plain value-1 body, so the comparison isolates the ABILITY.
const OFF = new Set((process.env.OFF || "").split(",").filter(Boolean));
const ABILITY = Object.fromEntries(
  Object.entries({ SPY: "swap", SCOUT: "reveal" }).filter(([k]) => !OFF.has(k)));
const COMMANDER_OFF = OFF.has("COMMANDER");
// WHAT THE SCOUT DOES. Three cards, one slot, measured against each other.
//   reveal   turns one hidden enemy unit face up. The card as printed, and it measures at ZERO
//            — 0.99 with its text and 0.99 without (D061).
//   retreat  ON REVEAL, one unit on the ground returns to its owner's hand. The Scout stays.
//            Under AGILITY the Scout is band 1, so this lands BEFORE ANYTHING SWINGS: the unit
//            pulled never strikes and never dies, and the slot it held comes free.
//   sortie   a TURN, not a charge ability: commit the Scout, look at one hidden enemy unit, and
//            take it straight back. It never stands in the line, so it can never be killed and
//            never hands anyone a point — you spend a turn to see one card.
// ⚠️ ONLY `retreat` IS HONESTLY MEASURABLE HERE. It moves bodies, and bodies are what this model
// can see. `reveal` and `sortie` pay in INFORMATION, which is the thing D059 established this
// simulation cannot price — so a number against either of them is a LOWER BOUND and must never
// be quoted as a verdict.
// THE SPY REMOVES. ON REVEAL, one enemy unit LEAVES WITHOUT A FIGHT — no choice, it does not
// strike, it cannot be killed, and nobody scores off it. Under AGILITY the Spy sits in band 1 and
// nothing acts before band 1, so the withdrawal lands before contact.
//
//   solo      ADOPTED (D062). The enemy unit leaves; the Spy stays and fights on.
//   mutual    the Spy is spent along with its target. Measured WORSE on every gate.
//   exchange  the printed card: swap yourself with the enemy's strongest survivor, permanently.
//
// ⚠️ THE MUTUAL CLAUSE WAS A PREDICTION AND IT WAS WRONG. The argument was that an unanswerable
// band-1 card is the shape LESSONS.md records as what ended the old game — the broker that
// measured +38.8 and sat in all 50 of the top 50 armies because nothing could answer it. Spending
// the Spy was meant to make it a trade rather than a tax. Measured, it cost 0.11 kills a charge
// and two minutes, took the signature gate from 4.5 to 5.3, and bought NOTHING: the ruler holding
// two Spies reads 0.95 either way, against 0.99 for solo.
//
// ⚠️ AND THE ANALOGY DID NOT APPLY, WHICH IS THE PART WORTH KEEPING. That broker was broken
// because it WON YOU THE GROUND — a payoff that landed in one pair of hands. DENIAL IS NOT
// PRIVATE: pulling their Elephant out helps everyone facing it, and the Spy's owner captures a
// fraction. "Nothing can answer it" is only dangerous when it is ALSO PAID TO ONE PERSON. The two
// properties were conflated and only the second is the hazard — which is D059's zero-value
// mechanism seen from the other side, capping the ceiling as surely as it caps the floor.
const SPYMODE = process.env.SPYMODE || "solo";
const SPY_WITHDRAW = SPYMODE === "solo" || SPYMODE === "mutual";
const SPY_SPENDS_ITSELF = SPYMODE === "mutual";
const COMMANDER = "COMMANDER";
// ---- WHAT PAYS A POINT ------------------------------------------------------------------
//   kills     one point per enemy unit you killed.
//   value  the VALUE of each unit you killed — an Elephant is worth 5, a Slinger 1.
//   hold      KING OF THE HILL: the army with the greater surviving value HOLDS THE GROUND,
//             and every player with a unit still standing in it takes a point.
//   holdtop   the hill pays ONE point, to whoever holds the most value on it.
//   killhold  a point per kill, AND a point for standing on the ground you took.
//   survive   a point for every unit of YOURS still standing when the dust settles.
export const VPMODE = process.env.VPMODE || "kills";
const PAYS_KILLS = ["kills", "value", "killhold"].includes(VPMODE);
const PAYS_HILL = ["hold", "holdtop", "killhold", "holdblood"].includes(VPMODE);
// ⚠️ HOLDBLOOD — the ground pays only if the charge DREW BLOOD. Measured, plain `hold` pays for
// standing still: at two players it killed 0.17 units per charge and the whole battle became a
// formality, because holding was the point and killing was not. Requiring one enemy casualty
// costs the rule nothing when armies actually meet and removes the bloodless win entirely.
const NEEDS_BLOOD = VPMODE === "holdblood";

export const NUM_ARMIES = Number(process.env.ARMIES || 2);
export const ARMY_CAP = Number(process.env.CAP || 4);
export const MAX_PER_ARMY = ARMY_CAP;
// SEVEN KILLS TO WIN (D057). More battles is less variance: seat deviation falls 4.6 -> 3.6 ->
// 3.0 as the target rises from 4 to 7, and signature deviation 4.1 -> 3.5, because no single
// lucky charge decides as much of the game. It plateaus after 7. The price is ~19 table turns
// per extra point, and it is paid almost entirely by the two-player game.
export const TARGET = Number(process.env.TARGET || 7);
// ⚠️ ONE TARGET AT EVERY COUNT. Two players pays for it alone — every extra point costs ~19
// table turns, shared out at 3-8 players and landing on one person heads-up, so seven kills is
// ~22 minutes at two against 13-16 everywhere else. Adopted anyway: a rule with no exception is
// worth more at the table than two minutes, and the exception was the only one in the game.
export const TARGET_2P = Number(process.env.TARGET2P || TARGET);
export const targetFor = (n) => (n === 2 ? TARGET_2P : TARGET);

// ---- HOW LONG IS THIS IN MINUTES ------------------------------------------------------------
// DECCAN is a 15-20 MINUTE GAME. Turn counts do not say whether that is true, so the estimate is
// made here, out loud, from two stated numbers rather than left to a feeling about "60 turns".
// A plain action is a card down or a card back; a charge is a reveal, damage assigned and
// resolved, and the recovery sorted out. Both are tunable so the estimate can be argued with.
export const SEC_ACTION = Number(process.env.SECACTION || 8);
export const SEC_CHARGE = Number(process.env.SECCHARGE || 45);
export const minutes = (turns, charges) =>
  ((turns - charges) * SEC_ACTION + charges * SEC_CHARGE) / 60;
export const HAND = Number(process.env.HAND || 9);   // 8 rulers x 9 = 72 cards
const FORCED = process.env.FORCED !== "0";
const DEFECT = process.env.DEFECT !== "0";
// ARMYCMD=1 — ONCE YOU STAND IN AN ARMY YOU MAY PULL BACK ANY UNIT IN IT, not only your own.
//
// The asymmetry this answers is already in the rules: the SENIOR PARTNER chooses when the charge
// happens, and the OWNER is the only one who may take a unit out of the line. So a senior partner
// can call the charge at the moment an ally's Scout is standing in front of an Elephant, and
// nobody at the table can do a thing about it — least of all the players whose turn it is not.
// Army-wide command makes the line one body: whoever is on turn can save it.
//
// ⚠️ IT IS A WITHDRAWAL RULE ONLY. You may never DEPLOY another player's card — their hand is
// theirs, and committing it would spend your turn to hand them the kill and the point.
const ARMYCMD = process.env.ARMYCMD === "1";
// TWO BRAKES ON IT, because the unrestricted rule is a TURN SINK: covering a comrade is almost
// always worth a little, it is available to every player against every unit in the line, so it is
// taken over and over and the front becomes the shuffling contest the recovery rule exists to
// prevent. Measured, it costs 4 minutes at the gentlest valuation and 15 at the plainest.
//   ARMYSEEN=1  you may only pull back a comrade you can SEE — a face-up unit. You cannot give
//               an order about a card that is still face down, which is also the honest reading
//               of a hidden commitment: it is not yet part of the line anyone is commanding.
//   ARMYONCE=1  you may cover a comrade ONCE between charges. Scarcity turns the rule from a
//               habit into a decision — the whole question becomes WHICH unit is worth your one.
const ARMYSEEN = process.env.ARMYSEEN === "1";
const ARMYONCE = process.env.ARMYONCE === "1";
// WOUNDS=1 — damage carries between charges. Off, a survivor stands back up whole, which is the
// simpler rule and the one with no bookkeeping on the table.
const WOUNDS = process.env.WOUNDS === "1";
// AGILITY=1 — VALUE IS ALSO AGILITY, INVERTED. The battle stops being one instant and becomes
// a ladder: everything printed 1 strikes, then everything printed 2, up to the Elephant 6. A unit
// killed before its band comes up NEVER STRIKES. So cheap units get initiative and can stack
// damage onto an Elephant and take it off the board before it swings once.
//
// ⚠️ IT REVERSES THE RULE THIS CHASSIS WAS BUILT ON — no survival test, everything in the same
// instant — and it is the ONE reversal that does not re-break what that rule was protecting.
// The survival test was thrown out because a value-1 card lived through 5% of charges, so the
// Spy and the Scout resolved 0.05 times a game: "not weak cards, cards that did not exist."
// Under agility the 1s act FIRST, before anything can reach them, so an ability card gets its
// text off UNCONDITIONALLY. The old failure cannot recur — nothing resolves before band 1.
//
// TIES RESOLVE AS A BAND. Everything at the same value strikes together, so the three ability
// cards need no order among themselves and ganging works within a band as well as across it.
// ADOPTED D061. `AGILITY=0` restores the single instant.
const AGILITY = process.env.AGILITY !== "0";
// ⚠️ "NOBODY CAN OR WILL ACT" IS A CLAIM ABOUT THE TABLE, AND IT NEEDS THE SAME EVIDENCE AT
// EVERY SIZE. The ending condition was a full lap of passes — n*2 — which at eight players means
// sixteen refusals in a row and at TWO players means each of them passing twice. A floor is what
// makes the test cost the same everywhere.
// Measured at 2 players: 76% of games reached the target on a bare n*2, and 40% of the failures
// ended with NOBODY on any points — the game did not stalemate, it never started. A floor of 8
// takes 2p to 100% and is provably free above four players, where n*2 already exceeds it. It
// saturates: 8, 10, 14 and 20 all measure identically.
const IDLE_FLOOR = Number(process.env.IDLEFLOOR || 8);

const TEMPERATURE = 0.4;
const PASS_BASE = 1.0;
const KILL_WEIGHT = 1.3;
const RISK_WEIGHT = 0.9;
const CHARGE_BASE = 0.4;
const SURVIVE_BONUS = 0.25;

export function makeRng(seed) {
  let x = seed >>> 0;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---- the eight rulers -----------------------------------------------------------------------
// ROSTER is a "|"-separated list of eight count vectors read in TYPES order. Unset, the
// PLACEHOLDER is used: ruler i holds ONE OF EVERY TYPE PLUS A SECOND OF ITS OWN. It is the
// smallest identity that exists — every ruler holds everything, and the only difference is
// which single card they hold twice.
// ⚠️ That is what makes faction deviation READABLE this early: it measures what each signature
// is worth, one card at a time, which is the evidence the real compositions get chosen from.
const signatureDeck = (i) => {
  const counts = Object.fromEntries(TYPES.map((t) => [t, 1]));
  for (let k = 0; k < HAND - TYPES.length; k++) counts[TYPES[(i + k) % TYPES.length]]++;
  return counts;
};
// A roster is eight count vectors read in TYPES order. `makeFactions` builds one at RUNTIME so a
// search can try thousands without reloading the module — pass the result as `opts.roster`.
export function makeFactions(vectors, keys) {
  return vectors.map((v, i) => {
    const counts = Object.fromEntries(TYPES.map((t, j) => [t, Number(v[j] || 0)]));
    return { key: keys?.[i] ?? `r${i + 1}`, counts,
      total: TYPES.reduce((n, t) => n + counts[t] * VALUE[t], 0),
      units: TYPES.flatMap((t) => Array.from({ length: counts[t] }, () => ({ arm: t, v: VALUE[t] }))) };
  });
}
export const FACTIONS = process.env.ROSTER
  ? makeFactions(process.env.ROSTER.split("|").map((v) => v.split(",").map(Number)))
  : makeFactions(Array.from({ length: 8 }, (_, i) => TYPES.map((t) => signatureDeck(i)[t])),
                 TYPES.map((t) => t.toLowerCase()));

export function validate() {
  const p = [];
  for (const t of TYPES) if (!Number.isFinite(VALUE[t]) || VALUE[t] < 1) p.push(`${t}: bad value`);
  for (const f of FACTIONS) if (f.units.length !== HAND) p.push(`${f.key}: ${f.units.length} units`);
  if (new Set(TYPES).size !== TYPES.length) p.push("duplicate unit types");
  for (const t of Object.keys(ABILITY)) if (!TYPES.includes(t)) p.push(`${t}: ability with no unit`);
  return p;
}

// ---- the game -------------------------------------------------------------------------------
export function newGame(factionKeys, pool = FACTIONS) {
  return {
    charge: 0, turn: 0,
    armies: Array.from({ length: NUM_ARMIES }, () => []),
    leader: new Array(NUM_ARMIES).fill(null),
    players: factionKeys.map((k, i) => {
      const f = pool.find((x) => x.key === k) || pool[i % pool.length];
      return { seat: i, faction: f, vp: 0, tempo: undefined, hand: f.units.map((u) => ({ ...u })) };
    }),
  };
}

const armyOf = (g, seat) => g.armies.findIndex((a) => a.some((c) => c.owner === seat));
const inHand = (p, g) => p.hand.filter((u) => !u.onBoard && (u.readyAt ?? 0) <= g.turn);
export const recovering = (p, g) => p.hand.filter((u) => !u.onBoard && (u.readyAt ?? 0) > g.turn);
export const boardFull = (g) => g.armies.every((a) => a.length >= ARMY_CAP);

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
    const seen = new Set();                                // two identical cards are one decision
    for (const u of units) { if (seen.has(u.arm)) continue; seen.add(u.arm); acts.push({ unit: u, army: a }); }
  }
  const mayCover = ARMYCMD && (!ARMYONCE || p.coveredAt !== g.charge);
  if (mine >= 0) for (const c of g.armies[mine]) {
    if (c.owner === seat) { acts.push({ withdraw: c, army: mine }); continue; }
    if (mayCover && (!ARMYSEEN || c.revealed)) acts.push({ withdraw: c, army: mine });
  }
  // ONE UNIT, ONE TURN — you may cross only when a single unit is all you have standing.
  if (DEFECT && mine >= 0 && g.armies[mine].filter((c) => c.owner === seat).length === 1) {
    const contingent = g.armies[mine].filter((c) => c.owner === seat);
    for (let a = 0; a < NUM_ARMIES; a++) {
      if (a === mine || g.armies[a].length + 1 > ARMY_CAP) continue;
      const members = new Set(g.armies[a].map((c) => c.owner));
      if (!members.has(seat) && members.size >= MAX_PER_ARMY) continue;
      acts.push({ defect: contingent, from: mine, to: a });
    }
  }
  // ⚠️ AND SOMETHING MUST BE OPPOSITE. A charge only ever asked whether YOUR army had a unit, so
  // charging an EMPTY enemy was legal: no kills, no casualties, your side automatically took the
  // field on surviving value, and the field hands the next turn to your own senior partner — who
  // could call another one. A senior partner could charge for ever and never pass play on.
  // No bot ever found it (a bloodless charge scores 0.4 against 1.0 for passing) which is exactly
  // the failure LESSONS.md records: a reconciliation that reads the rules confirms what is
  // WRITTEN and cannot find what is MISSING.
  if (mine >= 0 && g.leader[mine] === seat && g.armies[mine].length
      && g.armies.some((a, i) => i !== mine && a.length)) acts.push({ charge: true });
  return acts;
}

export function commit(g, seat, unit, army) {
  unit.onBoard = true;
  g.armies[army].push({ owner: seat, arm: unit.arm, v: unit.v, ref: unit, revealed: false });
  if (g.leader[army] === null) g.leader[army] = seat;
}

// ---- the charge -----------------------------------------------------------------------------
// ⚠️ PURE. It decides what WOULD happen and mutates nothing, because the policy calls it to look
// ahead before choosing to charge. `charge()` below is the only thing that applies the result.
//
// Targets are assigned heaviest attacker first, over a shared pool of remaining durability, so
// blows stack: two Warriors together finish a Horseman that neither could finish alone. All the
// damage still LANDS at once — a unit killed in this charge has already dealt its own blow.
export function resolveCharge(armies) {
  const all = [];
  armies.forEach((a, ai) => a.forEach((u, ui) => all.push({ u, ai, ui })));
  // ⚠️ THE WITHDRAWAL RESOLVES BEFORE CONTACT, and it has to. Under AGILITY the Spy is band 1 and
  // nothing acts before band 1, so a unit it sends home left the field before a blow was thrown:
  // it neither strikes nor dies nor can be targeted, and NOBODY SCORES OFF IT. A withdrawal that
  // resolved after the damage would be a rule about corpses.
  //
  // ⚠️ EVERY SPY PICKS FROM THE UNTOUCHED BOARD, THEN THEY ALL LEAVE TOGETHER. Removing each one
  // as it acted would make an enemy Spy untargetable purely because it sat earlier in the array —
  // an ordering artifact deciding a real interaction. Two Spies may not name the same unit, which
  // is the rule the exchange already used.
  const retreats = [];
  if (SPY_WITHDRAW && ABILITY.SPY) {
    const picked = new Set();
    for (const k of all) {
      if (k.u.arm !== "SPY") continue;
      let best = null;
      for (const t of all) {
        if (t.ai === k.ai || picked.has(t)) continue;
        if (!best || t.u.v > best.u.v || (t.u.v === best.u.v && t.ui < best.ui)) best = t;
      }
      if (!best) continue;
      picked.add(best);
      retreats.push(best);
      if (SPY_SPENDS_ITSELF) { picked.add(k); retreats.push(k); }   // the Spy goes with it
    }
    for (const t of retreats) { const i = all.indexOf(t); if (i >= 0) all.splice(i, 1); }
  }
  // ⚠️ KEYED BY ARMY AND INDEX, NOT BY IDENTITY. `dead` is sized and indexed on the ORIGINAL
  // arrays and must stay that way, so nothing here may splice g.armies.
  const withdrew = new Set(retreats.map((t) => t.ai + ":" + t.ui));
  // WHAT EACH UNIT HITS FOR. Everything hits for its printed value; a Commander hits for the
  // value of the biggest thing facing it, and for 1 if nothing but Commanders faces it.
  const blow = new Map(all.map((k) => {
    if (k.u.arm !== COMMANDER || COMMANDER_OFF) return [k, k.u.v];
    const opp = all.filter((t) => t.ai !== k.ai && t.u.arm !== COMMANDER).map((t) => t.u.v);
    return [k, opp.length ? Math.max(...opp) : k.u.v];
  }));
  const hp = new Map(all.map((t) => [t, WOUNDS ? (t.u.hp ?? t.u.v) : t.u.v]));
  const left = new Map(hp);                       // durability still to be spent, as assigned
  const incoming = new Map();
  const dead = armies.map((a) => new Array(a.length).fill(false));
  const gone = (t) => dead[t.ai][t.ui];

  // WHO A BLOW GOES INTO: finish something if it can, otherwise the biggest thing still standing.
  const aim = (k) => {
    let best = null;
    for (const t of all) {
      if (t.ai === k.ai || gone(t) || left.get(t) <= 0) continue;
      const fin = blow.get(k) >= left.get(t);
      if (!best) { best = t; continue; }
      const bf = blow.get(k) >= left.get(best);
      if (fin !== bf) { if (fin) best = t; continue; }
      if (t.u.v !== best.u.v) { if (t.u.v > best.u.v) best = t; continue; }
      if (left.get(t) < left.get(best)) best = t;
    }
    return best;
  };
  const land = (k, t) => {
    left.set(t, left.get(t) - blow.get(k));
    if (!incoming.has(t)) incoming.set(t, []);
    incoming.get(t).push(k);
  };

  if (AGILITY) {
    // THE LADDER. Lowest printed value first; a unit killed in an earlier band never strikes.
    // Deaths are registered at the END of each band, so everything at one value is genuinely
    // simultaneous — two Warriors together finish a Horseman that neither could finish alone,
    // and neither of them is retracted because the other one landed first.
    for (const band of [...new Set(all.map((k) => k.u.v))].sort((a, b) => a - b)) {
      for (const k of all) {
        if (k.u.v !== band || gone(k)) continue;
        const t = aim(k);
        if (t) land(k, t);
      }
      for (const t of all) if (!gone(t) && left.get(t) <= 0) dead[t.ai][t.ui] = true;
    }
  } else {
    // ONE INSTANT. Targets are assigned heaviest attacker first over a shared pool, and every
    // unit strikes whether or not this charge kills it.
    for (const k of [...all].sort((x, y) => y.u.v - x.u.v || x.ai - y.ai || x.ui - y.ui)) {
      const t = aim(k);
      if (t) land(k, t);
    }
  }
  const kills = [];
  const hpAfter = new Map();
  for (const t of all) {
    const hits = incoming.get(t) || [];
    const after = hp.get(t) - hits.reduce((n, k) => n + blow.get(k), 0);
    hpAfter.set(t.u, after);              // keyed by the board card: that is what stays standing
    if (after > 0 || !hits.length) continue;
    dead[t.ai][t.ui] = true;              // already set under AGILITY; harmless to repeat
    // THE KILLING BLOW: the largest single contributor. ⚠️ Ties must NOT break on seat — that
    // hands the earliest seat a systematic share of every contested kill.
    const killer = hits.reduce((b, k) => !b || blow.get(k) > blow.get(b) ? k
      : blow.get(k) < blow.get(b) ? b : (k.ui < b.ui ? k : b), null);
    kills.push({ by: killer, hit: t });
  }

  // ---- the three abilities, in the same instant as the damage --------------------------------
  // Every ability reads the board AS REVEALED, before anything has been removed from it, and no
  // ability is conditional on its carrier living. Two cards naming the same target is the same
  // waste as two units finishing the same one — the second is spent and pays nothing.
  const highest = (mineAi, exclude) => {
    let best = null;
    for (const t of all) {
      if (t.ai === mineAi || exclude.has(t)) continue;
      if (!best || t.u.v > best.u.v || (t.u.v === best.u.v && t.ui < best.ui)) best = t;
    }
    return best;
  };
  const taken = new Set(), swaps = [], reveals = [];
  for (const k of all) {
    if (!ABILITY[k.u.arm]) continue;
    if (ABILITY[k.u.arm] === "swap") {
      if (SPY_WITHDRAW) continue;                // this Spy does something else
      const t = highest(k.ai, taken);
      if (!t) continue;
      taken.add(t); swaps.push({ spy: k, target: t });   // charge() drops it if either one died
    } else {
      const t = all.find((x) => x.ai !== k.ai && !x.u.revealed && !reveals.includes(x));
      if (t) reveals.push(t);
    }
  }

  // A UNIT THAT WITHDREW IS NOT A SURVIVOR — it is not on the field at all, so it cannot hold it.
  const totals = armies.map((a, ai) =>
    a.reduce((n, c, ui) => n + (dead[ai][ui] || withdrew.has(ai + ":" + ui) ? 0 : c.v), 0));
  const top = Math.max(...totals, 0);
  const victors = totals.filter((t) => t === top).length === 1 ? totals.indexOf(top) : -1;
  return { dead, kills, swaps, reveals, retreats, victors, totals, hpAfter };
}

export function charge(g, n, tally) {
  const { dead, kills, swaps, reveals, retreats, victors, hpAfter } = resolveCharge(g.armies);
  // A WITHDRAWN UNIT LEFT BEFORE CONTACT: home to its owner's hand, one lap of recovery, NOT a
  // casualty and NOT a point for anybody. ⚠️ It must not be spliced out here — `dead` is indexed
  // on these arrays and the survivor loop below reads it by index. It leaves there instead.
  const quit = new Set((retreats || []).map((t) => t.u));
  if (tally) g.armies.forEach((a, ai) => a.forEach((c, ui) => {
    if (quit.has(c)) return;                     // it never stood in this charge
    tally.stood[c.arm] = (tally.stood[c.arm] || 0) + 1;
    if (dead[ai][ui]) return;
    tally.lived[c.arm] = (tally.lived[c.arm] || 0) + 1;
    // a survivor that was hit but not finished — the only unit a persistent wound would touch
    if ((hpAfter.get(c) ?? c.v) < c.v) tally.hurt[c.arm] = (tally.hurt[c.arm] || 0) + 1;
  }));
  // per player, what this charge cost and what it paid — read-only, for the risk/reward harness
  const ledger = new Map();
  const row = (o) => { if (!ledger.has(o)) ledger.set(o, { stood: 0, lost: 0, killed: 0 }); return ledger.get(o); };
  const scored = new Map();
  const pay = (p, n) => { g.players[p].vp += n; scored.set(p, (scored.get(p) || 0) + n); };
  if (PAYS_KILLS) {
    for (const { by, hit } of kills) pay(by.u.owner, VPMODE === "value" ? hit.u.v : 1);
  }
  if (VPMODE === "survive") {
    g.armies.forEach((a, ai) => a.forEach((c, ui) => { if (!dead[ai][ui]) pay(c.owner, 1); }));
  }
  const blood = dead.some((col, ai) => ai !== victors && col.some(Boolean));
  if (PAYS_HILL && victors >= 0 && (!NEEDS_BLOOD || blood)) {
    // THE HILL. Killing decides who holds the ground; the ground is what pays.
    const held = new Map();
    g.armies[victors].forEach((c, ui) => {
      if (dead[victors][ui]) return;
      held.set(c.owner, (held.get(c.owner) || 0) + c.v);
    });
    const takers = VPMODE === "holdtop"
      ? (held.size ? [[...held.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0]] : [])
      : [...held.keys()];
    for (const p of takers) pay(p, 1);
  }
  for (const t of reveals) t.u.revealed = true;
  // THE SPY'S EXCHANGE IS PERMANENT: the two cards change hands and stay changed. Each keeps
  // the ground it stands on, so the Spy is now fighting for the side it infiltrated.
  for (const { spy, target } of swaps) {
    // ⚠️ THE EXCHANGE DOES NOT WAIT FOR THE SPY TO LIVE. Requiring it to survive contradicted the
    // one rule this whole battle runs on — everything lands in the same instant — and because a
    // value-1 Spy usually dies, the swap was cancelled far more often than it completed. The
    // ability measured at ZERO: 0.954 against 0.957 with it switched off entirely.
    // The target must still be alive, because you cannot change places with a corpse.
    if (dead[target.ai][target.ui]) continue;
    const a = g.players[spy.u.owner], b = g.players[target.u.owner];
    a.hand.splice(a.hand.indexOf(spy.u.ref), 1); b.hand.push(spy.u.ref);
    b.hand.splice(b.hand.indexOf(target.u.ref), 1); a.hand.push(target.u.ref);
    [spy.u.owner, target.u.owner] = [target.u.owner, spy.u.owner];
  }

  const lost = new Map();
  for (let a = 0; a < NUM_ARMIES; a++) {
    g.armies[a].forEach((c, i) => {
      if (quit.has(c)) return;
      const r = row(c.owner); r.stood++; if (dead[a][i]) r.lost++;
    });
  }
  for (const [o, n] of scored) row(o).killed += n;
  for (let a = 0; a < NUM_ARMIES; a++) {
    const keep = [];
    g.armies[a].forEach((c, i) => {
      if (quit.has(c)) {                         // left before contact: no casualty, no point
        c.ref.onBoard = false; c.ref.readyAt = g.turn + n; c.hp = undefined;
        return;
      }
      if (dead[a][i]) {
        // LOSING UNITS RECOVER. Nothing is destroyed — a killed unit goes home and sits out a
        // lap of the table before it can be committed again.
        c.ref.onBoard = false; c.ref.readyAt = g.turn + n; c.hp = undefined;
        lost.set(c.owner, (lost.get(c.owner) || 0) + 1);
      } else {
        c.revealed = true; c.ref.revealed = true;         // WINNING UNITS STAND, face up
        // ⚠️ A WOUND BELONGS TO THE UNIT ON THE GROUND, NOT TO THE CARD IN HAND. It was written
        // to `c.ref` and read back off `c`, so it never survived a single charge and WOUNDS=1
        // measured identically to WOUNDS=0 — an inert lever reading as a finding.
        if (WOUNDS) c.hp = hpAfter.get(c) ?? c.v;
        keep.push(c);
      }
    });
    g.armies[a] = keep;
    if (!keep.length) g.leader[a] = null;
    else {
      const by = new Map();
      for (const c of keep) by.set(c.owner, (by.get(c.owner) || 0) + c.v);
      const hi = Math.max(...by.values());
      g.leader[a] = by.get(g.leader[a]) === hi ? g.leader[a]
        : [...by.entries()].filter(([, v]) => v === hi).sort((x, y) => x[0] - y[0])[0][0];
    }
  }
  g.charge++;
  // ⚠️ THE FIELD IS ONLY TAKEN IF THE CHARGE DREW BLOOD, and this is the other half of the same
  // exploit. Requiring an occupied enemy army is not enough on its own: after a charge the front
  // is quiet BY CONSTRUCTION — every survivor faces things it cannot finish — so a second charge
  // between two occupied armies also kills nothing, also awards the field on surviving value, and
  // also returns the turn to the same seat. A charge that kills nothing now takes no field and
  // grants no turn, and play simply continues in order.
  g.nextSeat = victors >= 0 && kills.length ? g.leader[victors] : null;
  // ⚠️ THIS COUNTER NAMED A UNIT THAT NO LONGER EXISTS. It read `arm === "SLINGER"` after D058
  // replaced the Slinger with the Commander, so it returned 0 on every charge, and the gates'
  // ability table has printed 0.00 for the Commander in every run since. A readout that cannot
  // fail reports a card as inert whether it is inert or not — and the Commander is in fact the
  // busiest of the three. Count the kills the Commander actually took.
  return { kills, scored, lost, victors, ledger,
    commanded: kills.filter((k) => k.by.u.arm === COMMANDER).length,
    swapped: swaps.length, revealed: reveals.length,
    // under `mutual` a firing takes two cards, under `solo` one — count the Spies, not the cards
    withdrew: (retreats || []).length / (SPY_SPENDS_ITSELF ? 2 : 1) };
}

// ---- the policy ------------------------------------------------------------------------------
// Every unit can hit every unit, so what a card is worth is simply what it can finish and what
// can finish it.
//
// ⚠️ THE THREE ABILITIES MUST BE PRICED HERE OR THEY DO NOT EXIST. Measured without these terms,
// the Slinger fired 2.7 times a game and the Spy and the Scout fired 0.04 — not because they are
// weak but because nothing in the policy could see them, so a bot read them as the worst card in
// the game and never played one. A rule the decision function ignores is untestable, and its
// measurement is an artifact of the omission rather than a reading of the card.
//
// These three numbers are STATED JUDGEMENTS, not measurements, and they are env-tunable so that
// any conclusion drawn from them can be sensitivity-tested. A conclusion that moves when they
// move is an assumption, not a finding.
const V_SPY = Number(process.env.V_SPY ?? 0.5);           // takes their best card, permanently
const V_SCOUT = Number(process.env.V_SCOUT ?? 0.25);      // turns one hidden card face up
const V_DENY = Number(process.env.V_DENY ?? 0.3);         // ARMYCMD: a point denied to someone else
// ⚠️ WHAT A SILENCED BODY IS STILL FOR. Gating the kill term on not being pre-empted, and nothing
// else, made every big card a bad deal against simply passing: commits fell across the board,
// charges dropped to 0.96 kills and the game ran 37 minutes. But an ELEPHANT 6 that never swings
// has still eaten six points of early blows that would otherwise have finished two cheap cards.
// Soak is the other half of the trade agility creates, and without it the policy sees only the
// cost. A STATED JUDGEMENT, env-tunable, so anything concluded from it can be sensitivity-tested.
const V_SOAK = Number(process.env.V_SOAK ?? 0.6);
const AVG_VALUE = () => TYPES.reduce((n, t) => n + VALUE[t], 0) / TYPES.length;
const MAX_VALUE = () => Math.max(...TYPES.map((t) => VALUE[t]));

// what the Spy and the Scout are worth HERE, on this board — the Spy scales with the best thing
// standing opposite, the Scout with how much of the enemy line is still face down.
function abilityWorth(g, arm, army) {
  const ab = ABILITY[arm];
  if (ab !== "swap" && ab !== "reveal") return 0;
  let best = 0, hidden = 0, seen = 0;
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (a === army) continue;
    for (const c of g.armies[a]) { seen++; if (c.revealed) best = Math.max(best, c.v); else hidden++; }
  }
  if (!seen) return 0;
  if (ab === "swap") return V_SPY * (best || AVG_VALUE()) / MAX_VALUE();
  return V_SCOUT * (hidden / seen);
}

function expectedKills(g, arm, army) {
  // a Commander is worth whatever the biggest thing opposite it is worth
  let mine = VALUE[arm];
  if (arm === COMMANDER) {
    const opp = [];
    for (let a = 0; a < NUM_ARMIES; a++) if (a !== army)
      for (const c of g.armies[a]) if (c.revealed && c.arm !== COMMANDER) opp.push(c.v);
    mine = opp.length ? Math.max(...opp) : AVG_VALUE();
  }
  let n = 0;
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (a === army) continue;
    for (const c of g.armies[a]) n += c.revealed ? Math.min(1, mine / c.v) : Math.min(1, mine / AVG_VALUE());
  }
  return Math.min(1, n);
}
function expectedRisk(g, arm, army) {
  const mine = VALUE[arm];
  let n = 0;
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (a === army) continue;
    for (const c of g.armies[a]) n += c.revealed ? c.v : AVG_VALUE();
  }
  return Math.min(1, n / mine);
}
// ⚠️ UNDER AGILITY, DYING AND BEING SILENCED ARE TWO DIFFERENT COSTS AND THE POLICY MUST PRICE
// BOTH. `expectedRisk` is the chance the card dies at all — it loses a lap of recovery and hands
// somebody a point. THIS is the chance it never strikes: only enemies of STRICTLY LOWER value act
// before you, so only their damage can silence you. Equal value is the same band and lands
// together, which is why a tie must not count here.
//
// It is the term that makes a cheap card mean something. A value-1 unit CANNOT be pre-empted by
// anything — nothing in the game is faster — so its blow and its printed text land whatever else
// happens, and it is priced for that even though it usually dies. An ELEPHANT 6 is pre-empted by
// every other card on the table. Without this the policy reads the two as the same trade with
// different numbers, which is the whole reason the abilities could not be measured before.
// ⚠️ AND IT MUST BE A SHARE, NOT A SUM. Counting every faster enemy's damage as if all of it were
// aimed at this one card priced an ELEPHANT 6 as certainly silenced — nothing big was ever worth
// deploying, charges fell to 0.96 kills, and the game ran 37 minutes and failed two gates. The
// enemy's fast damage is spread across the whole line, and the aim heuristic sends it at the
// BIGGEST thing standing, so a big card's share is large but never all of it.
function expectedPreempt(g, arm, army) {
  if (!AGILITY) return 0;
  const mine = VALUE[arm];
  let fast = 0;
  for (let a = 0; a < NUM_ARMIES; a++) {
    if (a === army) continue;
    for (const c of g.armies[a]) {
      const v = c.revealed ? c.v : AVG_VALUE();
      if (v >= mine) continue;                 // same band or slower: it cannot silence me
      fast += v;
    }
  }
  if (!fast) return 0;
  // my share of what is thrown early: value attracts the blow, so weight by value across the
  // line I would be standing in, this card included.
  let line = mine;
  for (const c of g.armies[army]) line += c.v;
  return Math.min(1, (fast * (mine / line)) / mine);
}

// ⚠️ IS THE TEMPO TERM AN IMPROVEMENT OR IS IT DAMAGE? The only way to know is to sit the two
// policies at the same table. `p.tempo` is set per player by the harness; unset, every seat uses
// whatever AGILITY says, which is what every gate run does.
export function score(g, seat, act) {
  // ⚠️ DEFAULT OFF, AND THE REASON IS MEASURED. Pricing initiative made the policy play STRICTLY
  // WORSE: 32-35% of the wins against 65-68% for the policy that ignores it, over 4,000 games at
  // 4, 6 and 8 players (`sim/tempo-h2h.mjs`). Being pre-empted costs far less than the term
  // charges for it — a silenced ELEPHANT 6 has still eaten six points of early blows. Kept behind
  // TEMPO=1 as a failed experiment, because a policy that plays worse measures worse.
  const TEMPO = g.players[seat].tempo ?? (process.env.TEMPO === "1");
  if (act.pass) return PASS_BASE;
  if (act.charge) {
    const { kills, dead, victors } = resolveCharge(g.armies);
    let mine = 0, lose = 0;
    for (const { by, hit } of kills) { if (by.u.owner === seat) mine++; if (hit.u.owner === seat) lose++; }
    if (VPMODE === "value") {
      mine = 0;
      for (const { by, hit } of kills) if (by.u.owner === seat) mine += hit.u.v / 3;
    }
    if (VPMODE === "survive") {
      mine = 0;
      g.armies.forEach((a, ai) => a.forEach((c, ui) => { if (!dead[ai][ui] && c.owner === seat) mine += 1; }));
    }
    if (PAYS_HILL) {
      // ⚠️ D045: under the hill, kills are the MEANS and holding is the POINT. A policy still
      // scoring itself on kills alone would be playing a different game from the measured one.
      if (VPMODE !== "killhold") mine = 0;
      const blood = dead.some((col, ai) => ai !== victors && col.some(Boolean));
      if (victors >= 0 && (!NEEDS_BLOOD || blood)) {
        const held = new Map();
        g.armies[victors].forEach((c, ui) => {
          if (dead[victors][ui]) return;
          held.set(c.owner, (held.get(c.owner) || 0) + c.v);
        });
        if (VPMODE === "holdtop") {
          const top = held.size ? [...held.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0] : -1;
          mine += top === seat ? 1 : 0;
        } else mine += held.has(seat) ? 1 : 0;
      }
    }
    return CHARGE_BASE + KILL_WEIGHT * mine - RISK_WEIGHT * lose;
  }
  if (act.defect) {
    let here = 0, there = 0;
    for (const c of act.defect) {
      here += expectedKills(g, c.arm, act.from) * (1 - (TEMPO ? expectedPreempt(g, c.arm, act.from) : 0))
        - expectedRisk(g, c.arm, act.from);
      there += expectedKills(g, c.arm, act.to) * (1 - (TEMPO ? expectedPreempt(g, c.arm, act.to) : 0))
        - expectedRisk(g, c.arm, act.to);
    }
    return PASS_BASE - 0.3 + KILL_WEIGHT * (there - here);
  }
  if (act.withdraw) {
    const k = expectedKills(g, act.withdraw.arm, act.army)
      * (1 - (TEMPO ? expectedPreempt(g, act.withdraw.arm, act.army) : 0));
    const r = expectedRisk(g, act.withdraw.arm, act.army);
    const full = g.armies[act.army].length >= ARMY_CAP;
    // ⚠️ AN ALLY'S UNIT IS A DIFFERENT DECISION AND MUST NOT SHARE THE FORMULA. Your own unit is
    // pulled back because it is IDLE — it can kill nothing and nothing can kill it, so it is a
    // card locked up for no return. An ally's is pulled back for what it DENIES: the enemy the
    // kill it was about to take on it, and the ally the kill it was about to make. Neither point
    // was ever going to be yours, so both are worth a share of one to you.
    // V_DENY is a STATED JUDGEMENT, not a measurement, and it is env-tunable so that anything
    // concluded from this lever can be sensitivity-tested against it.
    if (act.withdraw.owner !== seat) return PASS_BASE - 0.2 + V_DENY * (r + k);
    return PASS_BASE - 0.2 + (full ? 0.6 : 0) + 0.5 * (1 - k) - 0.4 * (1 - r);
  }
  const k = expectedKills(g, act.unit.arm, act.army);
  const r = expectedRisk(g, act.unit.arm, act.army);
  // WHAT YOU DO ONLY COUNTS IF YOU GET TO DO IT. The blow and the printed text are both gated on
  // not being silenced first; the death cost is not, because you pay that either way.
  const pre = (TEMPO ? expectedPreempt(g, act.unit.arm, act.army) : 0);
  const live = 1 - pre;
  return KILL_WEIGHT * k * live - RISK_WEIGHT * r + SURVIVE_BONUS * (1 - r)
    + V_SOAK * pre * (VALUE[act.unit.arm] / MAX_VALUE())
    + live * abilityWorth(g, act.unit.arm, act.army);
}

function choose(acts, scores, rnd) {
  const max = Math.max(...scores);
  const w = scores.map((x) => Math.exp((x - max) / TEMPERATURE));
  const tot = w.reduce((a, b) => a + b, 0);
  let r = rnd() * tot;
  for (let i = 0; i < acts.length; i++) if ((r -= w[i]) <= 0) return acts[i];
  return acts[acts.length - 1];
}

export function playGame(factionKeys, seed, opts = {}) {
  const rnd = makeRng(seed);
  const g = newGame(factionKeys, opts.roster || FACTIONS);
  if (opts.tempo) g.players.forEach((p, i) => { p.tempo = opts.tempo[i]; });
  const n = g.players.length;
  let seat = 0, idle = 0, charges = 0, turns = 0, kills = 0;
  const fired = { commanded: 0, swapped: 0, revealed: 0, saved: 0, withdrew: 0 };
  // SAVES ARE TALLIED PER TYPE, because "who gets covered" is the whole question the rule is
  // asked to answer: a rule that only ever saves Elephants is a different rule from one that
  // saves the value-1 cards nobody could otherwise protect.
  const tally = { sent: {}, stood: {}, lived: {}, hurt: {}, saved: {} };

  for (let guard = 0; guard < 4000; guard++) {
    const acts = legalActions(g, seat);
    const act = choose(acts, acts.map((a) => score(g, seat, a)), rnd);
    turns++; g.turn++;
    if (act.pass) idle++;
    else {
      idle = 0;
      if (act.charge) { const r = charge(g, n, tally); kills += r.kills.length; charges++; opts.onCharge?.(r);
        fired.commanded += r.commanded; fired.swapped += r.swapped; fired.revealed += r.revealed; fired.withdrew += r.withdrew; }
      else if (act.defect) {
        const from = g.armies[act.from], to = g.armies[act.to];
        for (const c of act.defect) { from.splice(from.indexOf(c), 1); to.push(c); }
        if (!from.length) g.leader[act.from] = null;
        else if (g.leader[act.from] === seat) {
          const by = new Map();
          for (const c of from) by.set(c.owner, (by.get(c.owner) || 0) + c.v);
          g.leader[act.from] = [...by.entries()].sort((x, y) => y[1] - x[1])[0][0];
        }
        if (g.leader[act.to] === null) g.leader[act.to] = seat;
      } else if (act.withdraw) {
        // ARMYCMD: a comrade's unit pulled back. The cover is spent for this charge.
        if (act.withdraw.owner !== seat) {
          fired.saved++; g.players[seat].coveredAt = g.charge;
          tally.saved[act.withdraw.arm] = (tally.saved[act.withdraw.arm] || 0) + 1;
        }
        const a = g.armies[act.army];
        a.splice(a.indexOf(act.withdraw), 1);
        act.withdraw.ref.onBoard = false;
        act.withdraw.ref.readyAt = g.turn + n;
        if (!a.length) g.leader[act.army] = null;
      } else { commit(g, seat, act.unit, act.army);
        tally.sent[act.unit.arm] = (tally.sent[act.unit.arm] || 0) + 1; }
    }
    if (FORCED && boardFull(g)) { const r = charge(g, n, tally); kills += r.kills.length; charges++; opts.onCharge?.(r);
      fired.commanded += r.commanded; fired.swapped += r.swapped; fired.revealed += r.revealed; fired.withdrew += r.withdrew; }
    opts.onTurn?.(g, seat, act, { turns, charges });
    if (Math.max(...g.players.map((p) => p.vp)) >= targetFor(n)) break;
    if (idle >= Math.max(IDLE_FLOOR, n * 2)) break;
    if (g.nextSeat !== null && g.nextSeat !== undefined) { seat = g.nextSeat; g.nextSeat = null; }
    else seat = (seat + 1) % n;
  }
  const top = Math.max(...g.players.map((p) => p.vp));
  return {
    vp: g.players.map((p) => p.vp),
    target: targetFor(n),
    winners: g.players.filter((p) => p.vp === top).map((p) => p.seat),
    charges, turns, kills, ...fired, tally, end: top >= targetFor(n) ? "target" : "stall",
  };
}
