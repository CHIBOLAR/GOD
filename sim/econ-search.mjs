// DECCAN II — pick the two archetypes for the seven-card Force.
// Shape is 2,2,1,1,1 across the ring; the seven numbers are the old Force, 1 2 3 4 4 7 10.
import { STRENGTH_MULTISET, ARMS, ARM_SHAPE } from "./cards.mjs";
import { matchup } from "./solver.mjs";

const build = (p, k) => p.flatMap((g, i) => g.map((s) => ({ t: ARMS[(i + k) % 5], s })));
const M = [...STRENGTH_MULTISET];

function patterns() {
  const seen = new Set(), out = [];
  const idx = M.map((_, i) => i);
  const pick = (pool, n) => {
    const res = [];
    const walk = (i, cur, rest) => {
      if (cur.length === n) { res.push([cur.slice(), rest.concat(pool.slice(i))]); return; }
      if (i === pool.length) return;
      cur.push(pool[i]); walk(i + 1, cur, rest); cur.pop();
      rest.push(pool[i]); walk(i + 1, cur, rest); rest.pop();
    };
    walk(0, [], []); return res;
  };
  for (const [g0, r1] of pick(idx, ARM_SHAPE[0]))
    for (const [g1, r2] of pick(r1, ARM_SHAPE[1]))
      for (const perm of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
        const p = [g0.map(i=>M[i]).sort((a,b)=>a-b), g1.map(i=>M[i]).sort((a,b)=>a-b),
                   [M[r2[perm[0]]]], [M[r2[perm[1]]]], [M[r2[perm[2]]]]];
        const rots = [0,1,2,3,4].map(k => JSON.stringify(p.map((_,i)=>p[(i+k)%5])));
        const canon = rots.slice().sort()[0];
        if (seen.has(canon)) continue;
        seen.add(canon); out.push(p);
      }
  return out;
}

const ALL = patterns();
console.log(`${ALL.length} distinct allocations of [${M.join(",")}] into 2,2,1,1,1\n`);

// ARCHETYPE A is fixed as the thematic anchor: the two biggest numbers in the lead arm,
// the doubled 4s beside them. Search every allocation for the B that levels it — the five
// relative rotations must sum to zero.
const A = [[7, 10], [4, 4], [1], [2], [3]];
const a0 = build(A, 0);
const key = (p) => JSON.stringify(p);
const aRots = new Set([0,1,2,3,4].map(k => key(A.map((_,i)=>A[(i+k)%5]))));

const scored = [];
for (const B of ALL) {
  if (aRots.has(key(B))) continue;
  const v = [0,1,2,3,4].map(d => matchup(a0, build(B, d), 2000).value);
  const sum = v.reduce((s,x)=>s+x,0);
  scored.push({ B, v, sum, worst: Math.max(...v.map(Math.abs)),
    d: A.flat().reduce((s,x,n)=>s+Math.abs(x-B.flat()[n]),0) });
}
scored.sort((x,y)=>Math.abs(x.sum)-Math.abs(y.sum));
const finals = scored.slice(0,25)
  .map(c => { const v=[0,1,2,3,4].map(d=>matchup(a0,build(c.B,d),20000).value);
              return {...c, v, sum:v.reduce((s,x)=>s+x,0), worst:Math.max(...v.map(Math.abs))}; })
  .sort((x,y)=>Math.abs(x.sum)*2+x.worst-(Math.abs(y.sum)*2+y.worst));

console.log("  allocation                              sum      worst  unlike");
for (const c of finals.slice(0,10))
  console.log(`  ${JSON.stringify(c.B).padEnd(38)} ${((c.sum>=0?"+":"")+c.sum.toFixed(3)).padStart(7)}   ` +
    `${c.worst.toFixed(3)}   ${c.d}`);
const best = finals[0];
console.log(`
  A = ${JSON.stringify(A)}`);
console.log(`  B = ${JSON.stringify(best.B)}`);
console.log(`  sum ${best.sum.toFixed(4)} · worst ${best.worst.toFixed(3)} · rotations ${best.v.map(x=>x.toFixed(2)).join(" / ")}`);
