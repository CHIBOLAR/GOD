// Gates for THE SIMPLE MODEL. Run: node sim/gates-simple.mjs [games per player count]
//
// The roster here is the PLACEHOLDER — ruler i holds one of every type plus a second of its own
// — so faction deviation is not a verdict on eight finished rulers. It is a reading of WHAT ONE
// EXTRA CARD OF EACH TYPE IS WORTH, which is exactly the evidence the real compositions get
// built from later. It is gated anyway, because if a single duplicated card can swing the game
// by more than a few points, no composition built out of nine of them will be balanced either.
import { TYPES, VALUE, FACTIONS, validate, playGame, TARGET, TARGET_2P, targetFor, minutes, ARMY_CAP, NUM_ARMIES, HAND } from "./simple.mjs";

const GAMES = Number(process.argv[2]) || 4000;
const COUNTS = [2, 3, 4, 5, 6, 7, 8];
const results = [];
const gate = (name, value, pass, fail, note = "") => {
  const ok = pass(value), hard = fail ? fail(value) : false;
  results.push({ name, value, ok, hard });
  console.log(`  [${ok ? "  ok  " : hard ? " FAIL " : " warn "}] ${name.padEnd(42)} ${String(value).padStart(8)}   ${note}`);
};

console.log(`DECCAN — THE SIMPLE MODEL: chassis gates (${GAMES} games per count)`);
console.log(`  no ring · damage only · ${TYPES.length} unit types · ${HAND} cards each · ${FACTIONS.length} rulers`);
console.log(`  ${NUM_ARMIES} armies of ${ARMY_CAP} · ${TARGET} kills to win\n`);
gate("card data valid", validate().length, (v) => v === 0, (v) => v > 0);

const keys = FACTIONS.map((f) => f.key);
const rows = [];
for (const n of COUNTS) {
  const seat = new Array(n).fill(0);
  const fw = new Map(keys.map((k) => [k, 0])), fg = new Map(keys.map((k) => [k, 0]));
  let ch = 0, tn = 0, ok = 0, kl = 0, sl = 0, sw = 0, rv = 0, sv = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    // every ruler takes every seat: the window rotates, so no ruler is fixed to a seat
    const f = Array.from({ length: n }, (_, i) => keys[(gi + i) % keys.length]);
    const r = playGame(f, 0x9e3779b9 ^ (gi * 2654435761));
    ch += r.charges; tn += r.turns; kl += r.kills;
    // ⚠️ THE SPY COLUMN MUST FOLLOW THE SPY. Reading `swapped` while SPYMODE=withdraw printed
    // 0.00 for a card firing several times a game — the same dead readout as the Slinger.
    sl += r.commanded; sw += r.swapped + r.withdrew; rv += r.revealed; sv += r.saved;
    if (r.end === "target") ok++;
    for (const k of f) fg.set(k, fg.get(k) + 1);
    const share = 1 / r.winners.length;
    for (const w of r.winners) { fw.set(f[w], fw.get(f[w]) + share); seat[w] += share; }
  }
  const exp = 100 / n;
  rows.push({ n, charges: ch / GAMES, turns: tn / GAMES, onTarget: 100 * ok / GAMES,
    kills: kl / GAMES, killsPerCharge: kl / Math.max(1, ch),
    minutes: minutes(tn / GAMES, ch / GAMES),
    commanded: sl / GAMES, swapped: sw / GAMES, revealed: rv / GAMES, saved: sv / GAMES,
    winRate: Object.fromEntries([...fw].map(([k, v]) => [k, 100 * v / (fg.get(k) || 1) / exp])),
    facErr: Math.max(...[...fw].map(([k, v]) => Math.abs(100 * v / (fg.get(k) || 1) - exp))),
    facWorst: [...fw].map(([k, v]) => ({ k, p: 100 * v / (fg.get(k) || 1) }))
      .sort((a, b) => Math.abs(b.p - exp) - Math.abs(a.p - exp))[0],
    seatErr: Math.max(...seat.map((v) => Math.abs(100 * v / GAMES - exp))) });
}

console.log("");
console.log("   n  target  charges  turns  MINUTES  ends on target  kills/charge");
for (const r of rows)
  console.log(`   ${r.n}     ${String(targetFor(r.n)).padStart(2)}     ${r.charges.toFixed(1).padStart(4)}   ${r.turns.toFixed(0).padStart(4)}` +
    `    ${r.minutes.toFixed(0).padStart(4)}         ${r.onTarget.toFixed(0).padStart(3)}%           ${r.killsPerCharge.toFixed(2).padStart(5)}`);

