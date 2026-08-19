// RULEBOOK SWEEP. ⚠️ A line-by-line read of the rulebook against the resolver confirms what IS
// written and cannot find what is MISSING — LESSONS.md records a reconciliation that claimed
// "nothing diverges" and missed a real exploit. So this file does the opposite: it asks the
// awkward questions a table would ask, and prints what the resolver actually does.
//   node sim/sweep.mjs
import { resolveCharge, legalActions, newGame, commit, VALUE, FACTIONS, playGame } from "./simple.mjs";

const card = (owner, arm) => ({ owner, arm, v: VALUE[arm], ref: {}, revealed: true });
let n = 0;
const q = (question, armies, read) => {
  const r = resolveCharge(armies.map((a) => a.slice()));
  console.log(`\n${String(++n).padStart(2)}. ${question}`);
  armies.forEach((a, i) => console.log(`    army ${i}: ` + (a.map((c) => `${c.arm.toLowerCase()}${c.v}/s${c.owner}`).join(" ") || "(empty)")));
  console.log("    → " + read(r, armies));
};
const kills = (r) => r.kills.length
  ? r.kills.map((k) => `${k.hit.u.arm.toLowerCase()}${k.hit.u.v} killed, point to seat ${k.by.u.owner}`).join("; ")
  : "no kills";
const standing = (r, armies) => {
  const gone = new Set((r.retreats || []).map((t) => t.u));
  return armies.map((a, ai) =>
    `army ${ai}: ` + (a.filter((c, ui) => !r.dead[ai][ui] && !gone.has(c)).map((c) => c.arm.toLowerCase() + c.v).join(" ") || "—")
    + ((r.retreats || []).some((t) => t.ai === ai) ? "  [sent home: " + r.retreats.filter((t) => t.ai === ai).map((t) => t.u.arm.toLowerCase() + t.u.v).join(" ") + "]" : "")).join(" | ");
};

console.log("DECCAN — rulebook sweep. What the resolver does with the awkward cases.");

q("Several enemies can be finished at once — which does the blow take?",
  [[card(0, "CANNON")], [card(1, "HORSEMAN"), card(2, "WARRIOR")]],
  (r, a) => kills(r) + "   (a cannon 5 could finish the 2 or the 3) · " + standing(r, a));

q("Nothing can be finished — which is 'the biggest still standing'?",
  [[card(0, "HORSEMAN")], [card(1, "ELEPHANT"), card(1, "CANNON")]],
  (r, a) => "no kill; damage went somewhere. standing: " + standing(r, a));

q("Two enemies tie for biggest — which one takes the blow?",
  [[card(0, "WARRIOR"), card(0, "WARRIOR")], [card(1, "CANNON"), card(2, "CANNON")]],
  (r) => kills(r));

q("The Spy's target ties for highest value — which does it name?",
  [[card(0, "SPY")], [card(1, "ELEPHANT"), card(2, "ELEPHANT")]],
  (r, a) => standing(r, a) + "  (the one NOT standing was sent home, not killed)");

q("Spy versus Spy, facing each other — do they remove each other?",
  [[card(0, "SPY"), card(0, "ELEPHANT")], [card(1, "SPY"), card(1, "ELEPHANT")]],
  (r, a) => standing(r, a) + " · " + kills(r));

q("A Commander facing nothing but Commanders — what does it hit for?",
  [[card(0, "COMMANDER")], [card(1, "COMMANDER")]],
  (r) => kills(r) + "   (each should strike for its own 1, killing the other)");

q("A Commander when the enemy's best is a Commander plus small fry",
  [[card(0, "COMMANDER")], [card(1, "COMMANDER"), card(1, "HORSEMAN")]],
  (r) => kills(r) + "   (it must ignore the enemy Commander and copy the horseman 2)");

q("An Elephant alone against three Horsemen — does it get to swing?",
  [[card(0, "ELEPHANT")], [card(1, "HORSEMAN"), card(2, "HORSEMAN"), card(3, "HORSEMAN")]],
  (r, a) => kills(r) + " · standing: " + standing(r, a));

q("A charge where one army is EMPTY",
  [[card(0, "ELEPHANT"), card(1, "WARRIOR")], []],
  (r, a) => kills(r) + " · field to army " + r.victors + " · standing: " + standing(r, a));

q("Both armies wipe each other out completely",
  [[card(0, "HORSEMAN")], [card(1, "HORSEMAN")]],
  (r, a) => kills(r) + " · field to army " + r.victors + " (-1 = nobody) · standing: " + standing(r, a));

// ---- legality questions, which need a real game rather than a bare resolver ------------------
console.log("\n--- legality ---");
const keys = FACTIONS.map((f) => f.key);
const g = newGame([keys[0], keys[1]], FACTIONS);
const u = g.players[0].hand.find((x) => x.arm === "ELEPHANT");
commit(g, 0, u, 0);
const acts = legalActions(g, 0);
console.log(`\n11. Seat 0 has one unit in army 0; army 1 is EMPTY. May seat 0 call the charge?`);
console.log(`    → ${acts.some((a) => a.charge) ? "YES — a charge into an empty army is legal" : "no"}`);
console.log(`12. May seat 0 deploy into army 1 as well?`);
console.log(`    → ${acts.some((a) => a.unit && a.army === 1) ? "YES (contradicts one-army rule!)" : "no — you may stand in only one army"}`);

// ---- can two players cross the target together? ----------------------------------------------
let shared = 0, games = 0;
for (const cnt of [3, 5, 8]) for (let i = 0; i < 3000; i++) {
  const f = Array.from({ length: cnt }, (_, s) => keys[(i + s) % keys.length]);
  const r = playGame(f, 0x9e3779b9 ^ (i * 2654435761));
  games++; if (r.winners.length > 1) shared++;
}
console.log(`\n13. Can two players hit seven in the same charge and share the win?`);
console.log(`    → ${shared} of ${games} games ended with more than one winner (${(100 * shared / games).toFixed(2)}%)`);
