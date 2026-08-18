// DECCAN II — every balance gate, measured on the WHOLE GAME WITH ALLIANCES.
//
// This supersedes the duel numbers in sim/prove.mjs. A faction that is poor in a duel may be
// an excellent ally, and only this model can tell the difference.
//
//   node sim/gates.mjs [games]

import { FACTIONS, VICTORY_TARGET, SUPPLY_SIZE, FORCE, BROKERS, validate } from "./cards.mjs";
import { resolveBattle, SEPOY_MULT } from "./battle.mjs";
import { NUM_ARMIES } from "./game.mjs";
import { playGame } from "./game.mjs";

const GAMES = Number(process.argv[2]) || 4000;
const COUNTS = [2, 3, 4, 5, 6, 7, 8];
const results = [];
const gate = (name, value, pass, fail, note = "") => {
  const ok = pass(value), hard = fail ? fail(value) : false;
  results.push({ name, value, ok, hard });
  console.log(`  [${ok ? "  ok  " : hard ? " FAIL " : " warn "}] ${name.padEnd(44)} ${String(value).padStart(8)}   ${note}`);
};

// ⚠️ BALANCED MATCHUP COVERAGE — this was a measurement bug, not a style choice.
// deal() used to shuffle the faction list with a per-game seed and take the first n. That
// coupled WHICH FACTIONS MEET to the order the factions happen to sit in the source file: the
// same eight factions, the same 12,000 games, measured 4.63 / 5.17 / 5.15 depending only on how
// ROSTER was written — across a gate threshold of 5.0. The gate was scoring the file, not the
// design, and it did not wash out with sample size.
//
// Every n-subset of the factions is now enumerated once and cycled through in turn. Each faction
// sits in exactly C(F-1, n-1) subsets whatever its index, so no faction can be advantaged by
// where it is written. Seat order rotates with the game index so seat effects stay measured.
const comboCache = new Map();
function combos(F, n) {
  const ck = `${F}:${n}`;
  if (comboCache.has(ck)) return comboCache.get(ck);
  const out = [], cur = [];
  (function pick(start) {
    if (cur.length === n) { out.push(cur.slice()); return; }
    for (let i = start; i < F; i++) { cur.push(i); pick(i + 1); cur.pop(); }
  })(0);
  comboCache.set(ck, out);
  return out;
}
function deal(n, g) {
  const keys = FACTIONS.map((f) => f.key);
  const F = keys.length;
  const out = [];
  if (n > F) { for (let i = 0; i < n; i++) out.push(keys[i % F]); return out; }
  const cs = combos(F, n), c = cs[g % cs.length], rot = g % n;
  for (let i = 0; i < n; i++) out.push(keys[c[(i + rot) % n]]);
  return out;
}
// ⚠️ Tried and REJECTED: additionally rotating which faction fills each slot (offsetting the
// combo indices by g/cs.length). It sounds like extra variance reduction and is the opposite —
// shifting a combo by an offset lands on ANOTHER COMBO ALREADY IN THE LIST, so subsets get
// double-counted and starved instead of covered once each. Measured: order spread widened from
// 0.56 to 1.6. The plain enumeration above is already exactly balanced; leave it alone.

console.log(`DECCAN II — balance gates, whole game with alliances (${GAMES} games per count)`);
console.log(`  ${NUM_ARMIES} armies, up to 3 units each\n`);
gate("card data valid", validate().length, (v) => v === 0, (v) => v > 0);

// LESSONS C4 REGRESSION. A borrowed unit must never earn an alone bonus for the borrower. This
// shipped unnoticed once (DECISIONS D040) and survived a line-by-line reconciliation, so it is
// now a gate rather than a note. Exhaustive over every pair of armies of 1-3 cards.
gate("LESSONS C4: no borrowed alone bonus", (() => {
  const pool = [...FORCE.map((u) => ({ ...u, isB: false })), ...BROKERS.map((b) => ({ ...b, isB: true }))];
  const mk = (u, owner) => ({ arm: u.arm, s: u.s, broker: u.isB ? u.key : undefined, owner });
  const sets = []; const build = (s, cur) => {
    if (cur.length) sets.push([...cur]);
    if (cur.length === 3) return;
    for (let i = s; i < pool.length; i++) build(i, [...cur, pool[i]]);
  }; build(0, []);
  let bad = 0;
  for (const A of sets) for (const B of sets) {
    const r = resolveBattle([A.map((u) => mk(u, 0)), B.map((u) => mk(u, 1))]);
    for (const sw of r.swaps) {
      if (sw.taken.broker !== "sepoy") continue;
      const i = r.armies.findIndex((a) => a.includes(sw.taken));
      if (i >= 0 && r.armies[i].length === 1 && r.totals[i] === sw.taken.s * SEPOY_MULT) bad++;
    }
  }
  return bad;
})(), (v) => v === 0, (v) => v > 0, "a stolen Sepoy must not double for the thief");

const rows = [];
for (const n of COUNTS) {
  const target = VICTORY_TARGET[n];
  const seat = new Array(n).fill(0);
  const fw = new Map(FACTIONS.map((f) => [f.key, 0])), fg = new Map(FACTIONS.map((f) => [f.key, 0]));
  let rounds = 0, onTarget = 0, allied = 0, satOut = 0, pr = 0, supply = 0, senap = 0, recruits = 0, armies = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const keys = deal(n, gi);
    const s = playGame(keys, target, 0x9e3779b9 ^ (gi * 2654435761));
    rounds += s.rounds; allied += s.alliedRounds; supply += s.supplyUsed; senap += s.rockets; armies += s.armiesSum;
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
    supply: supply / GAMES, rockets: senap / GAMES, recruits: recruits / GAMES, armies: armies / rounds,
  });
}

console.log("\n   n  target  rounds  ends on target  rounds with an alliance  sat out  brokers used");
for (const r of rows)
  console.log(`   ${r.n}    ${r.target}     ${r.rounds.toFixed(1).padStart(5)}      ${r.onTarget.toFixed(0).padStart(3)}%` +
    `        ${r.armies.toFixed(2)}       ${r.alliedPct.toFixed(0).padStart(3)}%     ${r.satOutPct.toFixed(0).padStart(3)}%      ` +
    `${r.supply.toFixed(1).padStart(4)} of ${SUPPLY_SIZE}`);

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
// Thresholds are a PROPORTION of the supply, not literals: leave 12% of the supply undrawn to
// pass, and running it dry is a hard fail. The literals this replaces (22 and 25) were the same
// proportions of a 25-card supply, and had silently stopped binding when the supply became 20.
gate("Power Brokers drawn per game", +Math.max(...rows.map((r) => r.supply)).toFixed(1), (v) => v <= SUPPLY_SIZE * 0.88, (v) => v > SUPPLY_SIZE, `the supply of ${SUPPLY_SIZE} must not run dry`);


const failed = results.filter((r) => r.hard), warned = results.filter((r) => !r.ok && !r.hard);
console.log(`\n  ${results.length} gates · ${results.filter((r) => r.ok).length} pass · ${warned.length} warn · ${failed.length} fail`);
if (failed.length) { console.log("\n  FAILED:"); failed.forEach((r) => console.log(`    ${r.name} = ${r.value}`)); process.exit(1); }
console.log("\n  the design holds.");
