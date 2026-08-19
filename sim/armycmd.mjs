// ARMYCMD — what "you may pull back any unit in your army" actually does.
//
//   node sim/armycmd.mjs [games per count]
//
// Run it against the same seeds with the rule off and on, so the two columns differ by the rule
// and by nothing else. It reports the three things the rule is being asked about: whether the
// game still fits in its 15-20 minutes, WHO gets covered, and whether the value-1 ability
// cards — the ones nobody could protect before — are worth any more with it in.
import { playGame, FACTIONS, TYPES, VALUE, minutes, targetFor } from "./simple.mjs";

const GAMES = Number(process.argv[2] || 1500);
const COUNTS = [3, 5, 8];
const keys = FACTIONS.map((f) => f.key);

const run = (n) => {
  const w = new Map(keys.map((k) => [k, 0])), g = new Map(keys.map((k) => [k, 0]));
  const saved = {};
  let tn = 0, ch = 0, sv = 0, kl = 0;
  for (let i = 0; i < GAMES; i++) {
    const f = Array.from({ length: n }, (_, s) => keys[(i + s) % keys.length]);
    const r = playGame(f, 0x9e3779b9 ^ (i * 2654435761));
    tn += r.turns; ch += r.charges; sv += r.saved; kl += r.kills;
    for (const t of TYPES) saved[t] = (saved[t] || 0) + (r.tally.saved[t] || 0);
    for (const k of f) g.set(k, g.get(k) + 1);
    const share = 1 / r.winners.length;
    for (const x of r.winners) w.set(f[x], w.get(f[x]) + share);
  }
  const exp = 1 / n;
  return { n, turns: tn / GAMES, charges: ch / GAMES, saves: sv / GAMES, kills: kl / GAMES,
    minutes: minutes(tn / GAMES, ch / GAMES), saved,
    rate: Object.fromEntries(keys.map((k) => [k, w.get(k) / g.get(k) / exp])) };
};

console.log(`ARMYCMD=${process.env.ARMYCMD || "0"} SEEN=${process.env.ARMYSEEN || "0"} ONCE=${process.env.ARMYONCE || "0"} V_DENY=${process.env.V_DENY ?? 0.3} · ${GAMES} games/count\n`);
console.log("   n   turns  minutes  charges  kills  saves/game");
const rows = COUNTS.map(run);
for (const r of rows)
  console.log(`   ${r.n}   ${r.turns.toFixed(0).padStart(5)}   ${r.minutes.toFixed(1).padStart(6)}   ${r.charges.toFixed(1).padStart(6)}  ${r.kills.toFixed(1).padStart(5)}  ${r.saves.toFixed(2).padStart(10)}`);

console.log("\n  WHO GETS COVERED (share of all saves, pooled)");
const pool = {};
for (const r of rows) for (const t of TYPES) pool[t] = (pool[t] || 0) + (r.saved[t] || 0);
const tot = Object.values(pool).reduce((a, b) => a + b, 0) || 1;
console.log("    " + TYPES.map((t) => `${t.slice(0, 4)} ${VALUE[t]}`.padStart(11)).join(""));
console.log("    " + TYPES.map((t) => `${(100 * (pool[t] || 0) / tot).toFixed(1)}%`.padStart(11)).join(""));

console.log("\n  what each RULER is worth (1.00 = a fair share)");
console.log("    players" + keys.map((k) => k.slice(0, 6).padStart(8)).join(""));
for (const r of rows)
  console.log(`       ${r.n}   ` + keys.map((k) => r.rate[k].toFixed(2).padStart(8)).join(""));
const avg = Object.fromEntries(keys.map((k) => [k, rows.reduce((a, r) => a + r.rate[k], 0) / rows.length]));
console.log("     mean   " + keys.map((k) => avg[k].toFixed(2).padStart(8)).join(""));
