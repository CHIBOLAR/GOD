// Per-faction win share against an even split, at every player count. Prints JSON.
import { FACTIONS, VICTORY_TARGET } from "./cards.mjs";
import { playGame } from "./game.mjs";
const GAMES = Number(process.argv[2]) || 800;
const COUNTS = (process.argv[3] || "2,3,4,5").split(",").map(Number);
function deal(n, g) {
  const k = FACTIONS.map(f => f.key);
  let y = (g * 2654435761) >>> 0;
  const r = () => ((y = (y * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = k.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [k[i], k[j]] = [k[j], k[i]]; }
  return k.slice(0, n);
}
const dev = new Map(FACTIONS.map(f => [f.key, []]));
let rounds = 0;
for (const n of COUNTS) {
  const fw = new Map(FACTIONS.map(f => [f.key, 0])), fg = new Map(FACTIONS.map(f => [f.key, 0]));
  let rd = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const keys = deal(n, gi);
    const s = playGame(keys, VICTORY_TARGET[n], 0x9e3779b9 ^ (gi * 2654435761));
    rd += s.rounds;
    for (let i = 0; i < n; i++) fg.set(keys[i], fg.get(keys[i]) + 1);
    const sh = 1 / s.winners.length;
    for (const w of s.winners) fw.set(keys[w], fw.get(keys[w]) + sh);
  }
  const exp = 100 / n;
  for (const [k, v] of fw) dev.get(k).push((100 * v) / (fg.get(k) || 1) - exp);
  rounds += rd / GAMES;
}
const mean = Object.fromEntries([...dev].map(([k, xs]) => [k, +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2)]));
let worst = 0, worstName = "", worstSigned = 0;
for (const [k, xs] of dev) for (const x of xs) if (Math.abs(x) > worst) { worst = Math.abs(x); worstName = k; worstSigned = x; }
console.log(JSON.stringify({ mean, worst: +worst.toFixed(2), worstName, worstSigned: +worstSigned.toFixed(2),
  rounds: +(rounds / COUNTS.length).toFixed(1) }));
