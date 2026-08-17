// CHASSIS TEST — which structural rules actually bound card value?
//
// Holds the CARD SET fixed (nine units, strengths 1..9) and changes only the structure.
// Card value = win% of armies holding a card minus win% of armies not holding it.
// The gate in README.md is a spread of 20 or less. The old game measured 47.6.
//
//   node sim/chassis-test.mjs

// ---- the card set -----------------------------------------------------------
// Strengths 1..9, one of each. Types cycle so each type holds a low, a middle and a high
// unit: HORSE {1,4,7}  FOOT {2,5,8}  GUNS {3,6,9}.
// Counter cycle (thematic, and one sentence): HORSE rides down GUNS · GUNS break FOOT ·
// FOOT holds HORSE.
const TYPES = ["HORSE", "FOOT", "GUNS"];
const BEATS = { HORSE: "GUNS", GUNS: "FOOT", FOOT: "HORSE" };

const CARDS = {};
for (let s = 1; s <= 9; s++) CARDS["U" + s] = { n: `${TYPES[(s - 1) % 3][0]}${s}`, s, t: TYPES[(s - 1) % 3] };
const KEYS = Object.keys(CARDS);
const REMOVER = "U5"; // the card that gains removal in the removal modes
const MAX = 3;

// ---- army enumeration -------------------------------------------------------
function subsets() {
  const out = [];
  const walk = (start, cur) => {
    if (cur.length) out.push([...cur]);
    if (cur.length === MAX) return;
    for (let i = start; i < KEYS.length; i++) { cur.push(KEYS[i]); walk(i + 1, cur); cur.pop(); }
  };
  walk(0, []);
  return out;
}
function placements(set) {
  const out = [];
  const walk = (i, slots) => {
    if (i === set.length) { out.push([...slots]); return; }
    for (let f = 0; f < 3; f++) {
      if (slots[f] !== null) continue;
      slots[f] = set[i]; walk(i + 1, slots); slots[f] = null;
    }
  };
  walk(0, [null, null, null]);
  return out;
}

// ---- battle -----------------------------------------------------------------
// One total, higher wins. Removal deletes the enemy's strongest. Types cannot apply:
// there is nothing to compare them on.
function scalarBattle(A, B, opt) {
  const mk = (keys) => keys.map((k) => ({ k, s: CARDS[k].s, dead: false }));
  const a = mk(A), b = mk(B);
  if (opt.removal) {
    const strongest = (arr) => arr.reduce((best, u) => (!best || u.s > best.s ? u : best), null);
    const hits = [];
    for (const u of a) if (u.k === REMOVER) { const t = strongest(b); if (t) hits.push(t); }
    for (const u of b) if (u.k === REMOVER) { const t = strongest(a); if (t) hits.push(t); }
    for (const t of hits) t.dead = true;
  }
  const total = (arr) => arr.reduce((s, u) => s + (u.dead ? 0 : u.s), 0);
  const ta = total(a), tb = total(b);
  return ta > tb ? 1 : tb > ta ? -1 : 0;
}

