// DECCAN — THE ROSTER SEARCH. What nine cards each of the eight rulers holds.
//
//   node sim/roster.mjs [total] [games per count] [passes]
//
// ⚠️ TOTAL DECK VALUE IS NEARLY THE WHOLE GAME, and it has to be held constant or nothing
// else can be read. Measured over eight nine-card decks spanning totals 9 to 41, win rate ran
// 0.42 -> 0.64 -> 1.28 -> 2.11 -> 2.74, monotonically, with no exception. A ruler is not
// interesting because it holds MORE; it is interesting because it holds the same amount in a
// different SHAPE. So every deck here is enumerated at one fixed total, and the search moves
// only through shapes that keep it.
//
// ⚠️ IDENTITY IS CONSTRAINED, NOT OPTIMISED. Ruler i must hold more of TYPES[i] than of anything
// else, and at least two. The lesson this repo already paid for is that a free hill-climb spends
// whatever you did not measure — it will happily hand every ruler the same good deck and report
// a beautiful deviation. Constrain the identity, then optimise inside it.
import { TYPES, VALUE, makeFactions, playGame, TARGET } from "./simple.mjs";

// ⚠️ THE STRUCTURE: FIVE MAINS ARE THE SPINE, THREE ABILITIES ARE SPARES.
// Every ruler holds ONE OF EACH of the five main units — Elephant, Cannon, Rifleman, Horseman,
// Warrior — which is five of its nine cards and 15 of its value. The other FOUR are spares,
// any mix of the eight types. So a ruler can lean on Slingers or Spies or Scouts and still never
// be ability-driven: four of nine is a minority by construction, and the spine is untouched.
// This is what makes 330 distinct rulers exist where "one of every type plus one" allowed 8.
const MAINS = 5;
const SPARES = 4;
const ABILITY_CAP = Number(process.env.ABILITYCAP || SPARES);
const TOTAL = Number(process.argv[2] || 0);              // 0 = accept the whole band
const TOTAL_MIN = Number(process.env.TOTALMIN || 19);
const TOTAL_MAX = Number(process.env.TOTALMAX || 23);
const GAMES = Number(process.argv[3] || 700);
const PASSES = Number(process.argv[4] || 3);
const COUNTS = (process.env.COUNTS || "3,5,8").split(",").map(Number);
const N = TYPES.length;

// ---- every nine-card deck at the fixed total ------------------------------------------------
function enumerate(total, cards) {
  const out = [], cur = new Array(N).fill(0);
  (function go(i, left, sum) {
    if (i === N) { if (left === 0 && sum === total) out.push(cur.slice()); return; }
    for (let k = 0; k <= left; k++) {
      cur[i] = k; const s2 = sum + k * VALUE[TYPES[i]];
      if (s2 <= total) go(i + 1, left - k, s2);
      cur[i] = 0;
    }
  })(0, cards, 0);
  return out;
}

