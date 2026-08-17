// DECCAN II — can the factions be made PROVABLY level while staying asymmetric?
//
// The certified result for the pure rotation 3/2/2/2/1 is a spread of 0.105, and compressing
// the strength ladder barely helps (0.072 at its flattest). The cause is structural: rotation
// equalises how MANY units a faction holds, not what they are worth. Elephant-lead holds three
// 9s and Archer-lead holds three 1s.
//
// The fix that follows: stop rotating the counts, and instead give every faction the same
// NUMBER of units and the same TOTAL STRENGTH, letting the counts differ. A faction with a
// cheap lead arm simply gets more of it. That keeps the asymmetry — the arms you hold are
// still completely different — while removing the thing rotation could not equalise.
//
//   node sim/equalise.mjs

import { ARMS, FORCE, GLYPH } from "./cards.mjs";

const UNITS = 10;
const strengthOf = Object.fromEntries(FORCE.map((u) => [u.arm, u.s]));
const TOTAL = 50;

// every count vector over the five arms with UNITS units and TOTAL strength
function vectors() {
  const out = [];
  const rec = (i, left, sum, cur) => {
    if (i === 5) { if (left === 0 && sum === TOTAL) out.push([...cur]); return; }
    for (let n = 0; n <= left; n++) {
      const s = sum + n * strengthOf[ARMS[i]];
      if (s > TOTAL) break;
      cur.push(n); rec(i + 1, left - n, s, cur); cur.pop();
    }
  };
  rec(0, UNITS, 0, []);
  return out;
}

const all = vectors();
console.log(`\n  ${all.length} count vectors hold ${UNITS} units at exactly ${TOTAL} strength\n`);

// For each lead arm pick the vector that leans hardest into it, then breaks ties by leaning
// into the next arm round the ring — so each faction is unmistakably "the X faction".
const chosen = ARMS.map((lead, k) => {
  const order = [0, 1, 2, 3, 4].map((g) => ARMS.indexOf(ARMS[(g + k) % 5]));
  let best = null;
  for (const v of all) {
    const key = order.map((idx) => v[idx]);
    if (!best) { best = { v, key }; continue; }
    for (let i = 0; i < 5; i++) {
      if (key[i] === best.key[i]) continue;
      if (key[i] > best.key[i]) best = { v, key };
      break;
    }
  }
  return { lead, v: best.v };
});

console.log("  faction        counts by arm (E R W H A)      hand                          total");
for (const c of chosen) {
  const units = [];
  ARMS.forEach((a, i) => { for (let n = 0; n < c.v[i]; n++) units.push(GLYPH[a] + strengthOf[a]); });
  const tot = ARMS.reduce((s, a, i) => s + c.v[i] * strengthOf[a], 0);
  console.log(`  ${("lead " + c.lead).padEnd(15)}${c.v.join(" ").padEnd(30)}${units.join(" ").padEnd(30)}${tot}`);
}

console.log("\n  export this as PATTERN_ABS to sim/cards.mjs to measure it:");
console.log("  " + JSON.stringify(Object.fromEntries(chosen.map((c) => [c.lead, c.v]))));
