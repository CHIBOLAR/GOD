// GOD — the multiplayer server.
//
// Static host + WebSocket hub + room manager. It owns seating, sockets, bots and reconnection;
// it owns NO rules. Every rule decision goes through web/engine.mjs, which goes through sim/.
//
//   local:   npm start          → http://localhost:3000
//   Render:  startCommand npm start, binds process.env.PORT

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";
import { FACTIONS, ARMS, ARMSTR, FORCE, BROKERS } from "../sim/cards.mjs";
import { createGame, apply, botAction, view, legalActions, PHASE } from "./engine.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "public");
const PORT = Number(process.env.PORT ?? 3000);
const BOT_DELAY = Number(process.env.BOT_DELAY ?? 700);   // ms, so a bot turn is watchable
// Long enough for the client's staged reveal to finish: one beat per cancellation (~340ms each,
// up to six), then the totals roll, then the point flare. Tapping skips it client-side.
const REVEAL_HOLD = Number(process.env.REVEAL_HOLD ?? 6500);

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
               ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };

// ---- static ------------------------------------------------------------------
const http = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/healthz") { res.writeHead(200).end("ok"); return; }
  // normalize() then reject any path that still climbs out of PUBLIC
  const rel = normalize(url.pathname).replace(/^([/\\])+/, "");
  const file = rel === "" ? "index.html" : rel;
  const full = join(PUBLIC, file);
  if (!full.startsWith(PUBLIC)) { res.writeHead(403).end("no"); return; }
  try {
    const body = await readFile(full);
    res.writeHead(200, { "content-type": MIME[extname(full)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    try {
      const body = await readFile(join(PUBLIC, "index.html"));   // SPA fallback
      res.writeHead(200, { "content-type": "text/html" }).end(body);
    } catch { res.writeHead(404).end("not found"); }
  }
});

// ---- rooms -------------------------------------------------------------------
const rooms = new Map();
// Everyone who is connected but not yet at a table: presence and a matchmaking queue.
const foyer = { queue: [] };
const ctx = new Map();          // ws -> { room, seat }; matchmaking must reach across sockets
const CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";           // no look-alikes
const code4 = () => Array.from({ length: 4 }, () => CODE[Math.floor(Math.random() * CODE.length)]).join("");

function newRoom() {
  let code; do { code = code4(); } while (rooms.has(code));
  const room = { code, seats: [], state: null, started: false, timer: null };
  rooms.set(code, room);
  return room;
}

const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };
const takenFactions = (room) => new Set(room.seats.map((s) => s.faction).filter(Boolean));
const freeFactions = (room) => FACTIONS.filter((f) => !takenFactions(room).has(f.key));

function lobbyOf(room) {
  return {
    t: "lobby", code: room.code, started: room.started,
    seats: room.seats.map((s, i) => ({
      i, name: s.name, bot: s.bot, faction: s.faction,
      ruler: s.faction ? FACTIONS.find((f) => f.key === s.faction).name : null,
      connected: s.bot || (s.ws && s.ws.readyState === 1),
    })),
    rulers: FACTIONS.map((f) => ({ key: f.key, name: f.name, era: f.era,
      taken: takenFactions(room).has(f.key) })),
  };
}

function pushFoyer() {
  const msg = {
    t: "foyer",
    online: [...ctx.keys()].filter((w) => w.readyState === 1).length,
    waiting: foyer.queue.length,
    tables: [...rooms.values()].filter((r) => !r.started)
      .map((r) => ({ code: r.code, seats: r.seats.length })),
    // onboarding is GENERATED from sim/cards.mjs and cannot drift from the game. The old
    // client hard-coded a copy of the card list and it went stale.
    ring: ARMS.map((a, i) => ({ arm: a, s: ARMSTR[i] })),
    force: FORCE.map((u) => ({ arm: u.arm, s: u.s })),
    brokers: BROKERS.map((b) => ({ name: b.name, arm: b.arm, s: b.s, when: b.when, text: b.text })),
  };
  for (const w of ctx.keys()) if (w.readyState === 1 && !ctx.get(w).room) send(w, msg);
}

function broadcast(room) {
  if (!room.started) { for (const s of room.seats) send(s.ws, lobbyOf(room)); return; }
  for (let i = 0; i < room.seats.length; i++) {
    const s = room.seats[i];
    if (!s.bot) send(s.ws, { t: "view", view: view(room.state, i) });
  }
}

