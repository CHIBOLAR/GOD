// DECCAN II — the single source of truth for all card data.
//
// rules/CARDS.md is GENERATED from this file (npm run cards). Never hand-edit that file.
// Every other module in sim/ imports from here.

// ---- the counter cycle ------------------------------------------------------
// HORSE rides down GUNS · GUNS break FOOT · FOOT holds HORSE.
export const TYPES = ["HORSE", "FOOT", "GUNS"];
export const BEATS = { HORSE: "GUNS", GUNS: "FOOT", FOOT: "HORSE" };
export const GLYPH = { HORSE: "H", FOOT: "F", GUNS: "G" };

// ---- the faction chassis ----------------------------------------------------
// CONSTRAINED ASYMMETRY (BRIEF.md). Every faction holds THE SAME TWELVE NUMBERS:
//
//     1 · 2 · 3 · 4 · 4 · 5 · 5 · 6 · 6 · 7 · 8 · 9        (twelve units, 60 strength)
//
// and exactly four of each type. The ONLY thing that differs between factions is WHICH TYPE
// each number is printed on.
//
// ⚠️ An earlier draft constrained only the TOTAL strength and let the distribution vary.
// It failed, and instructively: a faction of 1,2,8,9s measured +1.08 VP/battle against the
// field, because you choose what to commit and simply never commit your 1s and 2s. Equal
// total strength is not equal USABLE strength. Sharing the multiset closes that for good —
// there is no shape to exploit when everyone has the same shape.
export const UNITS_PER_FACTION = 12;
export const UNITS_PER_TYPE = 4;
export const TOTAL_STRENGTH = 60;
export const STRENGTH_MULTISET = [1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9];

// ---- the two archetypes -----------------------------------------------------
// The counter cycle HORSE -> GUNS -> FOOT -> HORSE has a rotational symmetry. The faction
// list is CLOSED UNDER THAT ROTATION: each archetype appears in all three arms. Two factions
// of the same archetype are therefore level against each other BY SYMMETRY, with no tuning,
// and the whole balance question collapses to one number — measured at +0.00.
//
// An ARCHETYPE is three groups of four strengths. Group 0 goes to the faction's lead arm,
// group 1 to the next arm round the cycle, group 2 to the last.
// In every archetype, GROUP 0 GOES TO THE FACTION'S LEAD ARM — the one it is known for —
// and the other two follow round the counter cycle. So `lead` always names the arm on the
// faction's card, and group 2 is always the arm it is worst at.
export const ARCHETYPES = {
  // THE SPECIALIST — the top four numbers in one arm, and very little behind them.
  // Devastating in its own mirror, and readable: everyone knows which arm it wants.
  specialist: [[6, 7, 8, 9], [2, 4, 5, 6], [1, 3, 4, 5]],

  // THE BLIND SPOT — two arms that can fight anybody, and one that cannot fight at all.
  // Found by sim/pattern-search.mjs as the shape that levels the specialist exactly:
  // three rotations summing to +0.00, worst single matchup 0.02 VP/battle.
  blindspot: [[3, 5, 7, 9], [5, 6, 6, 8], [1, 2, 4, 4]],

  // THE CHAMPION — the three best units in the game in one arm, a dud beside them, and two
  // arms that are merely dependable. Levels against both of the above: sums -0.065 and
  // -0.003, worst single matchup 0.069 VP/battle.
  champion: [[2, 7, 8, 9], [4, 4, 5, 5], [1, 3, 6, 6]],
};

// Build a faction: `lead` names the arm that takes group 0, and the rest follow the cycle.
const F = (key, name, era, blurb, archetype, lead) => {
  const k = TYPES.indexOf(lead);
  return {
    key, name, era, blurb, archetype, lead,
    units: ARCHETYPES[archetype].flatMap((group, g) =>
      group.map((s) => ({ t: TYPES[(g + k) % 3], s }))),
  };
};