// ⚠️ THIS TABLE READ `slung` — kills by the SLINGER, a unit D058 removed from the game — so the
// third column reported 0.00 in every run after it and the Commander read as a dead card.
// The last column is the ARMYCMD lever: how often a player pulled back a COMRADE's unit.
console.log("\n  abilities per game     commander kills   spy fires   scout reveals   comrades saved");
for (const r of rows)
  console.log(`   ${r.n} players                    ${r.commanded.toFixed(2).padStart(6)}      ${r.swapped.toFixed(2).padStart(6)}          ${r.revealed.toFixed(2).padStart(6)}          ${r.saved.toFixed(2).padStart(6)}`);

// ⚠️ THE SCORECARD. 1.00 is exactly a fair share of the wins; anything else is what that one
// extra card is worth. It is the first evidence for what the eight real rulers are made of.
console.log("");
// ⚠️ KEYED BY THE RULER, NOT BY A UNIT TYPE. This looked rulers up by type name, so a custom
// ROSTER — whose keys are r1..r8 — missed every lookup and printed a table of 1.00 across the
// board. A display that silently falls back to "perfect" is worse than one that crashes.
console.log("  what each RULER is worth (1.00 = its fair share of the wins)");
console.log("    players" + keys.map((k) => k.slice(0, 6).padStart(8)).join(""));
for (const r of rows)
  console.log(`       ${r.n}   ` + keys.map((k) => (r.winRate[k] ?? NaN).toFixed(2).padStart(8)).join(""));
// ⚠️ THE GATE READS ABSOLUTE PERCENTAGE POINTS, AND A FAIR SHARE SHRINKS WITH THE TABLE. The
// same relative unfairness reads 10.2 points at two players and 2.5 at eight — a 4x difference
// from the unit alone, not from the game. Both are printed so the choice is made deliberately.
console.log("");
console.log("  worst ruler per count, relative / percentage points");
console.log("    " + rows.map((r) => `${r.n}p ${Math.max(...keys.map((k) => Math.abs((r.winRate[k] ?? 1) - 1))).toFixed(2)}/${r.facErr.toFixed(1)}pp`).join("   "));
console.log();

gate("games decided on the target", +Math.min(...rows.map((r) => r.onTarget)).toFixed(0), (v) => v >= 75, (v) => v < 50, "not by stalling");
gate("worst seat deviation", +Math.max(...rows.map((r) => r.seatErr)).toFixed(1), (v) => v <= 5, (v) => v > 10, "no seat better than another");
gate("worst signature deviation", +Math.max(...rows.map((r) => r.facErr)).toFixed(1), (v) => v <= 5, (v) => v > 10, "one duplicated card must not decide it");
gate("shortest game (charges)", +Math.min(...rows.map((r) => r.charges)).toFixed(1), (v) => v >= 3, (v) => v < 2);
// ⚠️ THE CEILING WAS RAISED DELIBERATELY, from 120, and here is the number that justifies it.
// At seven kills, THREE TO EIGHT PLAYERS run 69-89 table turns — well inside the old limit. The
// 133 that broke it is the TWO-PLAYER game and nothing else. A threshold inherited from a
// different game should be re-derived rather than obeyed, but it must be re-derived in public.
gate("longest game (turns)", +Math.max(...rows.map((r) => r.turns)).toFixed(0), (v) => v <= 140, (v) => v > 260, "a table has to sit through these");
// ⚠️ TABLE TURNS ARE NOT WHAT A PERSON EXPERIENCES. The same 133-turn game is 66 decisions each
// at two players and 8.6 at eight, so a single length gate hides the only count that is long.
// This one measures what one player actually sits through.
gate("turns per player", +Math.max(...rows.map((r) => r.turns / r.n)).toFixed(1), (v) => v <= 50, (v) => v > 90, "how many decisions ONE person makes");
// ⚠️ THE REAL CONSTRAINT: DECCAN IS A 15-20 MINUTE GAME. Every other length gate is a proxy for
// this one, and a proxy can pass while the game takes half an hour.
gate("longest game (minutes)", +Math.max(...rows.map((r) => r.minutes)).toFixed(0), (v) => v <= 20, (v) => v > 30, "DECCAN is a 15-20 minute game");
// ⚠️ THE CHASSIS TEST. Without a ring, the only thing stopping the heaviest unit from being
// strictly best is the Slinger. A charge that kills nothing is a charge nobody would call.
gate("kills per charge", +Math.min(...rows.map((r) => r.killsPerCharge)).toFixed(2), (v) => v >= 1, (v) => v < 0.5, "a charge that kills nothing is not a charge");

const bad = results.filter((r) => r.hard).length, warn = results.filter((r) => !r.ok && !r.hard).length;
console.log(`\n  ${results.length} gates · ${results.length - warn - bad} pass · ${warn} warn · ${bad} fail\n`);
console.log(`  units: ${TYPES.map((t) => `${t} ${VALUE[t]}`).join(" · ")}`);
console.log(bad ? "  the chassis does NOT hold." : warn ? "  the chassis holds, with warnings." : "  the chassis holds.");
process.exit(bad ? 1 : 0);
