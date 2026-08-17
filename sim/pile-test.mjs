// DECCAN II — how should the counter work when an army is just a pile of cards?
//
// With no positions there is nothing to pair a unit against, so the counter has to read the
// enemy ARMY. The obvious reading is degenerate:
//
//   ALL      a unit counts 0 if the enemy army holds ANY unit of the type that beats it.
//            One card of each type therefore silences the ENTIRE enemy army, so the best army
//            in the game is one-of-each at minimum strength, strength stops mattering, and
//            two rainbow armies zero each other out forever. Measured: best army H2+F4+G1 at
//            100%, and every faction matchup solving to exactly 0.000.
//
// Capping how much one card can cancel is what fixes it:
//
//   ONE      each of your units cancels ONE enemy unit of the type it beats — the strongest
//            such. Cancellation is simultaneous, read off the revealed armies.
//   LEAD     only the type of your army's STRONGEST unit cancels anything.
//
//   node sim/pile-test.mjs

const TYPES = ["HORSE", "FOOT", "GUNS"];
const BEATS = { HORSE: "GUNS", GUNS: "FOOT", FOOT: "HORSE" };
const CARDS = {};
for (let s = 1; s <= 9; s++) CARDS["U" + s] = { n: `${TYPES[(s - 1) % 3][0]}${s}`, s, t: TYPES[(s - 1) % 3] };
const KEYS = Object.keys(CARDS);

function subsets() {
  const out = [];
  const walk = (start, cur) => {
    if (cur.length) out.push([...cur]);
    if (cur.length === 3) return;
    for (let i = start; i < KEYS.length; i++) { cur.push(KEYS[i]); walk(i + 1, cur); cur.pop(); }
  };
  walk(0, []);
  return out;
}

// which of `mine` are cancelled by `foe`, under each reading
function cancelled(mine, foe, mode) {
  const me = mine.map((k) => ({ ...CARDS[k], dead: false }));
  if (mode === "plain") return me;
  const fo = foe.map((k) => CARDS[k]);

  if (mode === "all") {
    for (const u of me) if (fo.some((v) => BEATS[v.t] === u.t)) u.dead = true;
    return me;
  }
  if (mode === "lead") {
    const lead = fo.reduce((b, v) => (!b || v.s > b.s ? v : b), null);
    if (lead) for (const u of me) if (BEATS[lead.t] === u.t) u.dead = true;
    return me;
  }
  // one: each enemy unit cancels the single strongest of mine that it beats
  const order = [...fo].sort((a, b) => b.s - a.s);
  for (const v of order) {
    let best = null;
    for (const u of me) if (!u.dead && BEATS[v.t] === u.t && (!best || u.s > best.s)) best = u;
    if (best) best.dead = true;
  }
  return me;
}

const total = (me) => me.reduce((s, u) => s + (u.dead ? 0 : u.s), 0);

const ARMIES = subsets();
function measure(label, mode) {
  const n = ARMIES.length;
  const st = ARMIES.map(() => ({ w: 0, d: 0 }));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const ta = total(cancelled(ARMIES[i], ARMIES[j], mode));
      const tb = total(cancelled(ARMIES[j], ARMIES[i], mode));
      if (ta > tb) st[i].w++; else if (tb > ta) st[j].w++; else { st[i].d++; st[j].d++; }
    }
  const rows = ARMIES.map((a, i) => ({ a, win: (100 * (st[i].w + st[i].d)) / (n - 1), draw: (100 * st[i].d) / (n - 1) }));
  rows.sort((p, q) => q.win - p.win);
  const avg = (xs) => (xs.length ? xs.reduce((s, r) => s + r.win, 0) / xs.length : 0);
  const val = KEYS.map((k) => ({
    n: CARDS[k].n,
    d: avg(rows.filter((r) => r.a.includes(k))) - avg(rows.filter((r) => !r.a.includes(k))),
  })).sort((x, y) => y.d - x.d);
  const spread = val[0].d - val[val.length - 1].d;
  const draws = rows.reduce((s, r) => s + r.draw, 0) / rows.length;
  // is a rainbow (one of each type) strictly the best plan?
  const isRainbow = (a) => new Set(a.map((k) => CARDS[k].t)).size === 3;
  const rainbowTop = rows.slice(0, 20).filter((r) => isRainbow(r.a)).length;
  const best = rows[0];
  console.log(`\n  ${label}`);
  console.log("    " + val.map((v) => `${v.n}:${v.d >= 0 ? "+" : ""}${v.d.toFixed(1)}`).join("  "));
  console.log(`    spread ${spread.toFixed(1)}   both-win ${draws.toFixed(1)}%   ` +
    `best army ${best.a.map((k) => CARDS[k].n).join("+")} ${best.win.toFixed(1)}%   ` +
    `rainbow in top 20: ${rainbowTop}/20`);
}

console.log("AN ARMY IS UP TO THREE CARDS, no positions. Nine units, strengths 1..9.");
console.log("Gate: card-value spread <= 20. Watch the last column — a rainbow lock is degenerate.");
measure("no counter at all                       ", "plain");
measure("ALL  one card silences every enemy of its prey type", "all");
measure("ONE  each card cancels ONE enemy of its prey type  ", "one");
measure("LEAD only the strongest unit's type cancels        ", "lead");
