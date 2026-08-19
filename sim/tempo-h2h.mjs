// DOES THE TEMPO TERM PLAY BETTER? Half the seats price initiative, half do not, same table,
// same decks, seats rotated so neither policy is fixed to a seat.
//   node sim/tempo-h2h.mjs [games]
import { playGame, FACTIONS } from "./simple.mjs";
const GAMES = Number(process.argv[2] || 4000);
const keys = FACTIONS.map((f) => f.key);
for (const n of [4, 6, 8]) {
  let w = 0, g = 0, blind = 0;
  for (let i = 0; i < GAMES; i++) {
    const f = Array.from({ length: n }, (_, s) => keys[(i + s) % keys.length]);
    // alternate which seats are tempo-aware, and rotate the offset every game
    const tempo = Array.from({ length: n }, (_, s) => (s + i) % 2 === 0);
    const r = playGame(f, 0x9e3779b9 ^ (i * 2654435761), { tempo });
    const share = 1 / r.winners.length;
    for (const x of r.winners) { if (tempo[x]) w += share; else blind += share; }
    g++;
  }
  const tot = w + blind;
  console.log(`  ${n} players · ${GAMES} games   tempo-aware ${(100 * w / tot).toFixed(1)}%   tempo-blind ${(100 * blind / tot).toFixed(1)}%`);
}
