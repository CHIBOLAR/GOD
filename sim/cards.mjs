// DECCAN II — the single source of truth for all card data.

// ---- the ring ---------------------------------------------------------------
// Each arm cancels the NEXT TWO along the ring, and is cancelled by the two behind it.
//   ELEPHANT -> RIFLEMAN -> WARRIOR -> HORSEMAN -> WARRIOR -> back to ELEPHANT
export const ARMS = ["ELEPHANT", "RIFLEMAN", "CANNON", "HORSEMAN", "WARRIOR"];
export const GLYPH = { ELEPHANT: "E", RIFLEMAN: "R", CANNON: "C", HORSEMAN: "H", WARRIOR: "W" };
export const armIndex = (a) => ARMS.indexOf(a);
export const beatsIdx = (x, y) => y === (x + 1) % 5 || y === (x + 2) % 5;
export const beats = (a, b) => beatsIdx(armIndex(a), armIndex(b));
export const PREY = Object.fromEntries(
  ARMS.map((a, i) => [a, [ARMS[(i + 1) % 5], ARMS[(i + 2) % 5]]]));

// ---- the Force and the supply, one card per arm each -------------------------
// Strength is a property of the ARM. The supply is an upgraded shadow of the Force: one Power
// Broker per arm, each exactly +1 over its Force counterpart, each carrying an ability. Force
// strengths are odd and broker strengths even, so a Force unit and a broker can never tie.
//
// BROKERS ARE INSIDE THE RING. A broker can be cancelled like anything else, which is the
// structural answer to the failure that ended the old game: a broker measured +38.8, present
// in all 50 of the top 50 armies, because nothing could answer it.
// The ladder is the lever on faction balance: the RATIO between the cheapest and dearest arm
// is what an Archer-heavy faction has to overcome. 1..9 is a 9x ratio; shifting the whole
// ladder up compresses it without touching the gaps or the odd/even broker shadow.
// ARMSTR assigns a strength to each arm IN RING ORDER (ELEPHANT, RIFLEMAN, WARRIOR,
// HORSEMAN, WARRIOR). Which strength sits on which arm is the one lever that can level the
// factions without touching the ring the designer specified — the relationships stay exactly
// as written, only the numbers move.
export const ARMSTR = (process.env.ARMSTR || "9,3,7,5,1").split(",").map(Number);
const S = Object.fromEntries(ARMS.map((a, i) => [a, ARMSTR[i]]));
export const FORCE = [
  { key: "warrior", name: "Warrior", arm: "WARRIOR", s: S.WARRIOR },
  { key: "horseman", name: "Horseman", arm: "HORSEMAN", s: S.HORSEMAN },
  { key: "cannon", name: "Cannon", arm: "CANNON", s: S.CANNON },
  { key: "rifleman", name: "Rifleman", arm: "RIFLEMAN", s: S.RIFLEMAN },
  { key: "elephant", name: "Elephant", arm: "ELEPHANT", s: S.ELEPHANT },
];

// Each ability is a (name, effect) pair. WHICH ARM it is printed on decides its strength,
// because a broker is always +1 over its arm's Force unit — so moving an ability between arms
// re-prices it. ABIL assigns them in ring order: ELEPHANT RIFLEMAN CANNON HORSEMAN WARRIOR.
//
// ⚠️ This is not cosmetic. When the strengths were rearranged to balance the factions, every
// ability moved with its arm and was silently re-priced: "double while alone" fell from a
// printed 8 to a printed 4, halving a lone Subhedar from 16 to 8. Abilities must be assigned
// deliberately AFTER the numbers settle, not inherited from before.
// TIMING KEYWORDS. Three, and they are purely temporal — each names a moment in the round, so
// the card face carries the ordering rule that used to live only in a rulebook sentence.
//
//   ON DEPLOY  when the card is committed, before anything is revealed. BEATS THE RING: the
//              card has not been contested yet, so cancellation cannot stop it. Siege Elephant
//              alone, and it is face up precisely because it acts before the ring (D030).
//   ON REVEAL  the abilities sub-step of the battle: ring first, THEN abilities, then the count.
//              Only SURVIVORS act — a cancelled unit's ability never fires.
//   ON DEFEAT  after the ground is decided, if this card's army did not take it. Also requires
//              the card to have survived the ring.
//
// ⚠️ ON REVEAL is the abilities step, NOT the Charge. Both armies turn face up at Charge, but
// nothing resolves until the ring has been read off the revealed armies. Naming the step on the
// card is the whole point of the keyword: without it, "does my Spy still steal if a Rifleman
// cancelled it?" is answerable only from the rulebook.
//
// The Sepoy is ON REVEAL and not a separate static keyword: its condition (ALONE) is fixed the
// moment both armies turn face up and can never change afterwards, and because the effect only
// touches the Sepoy's own strength, a cancelled Sepoy totals 0 whether doubled or not — so the
// timing is inert for it and does not need a fourth word. ALONE counts the REVEALED army, so a
// cancelled army-mate still counts as company (`battle.mjs` value(): `army.length === 1`).
export const TIMING = { DEPLOY: "ON DEPLOY", REVEAL: "ON REVEAL",
  VICTORY: "ON VICTORY", DEFEAT: "ON DEFEAT" };

