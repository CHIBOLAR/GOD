import { spawnSync } from "node:child_process";
const NAMES="sultan,badshah,peshwa,governor,rana,nizam,nawab,maharaja".split(",");
const BASE=[[3,1,1,1,2],[1,1,3,1,2],[1,1,1,4,1],[1,4,1,1,1],[1,1,1,2,3],[1,1,3,2,1],[1,3,2,1,1],[1,1,1,3,2]];
const SLOT=Number(process.env.SLOT), GAMES=Number(process.env.GAMES||5000);
const tok=(c)=>`V${c.join("")}@0`;
const decks=[];
for(let a=0;a<5;a++)for(let b=a;b<5;b++)for(let d=b;d<5;d++){const c=[1,1,1,1,1];c[a]++;c[b]++;c[d]++;decks.push(c);}
const same=(x,y)=>x.every((v,i)=>v===y[i]);
const rows=[];
for(const cand of decks){
  if(BASE.some((b,i)=>i!==SLOT&&same(b,cand))) continue;
  const spec=BASE.map((b,i)=>tok(i===SLOT?cand:b)).join(",");
  const r=spawnSync(process.execPath,["sim/gates.mjs",String(GAMES)],
    {encoding:"utf8",env:{...process.env,ROSTERSPEC:spec}});
  const o=r.stdout||""; const m=o.match(/worst faction deviation, 2-5p\s+([\d.]+)/);
  if(!m) continue;
  rows.push({cand,dev:+m[1]});
}
rows.sort((a,b)=>a.dev-b.dev);
const lbl=(c)=>`${c[0]}E ${c[1]}R ${c[2]}C ${c[3]}H ${c[4]}W`;
console.log(`sweep of ${NAMES[SLOT]} · ${rows.length} decks · ${GAMES} games`);
for(const r of rows.slice(0,8)) console.log("  "+lbl(r.cand).padEnd(20)+r.dev.toFixed(1));
const cur=rows.find(r=>same(r.cand,BASE[SLOT]));
if(cur) console.log(`\n  current (${lbl(BASE[SLOT])}): ${cur.dev.toFixed(1)}  rank ${rows.indexOf(cur)+1}/${rows.length}`);