const HAND = 9;
const inBand = (t) => (TOTAL ? t === TOTAL : t >= TOTAL_MIN && t <= TOTAL_MAX);
const all = [];
for (let t = TOTAL || TOTAL_MIN; t <= (TOTAL || TOTAL_MAX); t++) {
  for (const d of enumerate(t, HAND)) {
    if (d.slice(0, MAINS).some((v) => v < 1)) continue;            // the spine, one of each
    if (d.slice(MAINS).reduce((a, b) => a + b, 0) > ABILITY_CAP) continue;  // never a majority
    all.push(d);
  }
}
// the decks that may represent ruler i: it leads TYPES[i] outright and holds at least two
// ⚠️ TIES ARE ALLOWED. Requiring the lead to be STRICTLY the most numerous left the Elephant
// with zero legal decks at totals 18 and 20 — two elephants is ten of the value, and the
// seven cards left cannot avoid doubling up somewhere. "Holds as many of its own as of anything"
// is the identity that actually exists.
// ⚠️ EXTREME DECKS MEASURE BADLY AND THE FIRST SEARCH FOUND ONLY EXTREME DECKS. Unconstrained
// at a fixed total it returned 6 Horsemen, 5 Spies, 4 Slingers — 13.4 points of signature
// deviation and a 27-minute game, against 3.3 and 22 for the placeholder. MAXPER caps how many
// copies of one type a ruler may hold; MINTYPES is how much of the roster it must still cover.
const MAXPER = Number(process.env.MAXPER || 9);
const MINTYPES = Number(process.env.MINTYPES || 1);
// ⚠️ A LEAD MUST BE STRICT. Allowing ties returned a Maharaja "leading Horseman" with as many
// Cannons and Scouts as Horsemen, and a Nizam whose two Spies tied its Cannons. A ruler whose
// signature ties two other cards has no signature.
// ⚠️ NO RULER HOLDS MORE THAN THREE OF ANYTHING. Four Commanders measured 1.28 of a fair share
// — the strongest ruler in the game — because each one copies the enemy's best, so they
// multiply: four heavy blows for four points of printed value. A uniform cap also makes every
// identity read the same way at the table: "three of yours, one of everything else."
const LEAD_CAP = Number(process.env.LEADCAP || 3);
// LEADCOUNTS locks each ruler's SIGNATURE — how many of its own type it holds — and lets the
// search tune only the rest. Identity is then a designer's decision and the balancing happens
// inside it, which is the order this project has learned to work in: constrain, then optimise.
const LOCK = process.env.LEADCOUNTS ? process.env.LEADCOUNTS.split(",").map(Number) : null;
const pool = TYPES.map((_, i) =>
  all.filter((d) => (LOCK
      ? d[i] === LOCK[i] && d.every((v, j) => j === i || v <= d[i])
      : d[i] >= 2 && d.every((v, j) => j === i || v < d[i]) && d[i] <= LEAD_CAP)));

console.log(`DECCAN — roster search · 9 cards = 5 mains + 4 spares · total ${TOTAL || TOTAL_MIN + "-" + TOTAL_MAX} · ${TARGET} kills`);
console.log(`  ${all.length} decks at this total; per-ruler candidates: ${pool.map((p) => p.length).join(" ")}`);
if (pool.some((p) => !p.length)) {
  console.log(`\n  ⚠️ NO CANDIDATES for ${TYPES.filter((_, i) => !pool[i].length).join(", ")} at total ${TOTAL}.`);
  console.log(`  A ruler cannot lead a type it has no room for — try a different total.`);
  process.exit(1);
}

// ---- what a roster is worth -----------------------------------------------------------------
// Max deviation is the gate, but it is a max over many noisy cells and it disagrees between
// samples. RMS moves consistently and is what the search steers on; the max is reported beside
// it so a result can never be quoted on the flattering number alone.
// Five rulers lead a main unit, three lead a spare. Named as the designer named them.
const NAMES = ["sultan", "nawab", "governor", "maharaja", "rana", "nizam", "badshah", "peshwa"];
const keys = NAMES;
// ⚠️ A FAIR SHARE IS 1/n, AND n IS NOT THE NUMBER OF RULERS. Normalising by the roster size
// while playing at 3, 5 and 8 players made every ruler score above 1.36 — an impossible result
// that the search happily optimised for a full run before anyone read the numbers. Expected wins
// are accumulated per game, at that game's player count.
// ⚠️ THE OBJECTIVE MUST BE THE GATE, OR THE SEARCH OPTIMISES SOMETHING ELSE. This pooled every
// player count into one rate per ruler; the gate takes the WORST SINGLE COUNT. Three rosters in
// a row came back at 0.11-0.16 here and 13.4-13.8 on the real gates — beautifully balanced on
// average and broken at one count, which the pooled number could not see.
//
// Cells are now (count x ruler), exactly as the gate reads them. RMS across all cells is what
// the search STEERS on, because a max over many noisy cells is dominated by whichever cell got
// unlucky; the max is carried alongside so nothing is ever quoted on the flattering number.
function evaluate(vectors, games = GAMES) {
  const roster = makeFactions(vectors, keys);
  const cells = [];
  const rate = keys.map(() => []);
  for (const n of COUNTS) {
    const w = new Map(keys.map((k) => [k, 0])), e = new Map(keys.map((k) => [k, 0]));
    for (let gi = 0; gi < games; gi++) {
      const f = Array.from({ length: n }, (_, i) => keys[(gi + i) % N]);
      const r = playGame(f, 0x9e3779b9 ^ (gi * 2654435761), { roster });
      for (const k of f) e.set(k, e.get(k) + 1 / n);        // what a fair ruler would have won
      const share = 1 / r.winners.length;
      for (const x of r.winners) w.set(f[x], w.get(f[x]) + share);
    }
    keys.forEach((k, i) => {
      const v = w.get(k) / (e.get(k) || 1);
      rate[i].push(v); cells.push(Math.abs(v - 1));
    });
  }
  const mean = rate.map((xs) => xs.reduce((a, b) => a + b, 0) / xs.length);
  return { rate: mean, max: Math.max(...cells),
    rms: Math.sqrt(cells.reduce((a, b) => a + b * b, 0) / cells.length) };
}