// LOOK, not REVEAL, on the Siege Elephant: REVEAL is now a timing keyword, and the rulebook's
// own wording for this effect was always "look at any one committed enemy unit".
// CARD COPY IS CUT TO THE BONE. The timing keyword now carries what a clause used to: the
// Rockets no longer say "if your army loses" (ON DEFEAT says it) and the Spy no longer explains
// what permanence means (one word does). Every remaining word is load-bearing — the enemy's
// STRONGEST and WEAKEST cannot go, because those two targeting lines are deliberately opposite
// (D028), and PERMANENT cannot go, because a swap that lasts one battle is a different card.
//
// EXCHANGE, not SWAP: the exchange is permanent and two-way, and "swap" reads as a temporary
// board shuffle. (The resolver still calls these `swaps` internally — code identifiers, not
// player-facing text.)
// EXPERIMENT — ROCKETSUP=1 deploys the Sultan Rockets FACE UP.
// The question is whether a VISIBLE scorch threat forks the winning side ("is this ground worth
// my recovery?"), which a hidden one cannot: at 4-of-20, times the chance it is committed, times
// it surviving CANNON's killers, the hidden read is mostly noise.
// ⚠️ Face up is NOT the same as ON DEPLOY. The Siege Elephant is face up BECAUSE it acts before
// the ring; the Rockets would be face up purely as a deterrent, still resolving ON DEFEAT.
// ADOPTED: the Rockets deploy FACE UP. Two brokers now carry information — the Siege Elephant
// BUYS it (look at one enemy unit) and the Rockets ARE it (a threat everyone can plan around).
// Set ROCKETSUP=0 to put them back face down.
const ROCKETS_FACE_UP = process.env.ROCKETSUP !== "0";

const ABILITY = {
  siege:    { name: "Siege Elephant", faceUp: true, when: TIMING.DEPLOY,
    text: "Deploy FACE UP. LOOK at one enemy unit — it stays face up." },
  rockets:  { name: "Sultan Rockets", faceUp: true, when: TIMING.DEFEAT,
    text: "ON DEFEAT: kill one surviving enemy unit." },
  spy:      { name: "Spy", when: TIMING.REVEAL,
    text: "If it survives, EXCHANGE with the enemy's strongest survivor. PERMANENT." },
  subhedar: { name: "Subhedar", when: TIMING.VICTORY,
    text: "ON VICTORY: kill the enemy's weakest survivor." },
  sepoy:    { name: "Sepoy", when: TIMING.REVEAL,
    text: "Kills TWO enemy units instead of one." },
};
const ABIL = (process.env.ABIL || "siege,sepoy,rockets,spy,subhedar").split(",");
export const BROKERS = ARMS.map((arm, i) => ({
  key: ABIL[i], arm, s: S[arm] + 1, copies: Number(process.env.COPIES || 3), ...ABILITY[ABIL[i]],
}));
// THREE of each, 15 in the supply - 64 Force cards + 15 = 79 in the box.
// The supply shrank with the move to eight-card hands. It is drawn down to ~14 of 15 at eight
// players, so the "12% left undrawn" gate WARNS - see OPEN.md. No game in any run ended by
// exhaustion: 100% still end on the victory target at every player count.
// ⚠️ gates.mjs used to report "of 25" and gate at pass<=22 / fail>25 — thresholds inherited
// from a 25-card supply, which against 20 could never bind. GATES NOW DERIVE THE SUPPLY SIZE
// FROM HERE so the two cannot drift apart again. If COPIES changes, the gate follows.
export const SUPPLY_SIZE = BROKERS.reduce((s, b) => s + b.copies, 0);

// ---- the factions -----------------------------------------------------------
// ASYMMETRIC DISTRIBUTION. A faction is defined by HOW MANY of each arm it holds, counted
// from its lead arm and going round the ring. All five factions are the same pattern rotated.
//
// Because strength is fixed to the arm, rotating a faction changes its raw total — so the
// five-fold symmetry no longer PROVES the factions level, as it did when every faction shared
// one strength multiset. Balance here is measured, not guaranteed. The hope is that the ring
// self-balances it: an Elephant-heavy faction has huge raw strength and is shredded by cheap
// Archers, while an Archer-heavy faction is weak on paper and cancels giants.
// Measured across eight candidate patterns. 3/2/2/2/1 is the only one that is genuinely
// asymmetric AND lands inside the gate: faction spread 3.5 against a target of 5. Steeper
// patterns fail badly — 4/3/2/1/0 spreads 11.9, because with strength welded to the arm the
// raw totals run 40 to 70 and the ring cannot flatten a gap that wide.
export const PATTERN = (process.env.PATTERN || "3,2,2,2,1").split(",").map(Number);

