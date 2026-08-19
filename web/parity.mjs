// PARITY HARNESS — the online engine must play THE CHARGE, exactly as `sim/charge.mjs` plays it.
//
// `sim/charge.mjs` is the only implementation of the rules and the only thing the gates measure.
// `web/engine.mjs` is allowed to re-order WHEN decisions happen — that is what an interactive
// game is — but it may never decide anything the model decides. This file is the proof.
//
// Both sides run the same seed, the same factions and the same policy, so agreement is EXACT and
// not statistical. Every turn of both is recorded as one line; a single differing line means the
// online game is a DIFFERENT GAME from the one the gates measured, and the line names the turn
// it happened on and what each side did.
//
//   node web/parity.mjs [games per player count]
//
// ⚠️ THIS FILE MUST FOLLOW THE MODEL. When the model changes shape, the harness is the thing
// that has to be rewritten first — a harness left pointing at the old model reports a divergence
// that means nothing, which is worse than no harness. It pointed at the round-and-ground
// `sim/game.mjs` for a whole day after the game became THE CHARGE, and read "PARITY BROKEN" on
// every game while the engine was in fact fine.
import { FACTIONS } from "../sim/cards.mjs";
import { playGame } from "../sim/charge.mjs";
import { createGame, apply, botAction, PHASE } from "./engine.mjs";

const GAMES = Number(process.argv[2]) || 500;
const CONTEXT = 3;                     // turns of run-up printed before a divergence
const keys = FACTIONS.map((f) => f.key);

// ---- one turn, as one comparable line --------------------------------------------------------
// Everything that a rule could move: the clock, whose turn it is, what they did, the score, the
// supply, and both armies down to who owns which card and whether it is face up.
const tag = (c) => `${c.arm[0].toUpperCase()}${c.s}`;
const front = (g) =>
  g.armies.map((a) => a.map((c) => `${c.owner}:${tag(c)}${c.revealed ? "^" : ""}`).join(" ") || "·")
    .join(" ¦ ");
const line = (i, g, seat, act) =>
  `#${String(i).padStart(3)} t${String(g.turn).padStart(3)} s${seat} ${act.padEnd(20)}` +
  ` vp[${g.players.map((p) => p.vp).join(",")}] ch${g.charge} sup${g.supply.length}  ${front(g)}`;

// the model's move objects
const modelAct = (a) =>
  a.pass ? "hold"
  : a.charge ? "CHARGE"
  : a.defect ? `defect ${a.from}>${a.to}`
  : a.withdraw ? `withdraw ${tag(a.withdraw)}@${a.army}`
  : `deploy ${tag(a.unit)}>${a.army}`;

// the engine's wire moves, which name cards by uid — resolved BEFORE the move is applied
const engineAct = (s, seat, a) => {
  if (a.type === "hold") return "hold";
  if (a.type === "charge") return "CHARGE";
  if (a.type === "defect") return `defect ${a.from}>${a.to}`;
  if (a.type === "withdraw") {
    const c = s.g.armies[a.army].find((x) => x.ref.uid === a.card);
    return `withdraw ${c ? tag(c) : "?"}@${a.army}`;
  }
  const u = s.g.players[seat].hand.find((x) => x.uid === a.uid);
  return `deploy ${u ? tag(u) : "?"}>${a.army}`;
};

const outcome = (o) => `end=${o.end} vp=[${o.vp}] winners=[${o.winners}] charges=${o.charges} turns=${o.turns} supply=${o.supplyLeft}`;

// ---- the engine, driven by its own bot -------------------------------------------------------
// The driver is deliberately dumb: it never chooses anything and never touches the model. If
// this loop needs a rule in it to keep up with the model, that rule is missing from the engine.
function runEngine(factions, seed) {
  const s = createGame({ factions, seed });
  const trace = [];
  let steps = 0;
  while (s.phase !== PHASE.OVER && steps++ < 20000) {
    // "continue" is the server's timer, not a decision — it carries the table past a reveal.
    if (s.phase === PHASE.CHARGE) { apply(s, 0, { type: "continue" }); continue; }
    const seat = s.toAct;
    const a = botAction(s, seat);
    if (!a) break;
    const what = engineAct(s, seat, a);
    apply(s, seat, a);
    trace.push(line(trace.length + 1, s.g, seat, what));
  }
  const vp = s.g.players.map((p) => p.vp);
  const top = Math.max(...vp);
  return {
    trace,
    end: s.end,
    vp,
    winners: s.winners.length ? s.winners : s.g.players.filter((p) => p.vp === top).map((p) => p.seat),
    charges: s.g.charge,
    turns: trace.length,
    supplyLeft: s.g.supply.length,
  };
}

function runModel(factions, seed) {
  const trace = [];
  const o = playGame(factions, seed, {
    onTurn: (g, seat, act) => trace.push(line(trace.length + 1, g, seat, modelAct(act))),
  });
  return { ...o, trace };
}

// ---- every faction subset, cycled so no ruler is advantaged by its seat -----------------------
function combos(F, n) {
  const out = [], cur = [];
  (function pick(s) {
    if (cur.length === n) { out.push(cur.slice()); return; }
    for (let i = s; i < F; i++) { cur.push(i); pick(i + 1); cur.pop(); }
  })(0);
  return out;
}

let checked = 0, bad = 0, shown = 0;
for (const n of [2, 3, 4, 5, 6, 7, 8]) {
  const cs = combos(keys.length, n);
  let mism = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const c = cs[gi % cs.length], rot = gi % n;
    const factions = []; for (let i = 0; i < n; i++) factions.push(keys[c[(i + rot) % n]]);
    const seed = 0x9e3779b9 ^ (gi * 2654435761);

    const model = runModel(factions, seed);
    const engine = runEngine(factions, seed);

    // the first turn they part on — the only thing worth reporting, because everything after it
    // is a consequence rather than a finding
    let at = -1;
    const len = Math.max(model.trace.length, engine.trace.length);
    for (let i = 0; i < len; i++) {
      if (model.trace[i] !== engine.trace[i]) { at = i; break; }
    }
    const same = at < 0 && outcome(model) === outcome(engine);
    checked++;
    if (same) continue;
    bad++; mism++;
    if (shown++ >= 3) continue;                    // three is enough to debug from

    console.log(`\n  ── DIVERGENCE  n=${n} game=${gi}  [${factions.join(" ")}]  seed=${seed}`);
    if (at >= 0) {
      for (let i = Math.max(0, at - CONTEXT); i < at; i++) console.log(`     ${model.trace[i]}`);
      console.log(`  model  ${model.trace[at] ?? "(model ended here)"}`);
      console.log(`  engine ${engine.trace[at] ?? "(engine ended here)"}`);
    } else {
      console.log(`     every turn agreed; only the outcome differs`);
    }
    console.log(`  model  ${outcome(model)}`);
    console.log(`  engine ${outcome(engine)}`);
  }
  console.log(`  ${n} players — ${GAMES - mism}/${GAMES} identical`);
}

console.log(`\n${checked - bad}/${checked} games identical`);
console.log(bad === 0
  ? "PARITY HOLDS — the online game is the game the gates measured."
  : `PARITY BROKEN — ${bad} divergent games. The online game is NOT the measured game.`);
process.exit(bad === 0 ? 0 : 1);
