// DECCAN II — PROVE the factions are level, rather than average over armies.
//
// A round-robin weights every army equally, which nobody does: players choose. The honest
// question is the EQUILIBRIUM VALUE of each matchup — what the pairing is worth to one side
// when both play as well as possible. That is a well-defined number, and it can be CERTIFIED.
//
// The certificate. For any mixed strategy p the row player can guarantee at least
//     lo = min_j (p^T M)_j
// and for any mixed q the column player can hold the row player to at most
//     hi = max_i (M q)_i
// By the minimax theorem lo <= value <= hi for ANY p and q, so a pair of strategies with
// lo == hi PROVES the value exactly, whatever produced them. Fictitious play only has to
// propose the strategies; the bracket is what proves it.
//
//   node sim/prove.mjs

import { FACTIONS, GLYPH } from "./cards.mjs";
import { resolveBattle } from "./battle.mjs";

const CAP = 3;
const ITERS = 400000;
// A card is worth roughly (victory target / units per faction) points: ~4 over 10.
const CARD_COST = 0.4;

// every distinct army of 1..CAP units a faction can field
function armies(units) {
  const kinds = [];
  for (const u of units) {
    const k = kinds.find((x) => x.u.arm === u.arm);
    if (k) k.n++; else kinds.push({ u, n: 1 });
  }
  const out = [], cur = [];
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

function payoff(A, B) {
  const r = resolveBattle(A, B);
  const vpA = (r.winner === "A" || r.winner === "both") ? r.armyA.length : 0;
  const vpB = (r.winner === "B" || r.winner === "both") ? r.armyB.length : 0;
  return vpA - vpB - CARD_COST * (A.length - B.length);
}

// fictitious play proposes p and q; the bracket proves the value
function solve(M, n, m) {
  const rowPay = new Float64Array(n), colPay = new Float64Array(m);
  const pCount = new Float64Array(n), qCount = new Float64Array(m);
  for (let k = 0; k < n; k++) rowPay[k] = M[k * m];
  for (let k = 0; k < m; k++) colPay[k] = M[k];
  pCount[0] = 1; qCount[0] = 1;
  for (let t = 1; t <= ITERS; t++) {
    let bi = 0; for (let k = 1; k < n; k++) if (rowPay[k] > rowPay[bi]) bi = k;
    let bj = 0; for (let k = 1; k < m; k++) if (colPay[k] < colPay[bj]) bj = k;
    pCount[bi]++; qCount[bj]++;
    for (let k = 0; k < n; k++) rowPay[k] += M[k * m + bj];
    for (let k = 0; k < m; k++) colPay[k] += M[bi * m + k];
  }
  const tot = ITERS + 1;
  const p = Array.from(pCount, (x) => x / tot), q = Array.from(qCount, (x) => x / tot);

  // CERTIFICATE — recomputed from scratch, not from the fictitious-play accumulators
  let lo = Infinity;
  for (let j = 0; j < m; j++) { let s = 0; for (let i = 0; i < n; i++) s += p[i] * M[i * m + j]; lo = Math.min(lo, s); }
  let hi = -Infinity;
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < m; j++) s += q[j] * M[i * m + j]; hi = Math.max(hi, s); }
  return { lo, hi, mid: (lo + hi) / 2, gap: hi - lo, p, q };
}

const S = FACTIONS.map((f) => armies(f.units));
const N = FACTIONS.length;
const short = (f) => f.name.replace(/^The /, "").split(" ")[0].slice(0, 9);

console.log("\nPROVING THE FACTIONS LEVEL — equilibrium value of every matchup\n");
console.log(`  armies per faction: ${S.map((s) => s.length).join(", ")}`);
console.log(`  payoff = my points - their points - ${CARD_COST} per extra card committed`);
console.log(`  ${ITERS.toLocaleString()} iterations, then a certified bracket lo <= value <= hi\n`);

const V = Array.from({ length: N }, () => new Array(N).fill(0));
let worstGap = 0;
const pairs = [];
for (let i = 0; i < N; i++)
  for (let j = i + 1; j < N; j++) {
    const n = S[i].length, m = S[j].length;
    const M = new Float64Array(n * m);
    for (let a = 0; a < n; a++) for (let b = 0; b < m; b++) M[a * m + b] = payoff(S[i][a], S[j][b]);
    const r = solve(M, n, m);
    V[i][j] = r.mid; V[j][i] = -r.mid;
    worstGap = Math.max(worstGap, r.gap);
    pairs.push({ i, j, ...r });
  }

console.log("  matchup                              value        certified bracket");
for (const p of pairs) {
  const nm = `${short(FACTIONS[p.i])} vs ${short(FACTIONS[p.j])}`;
  console.log(`  ${nm.padEnd(34)} ${(p.mid >= 0 ? "+" : "") + p.mid.toFixed(4)}` +
    `      [${p.lo.toFixed(4)}, ${p.hi.toFixed(4)}]`);
}

console.log("\n  mean value against the field (0 is exactly level)\n");
const means = V.map((r) => r.reduce((s, x) => s + x, 0) / (N - 1));
FACTIONS.map((f, i) => ({ f, m: means[i] })).sort((a, b) => b.m - a.m)
  .forEach((r) => console.log(`    ${r.f.name.padEnd(26)} ${(r.m >= 0 ? "+" : "") + r.m.toFixed(4)}`));

const spread = Math.max(...means) - Math.min(...means);
const worstPair = Math.max(...V.flat().map(Math.abs));
console.log(`\n  FACTION SPREAD ............ ${spread.toFixed(4)} points per battle`);
console.log(`  worst single matchup ...... ${worstPair.toFixed(4)}`);
console.log(`  widest certificate gap .... ${worstGap.toFixed(6)}`);
console.log(`\n  Every value above is bracketed to within ${worstGap.toFixed(6)}, so the spread is`);
console.log(`  proven to lie within ${(spread + 2 * worstGap).toFixed(4)} in the worst case.`);