// ---- the driver --------------------------------------------------------------
// Advances the game while nobody human has to decide. One scheduled step at a time, so a room
// can never end up with two timers racing each other.
function step(room) {
  clearTimeout(room.timer); room.timer = null;
  const s = room.state;
  if (!s || s.phase === PHASE.OVER) { broadcast(room); return; }

  if (s.phase === PHASE.CHARGE) {
    // ⚠️ THE FRONT RESUMES WHEN EVERYONE HAS ACTUALLY SEEN THE CHARGE, not on a fixed guess.
    // A charge takes 2.7–7.7s to play depending on the viewer's speed setting, so any single
    // hold is either too short for the slowest or dead air for the fastest. Each client reports
    // when its sequence ends; REVEAL_HOLD is only the backstop for a client that never does.
    room.watched = new Set();
    room.watching = s.lastCharge?.n ?? 0;
    room.timer = setTimeout(() => { apply(s, 0, { type: "continue" }); step(room); }, REVEAL_HOLD);
    broadcast(room);
    return;
  }

  const seat = s.toAct;
  const actor = room.seats[seat];
  if (actor && actor.bot) {
    room.timer = setTimeout(() => {
      const a = botAction(s, seat);
      if (a) apply(s, seat, a);
      step(room);
    }, BOT_DELAY);
  }
  broadcast(room);                       // humans see the board while the bot thinks
}

function startGame(room) {
  const free = freeFactions(room);
  for (const s of room.seats) {                       // bots take what is left, at random
    if (!s.faction) {
      const pick = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      s.faction = pick.key;
    }
  }
  room.state = createGame({
    factions: room.seats.map((s) => s.faction),
    names: room.seats.map((s) => s.name),
    seed: (Math.random() * 2 ** 32) >>> 0,
  });
  room.started = true;
  for (const s of room.seats) send(s.ws, { t: "started", code: room.code });
  step(room);
}

// ---- sockets -----------------------------------------------------------------
const wss = new WebSocketServer({ server: http });

