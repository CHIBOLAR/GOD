// DECCAN II — does an asymmetric arm distribution stay level under cancellation?
//
// The bet: strength is fixed to the arm, so an Elephant-heavy faction has a huge raw total
// while an Archer-heavy one is weak on paper. Rotating a faction changes its total, so the
// five-fold symmetry no longer PROVES anything. The hope is the ring self-balances it —
// cheap Archers cancel Elephants, so raw total should not decide.
//
//   PATTERN=4,3,2,1,0 node sim/measure.mjs

import { FACTIONS, FORCE, BROKERS, ARMS, GLYPH, PATTERN } from "./cards.mjs";
import { resolveBattle } from "./battle.mjs";

const CAP = 3;

// every army of up to CAP units a faction can field from its own Force
function armies(units) {
  const kinds = [];
  for (const u of units) {
    const k = kinds.find((x) => x.u.arm === u.arm);
    if (k) k.n++; else kinds.push({ u, n: 1 });
  }
  const out = [];
  const cur = [];
  const walk = (i) => {
    if (cur.length) out.push(cur.map((x) => ({ ...x })));
    if (cur.length === CAP) return;
    for (let j = i; j < kinds.length; j++) {
      if (cur.filter((c) => c.arm === kinds[j].u.arm).length >= kinds[j].n) continue;
      cur.push(kinds[j].u); walk(j); cur.pop();
    }
  };
  walk(0);
  return out;
}

const table = FACTIONS.map((f) => ({ f, armies: armies(f.units) }));

console.log(`\nPATTERN ${PATTERN.join("/")} — units of the lead arm, then round the ring\n`);
for (const f of FACTIONS)
  console.log(`  ${f.name.padEnd(26)}${("lead " + f.lead).padEnd(16)}` +
    `${f.units.map((u) => GLYPH[u.arm] + u.s).join(" ").padEnd(30)} raw total ${f.total}`);

console.log("\n  ARM         FORCE             BROKER");
for (const a of ARMS) {
  const fu = FORCE.find((u) => u.arm === a), b = BROKERS.find((x) => x.arm === a);
  console.log(`  ${a.padEnd(11)}${(fu.name + " " + fu.s).padEnd(18)}${b.name} ${b.s}`);
}

// ---- faction vs faction, every army against every army ----------------------
console.log("\n\nFACTION vs FACTION  (share of battles scored; a level total scores for both)\n");
const N = FACTIONS.length;
const M = Array.from({ length: N }, () => new Array(N).fill(0));
for (let i = 0; i < N; i++)
  for (let j = 0; j < N; j++) {
    if (i === j) continue;
    let sc = 0, n = 0;
    for (const a of table[i].armies)
      for (const b of table[j].armies) {
        const r = resolveBattle(a, b);
        if (r.winner === "A" || r.winner === "both") sc++;
        n++;
      }
    M[i][j] = (100 * sc) / n;
  }
const short = (f) => f.name.replace(/^The /, "").split(" ")[0].slice(0, 9);
console.log("    " + "".padEnd(11) + FACTIONS.map((f) => short(f).padStart(10)).join("") + "      mean");
for (let i = 0; i < N; i++) {
  const row = FACTIONS.map((_, j) => (i === j ? "—" : M[i][j].toFixed(1)).padStart(10)).join("");
  const mean = M[i].reduce((s, x) => s + x, 0) / (N - 1);
  console.log("    " + short(FACTIONS[i]).padEnd(11) + row + "    " + mean.toFixed(1).padStart(6));
}
const means = M.map((r) => r.reduce((s, x) => s + x, 0) / (N - 1));
const spread = Math.max(...means) - Math.min(...means);
console.log(`\n  FACTION SPREAD (best mean − worst mean) .. ${spread.toFixed(1)} points  (want <= 5)`);

// does raw strength predict how good a faction is?
const rawOrder = [...FACTIONS].map((f, i) => ({ n: short(f), t: f.total, m: means[i] }))
  .sort((a, b) => b.t - a.t);
console.log("\n  raw total vs measured strength — is the game just adding numbers up?\n");
for (const r of rawOrder) console.log(`    ${r.n.padEnd(11)} raw ${String(r.t).padStart(3)}   scores ${r.m.toFixed(1)}%`);
const rich = rawOrder[0], poor = rawOrder[rawOrder.length - 1];
console.log(`\n    richest faction (${rich.n}, raw ${rich.t}) scores ${rich.m.toFixed(1)}%`);
console.log(`    poorest faction (${poor.n}, raw ${poor.t}) scores ${poor.m.toFixed(1)}%`);
console.log(`    -> the ring ${Math.abs(rich.m - poor.m) < 5 ? "DOES" : "does NOT"} cancel out a raw-strength gap of ${rich.t - poor.t}`);

// ---- army size --------------------------------------------------------------
console.log("\n  best army by size, per faction\n");
for (let i = 0; i < N; i++) {
  const all = table.flatMap((t, j) => (j === i ? [] : t.armies));
  const score = (a) => {
    let sc = 0;
    for (const b of all) { const r = resolveBattle(a, b); if (r.winner === "A" || r.winner === "both") sc++; }
    return (100 * sc) / all.length;
  };
  const rows = table[i].armies.map((a) => ({ a, size: a.length, w: score(a) }));
  const best = [1, 2, 3].map((k) => {
    const xs = rows.filter((r) => r.size === k);
    return xs.length ? Math.max(...xs.map((r) => r.w)) : NaN;
  });
  const top = [...rows].sort((x, y) => y.w - x.w)[0];
  console.log(`    ${short(FACTIONS[i]).padEnd(11)} 1u ${best[0].toFixed(1)}%  2u ${best[1].toFixed(1)}%  3u ${best[2].toFixed(1)}%` +
    `   best: ${top.a.map((u) => GLYPH[u.arm] + u.s).join("+")} ${top.w.toFixed(1)}%`);
}
