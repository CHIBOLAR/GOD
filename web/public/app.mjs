// GOD — client. The server's view() is the only authority (U083); this file renders it and
// sends the five verbs a PLAYER has: deploy, withdraw, defect, charge, hold. ("continue" is an
// engine tick the server fires on a timer after a charge — never a button.) Nothing here
// computes game state.

import { h, ARMS, pip, ring } from "./view/dom.mjs";
import { play, chargeBoard, chargeCaption, SPEEDS, speed, setSpeed } from "./view/charge.mjs";

const app = document.getElementById("app");
const S = {
  ws: null, screen: "foyer", err: "", code: null, seat: null,
  lobby: null, v: null, foyer: null,
  step: null,       // null | "army" | "unit" | "claim" — the deploy funnel
  sel: null,        // uid of the hand unit being deployed
  army: null,       // which army it is going into
  seen: 0,          // highest log sequence already staged
  queue: [],        // moments waiting to be shown
  showing: null,
  frame: null,      // the charge sequence's current picture
  playing: 0,       // reveal.n currently being played
  cancel: null,
};

// ---- transport ---------------------------------------------------------------
function connect() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}`);
  S.ws = ws;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.t === "error")   { S.err = m.msg; render(); return; }
    if (m.t === "foyer")   { S.foyer = m; if (S.screen === "foyer") render(); return; }
    if (m.t === "seated")  { S.code = m.code; S.seat = m.seat; S.screen = "lobby"; render(); return; }
    if (m.t === "lobby")   { S.lobby = m; S.screen = m.started ? "game" : "lobby"; render(); return; }
    if (m.t === "started") { S.screen = "game"; render(); return; }
    if (m.t === "view")    { S.v = m.view; S.screen = "game"; harvest(); startCharge(); render(); return; }
  };
  ws.onclose = () => { S.err = "connection lost — reconnecting"; render(); setTimeout(connect, 1500); };
}
const send = (msg) => { S.err = ""; S.ws?.readyState === 1 && S.ws.send(JSON.stringify(msg)); };
const act = (action) => { S.step = null; S.sel = null; S.army = null; send({ t: "act", action }); };
const reset = () => { S.step = null; S.sel = null; S.army = null; render(); };

// ---- staged moments ----------------------------------------------------------
// The log box is gone (U041). Its contents become full-screen moments the table watches.
// Only three kinds earn the whole screen: a declaration, an alliance, a betrayal.
const STAGED = { alliance: 1, defect: 1, command: 1, recruit: 1 };

function harvest() {
  for (const e of S.v.log || []) {
    if (!e.n || e.n <= S.seen) continue;
    S.seen = e.n;
    if (STAGED[e.kind]) S.queue.push(e);
  }
  if (!S.showing) next();
}

function next() {
  S.showing = S.queue.shift() || null;
  if (!S.showing) return;
  const hold = S.showing.kind === "defect" ? 1700 : 1300;
  setTimeout(() => {
    const el = document.querySelector(".moment");
    if (el) el.classList.add("out");                    // U030: exits shorter than entrances
    setTimeout(() => { next(); render(); }, 250);
  }, hold);
}

function moment() {
  const e = S.showing;
  if (!e) return null;
  const nm = (i) => S.v.players[i]?.name ?? "";
  const kind = e.kind === "defect" ? "betray" : e.kind === "alliance" ? "ally" : "";
  let who = "", verb = "", what = "";
  if (e.kind === "alliance") {
    who = nm(e.data.joined); verb = "joins the alliance led by"; what = nm(e.data.leader);
  } else if (e.kind === "defect") {
    who = nm(e.data.seat);
    verb = e.data.betrayed !== null && e.data.betrayed !== e.data.seat ? "abandons" : "crosses to";
    what = e.data.betrayed !== null && e.data.betrayed !== e.data.seat
      ? nm(e.data.betrayed) : `Army ${S.v.armies[e.data.to].name}`;
  } else if (e.kind === "command") {
    who = nm(e.data.leader);
    verb = e.data.reason === "raised" ? "raises" : "takes command of";
    what = `Army ${S.v.armies[e.data.army].name}`;
  } else if (e.kind === "recruit") {
    who = nm(e.data.seat); verb = "takes from the market"; what = e.text.split("takes the ")[1] || "a Power Broker";
  }
  // their whole army behind the banner — the read is the point (U025)
  const theirs = S.v.armies.flatMap((a) => a.units.filter((u) => u.owner === (e.data.joined ?? e.data.seat ?? e.data.leader)));
  return h("div", { class: `moment ${kind}` },
    h("div", {},
      h("div", { class: "who" }, who.toUpperCase()),
      h("div", { class: "verb" }, verb),
      h("div", { class: "what" }, what.toUpperCase()),
      theirs.length ? h("div", { class: "rule" }) : null,
      theirs.length ? h("div", { class: "army" }, theirs.map((u) => pip(u, S.v.players))) : null,
    ));
}

// ---- the charge ---------------------------------------------------------------
function startCharge() {
  const r = S.v.reveal;
  if (S.v.phase !== "charge" || !r || r.n === S.playing) {
    if (S.v.phase !== "charge" && S.frame) { S.cancel?.(); S.frame = null; }
    return;
  }
  S.playing = r.n;
  S.cancel?.();
  S.cancel = play(r, (f) => { S.frame = f; render(); }, () => {
    S.cancel = null;
    // tell the server we have actually watched it — this is what carries the game on, not a
    // button and not a fixed timer (see server.mjs step()).
    send({ t: "watched", n: r.n });
  });
}

// ---- screens -----------------------------------------------------------------
function foyer() {
  return h("div", { class: "pad" },
    h("h1", {}, "GOD"),
    h("p", { class: "sub" }, "Gambit of Deccan — two armies, one ground, and nobody wins it."),
    h("div", { class: "acts" },
      h("button", { class: "go", onclick: () => send({ t: "quick" }) }, "QUICK TABLE"),
      h("button", { onclick: () => send({ t: "create" }) }, "NEW TABLE")),
    h("div", { class: "acts" },
      h("input", { id: "code", placeholder: "table code",
        style: "flex:1;min-height:44px;background:var(--ink-3);border:1px solid var(--edge);color:var(--text);border-radius:3px;padding:0 12px;font-family:inherit" }),
      h("button", { onclick: () => send({ t: "join", code: document.getElementById("code").value.trim().toUpperCase() }) }, "JOIN")),
    S.foyer ? h("p", { class: "sub caps" }, `${S.foyer.online} online · ${S.foyer.tables.length} tables open`) : null,
    h("p", { class: "err" }, S.err));
}

function lobby() {
  const L = S.lobby;
  if (!L) return h("div", { class: "pad" }, "…");
  const mine = L.seats[S.seat]?.faction;
  return h("div", { class: "pad" },
    h("h1", {}, "TABLE ", L.code),
    h("p", { class: "sub" }, "Pick a ruler. Bots take whatever is left."),
    h("div", { class: "rulers" }, L.rulers.map((r) =>
      h("button", {
        class: "ruler" + (r.taken && r.key !== mine ? " taken" : "") + (r.key === mine ? " mine" : ""),
        disabled: r.taken && r.key !== mine,
        onclick: () => send({ t: "pick", faction: r.key }),
      }, h("div", { class: "n" }, r.name), h("div", { class: "e" }, r.era || "")))),
    h("div", { class: "acts" },
      h("button", { onclick: () => send({ t: "addBot" }) }, "ADD BOT"),
      h("button", { class: "go", disabled: L.seats.length < 2, onclick: () => send({ t: "start" }) }, "START")),
    h("p", { class: "sub caps" }, L.seats.map((s) => `${s.ruler || "unpicked"}${s.bot ? " (bot)" : ""}`).join(" · ")),
    h("p", { class: "err" }, S.err));
}

// ---- the game ----------------------------------------------------------------
const legal = (type) => (S.v.actions || []).filter((a) => a.type === type);

function seats() {
  return h("div", { class: "seats" }, S.v.players.map((p) => {
    // This round's declarations, on the seat — never in a log (U017).
    // ⚠️ NOT STAMPED true or false. The claim is on the seat and the revealed unit is on the
    // board; catching the lie is the player's job. Marking it would be tracking by another name,
    // and bluffs here are round-relevant only.
    const said = S.v.armies.flatMap((a) => a.units)
      .filter((u) => u.owner === p.seat && u.claim)
      .map((u) => h("span", { class: "claim" }, u.claim.slice(0, 4)));
    return h("div", {
      class: "seat" + (p.seat === S.v.you ? " you" : "") + (p.seat === S.v.toAct ? " onturn" : ""),
    },
      h("div", { class: "nm" }, p.name),
      h("div", { class: "sub caps" },
        h("span", { class: "vp" }, `${p.vp}vp`), " · ",
        `${p.inHand} held`, p.recovering ? ` · ${p.recovering}⏳` : ""),
      h("div", { class: "claims" }, said));
  }));
}

function armyBlock(a) {
  const total = a.units.reduce((n, u) => n + (u.s || 0), 0);
  const slots = [];
  for (let i = 0; i < S.v.cap; i++) {
    const u = a.units[i];
    slots.push(h("div", { class: "slot" + (u ? " filled" : "") }, u ? pip(u, S.v.players) : null));
  }
  return h("div", {},
    h("div", { class: "armyhead caps" },
      h("span", { style: "color:var(--parch)" }, `ARMY ${a.name}`),
      a.leader !== null ? h("span", { class: "who" }, `led by ${S.v.players[a.leader].name}`) : null,
      // U012: the tally is on screen throughout, so the charge resolves a number you watched
      h("span", { class: "tot mono" }, `str ${total}`)),
    h("div", { class: "slots" }, slots));
}

function hand() {
  const picking = S.step === "unit";
  const offered = new Set(legal("deploy").filter((a) => a.army === S.army).map((a) => a.uid));
  const mine = S.v.hand.filter((u) => u.state === "ready" || u.state === "recovering");
  return h("div", { class: "hand" }, mine.map((u) => {
    const rec = u.state === "recovering";
    const takeable = picking && offered.has(u.uid) && !rec;
    return h("div", {
      class: "card" + (u.broker ? " isbroker" : "") + (S.sel === u.uid ? " sel" : "")
        + (rec || (picking && !takeable) ? " locked" : ""),
      onclick: () => { if (takeable) { S.sel = u.uid; S.step = "claim"; render(); } },
    },
      h("div", { class: "mono", style: "font-size:17px" }, u.s),
      h("div", { class: "lbl" }, u.broker ? u.name : u.arm),
      // U053/U054: broker text is ON the card. Never a hover, never 7.5px.
      u.broker ? h("div", { class: "txt" }, u.text) : null,
      rec ? h("div", { class: "lbl" }, `recovering ${u.readyIn}`) : null);
  }));
}


// WHERE YOU SEND A UNIT IS THE POLITICAL ACT OF THIS GAME, so the choice gets the whole screen
// and shows what you are actually choosing between: not "Army I or II" but WHO you are standing
// beside, what they have killed, and what they have claimed to be holding.
function side(a, joinable) {
  const total = a.units.reduce((n, u) => n + (u.s || 0), 0);
  const roster = a.members.map((seat) => {
    const p = S.v.players[seat];
    const theirs = a.units.filter((u) => u.owner === seat);
    return h("div", { class: "member" + (a.leader === seat ? " lead" : "") },
      h("div", { class: "who" },
        h("b", {}, p.name),
        a.leader === seat ? h("span", { class: "caps", style: "color:var(--gold)" }, "senior") : null,
        h("span", { class: "kills caps" }, `${p.kills} killed`)),
      h("div", { class: "pips" }, theirs.map((u) => {
        const known = u.arm !== undefined;
        const cls = "mini pip " + (known ? u.arm.toLowerCase() : "hidden");
        return h("div", { class: cls, title: u.claim ? `claimed ${u.claim}` : "" },
          known ? u.s : "?");
      })),
      // what they SAID — the read you are buying by standing next to them
      theirs.some((u) => u.claim)
        ? h("div", { class: "claims" }, theirs.filter((u) => u.claim).map((u) =>
            h("span", { class: "claim" }, u.claim.slice(0, 4))))
        : h("div", { class: "caps", style: "color:var(--text-faint)" }, "said nothing"));
  });
  return h("button", { class: "side", disabled: !joinable,
      onclick: () => { if (joinable) { S.army = a.index; S.step = "unit"; render(); } } },
    h("div", {},
      h("div", { class: "nm" }, `ARMY ${a.name}`),
      h("div", { class: "caps str" }, `strength ${total} · ${a.count}/${S.v.cap} slots`)),
    roster.length ? h("div", { class: "roster" }, roster)
                  : h("div", { class: "empty" }, "empty ground — take command of it"));
}

function chooseArmy() {
  const armies = new Set(legal("deploy").map((a) => a.army));
  return h("div", { class: "choose" },
    h("div", { class: "caps" }, "where do you send it"),
    h("div", { class: "sides" }, S.v.armies.map((a) => side(a, armies.has(a.index)))),
    h("div", { class: "acts" }, h("button", { onclick: reset }, "BACK")));
}

function actions() {
  const yours = S.v.phase === "play" && S.v.toAct === S.v.you;

  // A charge is watched, not clicked. The server ticks past it on a timer once everyone has
  // had time to see it, so there is no button here and never should be.
  if (S.v.phase === "charge") {
    return h("div", { class: "acts" }, h("button", { disabled: true }, "THE ARMIES MEET"));
  }
  if (!yours) return h("div", { class: "acts" },
    h("button", { disabled: true }, `${S.v.players[S.v.toAct]?.name ?? ""} is deciding`));

  const back = h("button", { onclick: reset }, "BACK");
  const deploys = legal("deploy");

  // 2 — WHERE. U049: never prompt for a choice that changes nothing. With one army legal (and
  // your units may never split, so usually there is), we skip straight past it.
  if (S.step === "army") return h("div", { class: "acts" }, back);   // the screen is drawn above
  // 3 — WHO. handled by hand(); the bar just says so and offers a way out.
  if (S.step === "unit") {
    return h("div", { class: "acts" },
      h("button", { disabled: true }, `INTO ARMY ${S.v.armies[S.army].name} — PICK A UNIT`),
      back);
  }
  // 4 — WHAT YOU SAY. A declaration is part of deploying, not its own turn (U024).
  if (S.step === "claim") {
    return h("div", { class: "acts", style: "flex-wrap:wrap" },
      ARMS.map((a) => h("button", { style: "flex:1 1 30%",
        onclick: () => act({ type: "deploy", uid: S.sel, army: S.army, claim: a }) },
        `SAY ${a.slice(0, 4)}`)),
      h("button", { style: "flex:1 1 30%", class: "warn",
        onclick: () => act({ type: "deploy", uid: S.sel, army: S.army, claim: null }) }, "SAY NOTHING"),
      h("button", { style: "flex:1 1 30%", onclick: reset }, "BACK"));
  }

  // 1 — the five things a player may do.
  const w = legal("withdraw"), d = legal("defect"), c = legal("charge");
  return h("div", { class: "acts" },
    h("button", { class: "go", disabled: !deploys.length, onclick: () => {
      const armies = [...new Set(deploys.map((a) => a.army))];
      if (armies.length === 1) { S.army = armies[0]; S.step = "unit"; }   // U044, visibly
      else S.step = "army";
      render();
    } }, "DEPLOY"),
    h("button", { disabled: !w.length,
      onclick: () => act({ type: "withdraw", card: w[0].card, army: w[0].army }) }, "WITHDRAW"),
    h("button", { class: "warn", disabled: !d.length,
      onclick: () => act({ type: "defect", from: d[0].from, to: d[0].to }) }, "DEFECT"),
    h("button", { class: "go", disabled: !c.length, onclick: () => act({ type: "charge" }) }, "CHARGE"),
    h("button", { onclick: () => act({ type: "hold" }) }, "HOLD"));
}

function game() {
  const v = S.v;
  if (!v) return h("div", { class: "pad" }, "…");
  const you = v.players[v.you];
  return h("div", { style: "display:flex;flex-direction:column;min-height:100%" },
    h("div", { class: "bar" },
      h("span", { class: "brand" }, "GOD"),
      h("span", { class: "stat caps" }, "charge ", h("b", {}, v.charge)),
      h("span", { class: "spacer" }),
      h("span", { class: "stat caps" }, "you ", h("b", { class: "mono" }, `${you.vp}/${v.target}`)),
      h("span", { class: "stat caps" }, "supply ", h("b", { class: "mono" }, v.supplyLeft)),
      h("button", { class: "caps", style: "flex:0 0 auto;min-height:30px;padding:0 8px",
        title: "how fast a charge plays",
        onclick: () => { const i = SPEEDS.indexOf(speed());
          setSpeed(SPEEDS[(i + 1) % SPEEDS.length]); render(); } }, `${speed()}×`)),
    seats(),
    v.phase === "charge" && v.reveal && S.frame
      ? h("div", { class: "ground" },
          (() => { const [big, small] = chargeCaption(v.reveal, S.frame, v.players);
            return h("div", { class: "shout" },
              h("div", { class: "big" }, big), h("div", { class: "small" }, small)); })(),
          chargeBoard(v.reveal, S.frame, v.players, v.cap))
      : h("div", { class: "ground" },
          armyBlock(v.armies[0]),
          ring(),
          armyBlock(v.armies[1])),
    h("div", { class: "handwrap" }, hand()),
    actions(),
    S.err ? h("p", { class: "err pad" }, S.err) : null,
    S.step === "army" ? chooseArmy() : null,
    v.end ? h("div", { class: "moment" }, h("div", {},
      h("div", { class: "who" }, "THE WAR IS OVER"),
      h("div", { class: "what" }, v.winners.map((i) => v.players[i].name).join(" & ").toUpperCase()))) : null);
}

// ---- render ------------------------------------------------------------------
function render() {
  app.replaceChildren(
    S.screen === "foyer" ? foyer() : S.screen === "lobby" ? lobby() : game(),
    moment() || document.createComment(""),
  );
}

connect();
render();
