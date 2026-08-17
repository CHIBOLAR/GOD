// DECCAN II — which card economy? Measured, not argued.
//
//   spend        every committed unit gone for good      (no recovery at all)
//   winnerburns  winner's units gone, loser's recover    (the old game: only winning drains you)
//   winnerrests  winner's units recover, loser's return  (the designer's inversion)
//   allrest      everything recovers; nothing is lost
//
//   node sim/econ-test.mjs [games]

import { FACTIONS, VICTORY_TARGET } from "./cards.mjs";
import { playGame } from "./game.mjs";

const GAMES = Number(process.argv[2]) || 2000;
const COUNTS = [2, 4, 6, 8];
const ECONS = ["spend", "winnerburns", "winnerrests", "allrest"];

function deal(n, g) {
  const keys = FACTIONS.map((f) => f.key);
  let y = (g * 2654435761) >>> 0;
  const r = () => ((y = (y * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
  return keys.slice(0, n);
}

function run(n, econ) {
  const target = VICTORY_TARGET[n];
  const seat = new Array(n).fill(0);
  const fw = new Map(FACTIONS.map((f) => [f.key, 0])), fg = new Map(FACTIONS.map((f) => [f.key, 0]));
  let rounds = 0, onTarget = 0, satOut = 0, pr = 0, commits = 0, gini = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const keys = deal(n, gi);
    const s = playGame(keys, target, 0x9e3779b9 ^ (gi * 2654435761), { econ });
    rounds += s.rounds;
    if (s.end === "target") onTarget++;
    for (let i = 0; i < n; i++) { satOut += s.satOut[i]; commits += s.commits[i]; pr += s.rounds; fg.set(keys[i], fg.get(keys[i]) + 1); }
    const share = 1 / s.winners.length;
    for (const w of s.winners) { seat[w] += share; fw.set(keys[w], fw.get(keys[w]) + share); }
    const tot = s.vp.reduce((a, b) => a + b, 0);
    if (tot > 0) {
      const sorted = [...s.vp].sort((a, b) => a - b);
      let cum = 0; for (let i = 0; i < n; i++) cum += (2 * (i + 1) - n - 1) * sorted[i];
      gini += cum / (n * tot);
    }
  }
  const exp = 100 / n;
  return {
    n, econ, rounds: rounds / GAMES, onTarget: (100 * onTarget) / GAMES,
    seatErr: Math.max(...seat.map((v) => Math.abs((100 * v) / GAMES - exp))),
    facErr: Math.max(...[...fw].map(([k, v]) => Math.abs((100 * v) / (fg.get(k) || 1) - exp))),
    satOut: (100 * satOut) / pr, cards: commits / pr, gini: gini / GAMES,
  };
}

console.log(`DECCAN II — the card economy (${GAMES} games per cell)\n`);
console.log("   n   economy       rounds  on target  seat err  fac err  sat out  cards/rd  score spread");
for (const n of COUNTS) {
  for (const e of ECONS) {
    const r = run(n, e);
    console.log(`   ${r.n}   ${e.padEnd(12)}  ${r.rounds.toFixed(1).padStart(5)}     ${r.onTarget.toFixed(0).padStart(3)}%` +
      `     ${r.seatErr.toFixed(1).padStart(5)}    ${r.facErr.toFixed(1).padStart(5)}    ${r.satOut.toFixed(0).padStart(3)}%` +
      `     ${r.cards.toFixed(2)}       ${r.gini.toFixed(3)}`);
  }
  console.log();
}
