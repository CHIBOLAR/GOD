// THE CHARGE SEQUENCE. Every duration here is measured, not chosen by feel.
//
//   U030  400ms in, 250ms out — exits are always shorter than entrances (NN/g)
//   U031  100–200ms per kill; it is the animation that fires most, so it is the shortest
//   U032  nothing exceeds 500ms, the documented "elegant → cumbersome" threshold
//   U033  ACCELERATE THROUGH THE MIDDLE, DECELERATE FOR THE FINISH — Hearthstone 31.6, shipped
//   U034  a unit that dies without killing gets a grey-out, never a flourish
//   U035  the sequence lands on the SUMMED TOTAL, not on the flips
//   U037  every step has a defined behaviour at every speed
//   U065  reduced motion jumps to the end state; it does not merely play slower

import { h, pip } from "./dom.mjs";

export const SPEEDS = [0.5, 1, 2, 4];                    // U076: four notches, not a toggle
export const speed = () => Number(localStorage.getItem("god.speed") || 1);
export const setSpeed = (x) => localStorage.setItem("god.speed", String(x));

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// The ramp. Kills 1–2 land at full weight, the middle compresses, the last one gets its moment.
function killMs(i, n) {
  if (n <= 3) return 200;
  if (i < 2) return 200;                                 // establish
  if (i >= n - 1) return 220;                            // the finish, deliberately slowest
  return 110;                                            // the middle, compressed
}

// Build the whole timeline up front so its total length is knowable — the server's REVEAL_HOLD
// has to be at least this long or a charge would be cut off mid-sequence.
export function timeline(reveal) {
  const n = reveal.kills.length;
  const steps = [{ step: "meet", ms: 400 }, { step: "reveal", ms: 500 }];
  for (let i = 0; i < n; i++) steps.push({ step: "kill", i, ms: killMs(i, n) });
  steps.push({ step: "tally", ms: 900 }, { step: "spoils", ms: 900 });
  return steps;
}

export const timelineMs = (reveal, mult = 1) =>
  timeline(reveal).reduce((t, s) => t + s.ms, 0) / mult;

// Drive the sequence. `onFrame` is called with {step, killIdx} every time the picture changes.
export function play(reveal, onFrame, onDone) {
  const steps = timeline(reveal);
  if (reduced()) {                                       // U065: straight to the end state
    onFrame({ step: "spoils", killIdx: reveal.kills.length });
    onDone();
    return () => {};
  }
  const mult = speed();
  let i = 0, timer = null, killIdx = 0;
  const tick = () => {
    if (i >= steps.length) { onDone(); return; }
    const s = steps[i++];
    if (s.step === "kill") killIdx = s.i + 1;
    onFrame({ step: s.step, killIdx });
    timer = setTimeout(tick, s.ms / mult);
  };
  tick();
  return () => clearTimeout(timer);                      // cancel if the view moves on
}

// ---- rendering ---------------------------------------------------------------
// The board during a charge is drawn from the BEFORE snapshot, with the dead greyed out one by
// one as the sequence advances. It is the same board, dying — not a separate screen.
export function chargeBoard(reveal, frame, players, cap) {
  const dead = new Set();
  for (let k = 0; k < frame.killIdx; k++) {
    const { hit } = reveal.kills[k];
    dead.add(`${hit.army}:${hit.slot}`);
  }
  const shown = frame.step === "meet" ? 0 : 1;           // face down until the reveal lands
  return h("div", { class: "chargeboard" }, reveal.before.map((army, ai) => {
    const total = army.reduce((n, u, ui) =>
      n + (dead.has(`${ai}:${ui}`) ? 0 : u.s), 0);
    const slots = [];
    for (let i = 0; i < cap; i++) {
      const u = army[i];
      const isDead = dead.has(`${ai}:${i}`);
      slots.push(h("div", { class: "slot" + (u ? " filled" : "") + (isDead ? " struck" : "") },
        u ? pip(shown ? u : { owner: u.owner, claim: u.claim }, players, { dead: isDead }) : null));
    }
    return h("div", {},
      h("div", { class: "armyhead caps" },
        h("span", { style: "color:var(--parch)" }, `ARMY ${ai === 0 ? "I" : "II"}`),
        // U035: this number is what the whole sequence is building towards, so it is never
        // hidden and it never appears only at the end — it counts down as the dead fall.
        h("span", { class: "tot mono", style: frame.step === "tally" || frame.step === "spoils"
          ? "color:var(--gold);font-size:19px" : "" }, `str ${total}`)),
      h("div", { class: "slots" }, slots));
  }));
}

export function chargeCaption(reveal, frame, players) {
  const nm = (i) => players[i]?.name ?? "";
  if (frame.step === "meet")   return ["THE ARMIES MEET", ""];
  if (frame.step === "reveal") return ["REVEAL", "every face-down unit turns over"];
  if (frame.step === "kill") {
    const k = reveal.kills[frame.killIdx - 1];
    if (!k) return ["", ""];
    return [`${k.by.arm} ${k.by.s} KILLS ${k.hit.arm} ${k.hit.s}`,
            `${nm(k.by.owner)} cuts down ${nm(k.hit.owner)}`];
  }
  if (frame.step === "tally") {
    const v = reveal.victors;                 // army index, or -1 when strength is level
    if (v < 0) return ["LEVEL", "neither side takes the charge"];
    return [`ARMY ${v === 0 ? "I" : "II"} TAKES THE CHARGE`,
            `${reveal.totals[v]} against ${reveal.totals[1 - v]}`];
  }
  if (frame.step === "spoils") {
    if (!reveal.scored.length) return ["NOBODY SCORES", "the charge fell on nothing"];
    return ["THE SPOILS",
      reveal.scored.map(([p, v]) => `${nm(p)} +${v}`).join("   ")];
  }
  return ["", ""];
}
