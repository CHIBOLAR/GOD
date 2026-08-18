import { createGame, apply, botAction, view, PHASE } from "../web/engine.mjs";
const s = createGame({ factions:["sultan","badshah","peshwa"], seed: 777, names:["A","B","C"] });
let steps = 0, lastRound = -1;
while (s.phase !== PHASE.OVER && steps++ < 3000) {
  if (s.phase === PHASE.RESOLVED && s.g.round !== lastRound) {
    lastRound = s.g.round;
    const v = view(s, 0);
    const r = v.reveal;
    console.log(`\n== after round ${r.round + 1} == winners:[${r.winners}] rockets:${r.rocketsFired}`);
    console.log(`   awarded: ${JSON.stringify(r.awarded)}  recruited: ${JSON.stringify(r.recruited)}`);
    const counts = {};
    for (const h of v.hand) counts[h.state] = (counts[h.state] || 0) + 1;
    console.log(`   seat A hand: ${JSON.stringify(counts)}`);
    console.log(`   raw rest/spent (g.round=${s.g.round}): ` +
      s.g.players[0].hand.map(u => `${u.arm[0]}${u.s}:${u.spent?"SPENT":"r"+u.rest}`).join(" "));
  }
  const seat = s.phase === PHASE.RESOLVED ? 0 : s.toAct;
  const a = botAction(s, seat); if (!a) break;
  apply(s, seat, a);
}
console.log(`\nend:${s.end} vp:${s.g.players.map(p=>p.vp)}`);
