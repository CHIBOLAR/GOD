// DECCAN II — find the second faction archetype.
//
// WHY A ROTATION-CLOSED SET. The counter cycle HORSE->GUNS->FOOT->HORSE has a rotational
// symmetry. If the faction list is closed under that rotation — every archetype present in
// all three arms — then any two factions of the SAME archetype are provably level, with no
// tuning at all, and the whole balance question collapses to a single number per pair of
// archetypes.
//
// With archetypes A and B each present in three arms, write v_d for the value of A against
// the B whose lead arm sits d rotations along. Then:
//     every A faction has mean value (v0+v1+v2)/5 against the field
//     every B faction has exactly minus that
// so THE SET IS LEVEL IF AND ONLY IF v0+v1+v2 = 0, and individual v_d may differ freely —
// that difference is rock-paper-scissors between archetypes, which is wanted, not a fault.
//
// Archetype A is fixed as the thematic anchor: the top four numbers in one arm. This
// searches every distinct allocation of the shared multiset for the B that levels it.
//
//   node sim/pattern-search.mjs

import { STRENGTH_MULTISET, TYPES } from "./cards.mjs";
import { matchup } from "./solver.mjs";

const SEARCH_ITER = 800;
const VERIFY_ITER = 12000;
// One solve costs ~0.2s, and there are ~4300 distinct allocations x 3 rotations, so an
// exhaustive sweep is a ~36-minute job. A sample of this many is enough: we do not need the
// single most level allocation, only one that is level to well inside the measurement noise.
const SAMPLE = 400;
const SEED = 20260817;

// The archetypes already settled. The search finds the NEXT one, which must level against
// every anchor at once: sum_d v_d = 0 for each of them independently.
const ANCHORS = [
  ["specialist", [[6, 7, 8, 9], [2, 4, 5, 6], [1, 3, 4, 5]]],
  ["blindspot", [[1, 2, 4, 4], [3, 5, 7, 9], [5, 6, 6, 8]]],
];
const A = ANCHORS[0][1];

// units for the faction built from `pattern` with its primary arm rotated k steps
const build = (pattern, k) =>
  pattern.flatMap((group, g) => group.map((s) => ({ t: TYPES[(g + k) % 3], s })));

// ---- every distinct allocation of the shared multiset into three arms of four ----
function patterns() {
  const M = [...STRENGTH_MULTISET].sort((a, b) => a - b);
  const seen = new Set();
  const out = [];
  const pick = (pool, n) => {
    const res = [];
    const walk = (i, cur, rest) => {
      if (cur.length === n) { res.push([[...cur], [...rest, ...pool.slice(i)]]); return; }
      if (i === pool.length) return;
      cur.push(pool[i]); walk(i + 1, cur, rest); cur.pop();
      rest.push(pool[i]); walk(i + 1, cur, rest); rest.pop();
    };
    walk(0, [], []);
    return res;
  };
  for (const [P, rest1] of pick(M, 4))
    for (const [S, T] of pick(rest1, 4)) {
      const key = JSON.stringify([P, S, T]);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([P, S, T]);
    }
  return out;
}

// ---- score one candidate ----------------------------------------------------
// For each anchor, the three relative rotations. The candidate is level against that anchor
// exactly when the three sum to zero.
function score(C, iter) {
  const per = ANCHORS.map(([name, P]) => {
    const anchor0 = build(P, 0);
    const v = [0, 1, 2].map((d) => matchup(anchor0, build(C, d), iter).value);
    return { name, v, sum: v[0] + v[1] + v[2], worst: Math.max(...v.map(Math.abs)) };
  });
  return {
    per,
    err: Math.max(...per.map((x) => Math.abs(x.sum))),
    worst: Math.max(...per.map((x) => x.worst)),
  };
}

// distance from the nearest anchor, so we prefer a shape that plays differently
const dist = (C) =>
  Math.min(...ANCHORS.map(([, P]) =>
    C.reduce((s, g, i) => s + g.reduce((t, x, j) => t + Math.abs(x - P[i][j]), 0), 0)));

// deterministic sampler, so the search is reproducible
function sample(all, n, seed) {
  let x = seed;
  const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pool = [...all];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

const ALL = patterns();
const CANDIDATES = sample(ALL, SAMPLE, SEED);
console.log(`DECCAN II — searching for the second archetype`);
console.log(`  ${ALL.length} distinct allocations of the shared multiset; sampling ${CANDIDATES.length}`);
console.log(`  archetype A = ${A.map((g) => g.join("/")).join("  ")}`);
console.log(`  level when v0+v1+v2 = 0 across the three relative rotations\n`);

// A pattern and its CYCLIC ROTATIONS generate the same three factions, so a rotation of an
// anchor IS that anchor. Without this the search "finds" an anchor and calls it perfect.
const rotationsOf = (p) => [0, 1, 2].map((k) => JSON.stringify([p[k % 3], p[(k + 1) % 3], p[(k + 2) % 3]]));
const TAKEN = new Set(ANCHORS.flatMap(([, P]) => rotationsOf(P)));

const scored = [];
let done = 0;
for (const C of CANDIDATES) {
  if (TAKEN.has(JSON.stringify(C))) continue;
  scored.push({ C, ...score(C, SEARCH_ITER), dist: dist(C) });
  if (++done % 100 === 0) process.stdout.write(`  ...${done}/${CANDIDATES.length}\n`);
}

// shortlist: closest to level against EVERY anchor, then most unlike the ones we have
scored.sort((x, y) => x.err - y.err);
const shortlist = scored.slice(0, 40).sort((x, y) => y.dist - x.dist).slice(0, 12);

console.log("\n  verifying the shortlist at higher precision\n");
console.log("   allocation                          " +
  ANCHORS.map(([n]) => `sum vs ${n}`.padStart(18)).join("") + "    worst  unlike");
const finals = shortlist.map((c) => ({ ...c, ...score(c.C, VERIFY_ITER) }))
  .sort((x, y) => x.err - y.err);

for (const c of finals) {
  const shape = c.C.map((g) => g.join(",")).join(" / ").padEnd(34);
  const f = (x) => (x >= 0 ? "+" : "") + x.toFixed(3);
  console.log(`   ${shape} ` + c.per.map((p) => f(p.sum).padStart(18)).join("") +
    `    ${c.worst.toFixed(2)}     ${c.dist}`);
}

const best = finals[0];
console.log(`\n  BEST: ${best.C.map((g) => g.join(",")).join(" / ")}`);
for (const p of best.per)
  console.log(`    vs ${p.name.padEnd(12)} sum ${p.sum.toFixed(3)}   rotations ` +
    p.v.map((x) => x.toFixed(2)).join(" / "));
console.log(`    worst single matchup ${best.worst.toFixed(3)} VP/battle`);
