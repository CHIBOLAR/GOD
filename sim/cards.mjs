// DECCAN II — the single source of truth for all card data.
// rules/CARDS.md is GENERATED from this file (npm run cards). Never hand-edit that file.

// ---- the ring ---------------------------------------------------------------
// Each arm beats the NEXT TWO along the ring, and loses to the two behind it.
//
//   ELEPHANT -> RIFLEMAN -> WARRIOR -> HORSEMAN -> ARCHER -> back to ELEPHANT
//
// Every edge is real: a ball drops an elephant · elephants trample infantry · horses will not
// face elephants · spears stop a charge · warriors close with bowmen · cavalry rides down
// archers and rides down riflemen mid-reload · and a bow outshoots a matchlock.
export const ARMS = ["ELEPHANT", "RIFLEMAN", "WARRIOR", "HORSEMAN", "ARCHER"];
export const GLYPH = { ELEPHANT: "E", RIFLEMAN: "R", WARRIOR: "W", HORSEMAN: "H", ARCHER: "A" };
export const armIndex = (a) => ARMS.indexOf(a);
export const beatsIdx = (x, y) => y === (x + 1) % 5 || y === (x + 2) % 5;
export const beats = (a, b) => beatsIdx(armIndex(a), armIndex(b));
export const PREY = Object.fromEntries(ARMS.map((a, i) => [a, [ARMS[(i + 1) % 5], ARMS[(i + 2) % 5]]]));

// ---- the Force --------------------------------------------------------------
// COUNTERING IS A BONUS, NOT A CANCELLATION. A unit that faces either of the arms it beats
// gains its bonus. The bonuses are set so that EVERY unit counters at exactly 10.
//
// ⚠️ THE BONUSES HAVE TO BE THIS BIG. An earlier draft used 5/4/3/2/1, which lifted the
// boosted ladder to 6,7,8,9,10 — the same ORDER as the base ladder 1,3,5,7,9. Three of the ten
// counters then lost anyway: a boosted Archer at 6 still lost to a Rifleman at 7 and an
// Elephant at 9, and a boosted Horseman at 7 still lost to an Elephant. The Archer never beat
// either thing it was written to counter. Levelling every counter at 10 is what makes a
// counter mean anything. See DECISIONS.md D027.
export const FORCE = [
  { key: "archer",   name: "Archer",   arm: "ARCHER",   s: 1, bonus: 9 },
  { key: "horseman", name: "Horseman", arm: "HORSEMAN", s: 3, bonus: 7 },
  { key: "warrior",  name: "Warrior",  arm: "WARRIOR",  s: 5, bonus: 5 },
  { key: "rifleman", name: "Rifleman", arm: "RIFLEMAN", s: 7, bonus: 3 },
  { key: "elephant", name: "Elephant", arm: "ELEPHANT", s: 9, bonus: 1 },
];
export const COUNTER_AT = 10;

// ---- Power Brokers ----------------------------------------------------------
// 5 kinds, 5 copies each. Recruited by LOSING — one per defeated PLAYER, whatever they
// committed. That flow is what makes them safe to make strong: a broker can only ever reach a
// player who has just lost, so it cannot run away. The old game measured a broker at +38.8,
// present in all 50 of the top 50 armies, precisely because WINNERS drew them.
//
// ⚠️ BROKERS HAVE NO ARM. They neither give nor take a counter bonus, so they sit outside the
// ring entirely and cannot disturb its symmetry.
//
// ⚠️ Force strengths are ODD (1,3,5,7,9) and broker strengths are EVEN (2,4,6,8,10), so a
// Force unit and a broker can never tie, and every broker slots between two Force units.
export const BROKERS = [
  { key: "slinger", name: "Slinger", s: 2, copies: 5,
    text: "REMOVE the weakest unit of the opposing army." },
  { key: "spy", name: "Spy", s: 4, copies: 5,
    text: "SWAP with the strongest unit of the opposing army." },
  { key: "senapati", name: "Senapati", s: 6, copies: 5,
    text: "If your army LOSES, kill every recovering unit of the winning army." },
  { key: "sepoy", name: "Sepoy", s: 8, copies: 5,
    text: "While ALONE in your army, fight at double strength." },
  { key: "siege", name: "Siege Elephant", s: 10, copies: 5,
    text: "On deployment, REVEAL any one enemy unit." },
];

export const VICTORY_TARGET = { 2: 4, 3: 4, 4: 4, 5: 4 };

// ---- validation -------------------------------------------------------------
export function validate() {
  const problems = [];
  if (FORCE.length !== 5) problems.push(`Force is ${FORCE.length} units, expected 5`);
  for (const u of FORCE) {
    if (u.s + u.bonus !== COUNTER_AT)
      problems.push(`${u.name}: counters at ${u.s + u.bonus}, expected ${COUNTER_AT}`);
    if (u.s % 2 !== 1) problems.push(`${u.name}: Force strengths must be odd`);
  }
  if (new Set(FORCE.map((u) => u.arm)).size !== 5) problems.push("the Force does not cover all five arms");
  for (const b of BROKERS) if (b.s % 2 !== 0) problems.push(`${b.name}: broker strengths must be even`);
  const supply = BROKERS.reduce((s, b) => s + b.copies, 0);
  if (supply !== 25) problems.push(`the supply is ${supply} cards, expected 25`);
  return problems;
}
const bad = validate();
if (bad.length) { console.error("CARD DATA INVALID:"); bad.forEach((p) => console.error("  " + p)); process.exit(1); }

export const label = (u) => `${GLYPH[u.arm] || "*"}${u.s}`;
