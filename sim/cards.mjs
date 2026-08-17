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
const ABILITY = {
  siege:    { name: "Siege Elephant", faceUp: true, text: "Deploy FACE UP. On deployment, REVEAL any one enemy unit." },
  rockets: { name: "Sultan Rockets", text: "If your army LOSES, burn every recovering unit of the winning army." },
  spy:      { name: "Spy", text: "SWAP with the strongest unit of the opposing army." },
  subhedar: { name: "Subhedar", text: "REMOVE the weakest unit of the opposing army." },
  sepoy:    { name: "Sepoy", text: "While ALONE in your army, fight at double strength." },
};
const ABIL = (process.env.ABIL || "siege,sepoy,rockets,spy,subhedar").split(",");
export const BROKERS = ARMS.map((arm, i) => ({
  key: ABIL[i], arm, s: S[arm] + 1, copies: Number(process.env.COPIES || 4), ...ABILITY[ABIL[i]],
}));

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

// EIGHT FACTIONS, from two archetypes.
//   SPECIALIST  3 of your arm, 1 of each other        (5 identities, one per arm)
//   PAIR        2 of your arm, 2 of the NEXT arm, 1 each of the other three
// Five arms only yield five "three of my arm" identities, so the sixth through eighth come
// from the pair shape. Eight decks of seven is 56 cards, plus a 20-card supply = 76.
const ROSTER = [
  ["qutb",     "Qutb Shahi of Golconda", "the diamond throne", "ELEPHANT", "specialist"],
  ["firangi",  "The Firangi",            "the coastal batteries", "RIFLEMAN", "specialist"],
  ["mughal",   "The Mughal Host",        "the Deccan campaigns", "CANNON",  "specialist"],
  ["maratha",  "The Marathas",           "Ganimi Kava",        "HORSEMAN", "specialist"],
  ["berad",    "The Berads",             "the hill country",   "WARRIOR",  "specialist"],
  ["adilshahi","Adil Shahi of Bijapur",  "the Malik-e-Maidan", "CANNON",   "pair"],
  ["nizam",    "Nizam Shahi of Ahmadnagar", "Malik Ambar",     "HORSEMAN", "pair"],
  ["siddi",    "The Siddis of Janjira",  "the island fortress","RIFLEMAN", "pair"],
];
const SHAPE = { specialist: [3, 1, 1, 1, 1], pair: [2, 2, 1, 1, 1] };
const forceByArm = Object.fromEntries(FORCE.map((u) => [u.arm, u]));

export const FACTIONS = ROSTER.map(([key, name, era, lead, archetype]) => {
  const k = armIndex(lead);
  const counts = {};
  SHAPE[archetype].forEach((n, g) => { counts[ARMS[(g + k) % 5]] = n; });
  const units = [];
  for (const arm of ARMS) for (let i = 0; i < counts[arm]; i++) units.push({ ...forceByArm[arm] });
  return { key, name, era, lead, archetype, counts, units,
    total: units.reduce((s, u) => s + u.s, 0) };
});

export const VICTORY_TARGET = { 2: 5, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4 };

export function validate() {
  const p = [];
  for (const f of FACTIONS) if (f.units.length !== 7) p.push(`${f.key}: ${f.units.length} units`);
  if (new Set(FACTIONS.map((f) => f.key)).size !== 8) p.push("expected 8 distinct factions");
  for (const u of FORCE) if (u.s % 2 !== 1) p.push(`${u.name}: Force strengths must be odd`);
  for (const b of BROKERS) if (b.s % 2 !== 0) p.push(`${b.name}: broker strengths must be even`);
  if (new Set(BROKERS.map((b) => b.arm)).size !== 5) p.push("brokers do not cover all five arms");
  const supply = BROKERS.reduce((s, b) => s + b.copies, 0);
  if (supply !== Number(process.env.COPIES || 4) * 5) p.push(`the supply is ${supply} cards`);
  return p;
}
const bad = validate();
if (bad.length) {
  console.error("CARD DATA INVALID:");
  bad.forEach((x) => console.error("  " + x));
  process.exit(1);
}

export const label = (u) => `${GLYPH[u.arm]}${u.s}`;