wss.on("connection", (ws) => {
  const c = { room: null, seat: -1 };
  ctx.set(ws, c);
  pushFoyer();

  const fail = (msg) => send(ws, { t: "error", msg });

  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return fail("bad message"); }

    switch (m.t) {
      case "create": {
        c.room = newRoom();
        c.seat = 0;
        c.room.seats.push({ id: randomUUID(), name: (m.name || "Player").slice(0, 16), ws, bot: false, faction: null });
        send(ws, { t: "seated", code: c.room.code, seat: 0, id: c.room.seats[0].id });
        broadcast(c.room);
        break;
      }

      case "join": {
        const r = rooms.get((m.code || "").toUpperCase());
        if (!r) return fail("no such table");
        // reconnect first: a returning player reclaims their own seat, mid-game included
        const back = m.id ? r.seats.findIndex((s) => s.id === m.id) : -1;
        if (back >= 0) {
          c.room = r; c.seat = back; r.seats[back].ws = ws; r.seats[back].bot = false;
          send(ws, { t: "seated", code: r.code, seat: back, id: r.seats[back].id });
          if (r.started) send(ws, { t: "started", code: r.code });
          broadcast(r);
          break;
        }
        if (r.started) return fail("that game has already started");
        if (r.seats.length >= 8) return fail("table is full");
        c.room = r; c.seat = r.seats.length;
        r.seats.push({ id: randomUUID(), name: (m.name || "Player").slice(0, 16), ws, bot: false, faction: null });
        send(ws, { t: "seated", code: r.code, seat: c.seat, id: r.seats[c.seat].id });
        broadcast(r);
        break;
      }

      case "pick": {
        if (!c.room || c.room.started) return fail("cannot change ruler now");
        if (takenFactions(c.room).has(m.faction)) return fail("someone has taken that ruler");
        if (!FACTIONS.some((f) => f.key === m.faction)) return fail("unknown ruler");
        c.room.seats[c.seat].faction = m.faction;
        broadcast(c.room);
        break;
      }

      case "addBot": {
        if (!c.room || c.room.started) return fail("cannot add a bot now");
        if (c.room.seats.length >= 8) return fail("table is full");
        c.room.seats.push({ id: randomUUID(), name: `Bot ${c.room.seats.length}`, ws: null, bot: true, faction: null });
        broadcast(c.room);
        break;
      }

      case "removeSeat": {
        if (!c.room || c.room.started || c.seat !== 0) return fail("only the host can do that");
        const s = c.room.seats[m.seat];
        if (!s || !s.bot) return fail("only bots can be removed");
        c.room.seats.splice(m.seat, 1);
        broadcast(c.room);
        break;
      }

      case "start": {
        if (!c.room || c.room.started) return fail("already started");
        if (c.seat !== 0) return fail("only the host can start");
        if (c.room.seats.length < 2) return fail("needs at least two players");
        if (!c.room.seats[c.seat].faction) return fail("choose your ruler first");
        startGame(c.room);
        break;
      }

      // Matchmaking: sit in the foyer until enough people are waiting, then open a table for
      // them and fill any remaining seats with bots.
      case "quick": {
        ws.__name = (m.name || "Player").slice(0, 16);
        if (!foyer.queue.includes(ws)) foyer.queue.push(ws);
        pushFoyer();
        if (foyer.queue.length >= 2) {
          const take = foyer.queue.splice(0, Math.min(4, foyer.queue.length));
          const r = newRoom();
          take.forEach((sock, i) => {
            r.seats.push({ id: randomUUID(), name: sock.__name || `Player ${i + 1}`,
              ws: sock, bot: false, faction: null });
            send(sock, { t: "seated", code: r.code, seat: i, id: r.seats[i].id });
            const c = ctx.get(sock); if (c) { c.c.room = r; c.seat = i; }
          });
          broadcast(r);
          pushFoyer();
        }
        break;
      }

      case "unqueue": {
        foyer.queue = foyer.queue.filter((s) => s !== ws);
        pushFoyer();
        break;
      }

      // Not a player action — the client saying "my animation finished". See step().
      case "watched": {
        const r = c.room;
        if (!r || !r.state || r.state.phase !== PHASE.CHARGE) return;
        if (m.n !== r.watching) return;
        r.watched?.add(c.seat);
        const humans = r.seats.filter((x) => !x.bot && x.ws && x.ws.readyState === 1).length;
        if ((r.watched?.size ?? 0) >= humans) {
          clearTimeout(r.timer); r.timer = null;
          apply(r.state, 0, { type: "continue" });
          step(r);
        }
        return;
      }

      case "act": {
        if (!c.room || !c.room.started) return fail("no game running");
        const s = c.room.state;
        // the server re-derives legality; a client can never talk the engine into an illegal move
        const legal = legalActions(s, c.seat);
        // ⚠️ This used to guard on "commit", a verb from the game this engine replaced, so the
        // clause never fired and ANY uid/army was accepted as long as some deploy was legal.
        // Every field a client can choose is now matched against the legal action itself.
        const A = m.action || {};
        const ok = legal.some((a) => a.type === A.type && (
          a.type === "deploy"   ? a.uid === A.uid && a.army === A.army
          : a.type === "withdraw" ? a.card === A.card && a.army === A.army
          : a.type === "defect"   ? a.from === A.from && a.to === A.to
          : true));
        if (!ok) return fail("not a legal move right now");
        apply(s, c.seat, m.action);
        step(c.room);
        break;
      }

      default: fail("unknown message");
    }
  });

  ws.on("close", () => {
    foyer.queue = foyer.queue.filter((x) => x !== ws);
    ctx.delete(ws);
    pushFoyer();
    if (!c.room) return;
    const seat = c.room.seats[c.seat];
    if (!seat) return;
    seat.ws = null;
    // Before the game starts, a leaver frees the seat. Mid-game the seat is KEPT so the player
    // can reclaim it with their id; the engine has no concept of an absent player, so a bot
    // plays the seat meanwhile and hands it straight back on reconnect.
    if (!c.room.started) {
      c.room.seats.splice(c.seat, 1);
      if (!c.room.seats.length) { clearTimeout(c.room.timer); rooms.delete(c.room.code); return; }
    } else {
      seat.bot = true;
      step(c.room);
    }
    broadcast(c.room);
  });
});

http.listen(PORT, () => {
  console.log(`GOD — Gambit of Deccan`);
  console.log(`  listening on http://localhost:${PORT}`);
  console.log(`  ${FACTIONS.length} rulers · ${FACTIONS[0].units.length} units each`);
});
