// WHO SURVIVES A CHARGE, by unit. The one readout that says whether AGILITY does what it claims:
// under one instant every unit strikes and durability alone decides who is left, so the Elephant
// walks away from nearly everything. Under the ladder the cheap units strike FIRST and a unit
// killed before its band never swings — so an Elephant can be ganged down before it acts.
//   node sim/who.mjs [games per count]     · compare against AGILITY=1
import { playGame, FACTIONS, TYPES, VALUE } from "./simple.mjs";
const GAMES = Number(process.argv[2] || 1500);
const keys = FACTIONS.map((f) => f.key);
const stood = {}, lived = {};
for (const n of [3, 5, 8]) for (let i = 0; i < GAMES; i++) {
  const f = Array.from({ length: n }, (_, s) => keys[(i + s) % keys.length]);
  const r = playGame(f, 0x9e3779b9 ^ (i * 2654435761));
  for (const t of TYPES) {
    stood[t] = (stood[t] || 0) + (r.tally.stood[t] || 0);
    lived[t] = (lived[t] || 0) + (r.tally.lived[t] || 0);
  }
}
console.log(`AGILITY=${process.env.AGILITY || "0"} · ${GAMES} games at 3, 5 and 8 players`);
console.log("  unit          value    stood in a charge   SURVIVED IT");
for (const t of TYPES)
  console.log(`  ${t.padEnd(12)} ${String(VALUE[t]).padStart(5)}   ${String(stood[t]).padStart(16)}   ${(100 * lived[t] / stood[t]).toFixed(1).padStart(9)}%`);