// Three fronts. Each front is decided on its own; more fronts takes the ground.
function frontsBattle(A, B, opt) {
  const mk = (keys) => keys.map((k) => (k ? { k, s: CARDS[k].s, t: CARDS[k].t, dead: false } : null));
  const a = mk(A), b = mk(B);
  if (opt.removal) {
    const hits = [];
    for (let f = 0; f < 3; f++) {
      if (a[f] && a[f].k === REMOVER && b[f]) hits.push(b[f]);
      if (b[f] && b[f].k === REMOVER && a[f]) hits.push(a[f]);
    }
    for (const t of hits) t.dead = true;
  }
  const live = (u) => (u && !u.dead ? u : null);
  let wa = 0, wb = 0;
  for (let f = 0; f < 3; f++) {
    const x = live(a[f]), y = live(b[f]);
    if (!x && !y) continue;
    if (!y) { wa++; continue; }
    if (!x) { wb++; continue; }
    // the counter cycle. opt.bonus = null means a countered unit simply loses; a number
    // means it fights at that much less, floored at 0, and strength still decides.
    let sx = x.s, sy = y.s;
    if (opt.types) {
      if (BEATS[x.t] === y.t) { if (opt.bonus == null) { wa++; continue; } sy = Math.max(0, sy - opt.bonus); }
      else if (BEATS[y.t] === x.t) { if (opt.bonus == null) { wb++; continue; } sx = Math.max(0, sx - opt.bonus); }
    }
    if (sx > sy) wa++; else if (sy > sx) wb++;
  }
  if (wa > wb) return 1;
  if (wb > wa) return -1;
  // level on fronts: the Centre is the decisive ground
  if (opt.centre) {
    const x = live(a[1]), y = live(b[1]);
    const sx = x ? x.s : 0, sy = y ? y.s : 0;
    if (x && y && opt.types && BEATS[x.t] === y.t) return 1;
    if (x && y && opt.types && BEATS[y.t] === x.t) return -1;
    if (sx > sy) return 1;
    if (sy > sx) return -1;
  }
  // level on fronts: the ground is held by weight of numbers
  if (opt.tiebreak) {
    const tot = (arr) => arr.reduce((s, u) => s + (live(u) ? u.s : 0), 0);
    const ta = tot(a), tb = tot(b);
    if (ta > tb) return 1;
    if (tb > ta) return -1;
  }
  return 0;
}

// ---- round robin ------------------------------------------------------------
function run(armies, battle, opt, keysOf) {
  const n = armies.length;
  const stat = armies.map(() => ({ w: 0, d: 0, l: 0 }));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const r = battle(armies[i], armies[j], opt);
      if (r === 1) { stat[i].w++; stat[j].l++; }
      else if (r === -1) { stat[j].w++; stat[i].l++; }
      else { stat[i].d++; stat[j].d++; }
    }
  const rows = armies.map((army, i) => {
    const { w, d, l } = stat[i], t = w + d + l;
    return { army, keys: keysOf(army), win: (100 * w) / t, draw: (100 * d) / t };
  });
  rows.sort((x, y) => y.win - x.win);
  return rows;
}

function analyse(label, rows, opt) {
  const avg = (xs) => xs.reduce((s, r) => s + r.win, 0) / (xs.length || 1);
  const val = KEYS.map((k) => {
    const has = rows.filter((r) => r.keys.includes(k));
    const not = rows.filter((r) => !r.keys.includes(k));
    return { k, n: CARDS[k].n, d: avg(has) - avg(not) };
  }).sort((x, y) => y.d - x.d);

  const spread = val[0].d - val[val.length - 1].d;
  const meanDraw = rows.reduce((s, r) => s + r.draw, 0) / rows.length;
  const remVal = opt.removal ? val.find((v) => v.k === REMOVER).d : null;
  const remTop50 = opt.removal ? rows.slice(0, 50).filter((r) => r.keys.includes(REMOVER)).length : null;

  // win rate by army size — the "no dead choices" gate
  const bySize = [1, 2, 3].map((n) => {
    const xs = rows.filter((r) => r.keys.length === n);
    return { n, avg: avg(xs), best: Math.max(...xs.map((r) => r.win)) };
  });

  console.log(`\n--- ${label}  (${rows.length} armies, ${((rows.length * (rows.length - 1)) / 2).toLocaleString()} battles)`);
  console.log("    " + val.map((v) => `${v.n}:${v.d >= 0 ? "+" : ""}${v.d.toFixed(1)}`).join("  "));
  console.log(`    spread ${spread.toFixed(1)}   draws ${meanDraw.toFixed(1)}%` +
    (opt.removal ? `   removal ${remVal >= 0 ? "+" : ""}${remVal.toFixed(1)} (${remTop50}/50 of top armies)` : ""));
  console.log("    by army size  " + bySize.map((b) => `${b.n}u avg ${b.avg.toFixed(1)} best ${b.best.toFixed(1)}`).join("   "));
  return { label, spread, meanDraw, remVal, remTop50, bySize };
}

