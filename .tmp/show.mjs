import { FACTIONS, ARMS, ARMSTR } from "../sim/cards.mjs";
const N=(process.env.NAMES||"").split(",");
console.log("ruler".padEnd(10)+ARMS.map((a,i)=>`${a.slice(0,4)}${ARMSTR[i]}`.padStart(7)).join("")+"    raw");
FACTIONS.forEach((f,i)=>console.log((N[i]||f.key).padEnd(10)+ARMS.map(a=>String(f.counts[a]||0).padStart(7)).join("")+String(f.total).padStart(7)));
