// Tiny DOM helper and the shared vocabulary of the board. No game logic lives here.

export const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
};

export const ARMS = ["ELEPHANT", "RIFLEMAN", "CANNON", "HORSEMAN", "WARRIOR"];
export const STRENGTH = { ELEPHANT: 9, RIFLEMAN: 3, CANNON: 7, HORSEMAN: 5, WARRIOR: 1 };
const CLS = { ELEPHANT: "elephant", RIFLEMAN: "rifleman", CANNON: "cannon",
              HORSEMAN: "horseman", WARRIOR: "warrior" };

// A unit on the ground. Face-down shows only its owner and whatever they CLAIMED it was —
// which is the bluff, sitting on the board where the bet was made (U026).
export function pip(card, players, opts = {}) {
  const known = card.arm !== undefined;
  const cls = ["pip", known ? CLS[card.arm] : "hidden", card.broker ? "broker" : null]
    .filter(Boolean).join(" ");
  return h("div", { class: "unit" + (opts.dead ? " dead" : "") },
    h("div", { class: cls, title: known ? `${card.arm} ${card.s}` : "face down" },
      known ? String(card.s) : "?"),
    h("div", { class: "owner" }, players[card.owner]?.name ?? ""),
    card.claim ? h("div", { class: "said" }, `"${card.claim.slice(0, 4)}"`) : null,
  );
}

// U011 — the ring never leaves the screen. It is the entire game and it is five arrows.
export const ring = () =>
  h("div", { class: "ring caps" },
    ARMS.map((a, i) => [
      h("span", { style: "color:var(--text-soft)" }, `${a[0]}${STRENGTH[a]}`),
      i < 4 ? h("span", {}, "→") : h("span", { title: "back to Elephant" }, "⟲"),
    ]).flat());
