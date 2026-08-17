// Per-broker value in WHOLE GAMES: how much does committing this card change your chance of
// winning? A round-robin cannot answer it — brokers are earned by losing, so their value is
// inseparable from the economy (LESSONS.md D1).
import { FACTIONS, VICTORY_TARGET, BROKERS } from "./cards.mjs";
import { playGame } from "./game.mjs";
const GAMES = Number(process.argv[2]) || 1500;
const COUNTS = (process.argv[3] || "2,3,4,5").split(",").map(Number);
function deal(n, g) {
  const k = FACTIONS.map(f => f.key);
  let y = (g * 2654435761) >>> 0;
  const r = () => ((y = (y * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = k.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [k[i], k[j]] = [k[j], k[i]]; }
  return k.slice(0, n);
}
const keys = BROKERS.map(b => b.key);
const withB = Object.fromEntries(keys.map(k => [k, { w: 0, n: 0 }]));
const without = Object.fromEntries(keys.map(k => [k, { w: 0, n: 0 }]));
const facW = new Map(FACTIONS.map(f => [f.key, 0])), facN = new Map(FACTIONS.map(f => [f.key, 0]));
let rounds = 0, cells = 0, devs = [];
for (const n of COUNTS) {
  const fw = new Map(FACTIONS.map(f => [f.key, 0])), fg = new Map(FACTIONS.map(f => [f.key, 0]));
  let rd = 0;
  for (let gi = 0; gi < GAMES; gi++) {
    const fk = deal(n, gi);
    const s = playGame(fk, VICTORY_TARGET[n], 0x9e3779b9 ^ (gi * 2654435761));
    rd += s.rounds;
    const won = new Set(s.winners);
    for (let i = 0; i < n; i++) {
      fg.set(fk[i], fg.get(fk[i]) + 1);
      const win = won.has(i) ? 1 / s.winners.length : 0;
      for (const k of keys) {
        const t = s.used[i].has(k) ? withB[k] : without[k];
        t.w += win; t.n++;
      }
    }
    for (const w of won) fw.set(fk[w], fw.get(fk[w]) + 1 / s.winners.length);
  }
  const exp = 100 / n;
  for (const [k, v] of fw) devs.push(Math.abs((100 * v) / (fg.get(k) || 1) - exp));
  rounds += rd / GAMES; cells++;
}
const val = keys.map(k => ({
  k, name: BROKERS.find(b => b.key === k).name, s: BROKERS.find(b => b.key === k).s,
  d: 100 * (withB[k].w / (withB[k].n || 1) - without[k].w / (without[k].n || 1)),
  rate: (100 * withB[k].n) / (withB[k].n + without[k].n),
}));
const spread = Math.max(...val.map(v => v.d)) - Math.min(...val.map(v => v.d));
console.log(JSON.stringify({
  abil: BROKERS.map(b => b.key).join(","),
  spread: +spread.toFixed(2), facDev: +Math.max(...devs).toFixed(2),
  rounds: +(rounds / cells).toFixed(1),
  val: val.map(v => ({ n: v.name, s: v.s, d: +v.d.toFixed(1), used: +v.rate.toFixed(0) })),
}));
