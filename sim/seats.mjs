// DECCAN II — whole-game measurement: seat fairness, faction fairness, and the clock.
//
// LESSONS.md F1: seat fairness must be measured at EVERY player count, separately. The old
// game reached fairness at 2/3/4/6/8 exactly once, and 6-player had failed in the version
// immediately before.
//
//   node sim/seats.mjs [gamesPerCount]

import { FACTIONS } from "./cards.mjs";
import { playGame } from "./game.mjs";

const GAMES = Number(process.argv[2]) || 4000;
const COUNTS = [2, 3, 4, 5, 6, 7, 8];
const TARGETS = [4, 5, 6, 7, 8, 9, 10, 12];

// Deal factions to seats. A rotating deal (keys[(g+i) % 6]) looks fair and is not: at two
// players it only ever produces the six ADJACENT pairs, so specialist-vs-specialist and
// blindspot-vs-blindspot almost never happen and one faction's record is really its record
// against two opponents. Shuffle instead, so every subset and every seating is covered.
function deal(n, g) {
  const keys = FACTIONS.map((f) => f.key);
  let x = (g * 2654435761) >>> 0;
  const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys.slice(0, n);
}

function run(n, target, games) {
  const seatWins = new Array(n).fill(0);
  const facWins = new Map(FACTIONS.map((f) => [f.key, 0]));
  const facGames = new Map(FACTIONS.map((f) => [f.key, 0]));
  let rounds = 0, commits = 0, satOut = 0, playerRounds = 0;
  const ends = {};

  for (let gi = 0; gi < games; gi++) {
    const keys = deal(n, gi);
    const s = playGame(keys, target, 0x9e3779b9 ^ (gi * 2654435761));
    rounds += s.rounds;
    ends[s.end] = (ends[s.end] || 0) + 1;
    for (let i = 0; i < n; i++) {
      commits += s.commits[i];
      satOut += s.satOut[i];
      playerRounds += s.rounds;
      facGames.set(keys[i], facGames.get(keys[i]) + 1);
    }
    const share = 1 / s.winners.length;
    for (const w of s.winners) {
      seatWins[w] += share;
      facWins.set(keys[w], facWins.get(keys[w]) + share);
    }
  }

  const expected = 100 / n;
  const seatPct = seatWins.map((w) => (100 * w) / games);
  const facPct = [...facWins].map(([k, w]) => ({ k, pct: (100 * w) / (facGames.get(k) || 1) }));
  return {
    n, target,
    rounds: rounds / games,
    commitsPerPlayerRound: commits / playerRounds,
    satOutPct: (100 * satOut) / playerRounds,
    seatPct, seatErr: Math.max(...seatPct.map((p) => Math.abs(p - expected))),
    facPct, facErr: Math.max(...facPct.map((f) => Math.abs(f.pct - expected))),
    ends,
  };
}

// ---- pick the victory target for each player count --------------------------
console.log(`DECCAN II — whole-game measurement (${GAMES} games per cell)\n`);
console.log("  choosing the victory target: aim for 6-9 rounds and a game that ends on the target,");
console.log("  not by running the table dry.\n");
console.log("   n  target   rounds   ends on target   dry   seat err   faction err");

const chosen = {};
for (const n of COUNTS) {
  let best = null;
  for (const target of TARGETS) {
    const r = run(n, target, Math.max(400, GAMES / 4));
    const onTarget = (100 * (r.ends.target || 0)) / Math.max(400, GAMES / 4);
    // want a decisive finish and a game that lasts long enough to have a shape
    const score = Math.abs(r.rounds - 7.5) + (onTarget < 80 ? (80 - onTarget) / 10 : 0);
    if (!best || score < best.score) best = { target, r, onTarget, score };
  }
  chosen[n] = best.target;
  const r = best.r;
  console.log(
    `   ${n}   ${String(best.target).padStart(2)}    ${r.rounds.toFixed(1).padStart(5)}` +
      `      ${best.onTarget.toFixed(0).padStart(3)}%      ` +
      `${(100 * (r.ends.dry || 0) / Math.max(400, GAMES / 4)).toFixed(0).padStart(3)}%` +
      `    ${r.seatErr.toFixed(1).padStart(5)}      ${r.facErr.toFixed(1).padStart(5)}`,
  );
}

// ---- full measurement at the chosen targets ---------------------------------
console.log(`\n  full run at the chosen targets\n`);
console.log("   n  target  rounds  cards/player/round  sat out   seat win %");
const results = [];
for (const n of COUNTS) {
  const r = run(n, chosen[n], GAMES);
  results.push(r);
  console.log(
    `   ${n}   ${String(r.target).padStart(2)}    ${r.rounds.toFixed(1).padStart(5)}` +
      `        ${r.commitsPerPlayerRound.toFixed(2)}          ${r.satOutPct.toFixed(0).padStart(3)}%    ` +
      r.seatPct.map((p) => p.toFixed(1).padStart(5)).join(" "),
  );
}

console.log("\n  seat fairness — worst deviation from an even share (gate: <= 5.0, fail > 10.0)\n");
for (const r of results) {
  const flag = r.seatErr > 10 ? "FAIL" : r.seatErr > 5 ? "warn" : "ok";
  console.log(`   ${r.n} players   expected ${(100 / r.n).toFixed(1)}%   worst deviation ${r.seatErr.toFixed(1)}   ${flag}`);
}

console.log("\n  faction fairness — worst deviation from an even share (gate: <= 5.0, fail > 10.0)\n");
for (const r of results) {
  const flag = r.facErr > 10 ? "FAIL" : r.facErr > 5 ? "warn" : "ok";
  const worst = r.facPct.slice().sort((a, b) => Math.abs(b.pct - 100 / r.n) - Math.abs(a.pct - 100 / r.n))[0];
  console.log(`   ${r.n} players   worst ${worst.k} at ${worst.pct.toFixed(1)}%   deviation ${r.facErr.toFixed(1)}   ${flag}`);
}

console.log("\n  the sitting-out question (D007): a skipped round must be a real choice\n");
for (const r of results)
  console.log(`   ${r.n} players   ${r.commitsPerPlayerRound.toFixed(2)} cards per player per round   ` +
    `sat out entirely in ${r.satOutPct.toFixed(0)}% of their rounds`);

console.log("\n  chosen victory targets:  " +
  COUNTS.map((n) => `${n}p ${chosen[n]}`).join(" · "));
