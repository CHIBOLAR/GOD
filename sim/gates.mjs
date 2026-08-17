// DECCAN II — every balance gate, in one place.
//
// The gates were written down BEFORE the cards were tuned, so they cannot be moved to fit a
// result (LESSONS.md G1). Exit code 0 means the design holds.
//
//   node sim/gates.mjs        (npm run gates)

import { FACTIONS, VICTORY_TARGET, validate, GLYPH, ARMS } from "./cards.mjs";
import { strategies, payoffMatrix, solve } from "./solver.mjs";
import { resolveBattle } from "./battle.mjs";
import { playGame } from "./game.mjs";

const GAMES = Number(process.argv[2]) || 3000;
const results = [];
const gate = (name, value, pass, fail, note = "") => {
  const ok = pass(value);
  const hard = fail ? fail(value) : false;
  results.push({ name, value, ok, hard, note });
  const tag = ok ? "  ok  " : hard ? " FAIL " : " warn ";
  console.log(`  [${tag}] ${name.padEnd(46)} ${String(value).padStart(9)}   ${note}`);
  return ok;
};

console.log("DECCAN II — balance gates\n");

// ---- 0. the chassis itself --------------------------------------------------
const problems = validate();
gate("faction chassis intact", problems.length, (v) => v === 0, (v) => v > 0,
  problems.length ? problems[0] : "same twelve numbers, four of each type");

// ---- 1. faction balance at equilibrium --------------------------------------
console.log("\n  faction balance (zero-sum equilibrium, 12000 iterations)");
const S = FACTIONS.map((f) => strategies(f.units));
const N = FACTIONS.length;
const V = Array.from({ length: N }, () => new Array(N).fill(0));
for (let i = 0; i < N; i++)
  for (let j = i + 1; j < N; j++) {
    const { value } = solve(payoffMatrix(S[i], S[j]), S[i].length, S[j].length, 12000);
    V[i][j] = value; V[j][i] = -value;
  }
const means = V.map((row) => row.reduce((s, x) => s + x, 0) / (N - 1));
gate("faction spread (VP/battle)", +(Math.max(...means) - Math.min(...means)).toFixed(3),
  (v) => v <= 0.10, (v) => v > 0.25, "every faction level against the field");
gate("worst single faction matchup", +Math.max(...V.flat().map(Math.abs)).toFixed(3),
  (v) => v <= 0.20, (v) => v > 0.40, "no hopeless pairing");

// ---- 2. cards and army sizes ------------------------------------------------
console.log("\n  cards and army sizes (round-robin against a shared pool)");
const decode = (u) => ({ t: ARMS[u >> 4], s: u & 15 });
const ckey = (u) => `${GLYPH[ARMS[u >> 4]]}${u & 15}`;
const battle = (A, B) => {
  const r = resolveBattle(A, B);
  return r.winner === "A" ? 1 : r.winner === "B" ? -1 : 0;
};
const allArmies = [];
for (let i = 0; i < N; i++) for (const s of S[i]) allArmies.push(s.map(decode));
let x = 20260817;
const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = allArmies.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [allArmies[i], allArmies[j]] = [allArmies[j], allArmies[i]];
}
const pool = allArmies.slice(0, 2000);

let worstSpread = 0, drawSum = 0, cells = 0, worstSizeBest = 100;
for (let i = 0; i < N; i++) {
  const rows = S[i].map((s) => {
    const army = s.map(decode), keys = s.map(ckey);
    let w = 0, d = 0;
    for (const b of pool) { const r = battle(army, b); if (r === 1) w++; else if (r === 0) d++; }
    // level totals mean BOTH armies win, so a draw scores
    return { keys, size: keys.length, win: (100 * (w + d)) / pool.length, draw: (100 * d) / pool.length };
  });
  const avg = (xs) => (xs.length ? xs.reduce((s, r) => s + r.win, 0) / xs.length : 0);
  const cards = [...new Set(FACTIONS[i].units.map((u) => `${GLYPH[u.t]}${u.s}`))];
  const vals = cards.map((c) => avg(rows.filter((r) => r.keys.includes(c))) - avg(rows.filter((r) => !r.keys.includes(c))));
  worstSpread = Math.max(worstSpread, Math.max(...vals) - Math.min(...vals));
  drawSum += rows.reduce((s, r) => s + r.draw, 0) / rows.length; cells++;
  for (const n of [1, 2, 3])
    worstSizeBest = Math.min(worstSizeBest, Math.max(...rows.filter((r) => r.size === n).map((r) => r.win)));
}
gate("worst card-value spread within a faction", +worstSpread.toFixed(1),
  (v) => v <= 20, (v) => v > 30, "no card dominates its own hand");
