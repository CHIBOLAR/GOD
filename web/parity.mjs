// PARITY HARNESS — the online engine must produce the SAME GAME as the measured model.
//
// Both are driven by the same seeded RNG and the same policy functions, so agreement should be
// EXACT, not statistical. Any divergence means the interactive layer consumes randomness in a
// different order, i.e. it is a different game from the one the gates measured.
import { FACTIONS, VICTORY_TARGET } from "../sim/cards.mjs";
import { playGame } from "../sim/game.mjs";
import { createGame, apply, botAction, PHASE } from "./engine.mjs";

const GAMES = Number(process.argv[2]) || 500;
const keys = FACTIONS.map((f) => f.key);

function combos(F, n) {
  const out = [], cur = [];
  (function pick(s) {
    if (cur.length === n) { out.push(cur.slice()); return; }
    for (let i = s; i < F; i++) { cur.push(i); pick(i + 1); cur.pop(); }
  })(0);
  return out;
}

let checked = 0, bad = 0;
for (const n of [2, 3, 4, 5, 6, 7, 8]) {
  const cs = combos(keys.length, n);
  let mism = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const c = cs[gi % cs.length], rot = gi % n;
    const factions = []; for (let i = 0; i < n; i++) factions.push(keys[c[(i + rot) % n]]);
    const seed = 0x9e3779b9 ^ (gi * 2654435761);

    const model = playGame(factions, VICTORY_TARGET[n], seed);

    const s = createGame({ factions, seed });
    let steps = 0;
    while (s.phase !== PHASE.OVER && steps++ < 20000) {
      const seat = s.phase === PHASE.RESOLVED ? 0 : s.toAct;
      const a = botAction(s, seat);
      if (!a) break;
      apply(s, seat, a);
    }
    const engineVp = s.g.players.map((p) => p.vp);
    const same = model.end === s.end
      && JSON.stringify(model.vp) === JSON.stringify(engineVp)
      && JSON.stringify(model.winners) === JSON.stringify(s.winners);
    checked++;
    if (!same) {
      bad++; mism++;
      if (mism <= 2) {
        console.log(`  MISMATCH n=${n} game=${gi}`);
        console.log(`    model : end=${model.end} vp=[${model.vp}] winners=[${model.winners}] rounds=${model.rounds}`);
        console.log(`    engine: end=${s.end} vp=[${engineVp}] winners=[${s.winners}] rounds=${s.g.round}`);
      }
    }
  }
  console.log(`  ${n} players — ${GAMES - mism}/${GAMES} identical`);
}
console.log(`\n${checked - bad}/${checked} games identical`);
console.log(bad === 0 ? "PARITY HOLDS — the online game is the measured game."
                      : `PARITY BROKEN — ${bad} divergent games.`);
process.exit(bad === 0 ? 0 : 1);
