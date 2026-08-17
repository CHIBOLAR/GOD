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

import { FACTIONS, GLYPH } from "./cards.mjs";
import { strategies } from "./solver.mjs";
import { resolveFront, CENTRE } from "./battle.mjs";

const POOL = Number(process.argv[2]) || 2500;

const decode = (u) => (u === 0 ? null : { t: ["HORSE", "FOOT", "GUNS"][(u >> 4) - 1], s: u & 15 });
const key = (u) => (u === 0 ? null : `${GLYPH[["HORSE", "FOOT", "GUNS"][(u >> 4) - 1]]}${u & 15}`);

function battle(A, B) {
  let wa = 0, wb = 0, centre = 0;
  for (let f = 0; f < 3; f++) {
    const r = resolveFront(A[f], B[f]);
    if (r === 1) wa++; else if (r === -1) wb++;
    if (f === CENTRE) centre = r;
  }
  if (wa > wb) return 1;
  if (wb > wa) return -1;
  return centre;                       // level: the Centre decides (D012)
}

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

console.log(`DECCAN II — army round-robin`);
console.log(`  ${all.length} distinct armies across the nine factions; scoring against a shared pool of ${pool.length}\n`);

let worstCardSpread = 0, worstSizeGap = 0, totalDraw = 0, cells = 0;

for (const f of FACTIONS) {
  const raw = strategies(f.units);
  const armies = raw.map((s) => ({ slots: s.map(decode), keys: s.filter(Boolean).map(key) }));
  const rows = armies.map((a) => {
    let w = 0, d = 0;
    for (const b of pool) {
      const r = battle(a.slots, b);
      if (r === 1) w++; else if (r === 0) d++;
    }
    return { ...a, win: (100 * w) / pool.length, draw: (100 * d) / pool.length, size: a.keys.length };
  });
  rows.sort((p, q) => q.win - p.win);

  const avg = (xs) => (xs.length ? xs.reduce((s, r) => s + r.win, 0) / xs.length : 0);
  const cards = [...new Set(f.units.map((u) => `${GLYPH[u.t]}${u.s}`))];
  const val = cards.map((c) => ({
    c,
    d: avg(rows.filter((r) => r.keys.includes(c))) - avg(rows.filter((r) => !r.keys.includes(c))),
  })).sort((p, q) => q.d - p.d);

  const spread = val[0].d - val[val.length - 1].d;
  const sizes = [1, 2, 3].map((n) => ({ n, best: Math.max(...rows.filter((r) => r.size === n).map((r) => r.win)) }));
  const draw = rows.reduce((s, r) => s + r.draw, 0) / rows.length;
  worstCardSpread = Math.max(worstCardSpread, spread);
  totalDraw += draw; cells++;

  console.log(`  ${f.name}  [${f.archetype} / ${f.lead}]`);
  console.log("    " + val.map((v) => `${v.c}:${v.d >= 0 ? "+" : ""}${v.d.toFixed(1)}`).join("  "));
  console.log(`    card-value spread ${spread.toFixed(1)}   draws ${draw.toFixed(1)}%   ` +
    `best army ${rows[0].keys.join("+")} ${rows[0].win.toFixed(1)}%`);
  console.log("    best army by size:  " + sizes.map((s) => `${s.n}u ${s.best.toFixed(1)}%`).join("   "));
  console.log();
}

console.log(`  worst card-value spread across the nine factions .. ${worstCardSpread.toFixed(1)}  (gate <= 20)`);
console.log(`  mean draw rate .................................... ${(totalDraw / cells).toFixed(1)}%  (gate 3-10%)`);