// ⚠️ FACTIONS ARRIVE IN THREES — a whole archetype across all three arms — or the rotational
// symmetry that makes the balance provable is broken. See DECISIONS.md D015.
export const FACTIONS = [
  // --- THE SPECIALISTS. The top of the ladder in one arm, and the dregs everywhere else.
  F("maratha", "The Marathas", "Ganimi Kava",
    "The finest horse in the Deccan, and it knows it. Guns are an afterthought.",
    "specialist", "HORSE"),

  F("mughal", "The Mughal Host", "the Deccan campaigns",
    "The great infantry mass. It does not manoeuvre; it does not have to.",
    "specialist", "FOOT"),

  F("adilshahi", "Adil Shahi of Bijapur", "the Malik-e-Maidan",
    "Guns cast on a scale nobody else attempts, and an army built around waiting for them.",
    "specialist", "GUNS"),

  // --- THE BLIND SPOTS. Two arms that can fight anybody, and one that is barely there.
  F("nizamshahi", "Nizam Shahi of Ahmadnagar", "Malik Ambar",
    "Malik Ambar manoeuvres horse and foot around an enemy he cannot out-shoot.",
    "blindspot", "HORSE"),

  F("firangi", "The Firangi", "the coastal batteries",
    "Drilled foot and heavy cannon off the ships. Cavalry is somebody else's problem.",
    "blindspot", "FOOT"),

  F("qutbshahi", "Qutb Shahi of Golconda", "the diamond throne",
    "Guns and horse bought with diamond money, and nobody willing to stand in the line.",
    "blindspot", "GUNS"),

  // --- THE CHAMPIONS. The best single units in the game, with dead weight beside them.
  F("rajput", "The Rajput Contingents", "sworn to the Deccan war",
    "Heavy horse that will not turn, a levy that should not have come, and steady foot.",
    "champion", "HORSE"),

  F("berad", "The Berads", "the hill matchlocks",
    "Matchlockmen out of the ravines who shoot better than anyone has any right to.",
    "champion", "FOOT"),

  F("siddi", "The Siddis of Janjira", "the island fortress",
    "Abyssinian admirals and fortress guns that have never once been taken.",
    "champion", "GUNS"),
];

// ---- the victory target -----------------------------------------------------
// Tuned in sim/seats.mjs for a 6-9 round game that ends on the target rather than by running
// the table dry. Kept to three tiers so it fits on the player aid.
export const VICTORY_TARGET = { 2: 6, 3: 6, 4: 6, 5: 5, 6: 5, 7: 5, 8: 4 };

// ---- chassis validation -----------------------------------------------------
// Runs on import. A faction that breaks the chassis is a design bug, and it should be
// impossible to measure one by accident.
export function validate() {
  const problems = [];
  for (const f of FACTIONS) {
    if (f.units.length !== UNITS_PER_FACTION)
      problems.push(`${f.key}: ${f.units.length} units, expected ${UNITS_PER_FACTION}`);
    const total = f.units.reduce((s, u) => s + u.s, 0);
    if (total !== TOTAL_STRENGTH)
      problems.push(`${f.key}: total strength ${total}, expected ${TOTAL_STRENGTH}`);
    for (const t of TYPES) {
      const n = f.units.filter((u) => u.t === t).length;
      if (n !== UNITS_PER_TYPE) problems.push(`${f.key}: ${n} ${t}, expected ${UNITS_PER_TYPE}`);
    }
    for (const u of f.units)
      if (u.s < 1 || u.s > 9) problems.push(`${f.key}: strength ${u.s} outside 1..9`);
    // the chassis: every faction holds the same twelve numbers, only allocated differently
    const mine = f.units.map((u) => u.s).sort((a, b) => a - b).join(",");
    const want = [...STRENGTH_MULTISET].sort((a, b) => a - b).join(",");
    if (mine !== want) problems.push(`${f.key}: strengths [${mine}] are not the shared multiset [${want}]`);
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
export const typeTotals = (f) =>
  Object.fromEntries(TYPES.map((t) => [t, f.units.filter((u) => u.t === t).reduce((s, u) => s + u.s, 0)]));
