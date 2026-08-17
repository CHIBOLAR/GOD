// DECCAN II — the single source of truth for all card data.
//
// rules/CARDS.md is GENERATED from this file (npm run cards). Never hand-edit that file.
// Every other module in sim/ imports from here.

// ---- the five arms ----------------------------------------------------------
// Rock-paper-scissors-lizard-Spock: arm i beats i+1 and i+2, and loses to i-1 and i-2.
// Every edge below is a real thing that happened in the Deccan.
//
//   ARCHER   -> ELEPHANT (arrows panic them)     · WARRIOR  (shot down from range)
//   ELEPHANT -> WARRIOR  (trampled)             · HORSEMAN (horses will not face them)
//   WARRIOR  -> HORSEMAN (spears stop a charge) · CANNON   (gun crews overrun)
//   HORSEMAN -> CANNON   (ridden down)          · ARCHER   (run down in the open)
//   CANNON   -> ARCHER   (outranged, shredded)  · ELEPHANT (the one answer to them)
//
// ⚠️ FIVE ARMS, NOT THREE, AND THE COUNT IS LOAD-BEARING. With three arms a three-card army
// can hold one of each, and it then cancels the ENTIRE enemy army whatever it is: the best
// army in the game became one-of-each at minimum strength (100%), printed strength stopped
// mattering, and every faction matchup solved to exactly 0.000. With five arms no three cards
// can cover the field, so that lock is structurally impossible. See DECISIONS.md D023.
export const ARMS = ["ARCHER", "ELEPHANT", "WARRIOR", "HORSEMAN", "CANNON"];
export const GLYPH = { ARCHER: "A", ELEPHANT: "E", WARRIOR: "W", HORSEMAN: "H", CANNON: "C" };

export const armIndex = (a) => ARMS.indexOf(a);
export const beatsIdx = (x, y) => y === (x + 1) % 5 || y === (x + 2) % 5;
export const beats = (a, b) => beatsIdx(armIndex(a), armIndex(b));
// what each arm beats, for printing
export const PREY = Object.fromEntries(
  ARMS.map((a, i) => [a, [ARMS[(i + 1) % 5], ARMS[(i + 2) % 5]]]));

// kept for older call sites that want the two-name form
export const TYPES = ARMS;

// ---- the faction chassis ----------------------------------------------------
// CONSTRAINED ASYMMETRY. Every faction holds THE SAME TEN NUMBERS and exactly two units of
// each arm. The only thing that differs between factions is which arm each number sits in.
//
// ⚠️ An earlier draft constrained only the TOTAL strength and let the distribution vary. It
// failed instructively: a faction of 1,2,8,9s measured +1.08 VP/battle against the field,
// because you choose what to commit and simply never commit your 1s. Equal total strength is
// not equal USABLE strength. Sharing the multiset closes that for good.
export const UNITS_PER_FACTION = 10;
export const UNITS_PER_ARM = 2;
export const TOTAL_STRENGTH = 50;
export const STRENGTH_MULTISET = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9];

// ---- the archetypes ---------------------------------------------------------
// GROUP 0 GOES TO THE FACTION'S LEAD ARM — the one it is known for — and the rest follow
// round the cycle. So `lead` always names the arm on the faction card.
//
// ⚠️ FACTIONS ARRIVE IN FIVES. The counter cycle has a five-fold rotational symmetry, and the
// faction list is closed under it: every archetype appears in all five arms. Two factions of
// the same archetype are therefore level BY SYMMETRY, with no tuning, and the whole balance
// question collapses to one number per pair of archetypes. Add a sixth faction alone and the
// guarantee is gone.
export const ARCHETYPES = {
  // THE SPECIALIST — the top of the ladder in one arm, and very little behind it.
  specialist: [[8, 9], [5, 6], [4, 5], [2, 3], [1, 7]],
  // THE TWIN ARMS — two strong adjacent arms and very little behind them. Found by
  // sim/pattern-search.mjs as the shape that levels the specialist: the five rotations sum to
  // +0.006, worst single matchup 0.065 VP/battle.
  twinarms: [[8, 9], [6, 7], [1, 3], [4, 5], [2, 5]],
};

const F = (key, name, era, blurb, archetype, lead) => {
  const k = armIndex(lead);
  return {
    key, name, era, blurb, archetype, lead,
    units: ARCHETYPES[archetype].flatMap((group, g) =>
      group.map((s) => ({ t: ARMS[(g + k) % 5], s }))),
  };
};