// Spy, Scout and Slinger all begin with S, so a one-letter glyph silently merged three units.
const GLYPH = ["E", "C", "R", "H", "W", "Sp", "Sc", "Cd"];   // Cd = Commander
const show = (v) => TYPES.map((t, i) => (v[i] ? `${v[i]}${GLYPH[i]}` : "")).filter(Boolean).join(" ");

// ---- STAGE 1: rate every candidate deck on its own -------------------------------------------
// Coordinate descent over ~500 candidates was ~600,000 games per pass and did not finish. Rating
// each deck ONCE against a fixed field is one evaluation per deck instead of one per trial, and
// it turns "which eight go together" into a matter of picking eight equal numbers.
// ⚠️ A rating against a fixed field cannot see how two rulers interact. It is a filter, not a
// verdict, and the eight it picks are then measured against each other properly below.
const FIELD = Number(process.env.FIELD || 4);          // player count the ratings are taken at
const RGAMES = Number(process.env.RGAMES || 400);
const reference = pool.map((p, i) => p.slice().sort((a, b) => b[i] - a[i])[0]);
function rate(vec, i) {
  // one candidate in seat 0, a fixed field of the other seven identities opposite it
  const vectors = reference.slice(); vectors[i] = vec;
  const roster = makeFactions(vectors, keys);
  let w = 0, g = 0;
  for (let gi = 0; gi < RGAMES; gi++) {
    const f = Array.from({ length: FIELD }, (_, s) => keys[(i + s) % N]);
    const r = playGame(f, 0x9e3779b9 ^ (gi * 2654435761), { roster });
    g++; if (r.winners.includes(0)) w += 1 / r.winners.length;
  }
  return (w / g) * FIELD;                              // 1.00 = a fair share
}

console.log(`  rating ${pool.reduce((n, p) => n + p.length, 0)} candidate decks at ${FIELD} players...`);
const rated = pool.map((p, i) => p.map((v) => ({ v, i, r: rate(v, i) })).sort((a, b) => a.r - b.r));
for (let i = 0; i < N; i++) {
  const rs = rated[i].map((x) => x.r);
  console.log(`  ${keys[i].padEnd(10)} ${String(rs.length).padStart(3)} decks   rating ${Math.min(...rs).toFixed(2)} .. ${Math.max(...rs).toFixed(2)}`);
}

// ---- STAGE 2: pick the eight whose ratings sit closest to a common value ----------------------
// ⚠️ DECKS MUST BE DISTINCT. Ties in the lead let one deck qualify as two identities, and the
// first run returned the SAME nine cards for the Cannon and the Horseman — two rulers that are
// the same ruler. Each is claimed in turn and no later ruler may take it.
const sig = (v) => v.join(",");
// ⚠️ THE BOX HAS TO CONTAIN THE GAME. Left free, the search filled every spare slot with Scouts
// — the safest card — and the finished roster held 10 Scouts, 4 Spies and TWO Slingers across
// all 72 cards. The card whose whole job is answering an Elephant appeared twice in the box, and
// slinger kills fell from 1.5-4.3 a game to 0.65. Each ability must be properly stocked.
const MIN_COPIES = Number(process.env.MINCOPIES || 6);
const stocked = (pick) => TYPES.every((_, j) =>
  j < MAINS || pick.reduce((n, v) => n + v[j], 0) >= MIN_COPIES);
