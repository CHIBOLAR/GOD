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
import { FACTIONS } from "../sim/cards.mjs";
import { createGame, apply, botAction, view, legalActions, PHASE } from "./engine.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "public");
const PORT = Number(process.env.PORT ?? 3000);
const BOT_DELAY = Number(process.env.BOT_DELAY ?? 700);   // ms, so a bot turn is watchable
const REVEAL_HOLD = Number(process.env.REVEAL_HOLD ?? 4000);

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

  if (s.phase === PHASE.RESOLVED) {
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
  let room = null, seatIndex = -1;

  const fail = (msg) => send(ws, { t: "error", msg });

  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return fail("bad message"); }

    switch (m.t) {
      case "create": {
        room = newRoom();
        seatIndex = 0;
        room.seats.push({ id: randomUUID(), name: (m.name || "Player").slice(0, 16), ws, bot: false, faction: null });
        send(ws, { t: "seated", code: room.code, seat: 0, id: room.seats[0].id });
        broadcast(room);
        break;
      }

      case "join": {
        const r = rooms.get((m.code || "").toUpperCase());
        if (!r) return fail("no such table");
        // reconnect first: a returning player reclaims their own seat, mid-game included
        const back = m.id ? r.seats.findIndex((s) => s.id === m.id) : -1;
        if (back >= 0) {
          room = r; seatIndex = back; r.seats[back].ws = ws; r.seats[back].bot = false;
          send(ws, { t: "seated", code: r.code, seat: back, id: r.seats[back].id });
          if (r.started) send(ws, { t: "started", code: r.code });
          broadcast(r);
          break;
        }
        if (r.started) return fail("that game has already started");
        if (r.seats.length >= 8) return fail("table is full");
        room = r; seatIndex = r.seats.length;
        r.seats.push({ id: randomUUID(), name: (m.name || "Player").slice(0, 16), ws, bot: false, faction: null });
        send(ws, { t: "seated", code: r.code, seat: seatIndex, id: r.seats[seatIndex].id });
        broadcast(r);
        break;
      }

      case "pick": {
        if (!room || room.started) return fail("cannot change ruler now");
        if (takenFactions(room).has(m.faction)) return fail("someone has taken that ruler");
        if (!FACTIONS.some((f) => f.key === m.faction)) return fail("unknown ruler");
        room.seats[seatIndex].faction = m.faction;
        broadcast(room);
        break;
      }

      case "addBot": {
        if (!room || room.started) return fail("cannot add a bot now");
        if (room.seats.length >= 8) return fail("table is full");
        room.seats.push({ id: randomUUID(), name: `Bot ${room.seats.length}`, ws: null, bot: true, faction: null });
        broadcast(room);
        break;
      }

      case "removeSeat": {
        if (!room || room.started || seatIndex !== 0) return fail("only the host can do that");
        const s = room.seats[m.seat];
        if (!s || !s.bot) return fail("only bots can be removed");
        room.seats.splice(m.seat, 1);
        broadcast(room);
        break;
      }

      case "start": {
        if (!room || room.started) return fail("already started");
        if (seatIndex !== 0) return fail("only the host can start");
        if (room.seats.length < 2) return fail("needs at least two players");
        if (!room.seats[seatIndex].faction) return fail("choose your ruler first");
        startGame(room);
        break;
      }

      case "act": {
        if (!room || !room.started) return fail("no game running");
        const s = room.state;
        // the server re-derives legality; a client can never talk the engine into an illegal move
        const legal = legalActions(s, seatIndex);
        const ok = legal.some((a) => a.type === m.action?.type
          && (a.type !== "commit" || (a.uid === m.action.uid && a.army === m.action.army)));
        if (!ok) return fail("not a legal move right now");
        apply(s, seatIndex, m.action);
        step(room);
        break;
      }

      default: fail("unknown message");
    }
  });

  ws.on("close", () => {
    if (!room) return;
    const seat = room.seats[seatIndex];
    if (!seat) return;
    seat.ws = null;
    // Before the game starts, a leaver frees the seat. Mid-game the seat is KEPT so the player
    // can reclaim it with their id; the engine has no concept of an absent player, so a bot
    // plays the seat meanwhile and hands it straight back on reconnect.
    if (!room.started) {
      room.seats.splice(seatIndex, 1);
      if (!room.seats.length) { clearTimeout(room.timer); rooms.delete(room.code); return; }
    } else {
      seat.bot = true;
      step(room);
    }
    broadcast(room);
  });
});

http.listen(PORT, () => {
  console.log(`GOD — Gambit of Deccan`);
  console.log(`  listening on http://localhost:${PORT}`);
  console.log(`  ${FACTIONS.length} rulers · ${FACTIONS[0].units.length} units each`);
});