gate("weakest army size, at its best", +worstSizeBest.toFixed(1),
  (v) => v >= 5, (v) => v < 2, "no army size is a dead choice");
gate("draw rate (nobody takes the ground)", +(drawSum / cells).toFixed(1),
  (v) => v <= 10, (v) => v > 15, "level totals: both armies score");

// ---- 3. whole games ---------------------------------------------------------
console.log(`\n  whole games (${GAMES} per player count)`);
function deal(n, g) {
  const keys = FACTIONS.map((f) => f.key);
  let y = (g * 2654435761) >>> 0;
  const r = () => ((y = (y * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
  return keys.slice(0, n);
}
let worstSeat = 0, worstFaction = 0, minRounds = 99, maxRounds = 0, worstOnTarget = 100;
for (const n of [2, 3, 4, 5, 6, 7, 8]) {
  const target = VICTORY_TARGET[n];
  const seatWins = new Array(n).fill(0);
  const fw = new Map(FACTIONS.map((f) => [f.key, 0])), fg = new Map(FACTIONS.map((f) => [f.key, 0]));
  let rounds = 0, onTarget = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const keys = deal(n, gi);
    const s = playGame(keys, target, 0x9e3779b9 ^ (gi * 2654435761));
    rounds += s.rounds;
    if (s.end === "target") onTarget++;
    for (let i = 0; i < n; i++) fg.set(keys[i], fg.get(keys[i]) + 1);
    const share = 1 / s.winners.length;
    for (const wgt of s.winners) { seatWins[wgt] += share; fw.set(keys[wgt], fw.get(keys[wgt]) + share); }
  }
  const exp = 100 / n;
  worstSeat = Math.max(worstSeat, Math.max(...seatWins.map((v) => Math.abs((100 * v) / GAMES - exp))));
  worstFaction = Math.max(worstFaction, Math.max(...[...fw].map(([k, v]) => Math.abs((100 * v) / (fg.get(k) || 1) - exp))));
  minRounds = Math.min(minRounds, rounds / GAMES);
  maxRounds = Math.max(maxRounds, rounds / GAMES);
  worstOnTarget = Math.min(worstOnTarget, (100 * onTarget) / GAMES);
}
gate("worst seat-position deviation, 2-8p", +worstSeat.toFixed(1),
  (v) => v <= 5, (v) => v > 10, "no seat is better than another");
gate("worst faction deviation in play, 2-8p", +worstFaction.toFixed(1),
  (v) => v <= 5, (v) => v > 10, "no faction is better than another");
gate("shortest game (rounds)", +minRounds.toFixed(1), (v) => v >= 4, (v) => v < 3, "");
gate("longest game (rounds)", +maxRounds.toFixed(1), (v) => v <= 10, (v) => v > 14, "");
gate("games decided on the target, worst count", +worstOnTarget.toFixed(0),
  (v) => v >= 80, (v) => v < 60, "not by running the table dry");

// ---- verdict ----------------------------------------------------------------
const failed = results.filter((r) => r.hard);
const warned = results.filter((r) => !r.ok && !r.hard);
console.log(`\n  ${results.length} gates · ${results.filter((r) => r.ok).length} pass · ` +
  `${warned.length} warn · ${failed.length} fail`);
if (failed.length) {
  console.log("\n  FAILED:");
  for (const r of failed) console.log(`    ${r.name} = ${r.value}`);
  process.exit(1);
}
console.log("\n  the design holds.");