export const FACTIONS = [
  // --- THE SPECIALISTS ------------------------------------------------------
  F("maratha", "The Marathas", "Ganimi Kava",
    "The finest horse in the Deccan, and it knows it.", "specialist", "HORSEMAN"),
  F("mughal", "The Mughal Host", "the Deccan campaigns",
    "The great infantry mass. It does not manoeuvre; it does not have to.", "specialist", "WARRIOR"),
  F("adilshahi", "Adil Shahi of Bijapur", "the Malik-e-Maidan",
    "Guns cast on a scale nobody else attempts.", "specialist", "CANNON"),
  F("qutbshahi", "Qutb Shahi of Golconda", "the diamond throne",
    "War elephants bought with diamond money, and howdahs to match.", "specialist", "ELEPHANT"),
  F("berad", "The Berads", "the hill matchlocks",
    "Bowmen out of the ravines who shoot better than anyone has a right to.", "specialist", "ARCHER"),

  // --- THE TWIN ARMS. Two strong adjacent arms, and a real hole behind them. -----
  F("nizamshahi", "Nizam Shahi of Ahmadnagar", "Malik Ambar",
    "Malik Ambar's horse, and the guns they ride down, in the same army.", "twinarms", "HORSEMAN"),
  F("firangi", "The Firangi", "the coastal batteries",
    "Drilled foot off the ships, with the horse to finish what they start.", "twinarms", "WARRIOR"),
  F("siddi", "The Siddis of Janjira", "the island fortress",
    "Abyssinian admirals, fortress guns, and bowmen along the walls.", "twinarms", "CANNON"),
  F("rajput", "The Rajput Contingents", "sworn to the Deccan war",
    "A beast line that will not turn, and the spears that follow it in.", "twinarms", "ELEPHANT"),
  F("banjara", "The Banjara Caravans", "the grain roads",
    "Everything an army eats, escorted by people who know every ravine.", "twinarms", "ARCHER"),
];

// ---- the victory target -----------------------------------------------------
export const VICTORY_TARGET = { 2: 3, 3: 3, 4: 4, 5: 3, 6: 3, 7: 3, 8: 3 };

// ---- chassis validation -----------------------------------------------------
export function validate() {
  const problems = [];
  const want = [...STRENGTH_MULTISET].sort((a, b) => a - b).join(",");
  for (const f of FACTIONS) {
    if (f.units.length !== UNITS_PER_FACTION)
      problems.push(`${f.key}: ${f.units.length} units, expected ${UNITS_PER_FACTION}`);
    const total = f.units.reduce((s, u) => s + u.s, 0);
    if (total !== TOTAL_STRENGTH)
      problems.push(`${f.key}: total strength ${total}, expected ${TOTAL_STRENGTH}`);
    for (const a of ARMS) {
      const n = f.units.filter((u) => u.t === a).length;
      if (n !== UNITS_PER_ARM) problems.push(`${f.key}: ${n} ${a}, expected ${UNITS_PER_ARM}`);
    }
    const mine = f.units.map((u) => u.s).sort((a, b) => a - b).join(",");
    if (mine !== want) problems.push(`${f.key}: strengths [${mine}] are not the shared multiset [${want}]`);
  }
  const leads = new Set(FACTIONS.map((f) => `${f.archetype}/${f.lead}`));
  if (leads.size !== FACTIONS.length) problems.push("two factions share an archetype and a lead arm");
  for (const a of Object.keys(ARCHETYPES)) {
    const n = FACTIONS.filter((f) => f.archetype === a).length;
    if (n !== 5) problems.push(`archetype ${a} appears ${n} times, expected 5 (one per arm)`);
  }
  return problems;
}

const bad = validate();
if (bad.length) {
  console.error("CHASSIS VIOLATION — sim/cards.mjs:");
  for (const p of bad) console.error("  " + p);
  process.exit(1);
}

// ---- helpers ----------------------------------------------------------------
export const byKey = (k) => FACTIONS.find((f) => f.key === k);
export const label = (u) => `${GLYPH[u.t]}${u.s}`;
export const armTotals = (f) =>
  Object.fromEntries(ARMS.map((a) => [a, f.units.filter((u) => u.t === a).reduce((s, u) => s + u.s, 0)]));
