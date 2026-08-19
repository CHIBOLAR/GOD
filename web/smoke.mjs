// End-to-end smoke test over the REAL wire: spawns a server on a free port, plays a whole game
// as a human against bots, and asserts the client's contract holds.
//
// ⚠️ It picks a random high port and the server now refuses to start on a busy one, so this can
// never silently test an orphaned process from an earlier run. That mistake cost two real bugs.
import { spawn } from "node:child_process";
import { WebSocket } from "ws";

const PORT = 8200 + Math.floor(Math.random() * 700);
const srv = spawn(process.execPath, ["web/server.mjs"],
  { env: { ...process.env, PORT: String(PORT), REVEAL_HOLD: "20000" }, stdio: ["ignore", "pipe", "pipe"] });
let srvErr = "";
srv.stderr.on("data", (d) => { srvErr += d; });

const die = (msg) => {
  console.log(`  FAIL — ${msg}`);
  if (srvErr.trim()) console.log(srvErr.trim().split("\n").slice(0, 6).map(l => "    " + l).join("\n"));
  srv.kill(); process.exit(1);
};

await new Promise((r) => srv.stdout.once("data", r));      // wait for "listening"
const W = new WebSocket(`ws://localhost:${PORT}`);
const say = (m) => W.send(JSON.stringify(m));
const T0 = Date.now();
let started = false, acted = 0, charges = 0;
const seen = { alliance: 0, command: 0, defect: 0, recruit: 0, kill: 0 };
let hiN = 0;

W.on("open", () => say({ t: "create" }));
W.on("message", (raw) => {
  const m = JSON.parse(raw);
  if (m.t === "error")  return die(`server said: ${m.msg}`);
  if (m.t === "seated") return say({ t: "pick", faction: "sultan" });
  if (m.t === "lobby" && !m.started) {
    if (started) return;
    if (m.seats.length < 4) return say({ t: "addBot" });
    started = true; return say({ t: "start" });
  }
  if (m.t !== "view") return;
  const v = m.view;
  if (process.env.DEBUG) console.log(`    view phase=${v.phase} toAct=${v.toAct} you=${v.you} charge=${v.charge} acts=${v.actions.length}`);

  for (const e of v.log || []) {
    if (!e.n || e.n <= hiN) continue;
    hiN = e.n;
    if (seen[e.kind] !== undefined) seen[e.kind]++;
    if (e.kind !== "info" && !e.text) die(`event ${e.kind} has no text`);
  }
  // the client contract: every field app.mjs reads must exist
  for (const k of ["you","charge","target","cap","phase","toAct","armies","players","hand","actions","supplyLeft"])
    if (v[k] === undefined) die(`view is missing ${k}`);
  if (v.actions.some((a) => a.type === "commit")) die("dead verb 'commit' is back in legalActions");

  if (v.end) {
    const ok = charges > 0 && seen.kill > 0 && v.winners.length > 0;
    console.log(`  ${Date.now() - T0}ms · ${acted} actions · ${charges} charges · ${seen.kill} kills`);
    console.log(`  moments: alliance ${seen.alliance} · command ${seen.command} · ` +
                `defect ${seen.defect} · market ${seen.recruit}`);
    if (!ok) die("game ended without a real fight");
    console.log("  PASS — playable end to end over the real wire");
    srv.kill(); process.exit(0);
  }
  if (v.phase === "charge" && v.reveal) {
    if (v.reveal.victors === undefined) die("reveal has no victors");
    if (!Array.isArray(v.reveal.totals)) die("reveal has no totals");
    charges++;
    return say({ t: "watched", n: v.reveal.n });          // paced by the viewer, not a clock
  }
  if (v.phase !== "play" || v.toAct !== v.you) return;
  const acts = v.actions.filter((a) => !a.internal);
  if (!acts.length) return die("no legal action on our own turn");
  // ⚠️ Play like a player, not like a deploy bot. A human who NEVER charges holds the game open
  // indefinitely now that the winning side takes the initiative, so this alternates: build for
  // two turns, then commit. An always-deploy policy made this test hang and looked like an
  // engine stall when it was the test's own strategy.
  const dep = acts.find((a) => a.type === "deploy");
  const chg = acts.find((a) => a.type === "charge");
  const a = (chg && acted % 3 === 2) ? chg
          : dep ? { ...dep, claim: ["ELEPHANT", "CANNON", null][acted % 3] }
          : chg || acts[0];
  acted++;
  say({ t: "act", action: a });
});
setTimeout(() => die("timed out after 100s"), 45000);
