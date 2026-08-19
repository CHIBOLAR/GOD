// A SINGLE CHARGE, SPELLED OUT. For answering rules questions with the resolver rather than with
// a reading of the resolver.  node sim/scenario.mjs
import { resolveCharge, VALUE } from "./simple.mjs";

const card = (owner, arm) => ({ owner, arm, v: VALUE[arm], ref: {}, revealed: true });

function show(title, armies) {
  console.log("\n" + title);
  armies.forEach((a, i) =>
    console.log(`  army ${i}: ` + a.map((c) => `${c.arm.toLowerCase()} ${c.v} (seat ${c.owner})`).join(" · ")));
  const r = resolveCharge(armies.map((a) => a.slice()));
  const name = (k) => `${k.u.arm.toLowerCase()} ${k.u.v} of seat ${k.u.owner} [slot ${k.ui}]`;
  console.log("  kills:");
  if (!r.kills.length) console.log("    none");
  for (const { by, hit } of r.kills)
    console.log(`    ${hit.u.arm.toLowerCase()} ${hit.u.v} (seat ${hit.u.owner}) killed — POINT TO SEAT ${by.u.owner}  via ${name(by)}`);
  armies.forEach((a, ai) => a.forEach((c, ui) => {
    if (!r.dead[ai][ui]) console.log(`  stands: ${c.arm.toLowerCase()} ${c.v} (seat ${c.owner})`);
  }));
}

// THE QUESTION: three Warriors, three different players, one Elephant.
show("three warriors of three different players vs one elephant", [
  [card(0, "WARRIOR"), card(1, "WARRIOR"), card(2, "WARRIOR")],
  [card(3, "ELEPHANT")],
]);

// same, deployed in the other order — does the credit follow the player or the slot?
show("the same three, deployed in the opposite order", [
  [card(2, "WARRIOR"), card(1, "WARRIOR"), card(0, "WARRIOR")],
  [card(3, "ELEPHANT")],
]);

// two warriors is already enough to finish a 6 — what does the third one do?
show("two warriors and a horseman vs an elephant and a rifleman", [
  [card(0, "WARRIOR"), card(1, "WARRIOR"), card(2, "HORSEMAN")],
  [card(3, "ELEPHANT"), card(3, "RIFLEMAN")],
]);

// and the elephant's side of it: does it strike back?
show("one elephant vs two warriors, nothing else", [
  [card(0, "ELEPHANT")],
  [card(1, "WARRIOR"), card(2, "WARRIOR")],
]);

// THREE HORSEMEN: 2+2+2 exactly finishes a 6, so all three blows land and all three tie.
show("three horsemen of three players vs one elephant", [
  [card(0, "HORSEMAN"), card(1, "HORSEMAN"), card(2, "HORSEMAN")],
  [card(3, "ELEPHANT")],
]);

// the same three, but seat 2's horseman has been standing in the line the longest
show("same three, seat 2 committed first", [
  [card(2, "HORSEMAN"), card(0, "HORSEMAN"), card(1, "HORSEMAN")],
  [card(3, "ELEPHANT")],
]);

// ties only decide when the blows are EQUAL — a bigger blow takes it wherever it stands
show("a horseman in front, a rifleman behind it", [
  [card(0, "HORSEMAN"), card(1, "RIFLEMAN")],
  [card(2, "ELEPHANT")],
]);