// EIGHT RULERS OF EIGHT CARDS. 8 x 8 = 64 Force cards, plus a 15-card supply = 79 in the box.
//
// ⚠️ THE ROSTER IS NO LONGER GENERATED BY ROTATION. It used to be: every faction was one shape
// rotated to its lead arm. That is provably unfair here, and the reason is the same one recorded
// against the strength ladder above — STRENGTH IS WELDED TO THE ARM, so "3 of your lead plus 2
// of the next arm round the ring" is a different deck for every lead. Measured on nine cards:
// the Horseman-led ruler's "next two" are WARRIOR and ELEPHANT, handing it three Elephant-killers
// AND two Elephants, while the Elephant-led ruler's next two are RIFLEMAN and CANNON. Identical
// shape, +7.0 against -8.0. Rotation cannot be rescued by picking a better shape; it has to go.
//
// Each ruler's counts are therefore written out ARM BY ARM and chosen by measurement, one slot
// at a time, against the whole roster (`ROSTERSPEC` + the sweep harness). Every ruler still holds
// at least one of every arm, so "a ruler always has an answer to every arm" survives intact.
//
// THE SHAPE OF THE ANSWER: every ruler carries the arm that answers ITS OWN predator.
// The Sultan's Elephants die to Warriors, so the Sultan fields Warriors. Three separate slot
// sweeps landed on this independently — it is the single strongest pattern in the roster.
//   counts are [ELEPHANT, RIFLEMAN, CANNON, HORSEMAN, WARRIOR], in ring order.
const ROSTER = [
  ["sultan",   "The Sultan",   "war elephants, and the muskets and foot that walk beside them", "ELEPHANT", [2, 2, 1, 1, 2]],
  ["badshah",  "The Badshah",  "the imperial gun train and its levies",              "CANNON",   [1, 1, 3, 1, 2]],
  ["peshwa",   "The Peshwa",   "Ganimi Kava, and horse that never stands",           "HORSEMAN", [1, 1, 1, 4, 1]],
  ["governor", "The Governor", "matchlocks drilled off the ships",                   "RIFLEMAN", [1, 3, 1, 1, 2]],
  ["rana",     "The Rana",     "the last stand on foot, and riders to reach it",     "WARRIOR",  [1, 1, 1, 2, 3]],
  ["nizam",    "The Nizam",    "guns, and the horse that screens them",              "CANNON",   [2, 1, 2, 2, 1]],
  ["nawab",    "The Nawab",    "massed muskets, and horse to carry them",                    "RIFLEMAN", [1, 3, 1, 2, 1]],
  ["maharaja", "The Maharaja", "horse and foot, and nothing bought",                 "HORSEMAN", [1, 1, 1, 3, 2]],
];
// EIGHT CARDS, five arms, no zeroes: three spare cards over the 1-per-arm floor, so 35 decks
// exist. That number is the whole reason for eight cards rather than seven. At SEVEN cards there
// are two spares and only 15 decks, and every legal single-card move swung a faction 5-9 points
// against a 5-point gate — the lever had worse resolution than the target, and Peshwa and Badshah
// could not be fixed at all. At eight, a slot can be re-aimed without overshooting.
//
// SHAPE is used only by ROSTERSPEC's S/P/K tokens, for sweeps. Read from the lead arm round
// the ring: specialist puts all three spares on the lead, pair puts two on the lead and one on
// the NEXT arm, skip puts the third on the arm TWO along.
const SHAPE = {
  specialist: [4, 1, 1, 1, 1],
  pair: [3, 2, 1, 1, 1],
  skip: [3, 1, 2, 1, 1],
};
const forceByArm = Object.fromEntries(FORCE.map((u) => [u.arm, u]));