// ---- run --------------------------------------------------------------------
const SETS = subsets();
const FRONT_ARMIES = SETS.flatMap(placements);
const ids = (a) => a;
const idsF = (a) => a.filter(Boolean);

console.log("CHASSIS TEST — same nine cards, four structures. Gate: card-value spread <= 20.");

const results = [
  analyse("A  scalar total, no removal   ", run(SETS, scalarBattle, {}, ids), {}),
  analyse("B  scalar total + removal     ", run(SETS, scalarBattle, { removal: true }, ids), { removal: true }),
  analyse("C  three fronts               ", run(FRONT_ARMIES, frontsBattle, {}, idsF), {}),
  analyse("D  three fronts + removal     ", run(FRONT_ARMIES, frontsBattle, { removal: true }, idsF), { removal: true }),
  analyse("E  three fronts + types       ", run(FRONT_ARMIES, frontsBattle, { types: true }, idsF), {}),
  analyse("F  three fronts + types + rem ", run(FRONT_ARMIES, frontsBattle, { types: true, removal: true }, idsF), { removal: true }),
  analyse("G  E + strength tie-break     ", run(FRONT_ARMIES, frontsBattle, { types: true, tiebreak: true }, idsF), {}),
  analyse("H  E + Centre decides         ", run(FRONT_ARMIES, frontsBattle, { types: true, centre: true }, idsF), {}),
];

console.log("\n=================== SUMMARY ===================");
console.log("  structure                         spread   draws   removal");
for (const r of results)
  console.log(
    `  ${r.label}  ${r.spread.toFixed(1).padStart(6)}  ${r.meanDraw.toFixed(1).padStart(5)}%  ` +
      (r.remVal === null ? "     —" : `${r.remVal >= 0 ? "+" : ""}${r.remVal.toFixed(1)} ${r.remTop50}/50`),
  );
console.log("\n  gate: spread <= 20 passes, > 30 is a hard fail; draws 3-10%.");

// ---- how hard should the counter bite? --------------------------------------
// If a countered unit simply loses, then any two DIFFERENT types settle their front on
// type alone — so printed strength only ever decides a MIRROR front. That converges the
// balance but leaves the numbers on the cards doing very little. A softer counter (the
// countered unit fights at -X) keeps strength live on every front. Sweep X.
console.log("\n=================== HOW HARD SHOULD THE COUNTER BITE? ===================");
console.log("  all rows: three fronts + types + Centre tie-break\n");
console.log("  counter     spread   draws   strength tiers (high / mid / low card value)");
for (const bonus of [null, 8, 6, 5, 4, 3, 2, 1]) {
  const rows = run(FRONT_ARMIES, frontsBattle, { types: true, centre: true, bonus }, idsF);
  const avg = (xs) => xs.reduce((s, r) => s + r.win, 0) / (xs.length || 1);
  const val = KEYS.map((k) => {
    const has = rows.filter((r) => r.keys.includes(k));
    const not = rows.filter((r) => !r.keys.includes(k));
    return { s: CARDS[k].s, d: avg(has) - avg(not) };
  });
  const spread = Math.max(...val.map((v) => v.d)) - Math.min(...val.map((v) => v.d));
  const draws = rows.reduce((s, r) => s + r.draw, 0) / rows.length;
  const tier = (lo, hi) => {
    const xs = val.filter((v) => v.s >= lo && v.s <= hi);
    return (xs.reduce((s, v) => s + v.d, 0) / xs.length).toFixed(1);
  };
  const name = bonus == null ? "auto-win" : `-${bonus}`;
  console.log(
    `  ${name.padEnd(10)} ${spread.toFixed(1).padStart(6)}  ${draws.toFixed(1).padStart(5)}%   ` +
      `${tier(7, 9).padStart(6)} / ${tier(4, 6).padStart(5)} / ${tier(1, 3).padStart(5)}`,
  );
}
console.log("\n  want: spread <= 20, draws 3-10%, and a real gap between the strength tiers.");
