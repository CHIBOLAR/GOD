// DECCAN II — the single source of truth for all card data.
//
// rules/CARDS.md is GENERATED from this file (npm run cards). Never hand-edit that file.
// Every other module in sim/ imports from here.

// ---- the five arms ----------------------------------------------------------
// Rock-paper-scissors-lizard-Spock: arm i beats i+1 and i+2, and loses to i-1 and i-2.
// Every edge below is a real thing that happened in the Deccan.
//
//   RIFLEMAN -> ELEPHANT (a ball drops them)   · WARRIOR  (shot down before contact)
//   ELEPHANT -> WARRIOR  (trampled)            · HORSEMAN (horses will not face them)
//   WARRIOR  -> HORSEMAN (spears stop a charge)· ARCHER   (closed with and cut down)
//   HORSEMAN -> ARCHER   (ridden down)         · RIFLEMAN (ridden down mid-reload)
//   ARCHER   -> RIFLEMAN (a bow outshoots a matchlock) · ELEPHANT (arrows panic them)
//
export const ARMS = ["RIFLEMAN", "ELEPHANT", "WARRIOR", "HORSEMAN", "ARCHER"];
export const GLYPH = { RIFLEMAN: "R", ELEPHANT: "E", WARRIOR: "W", HORSEMAN: "H", ARCHER: "A" };

export const armIndex = (a) => ARMS.indexOf(a);
export const beatsIdx = (x, y) => y === (x + 1) % 5 || y === (x + 2) % 5;
export const beats = (a, b) => beatsIdx(armIndex(a), armIndex(b));
// what each arm beats, for printing
export const PREY = Object.fromEntries(
  ARMS.map((a, i) => [a, [ARMS[(i + 1) % 5], ARMS[(i + 2) % 5]]]));

// kept for older call sites that want the two-name form
export const TYPES = ARMS;

// ---- the faction chassis ----------------------------------------------------
// 5 factions x 10 units = 50 cards, plus 25 Power Brokers = 75, inside the 76-card limit.
//
// Every faction holds THE SAME TEN NUMBERS and two units of each arm. The only difference is
// WHICH ARM each number sits in. With five factions and five arms there is exactly ONE
// archetype, rotated five times — so every faction is a rotation of every other and they are
// LEVEL BY SYMMETRY, exactly, with no tuning and nothing to search.
//
// The shape runs downhill round the ring: your lead arm is your best and each arm after it is
// weaker. So the two arms that BEAT your lead arm are your two worst — you cannot cover your
// own speciality, which is the tension the whole game turns on.
export const UNITS_PER_FACTION = 10;
export const UNITS_PER_ARM = 2;
export const TOTAL_STRENGTH = 50;
export const STRENGTH_MULTISET = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9];

export const ARCHETYPES = {
  host: [[8, 9], [5, 7], [3, 6], [2, 4], [1, 5]],
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
  F("maratha", "The Marathas", "Ganimi Kava",
    "The finest horse in the Deccan, and it knows it.", "host", "HORSEMAN"),
  F("mughal", "The Mughal Host", "the Deccan campaigns",
    "The great infantry mass. It does not manoeuvre; it does not have to.", "host", "WARRIOR"),
  F("firangi", "The Firangi", "the coastal batteries",
    "Matchlocks off the ships, drilled to fire in ranks nobody here has seen.", "host", "RIFLEMAN"),
  F("qutbshahi", "Qutb Shahi of Golconda", "the diamond throne",
    "War elephants bought with diamond money, and howdahs to match.", "host", "ELEPHANT"),
  F("berad", "The Berads", "the hill country",
    "Bowmen out of the ravines who shoot better than anyone has a right to.", "host", "ARCHER"),
];

// ---- Power Brokers ----------------------------------------------------------
// 5 kinds, 5 copies each. Recruited by LOSING a battle — one per defeat, whatever you
// committed. That flow is what makes them safe to make strong: a Power Broker can only ever
// reach a player who has just lost, so it is structurally incapable of running away. The old
// game measured a broker at +38.8 in all 50 top armies precisely because WINNERS drew them.
//
// ⚠️ POWER BROKERS HAVE NO ARM. They cancel nothing and nothing cancels them, so they sit
// outside the counter ring and cannot disturb the five-fold symmetry that levels the factions.
export const BROKERS = [
  { key: "senapati", name: "Senapati", s: 0, copies: 5,
    text: "COPY the printed strength of the weakest unit in your own army." },
  { key: "archerbroker", name: "Slinger", s: 1, copies: 5,
    text: "KILL the weakest unit of the opposing army." },
  { key: "scout", name: "Scout", s: 2, copies: 5,
    text: "REVEAL one committed unit of one player. It stays revealed." },
  { key: "sepoy", name: "Sepoy", s: 4, copies: 5,
    text: "If your army LOSES, kill every recovering unit of the winning army." },
  { key: "spy", name: "Spy", s: 6, copies: 5,
    text: "SWAP with the weakest unit of the opposing army." },
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
  if (BROKERS.reduce((s, b) => s + b.copies, 0) !== 25)
    problems.push("the Power Broker supply is not 25 cards");
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
