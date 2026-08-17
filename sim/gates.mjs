// DECCAN II — every balance gate, measured on the WHOLE GAME WITH ALLIANCES.
//
// This supersedes the duel numbers in sim/prove.mjs. A faction that is poor in a duel may be
// an excellent ally, and only this model can tell the difference.
//
//   node sim/gates.mjs [games]

import { FACTIONS, VICTORY_TARGET, validate, PATTERN } from "./cards.mjs";
import { playGame } from "./game.mjs";

const GAMES = Number(process.argv[2]) || 4000;
const COUNTS = [2, 3, 4, 5];
const results = [];
const gate = (name, value, pass, fail, note = "") => {
  const ok = pass(value), hard = fail ? fail(value) : false;
  results.push({ name, value, ok, hard });
  console.log(`  [${ok ? "  ok  " : hard ? " FAIL " : " warn "}] ${name.padEnd(44)} ${String(value).padStart(8)}   ${note}`);
};

function deal(n, g) {
  const keys = FACTIONS.map((f) => f.key);
  let y = (g * 2654435761) >>> 0;
  const r = () => ((y = (y * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
  return keys.slice(0, n);
}

console.log(`DECCAN II — balance gates, whole game with alliances (${GAMES} games per count)`);
console.log(`  pattern ${PATTERN.join("/")}\n`);
gate("card data valid", validate().length, (v) => v === 0, (v) => v > 0);

const rows = [];
for (const n of COUNTS) {
  const target = VICTORY_TARGET[n];
  const seat = new Array(n).fill(0);
  const fw = new Map(FACTIONS.map((f) => [f.key, 0])), fg = new Map(FACTIONS.map((f) => [f.key, 0]));
  let rounds = 0, onTarget = 0, allied = 0, satOut = 0, pr = 0, supply = 0, senap = 0, recruits = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const keys = deal(n, gi);
    const s = playGame(keys, target, 0x9e3779b9 ^ (gi * 2654435761));
    rounds += s.rounds; allied += s.alliedRounds; supply += s.supplyUsed; senap += s.rockets;
    if (s.end === "target") onTarget++;
    for (let i = 0; i < n; i++) { satOut += s.satOut[i]; pr += s.rounds; recruits += s.recruits[i]; fg.set(keys[i], fg.get(keys[i]) + 1); }
    const share = 1 / s.winners.length;
    for (const w of s.winners) { seat[w] += share; fw.set(keys[w], fw.get(keys[w]) + share); }
  }
  const exp = 100 / n;
  rows.push({
    n, target, rounds: rounds / GAMES,
    onTarget: (100 * onTarget) / GAMES,
    seatErr: Math.max(...seat.map((v) => Math.abs((100 * v) / GAMES - exp))),
    facErr: Math.max(...[...fw].map(([k, v]) => Math.abs((100 * v) / (fg.get(k) || 1) - exp))),
    facWorst: [...fw].map(([k, v]) => ({ k, p: (100 * v) / (fg.get(k) || 1) }))
      .sort((a, b) => Math.abs(b.p - exp) - Math.abs(a.p - exp))[0],
    alliedPct: (100 * allied) / rounds, satOutPct: (100 * satOut) / pr,
    supply: supply / GAMES, rockets: senap / GAMES, recruits: recruits / GAMES,
  });
}

console.log("\n   n  target  rounds  ends on target  rounds with an alliance  sat out  brokers used");
for (const r of rows)
  console.log(`   ${r.n}    ${r.target}     ${r.rounds.toFixed(1).padStart(5)}      ${r.onTarget.toFixed(0).padStart(3)}%` +
    `             ${r.alliedPct.toFixed(0).padStart(3)}%              ${r.satOutPct.toFixed(0).padStart(3)}%      ` +
    `${r.supply.toFixed(1).padStart(4)} of 25`);

console.log("\n  seat fairness, per player count");
for (const r of rows)
  console.log(`    ${r.n} players   expected ${(100 / r.n).toFixed(1)}%   worst deviation ${r.seatErr.toFixed(1)}`);
console.log("\n  faction fairness, per player count");
for (const r of rows)
  console.log(`    ${r.n} players   worst ${r.facWorst.k.padEnd(9)} at ${r.facWorst.p.toFixed(1)}%   deviation ${r.facErr.toFixed(1)}`);

console.log();
gate("worst seat deviation, 2-5p", +Math.max(...rows.map((r) => r.seatErr)).toFixed(1), (v) => v <= 5, (v) => v > 10, "no seat better than another");
gate("worst faction deviation, 2-5p", +Math.max(...rows.map((r) => r.facErr)).toFixed(1), (v) => v <= 5, (v) => v > 10, "no faction better than another");
gate("shortest game (rounds)", +Math.min(...rows.map((r) => r.rounds)).toFixed(1), (v) => v >= 4, (v) => v < 3);
gate("longest game (rounds)", +Math.max(...rows.map((r) => r.rounds)).toFixed(1), (v) => v <= 12, (v) => v > 16);
gate("games decided on the target", +Math.min(...rows.map((r) => r.onTarget)).toFixed(0), (v) => v >= 80, (v) => v < 60, "not by running dry");
gate("rounds containing an alliance", +Math.min(...rows.slice(1).map((r) => r.alliedPct)).toFixed(0), (v) => v >= 15, (v) => v < 5, "3p+; alliances must actually happen");
gate("Power Brokers drawn per game", +Math.max(...rows.map((r) => r.supply)).toFixed(1), (v) => v <= 22, (v) => v > 25, "the supply must not run dry");

const failed = results.filter((r) => r.hard), warned = results.filter((r) => !r.ok && !r.hard);
console.log(`\n  ${results.length} gates · ${results.filter((r) => r.ok).length} pass · ${warned.length} warn · ${failed.length} fail`);
if (failed.length) { console.log("\n  FAILED:"); failed.forEach((r) => console.log(`    ${r.name} = ${r.value}`)); process.exit(1); }
console.log("\n  the design holds.");
