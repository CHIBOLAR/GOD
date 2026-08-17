// DECCAN II — find the next faction archetype.
//
// WHY A ROTATION-CLOSED SET. The counter cycle has a five-fold rotational symmetry. If the
// faction list is closed under it — every archetype present in all five arms — then any two
// factions of the SAME archetype are provably level with no tuning at all, and the whole
// balance question collapses to one number per pair of archetypes.
//
// Writing v_d for archetype A against the B whose lead arm sits d rotations along:
//     every A faction has mean value (v0+..+v4)/9 against the field, every B exactly minus it
// so THE SET IS LEVEL IFF sum_d v_d = 0. Individual v_d may differ freely — that difference
// is rock-paper-scissors between archetypes, which is wanted, not a fault.
//
//   node sim/pattern-search.mjs

import { STRENGTH_MULTISET, ARMS, ARCHETYPES } from "./cards.mjs";
import { matchup } from "./solver.mjs";

const SEARCH_ITER = 3000;
const VERIFY_ITER = 20000;
const SAMPLE = Number(process.argv[2]) || 1200;
const SEED = 20260817;

const ANCHORS = [["specialist", ARCHETYPES.specialist]];

const build = (pattern, k) =>
  pattern.flatMap((group, g) => group.map((s) => ({ t: ARMS[(g + k) % 5], s })));

// ---- every distinct allocation of the shared multiset into five arms of two ----
function patterns() {
  const M = [...STRENGTH_MULTISET].sort((a, b) => a - b);
  const seen = new Set();
  const out = [];
  const walk = (pool, acc) => {
    if (!pool.length) {
      const key = JSON.stringify(acc);
      if (!seen.has(key)) { seen.add(key); out.push(acc.map((g) => [...g])); }
      return;
    }
    for (let i = 1; i < pool.length; i++) {
      const pair = [pool[0], pool[i]];
      const rest = pool.filter((_, j) => j !== 0 && j !== i);
      acc.push(pair); walk(rest, acc); acc.pop();
    }
  };
  // the walk above fixes group order by smallest-first, so permute the five pairs after
  const base = [];
  walk(M, base);
  const perms = [];
  const permute = (arr, cur) => {
    if (!arr.length) { perms.push([...cur]); return; }
    for (let i = 0; i < arr.length; i++) {
      cur.push(arr[i]); permute(arr.filter((_, j) => j !== i), cur); cur.pop();
    }
  };
  const final = new Set();
  const res = [];
  for (const groups of out) {
    perms.length = 0;
    permute(groups, []);
    for (const p of perms) {
      // a pattern and its cyclic rotations build the same five factions
      const rots = [0, 1, 2, 3, 4].map((k) => JSON.stringify(p.map((_, i) => p[(i + k) % 5])));
      const canon = rots.slice().sort()[0];
      if (final.has(canon)) continue;
      final.add(canon);
      res.push(p);
    }
  }
  return res;
}

function score(C, iter) {
  const per = ANCHORS.map(([name, P]) => {
    const a0 = build(P, 0);
    const v = [0, 1, 2, 3, 4].map((d) => matchup(a0, build(C, d), iter).value);
    return { name, v, sum: v.reduce((s, x) => s + x, 0), worst: Math.max(...v.map(Math.abs)) };
  });
  return { per, err: Math.max(...per.map((x) => Math.abs(x.sum))), worst: Math.max(...per.map((x) => x.worst)) };
}

const dist = (C) => Math.min(...ANCHORS.map(([, P]) =>
  C.reduce((s, g, i) => s + g.reduce((t, x, j) => t + Math.abs(x - P[i][j]), 0), 0)));

const ALL = patterns();
let x = SEED;
const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
const pool = [...ALL];
for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
const CANDIDATES = pool.slice(0, SAMPLE);

console.log("DECCAN II — searching for the next archetype (five arms)");
console.log(`  ${ALL.length} distinct allocations; sampling ${CANDIDATES.length}`);
console.log(`  anchor = ${ANCHORS[0][1].map((g) => g.join("/")).join("  ")}`);
console.log("  level when v0+v1+v2+v3+v4 = 0\n");

const taken = new Set(ANCHORS.flatMap(([, P]) =>
  [0, 1, 2, 3, 4].map((k) => JSON.stringify(P.map((_, i) => P[(i + k) % 5])))));

const scored = [];
let done = 0;
for (const C of CANDIDATES) {
  if (taken.has(JSON.stringify(C))) continue;
  scored.push({ C, ...score(C, SEARCH_ITER), dist: dist(C) });
  if (++done % 200 === 0) process.stdout.write(`  ...${done}/${CANDIDATES.length}\n`);
}
scored.sort((a, b) => a.err - b.err);
const shortlist = scored.slice(0, 30).sort((a, b) => b.dist - a.dist).slice(0, 10);

console.log("\n  verifying the shortlist\n");
console.log("   allocation                                 sum      worst   unlike");
const finals = shortlist.map((c) => ({ ...c, ...score(c.C, VERIFY_ITER) })).sort((a, b) => a.err - b.err);
for (const c of finals) {
  const shape = c.C.map((g) => g.join(",")).join(" ").padEnd(30);
  const s = c.per[0].sum;
  console.log(`   ${shape} ${((s >= 0 ? "+" : "") + s.toFixed(3)).padStart(9)}    ${c.worst.toFixed(3)}    ${c.dist}`);
}
const best = finals[0];
console.log(`\n  BEST: ${JSON.stringify(best.C)}`);
console.log(`    sum ${best.per[0].sum.toFixed(4)} · rotations ${best.per[0].v.map((x) => x.toFixed(2)).join(" / ")}`);
console.log(`    worst single matchup ${best.worst.toFixed(3)} VP/battle`);
