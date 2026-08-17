// DECCAN II — five arms instead of three. Rock-paper-scissors-lizard-Spock.
//
// WHY. With THREE types, a three-card army can hold one of each, and under any "your unit
// cancels their type" reading that army cancels everything. Measured: the best army in the
// game became one-of-each at minimum strength (H1+F2+G3, 100%), strength stopped mattering,
// and every faction matchup solved to exactly 0.000 — two rainbow armies zeroing each other.
//
// With FIVE arms each beating two, a three-card army can never cover the field: whatever
// three arms you bring, at least one arm has nothing in your army that answers it. The
// degenerate lock is structurally impossible.
//
//   node sim/five-test.mjs

// Order matters: arm i beats i+1 and i+2. Every edge below is historically real.
//   SLINGER  -> ELEPHANT (missiles panic them), SPEARMAN (harried from range)
//   ELEPHANT -> SPEARMAN (trampled), HORSEMAN (horses will not face them)
//   SPEARMAN -> HORSEMAN (pikes stop a charge), CANNON (gun crews overrun)
//   HORSEMAN -> CANNON (ridden down), SLINGER (run down in the open)
//   CANNON   -> SLINGER (shredded), ELEPHANT (the one answer to them)
const ARMS = ["SLINGER", "ELEPHANT", "SPEARMAN", "HORSEMAN", "CANNON"];
const G = { SLINGER: "S", ELEPHANT: "E", SPEARMAN: "P", HORSEMAN: "H", CANNON: "C" };
const beats = (x, y) => y === (x + 1) % 5 || y === (x + 2) % 5;

// A test pool: each arm at a low, middle and high strength.
const CARDS = [];
[[1, 4, 7], [2, 5, 8], [3, 6, 9], [1, 5, 9], [2, 6, 7]].forEach((ss, t) =>
  ss.forEach((s) => CARDS.push({ t, s, n: `${G[ARMS[t]]}${s}` })));

function subsets(max) {
  const out = [];
  const walk = (start, cur) => {
    if (cur.length) out.push([...cur]);
    if (cur.length === max) return;
    for (let i = start; i < CARDS.length; i++) { cur.push(i); walk(i + 1, cur); cur.pop(); }
  };
  walk(0, []);
  return out;
}

// EACH of your units cancels ONE enemy unit of an arm it beats — the strongest available.
function surviving(mine, foe) {
  const me = mine.map((i) => ({ ...CARDS[i], dead: false }));
  const order = foe.map((i) => CARDS[i]).sort((a, b) => b.s - a.s);
  for (const v of order) {
    let best = null;
    for (const u of me) if (!u.dead && beats(v.t, u.t) && (!best || u.s > best.s)) best = u;
    if (best) best.dead = true;
  }
  return me;
}
const total = (me) => me.reduce((s, u) => s + (u.dead ? 0 : u.s), 0);

const ARMIES = subsets(3);
const n = ARMIES.length;
const st = ARMIES.map(() => ({ w: 0, d: 0 }));
for (let i = 0; i < n; i++)
  for (let j = i + 1; j < n; j++) {
    const ta = total(surviving(ARMIES[i], ARMIES[j]));
    const tb = total(surviving(ARMIES[j], ARMIES[i]));
    if (ta > tb) st[i].w++; else if (tb > ta) st[j].w++; else { st[i].d++; st[j].d++; }
  }
const rows = ARMIES.map((a, i) => ({
  a, size: a.length,
  win: (100 * (st[i].w + st[i].d)) / (n - 1), draw: (100 * st[i].d) / (n - 1),
})).sort((p, q) => q.win - p.win);

const avg = (xs) => (xs.length ? xs.reduce((s, r) => s + r.win, 0) / xs.length : 0);
const val = CARDS.map((c, i) => ({
  n: c.n, d: avg(rows.filter((r) => r.a.includes(i))) - avg(rows.filter((r) => !r.a.includes(i))),
})).sort((x, y) => y.d - x.d);

console.log(`FIVE ARMS — ${n} armies, ${((n * (n - 1)) / 2).toLocaleString()} battles\n`);
console.log("  " + ARMS.map((a, i) => `${a} beats ${ARMS[(i + 1) % 5]} + ${ARMS[(i + 2) % 5]}`).join("\n  "));
console.log("\n  card value");
console.log("    " + val.map((v) => `${v.n}:${v.d >= 0 ? "+" : ""}${v.d.toFixed(1)}`).join("  "));
const spread = val[0].d - val[val.length - 1].d;
const draws = rows.reduce((s, r) => s + r.draw, 0) / rows.length;
const sizes = [1, 2, 3].map((k) => Math.max(...rows.filter((r) => r.size === k).map((r) => r.win)));
const armsIn = (a) => new Set(a.map((i) => CARDS[i].t)).size;
console.log(`\n  card-value spread ....... ${spread.toFixed(1)}   (gate <= 20)`);
console.log(`  both-win rate ........... ${draws.toFixed(1)}%`);
console.log(`  best army ............... ${rows[0].a.map((i) => CARDS[i].n).join("+")} at ${rows[0].win.toFixed(1)}%`);
console.log(`  best army by size ....... 1u ${sizes[0].toFixed(1)}%  2u ${sizes[1].toFixed(1)}%  3u ${sizes[2].toFixed(1)}%`);
console.log(`  distinct arms in top 20 . ${(rows.slice(0, 20).reduce((s, r) => s + armsIn(r.a), 0) / 20).toFixed(2)} of 3`);
console.log(`  three-of-a-kind in top 20 ${rows.slice(0, 20).filter((r) => armsIn(r.a) === 1).length}/20`);
