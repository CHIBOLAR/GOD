// DECCAN II — exhaustive army round-robin, per faction.
//
// The old game's round-robin ran over one shared card pool, because every player held the
// same seven cards. DECCAN II is asymmetric, so the useful question is per faction: within
// THIS hand, is any card dead, and is any army size dead?
//
// Each of a faction's armies is scored against a fixed, shared pool of opposing armies drawn
// from every faction, so the numbers are comparable across factions.
//
//   node sim/rr.mjs [opponentPoolSize]

import { FACTIONS, GLYPH, TYPES } from "./cards.mjs";
import { strategies } from "./solver.mjs";
import { resolveBattle } from "./battle.mjs";

const POOL = Number(process.argv[2]) || 3000;
const decode = (u) => ({ t: TYPES[u >> 4], s: u & 15 });
const key = (u) => `${GLYPH[TYPES[u >> 4]]}${u & 15}`;

// ---- the shared opponent pool ----------------------------------------------
const all = [];
for (const f of FACTIONS) for (const s of strategies(f.units)) all.push(s.map(decode));
let x = 20260817;
const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = all.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [all[i], all[j]] = [all[j], all[i]];
}
const pool = all.slice(0, POOL);

console.log("DECCAN II — army round-robin");
console.log(`  ${all.length} distinct armies across the nine factions; scoring against a shared pool of ${pool.length}\n`);

let worstSpread = 0, drawSum = 0, cells = 0, worstSize = 100;

for (const f of FACTIONS) {
  const raw = strategies(f.units);
  const rows = raw.map((s) => {
    const army = s.map(decode), keys = s.map(key);
    let w = 0, d = 0;
    for (const b of pool) {
      const r = resolveBattle(army, b);
      if (r.winner === "A") w++; else if (r.winner === "both") d++;
    }
    // level totals mean BOTH armies win, so a draw scores
    return { keys, size: keys.length, win: (100 * (w + d)) / pool.length, draw: (100 * d) / pool.length };
  });
  rows.sort((p, q) => q.win - p.win);

  const avg = (xs) => (xs.length ? xs.reduce((s, r) => s + r.win, 0) / xs.length : 0);
  const cards = [...new Set(f.units.map((u) => `${GLYPH[u.t]}${u.s}`))];
  const val = cards.map((c) => ({
    c, d: avg(rows.filter((r) => r.keys.includes(c))) - avg(rows.filter((r) => !r.keys.includes(c))),
  })).sort((p, q) => q.d - p.d);

  const spread = val[0].d - val[val.length - 1].d;
  const sizes = [1, 2, 3].map((n) => Math.max(...rows.filter((r) => r.size === n).map((r) => r.win)));
  const draw = rows.reduce((s, r) => s + r.draw, 0) / rows.length;
  worstSpread = Math.max(worstSpread, spread);
  worstSize = Math.min(worstSize, ...sizes);
  drawSum += draw; cells++;

  console.log(`  ${f.name}  [${f.archetype} / ${f.lead}]`);
  console.log("    " + val.map((v) => `${v.c}:${v.d >= 0 ? "+" : ""}${v.d.toFixed(1)}`).join("  "));
  console.log(`    card-value spread ${spread.toFixed(1)}   both-win ${draw.toFixed(1)}%   ` +
    `best army ${rows[0].keys.join("+")} ${rows[0].win.toFixed(1)}%`);
  console.log("    best army by size:  " + sizes.map((v, i) => `${i + 1}u ${v.toFixed(1)}%`).join("   "));
  console.log();
}

console.log(`  worst card-value spread across the nine factions .. ${worstSpread.toFixed(1)}  (gate <= 20)`);
console.log(`  weakest army size, at its best .................... ${worstSize.toFixed(1)}%  (gate >= 5)`);
console.log(`  mean both-win rate ............................... ${(drawSum / cells).toFixed(1)}%`);
