// DECCAN — the balance gates, measured on THE CHARGE.
//
// The old round-and-ground game is kept in sim/gates-round.mjs and sim/game.mjs for reference;
// this measures the game we are actually building. Run: npm run gates [games]
import { FACTIONS, BROKERS, validate } from "./cards.mjs";
import { playGame, TARGET, ARMY_CAP, NUM_ARMIES } from "./charge.mjs";

const GAMES = Number(process.argv[2]) || 4000;
const COUNTS = [2, 3, 4, 5, 6, 7, 8];
const SUPPLY = BROKERS.reduce((s, b) => s + b.copies, 0);
const results = [];
const gate = (name, value, pass, fail, note = "") => {
  const ok = pass(value), hard = fail ? fail(value) : false;
  results.push({ name, value, ok, hard });
  console.log(`  [${ok ? "  ok  " : hard ? " FAIL " : " warn "}] ${name.padEnd(42)} ${String(value).padStart(8)}   ${note}`);
};

// Every n-subset enumerated and cycled, so no faction is advantaged by where it sits in the file.
const cache = new Map();
function combos(F, n) {
  const ck = `${F}:${n}`; if (cache.has(ck)) return cache.get(ck);
  const out = [], cur = [];
  (function pick(s) { if (cur.length === n) { out.push(cur.slice()); return; }
    for (let i = s; i < F; i++) { cur.push(i); pick(i + 1); cur.pop(); } })(0);
  cache.set(ck, out); return out;
}

console.log(`DECCAN — THE CHARGE: balance gates (${GAMES} games per count)`);
console.log(`  ${NUM_ARMIES} armies of ${ARMY_CAP} · ${TARGET} kills to win · ${SUPPLY} Power Brokers\n`);
gate("card data valid", validate().length, (v) => v === 0, (v) => v > 0);

const keys = FACTIONS.map((f) => f.key);
const rows = [];
for (const n of COUNTS) {
  const cs = combos(keys.length, n);
  const fw = new Map(keys.map((k) => [k, 0])), fg = new Map(keys.map((k) => [k, 0]));
  const seat = new Array(n).fill(0);
  let ch = 0, tn = 0, ok = 0, sl = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const c = cs[gi % cs.length], rot = gi % n, f = [];
    for (let i = 0; i < n; i++) f.push(keys[c[(i + rot) % n]]);
    const r = playGame(f, 0x9e3779b9 ^ (gi * 2654435761));
    ch += r.charges; tn += r.turns; sl += r.supplyLeft; if (r.end === "target") ok++;
    for (const k of f) fg.set(k, fg.get(k) + 1);
    const share = 1 / r.winners.length;
    for (const w of r.winners) { fw.set(f[w], fw.get(f[w]) + share); seat[w] += share; }
  }
  const exp = 100 / n;
  rows.push({ n, charges: ch / GAMES, turns: tn / GAMES, onTarget: 100 * ok / GAMES,
    supplyLeft: sl / GAMES,
    facErr: Math.max(...[...fw].map(([k, v]) => Math.abs(100 * v / (fg.get(k) || 1) - exp))),
    facWorst: [...fw].map(([k, v]) => ({ k, p: 100 * v / (fg.get(k) || 1) }))
      .sort((a, b) => Math.abs(b.p - exp) - Math.abs(a.p - exp))[0],
    seatErr: Math.max(...seat.map((v) => Math.abs(100 * v / GAMES - exp))) });
}

console.log("\n   n  charges  turns  ends on target  brokers left");
for (const r of rows)
  console.log(`   ${r.n}    ${r.charges.toFixed(1).padStart(4)}   ${r.turns.toFixed(0).padStart(4)}` +
    `       ${r.onTarget.toFixed(0).padStart(3)}%          ${r.supplyLeft.toFixed(1).padStart(4)} of ${SUPPLY}`);
console.log("\n  faction fairness, per player count");
for (const r of rows)
  console.log(`    ${r.n} players   worst ${r.facWorst.k.padEnd(9)} at ${r.facWorst.p.toFixed(1)}%   deviation ${r.facErr.toFixed(1)}`);

console.log();
gate("worst faction deviation", +Math.max(...rows.map((r) => r.facErr)).toFixed(1), (v) => v <= 5, (v) => v > 10, "no ruler better than another");
gate("worst seat deviation", +Math.max(...rows.map((r) => r.seatErr)).toFixed(1), (v) => v <= 5, (v) => v > 10, "no seat better than another");
gate("games decided on the target", +Math.min(...rows.map((r) => r.onTarget)).toFixed(0), (v) => v >= 75, (v) => v < 50, "not by stalling");
gate("shortest game (charges)", +Math.min(...rows.map((r) => r.charges)).toFixed(1), (v) => v >= 3, (v) => v < 2);
gate("longest game (turns)", +Math.max(...rows.map((r) => r.turns)).toFixed(0), (v) => v <= 120, (v) => v > 260, "a table has to sit through these");
gate("Power Brokers left", +Math.min(...rows.map((r) => r.supplyLeft)).toFixed(1), (v) => v >= SUPPLY * 0.12, (v) => v <= 0, `of ${SUPPLY}; the supply must not run dry`);

const failed = results.filter((r) => r.hard), warned = results.filter((r) => !r.ok && !r.hard);
console.log(`\n  ${results.length} gates · ${results.filter((r) => r.ok).length} pass · ${warned.length} warn · ${failed.length} fail`);
if (failed.length) { console.log("\n  FAILED:"); failed.forEach((r) => console.log(`    ${r.name} = ${r.value}`)); process.exit(1); }
console.log("\n  the design holds.");
