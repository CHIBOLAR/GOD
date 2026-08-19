// ⚠️ EXPLOIT PROBE. A charge is legal whenever YOUR army has a unit — the rules never ask whether
// there is anything opposite. An empty enemy army means no kills, no casualties, and your side
// automatically "takes the field" on surviving value, which hands the next turn to your own senior
// partner. Who may then call another one.
//   node sim/emptycharge.mjs
import { newGame, commit, legalActions, charge, FACTIONS } from "./simple.mjs";

const keys = FACTIONS.map((f) => f.key);
const g = newGame([keys[0], keys[1], keys[2]], FACTIONS);
const u = g.players[0].hand.find((x) => x.arm === "ELEPHANT");
commit(g, 0, u, 0);                                   // seat 0 alone in army 0; army 1 empty

console.log("seat 0 holds one elephant in army 0. Army 1 is empty.\n");
let seat = 0;
for (let i = 1; i <= 6; i++) {
  const acts = legalActions(g, seat);
  if (!acts.some((a) => a.charge)) { console.log(`  turn ${i}: seat ${seat} may not charge — loop broken`); break; }
  const r = charge(g, g.players.length, null);
  const next = g.nextSeat;
  console.log(`  turn ${i}: seat ${seat} calls the charge → ${r.kills.length} kills, ` +
    `field to army ${r.victors}, next turn goes to seat ${next}`);
  if (next === null || next === undefined) { console.log("    turn passes on normally — no loop"); break; }
  seat = next;
  g.nextSeat = null;
}
console.log(`\n  army 0 still holds ${g.armies[0].length} unit(s); seat 0 vp = ${g.players[0].vp}`);
console.log("  ⚠️ if the same seat keeps getting the turn, a senior partner facing an empty army");
console.log("     can charge forever and never pass play on.");

// ⚠️ AND IT IS NOT ONLY THE EMPTY CASE. After a charge the front is quiet by construction —
// every survivor faces things it cannot finish. So a BLOODLESS charge between two occupied
// armies is the same exploit: nobody dies, the bigger side still "takes the field" on surviving
// value, and the turn comes straight back to the same senior partner.
import { newGame as ng2, commit as c2, charge as ch2, FACTIONS as F2 } from "./simple.mjs";
console.log("\n\nBoth armies occupied, but nothing can kill anything:\n");
const h = ng2([F2[0].key, F2[1].key, F2[2].key], F2);
c2(h, 0, h.players[0].hand.find((x) => x.arm === "ELEPHANT"), 0);   // elephant 6, army 0
c2(h, 1, h.players[1].hand.find((x) => x.arm === "SCOUT"), 1);      // scout 1, army 1
// the scout deals 1 to a 6 and the elephant deals 6 to a 1 — so blood IS drawn here.
// use two units that genuinely cannot finish each other: elephant 6 vs elephant 6.
const h2 = ng2([F2[0].key, F2[1].key, F2[2].key], F2);
c2(h2, 0, h2.players[0].hand.find((x) => x.arm === "ELEPHANT"), 0);
c2(h2, 1, h2.players[1].hand.find((x) => x.arm === "CANNON"), 1);
let s2 = 0;
for (let i = 1; i <= 4; i++) {
  const r = ch2(h2, h2.players.length, null);
  console.log(`  turn ${i}: seat ${s2} charges → ${r.kills.length} kills, field to army ${r.victors}, next seat ${h2.nextSeat}`);
  if (h2.nextSeat === null || h2.nextSeat === undefined) { console.log("    turn passes on — no loop"); break; }
  s2 = h2.nextSeat; h2.nextSeat = null;
}
console.log(`  armies now: [${h2.armies[0].map((c) => c.arm).join(",")}] vs [${h2.armies[1].map((c) => c.arm).join(",")}]`);
