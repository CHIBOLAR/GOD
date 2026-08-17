// DECCAN II — faction balance, solved rather than averaged.
//
// Reports the full pairwise equilibrium matrix for the faction list in sim/cards.mjs.
// See sim/solver.mjs for what is being solved and why an average would not do.
//
//   node sim/factions.mjs

import { FACTIONS } from "./cards.mjs";
import { strategies, payoffMatrix, solve, CARD_COST } from "./solver.mjs";

const ITERATIONS = 12000;

const S = FACTIONS.map((f) => strategies(f.units));
console.log("DECCAN II — faction balance at equilibrium");
console.log(`card cost ${CARD_COST} VP · ${ITERATIONS} fictitious-play iterations\n`);

const N = FACTIONS.length;
const V = Array.from({ length: N }, () => new Array(N).fill(0));
let worstGap = 0;
for (let i = 0; i < N; i++)
  for (let j = i + 1; j < N; j++) {
    const M = payoffMatrix(S[i], S[j]);
    const { value, gap } = solve(M, S[i].length, S[j].length, ITERATIONS);
    V[i][j] = value; V[j][i] = -value;
    worstGap = Math.max(worstGap, gap);
  }

const short = (f) => f.name.replace(/^The /, "").split(" ")[0].slice(0, 9);
console.log("  pairwise equilibrium value to the ROW faction (VP per battle)\n");
console.log("    " + "".padEnd(11) + FACTIONS.map((f) => short(f).padStart(10)).join(""));
for (let i = 0; i < N; i++) {
  const cells = FACTIONS.map((_, j) =>
    (i === j ? "—" : (V[i][j] >= 0 ? "+" : "") + V[i][j].toFixed(2)).padStart(10)).join("");
  console.log("    " + short(FACTIONS[i]).padEnd(11) + cells);
}

const mean = FACTIONS.map((_, i) => V[i].reduce((s, x) => s + x, 0) / (N - 1));
const rank = FACTIONS.map((f, i) => ({ f, m: mean[i], worst: Math.min(...V[i].filter((_, j) => j !== i)) }))
  .sort((a, b) => b.m - a.m);

console.log("\n  mean value across all opponents (0.000 is perfectly level)\n");
for (const r of rank)
  console.log(`    ${r.f.name.padEnd(28)} [${r.f.archetype}/${r.f.lead}]`.padEnd(56) +
    `${(r.m >= 0 ? "+" : "") + r.m.toFixed(3)}   worst matchup ${r.worst.toFixed(2)}`);

const spread = rank[0].m - rank[rank.length - 1].m;
console.log(`\n  FACTION SPREAD (best mean − worst mean) .. ${spread.toFixed(3)} VP/battle`);
console.log(`  worst single matchup ..................... ${Math.max(...V.flat().map(Math.abs)).toFixed(3)} VP/battle`);
console.log(`  solver duality gap ....................... ${worstGap.toFixed(3)}`);