// ---- ROSTER SWEEP (ROSTERSPEC) --------------------------------------------------------------
// The strength ladder is exhausted: all 120 ARMSTR permutations were measured and 9,3,7,5,1 is
// the best that keeps "a Warrior 1 cancels an Elephant 9". Anything better only MOVES the crown
// (LESSONS B3). So the remaining lever is WHICH ARMS GET A SPECIALIST AND WHICH GET A PAIR.
//
// Ten identities exist — a specialist and a pair for each of the five arms — and the game uses
// eight of them. `ROSTERSPEC` picks which eight: "S<i>" = specialist in ARMS[i], "P<i>" = pair
// led by ARMS[i]. Unset, the named roster above is used completely unchanged.
//   default equivalent:  S0,S1,S2,S3,S4,P1,P2,P3
const ROSTERSPEC = process.env.ROSTERSPEC;
const ACTIVE_ROSTER = ROSTERSPEC
  ? ROSTERSPEC.split(",").map((t) => {
      // S<i> specialist · P<i> adjacent pair · K<i> skip pair, each led by ARMS[i]
      // V<abcde>@<i> — an ARBITRARY shape: counts a,b,c,d,e read from lead ARMS[i] round the
      // ring, so "V30121@3" is 3 HORSEMAN, 0 WARRIOR, 1 ELEPHANT, 2 RIFLEMAN, 1 CANNON. Zeroes
      // are allowed here and nowhere else. ⚠️ D034: dropping ONE arm is free (four arms still
      // answer all five); dropping two ADJACENT arms leaves a hole that can be aimed at for the
      // whole game. This lever will happily build the bad kind — check coverage before trusting.
      if (t[0] === "V") {
        const [vec, lead] = t.slice(1).split("@");
        const counts = vec.split("").map(Number);
        const arm = ARMS[Number(lead)];
        SHAPE[t] = counts;                       // register the custom shape under its own key
        return [t, t, `custom ${vec} from ${arm}`, arm, t];
      }
      const archetype = t[0] === "P" ? "pair" : t[0] === "K" ? "skip" : "specialist";
      const arm = ARMS[Number(t.slice(1))];
      return [t, t, `${archetype} in ${arm}`, arm, archetype];
    })
  : ROSTER;

// `shape` is either an explicit per-arm count array in ring order (the shipped roster) or the
// name of a SHAPE, which is then read from the ruler's lead arm round the ring (ROSTERSPEC).
export const FACTIONS = ACTIVE_ROSTER.map(([key, name, era, lead, shape]) => {
  const explicit = Array.isArray(shape);
  const k = explicit ? 0 : armIndex(lead);
  const counts = {};
  (explicit ? shape : SHAPE[shape]).forEach((n, g) => { counts[ARMS[(g + k) % 5]] = n; });
  const units = [];
  for (const arm of ARMS) for (let i = 0; i < counts[arm]; i++) units.push({ ...forceByArm[arm] });
  return { key, name, era, lead, archetype: explicit ? "custom" : shape, counts, units,
    total: units.reduce((s, u) => s + u.s, 0) };
});

// TARGET=<n> overrides every count, for tuning the target against a new scoring rule.
const T = Number(process.env.TARGET || 0);
export const VICTORY_TARGET = T
  ? Object.fromEntries([2,3,4,5,6,7,8].map((k) => [k, k === 2 ? T + 1 : T]))
  : { 2: 5, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4 };

export function validate() {
  const p = [];
  // HAND is the deck size: eight cards per ruler. Sweeps of other formats set it explicitly.
  const HAND = Number(process.env.HAND || 8);
  for (const f of FACTIONS) if (f.units.length !== HAND) p.push(`${f.key}: ${f.units.length} units`);
  // Keys must always be distinct. The SHIPPED game is exactly 8 factions; an exploratory
  // ROSTERSPEC may hold any number, so that all 15 possible identities can be measured at once.
  if (new Set(FACTIONS.map((f) => f.key)).size !== FACTIONS.length) p.push("duplicate faction keys");
  if (!ROSTERSPEC && FACTIONS.length !== 8) p.push("expected 8 distinct factions");
  for (const u of FORCE) if (u.s % 2 !== 1) p.push(`${u.name}: Force strengths must be odd`);
  for (const b of BROKERS) if (b.s % 2 !== 0) p.push(`${b.name}: broker strengths must be even`);
  if (new Set(BROKERS.map((b) => b.arm)).size !== 5) p.push("brokers do not cover all five arms");
  const timings = new Set(Object.values(TIMING));
  for (const b of BROKERS) if (!timings.has(b.when)) p.push(`${b.name}: needs a timing keyword`);
  // ON DEPLOY requires face up — you cannot act on deployment from under a face-down card.
  // The converse does NOT hold: a card may be face up purely as a visible threat (ROCKETSUP).
  for (const b of BROKERS) {
    if (b.when === TIMING.DEPLOY && !b.faceUp) p.push(`${b.name}: ON DEPLOY must deploy face up`);
  }
  const supply = BROKERS.reduce((s, b) => s + b.copies, 0);
  if (supply !== Number(process.env.COPIES || 3) * 5) p.push(`the supply is ${supply} cards`);
  return p;
}
const bad = validate();
if (bad.length) {
  console.error("CARD DATA INVALID:");
  bad.forEach((x) => console.error("  " + x));
  process.exit(1);
}

export const label = (u) => `${GLYPH[u.arm]}${u.s}`;
