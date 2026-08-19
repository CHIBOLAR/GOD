// WHAT IS AN ABILITY WORTH? Switch one off (OFF=SPY) and the unit stays in the game as a plain
// value-1 body, so the comparison isolates the TEXT from the body it is printed on.
//   node sim/ability.mjs [games per count]
// ⚠️ Read every number here against the limit recorded in D059 and OPEN.md: this model still
// cannot price INFORMATION. No bot bluffs, and none re-times a charge on what it just learned.
import { playGame, FACTIONS } from "./simple.mjs";
const GAMES = Number(process.argv[2] || 1200);
const keys = FACTIONS.map((f) => f.key);
const mean = keys.map(() => []);
let kc = 0, ch = 0, mins = 0, n0 = 0;
for (const n of [3, 5, 8]) {
  const w = new Map(keys.map((k) => [k, 0])), g = new Map(keys.map((k) => [k, 0]));
  let kills = 0, charges = 0;
  for (let i = 0; i < GAMES; i++) {
    const f = Array.from({ length: n }, (_, s) => keys[(i + s) % keys.length]);
    const r = playGame(f, 0x9e3779b9 ^ (i * 2654435761));
    kills += r.kills; charges += r.charges;
    for (const k of f) g.set(k, g.get(k) + 1);
    const share = 1 / r.winners.length;
    for (const x of r.winners) w.set(f[x], w.get(f[x]) + share);
  }
  keys.forEach((k, i) => mean[i].push(w.get(k) / g.get(k) / (1 / n)));
  kc += kills / charges; n0++;
}
const avg = mean.map((xs) => xs.reduce((a, b) => a + b, 0) / xs.length);
console.log(`  OFF=${(process.env.OFF || "none").padEnd(22)}  kills/charge ${(kc / n0).toFixed(2)}   ` +
  keys.map((k, i) => `${k.slice(0, 4)} ${avg[i].toFixed(2)}`).join("  "));
