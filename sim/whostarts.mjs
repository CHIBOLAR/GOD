// WHO TAKES THE FIRST TURN AFTER A CHARGE? Observed from real games, not read off the resolver.
//   node sim/whostarts.mjs [games per count]
//
// playGame calls onTurn AFTER the turn has resolved and BEFORE it advances the seat, so at that
// moment g.nextSeat is set and g.leader / g.armies are already in their post-charge state.
import { playGame, FACTIONS } from "./simple.mjs";
const GAMES = Number(process.argv[2] || 600);
const keys = FACTIONS.map((f) => f.key);

let charges = 0, isSeniorOfField = 0, noVictorSoOrderContinues = 0, other = 0, seniorityMoved = 0;

for (const n of [3, 5, 8]) {
  for (let i = 0; i < GAMES; i++) {
    const f = Array.from({ length: n }, (_, s) => keys[(i + s) % keys.length]);
    let seen = 0, seniorsBefore = null;
    playGame(f, 0x9e3779b9 ^ (i * 2654435761), {
      onTurn: (g, seat, act) => {
        if (g.charge === seen) { seniorsBefore = g.leader.slice(); return; }   // no charge this turn
        seen = g.charge;
        charges++;
        const totals = g.armies.map((a) => a.reduce((t, c) => t + c.v, 0));
        const top = Math.max(...totals);
        const field = totals.filter((t) => t === top).length === 1 ? totals.indexOf(top) : -1;
        if (field < 0) { if (g.nextSeat === null) noVictorSoOrderContinues++; else other++; }
        else if (g.nextSeat === g.leader[field]) {
          isSeniorOfField++;
          if (seniorsBefore && seniorsBefore[field] !== null && seniorsBefore[field] !== g.leader[field]) seniorityMoved++;
        } else other++;
        seniorsBefore = g.leader.slice();
      },
    });
  }
}

const pc = (x) => ((100 * x) / charges).toFixed(1) + "%";
console.log(`  ${charges} charges observed at 3, 5 and 8 players\n`);
console.log(`  next turn went to the SENIOR PARTNER of the army that took the field   ${pc(isSeniorOfField).padStart(7)}`);
console.log(`  no army took the field (values tied) — turn order simply continued      ${pc(noVictorSoOrderContinues).padStart(7)}`);
console.log(`  anything else                                                           ${pc(other).padStart(7)}`);
console.log(`\n  of the charges that had a winner, seniority CHANGED HANDS in            ${pc(seniorityMoved).padStart(7)}`);
console.log(`  — so the player who starts is often not the one who called the charge.`);