let best = null, score = null;
for (const targetRate of [0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15]) {
  const taken = new Set(), pick = [];
  for (let i = 0; i < N; i++) {
    const free = rated[i].filter((x) => !taken.has(sig(x.v)));
    if (!free.length) { pick.length = 0; break; }
    const chosen = free.reduce((b, x) =>
      Math.abs(x.r - targetRate) < Math.abs(b.r - targetRate) ? x : b);
    taken.add(sig(chosen.v)); pick.push(chosen.v);
  }
  if (pick.length !== N) continue;
  // ⚠️ REPAIR, DO NOT DISCARD. Requiring six copies of every ability made the greedy pick illegal
  // at almost every target rate, and throwing the attempt away left NO roster at all. Instead,
  // find the ability that is short and hand it to whichever ruler can carry more of it at the
  // smallest cost to its own rating.
  for (let guard = 0; guard < 40 && !stocked(pick); guard++) {
    const short = TYPES.findIndex((_, j) =>
      j >= MAINS && pick.reduce((n, v) => n + v[j], 0) < MIN_COPIES);
    if (short < 0) break;
    let bestSwap = null;
    for (let i = 0; i < N; i++) {
      for (const cand of rated[i]) {
        if (cand.v[short] <= pick[i][short]) continue;
        if (pick.some((v, j) => j !== i && sig(v) === sig(cand.v))) continue;
        const cost = Math.abs(cand.r - targetRate);
        if (!bestSwap || cost < bestSwap.cost) bestSwap = { i, v: cand.v, cost };
      }
    }
    if (!bestSwap) break;
    pick[bestSwap.i] = bestSwap.v;
  }
  if (!stocked(pick)) continue;
  const sc = evaluate(pick);
  if (!score || sc.rms < score.rms) { best = pick; score = sc; }
}
if (!best) {
  console.log(`
  ⚠️ NO LEGAL ROSTER: with a strict lead and ${MIN_COPIES}+ copies of every ability,`);
  console.log(`  no eight decks satisfy both. Loosen MINCOPIES or widen the total band.`);
  process.exit(1);
}
console.log(`
  best assembled roster: max ${score.max.toFixed(2)}  rms ${score.rms.toFixed(3)}`);

// ---- coordinate descent: one ruler at a time, its own candidates only -------------------------
for (let pass = 1; pass <= PASSES; pass++) {
  let moved = 0;
  for (let i = 0; i < N; i++) {
    let bestVec = best[i], bestScore = score;
    // only the twelve candidates rated nearest this ruler's current one — the rating already
    // ruled out the rest, and trying all of them is what made the first search never finish
    const near = rated[i].slice().sort((a, b) => Math.abs(a.r - 1) - Math.abs(b.r - 1)).slice(0, 12);
    for (const { v: cand } of near) {
      if (cand === bestVec) continue;
      if (best.some((v, j) => j !== i && sig(v) === sig(cand))) continue;   // stay distinct
      const trialStock = best.slice(); trialStock[i] = cand;
      if (!stocked(trialStock)) continue;                                  // stay stocked
      const trial = best.slice(); trial[i] = cand;
      const sc = evaluate(trial);
      if (sc.rms < bestScore.rms) { bestVec = cand; bestScore = sc; }
    }
    if (bestVec !== best[i]) { best[i] = bestVec; score = bestScore; moved++; }
  }
  console.log(`  pass ${pass}: ${moved} rulers moved · max ${score.max.toFixed(2)}  rms ${score.rms.toFixed(3)}`);
  if (!moved) break;
}

const final = evaluate(best, GAMES * 3);
console.log(`\n  VERIFIED at ${GAMES * 3} games/count: max ${final.max.toFixed(2)}  rms ${final.rms.toFixed(3)}\n`);
console.log("  ruler       deck                              total   win rate");
best.forEach((v, i) => {
  const tot = v.reduce((n, c, j) => n + c * VALUE[TYPES[j]], 0);
  console.log(`  ${keys[i].padEnd(10)}  ${show(v).padEnd(32)}${String(tot).padStart(5)}     ${final.rate[i].toFixed(2)}`);
});
console.log(`\n  ROSTER=${best.map((v) => v.join(",")).join("|")}`);
