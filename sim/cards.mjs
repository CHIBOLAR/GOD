// DECCAN II — the single source of truth for all card data.

// ---- the ring ---------------------------------------------------------------
// Each arm cancels the NEXT TWO along the ring, and is cancelled by the two behind it.
//   ELEPHANT -> RIFLEMAN -> WARRIOR -> HORSEMAN -> ARCHER -> back to ELEPHANT
export const ARMS = ["ELEPHANT", "RIFLEMAN", "WARRIOR", "HORSEMAN", "ARCHER"];
export const GLYPH = { ELEPHANT: "E", RIFLEMAN: "R", WARRIOR: "W", HORSEMAN: "H", ARCHER: "A" };
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
export const FORCE = [
  { key: "archer", name: "Archer", arm: "ARCHER", s: 1 },
  { key: "horseman", name: "Horseman", arm: "HORSEMAN", s: 3 },
  { key: "warrior", name: "Warrior", arm: "WARRIOR", s: 5 },
  { key: "rifleman", name: "Rifleman", arm: "RIFLEMAN", s: 7 },
  { key: "elephant", name: "Elephant", arm: "ELEPHANT", s: 9 },
];

export const BROKERS = [
  { key: "slinger", name: "Slinger", arm: "ARCHER", s: 2, copies: 5,
    text: "REMOVE the weakest unit of the opposing army." },
  { key: "spy", name: "Spy", arm: "HORSEMAN", s: 4, copies: 5,
    text: "SWAP with the strongest unit of the opposing army." },
  { key: "senapati", name: "Senapati", arm: "WARRIOR", s: 6, copies: 5,
    text: "If your army LOSES, kill every recovering unit of the winning army." },
  { key: "sepoy", name: "Sepoy", arm: "RIFLEMAN", s: 8, copies: 5,
    text: "While ALONE in your army, fight at double strength." },
  // Deployed FACE UP. A hidden reveal-card is unenforceable at a real table: nobody can check
  // that you held one, so a player could simply claim the peek. Playing it face up also makes
  // it self-balancing — the strongest card in the game is the one that announces itself, and
  // an announced ELEPHANT invites every Archer and Rifleman at the table.
  { key: "siege", name: "Siege Elephant", arm: "ELEPHANT", s: 10, copies: 5, faceUp: true,
    text: "Deploy FACE UP. On deployment, REVEAL any one enemy unit." },
];

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

const NAMES = {
  ELEPHANT: ["Qutb Shahi of Golconda", "the diamond throne"],
  RIFLEMAN: ["The Firangi", "the coastal batteries"],
  WARRIOR: ["The Mughal Host", "the Deccan campaigns"],
  HORSEMAN: ["The Marathas", "Ganimi Kava"],
  ARCHER: ["The Berads", "the hill country"],
};
const forceByArm = Object.fromEntries(FORCE.map((u) => [u.arm, u]));

export const FACTIONS = ARMS.map((lead, k) => {
  const counts = {};
  PATTERN.forEach((n, g) => { counts[ARMS[(g + k) % 5]] = n; });
  const units = [];
  for (const arm of ARMS) for (let i = 0; i < counts[arm]; i++) units.push({ ...forceByArm[arm] });
  return {
    key: lead.toLowerCase(), name: NAMES[lead][0], era: NAMES[lead][1], lead, counts, units,
    total: units.reduce((s, u) => s + u.s, 0),
  };
});

export const VICTORY_TARGET = { 2: 4, 3: 4, 4: 4, 5: 4 };

export function validate() {
  const p = [];
  const size = PATTERN.reduce((a, b) => a + b, 0);
  for (const f of FACTIONS) if (f.units.length !== size) p.push(`${f.key}: ${f.units.length} units`);
  for (const u of FORCE) if (u.s % 2 !== 1) p.push(`${u.name}: Force strengths must be odd`);
  for (const b of BROKERS) if (b.s % 2 !== 0) p.push(`${b.name}: broker strengths must be even`);
  if (new Set(BROKERS.map((b) => b.arm)).size !== 5) p.push("brokers do not cover all five arms");
  if (BROKERS.reduce((s, b) => s + b.copies, 0) !== 25) p.push("the supply is not 25 cards");
  return p;
}
const bad = validate();
if (bad.length) {
  console.error("CARD DATA INVALID:");
  bad.forEach((x) => console.error("  " + x));
  process.exit(1);
}

export const label = (u) => `${GLYPH[u.arm]}${u.s}`;
