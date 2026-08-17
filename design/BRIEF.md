# THE BRIEF

*Locked 2026-08-17. Changes to this file are decisions and belong in `DECISIONS.md` first.*

DECCAN II is a **complete redesign**. The previous game (archived at
`OneDrive/Desktop/deccan`, ~30 versions, July–August 2026) is research, not a starting point.

---

## What this project produces

A **physical card game**: one rulebook, one player aid, one card list.

There is **no app**. Code exists in this repo for exactly one purpose — to simulate and balance
the design. No client, no server, no lobby, no bots-as-opponents.

---

## The three problems the redesign must solve

The old game works. These are why it is being replaced.

### 1. Too many exceptions to teach

The Law of DECCAN needs **19 glossary terms** and **6 exception marks** to stay coherent:
PAIRED, ALONE, lone-army immunity, fizzle, targets-locked-at-reveal, ascending-printed-strength
resolution order, only-one-Commander-copies, senior ally. Every one was added to patch a specific
hole found in play or in measurement. The game cannot be taught in five minutes.

### 2. Balance never converged

Thirty versions, and in every one a single card dominated. Every fix moved the crown rather than
removing it. The final measured state of the old canon:

> Cannon **+38.8** card value. **All 50 of the top 50 armies contain one.** Best Cannon-free army
> ranks **62nd of 363**. The whole best-to-worst spread of the previous version was 27.5; the
> Cannon alone opened 47.7.

### 3. The social layer is thin

Claims and bluffing were designed, built and measured (v25), then deleted in the reset.
Alliances last one battle and rarely bind. Face-down deploy is the only hidden information left,
and there is nothing at the table to read.

---

## What is non-negotiable

| Kept | |
| --- | --- |
| **Name and theme** | DECCAN. The Deccan plateau, Maratha-era armies, the unit flavour. |
| **Two armies contest one ground** | Players commit units into one of two opposing armies. Both reveal. One side takes the ground. |
| **Alliances and betrayal** | Multiple players in one army, sharing a win unequally. The negotiation layer is what makes this a social game rather than an arithmetic puzzle. |

## What is being replaced

| Replaced | With |
| --- | --- |
| **The symmetric economy** — everyone holds an identical 7-card Force, winners draw from a shared supply of 20 Power Brokers | **Asymmetric starts.** Each player takes a faction with its own units. |

## Shape

| | |
| --- | --- |
| **Players** | **2–8** |
| Length | ~30–45 min *(assumption — the user specified player count only; confirm in play)* |
| Weight | Medium-light. A rulebook, not a Law. |
| Victory | A race to a fixed victory-point target *(carried from the old game; open to change)* |

## Seat policy

**Sitting out is a real choice.** With 2–8 players and only two armies, most of an 8-seat table
would otherwise watch. Not everyone commits every round — and the round you skip must *buy* you
something. Downtime has to feel like plotting, not waiting.

---

## Carried over from the old project

Two things only:

1. **The measured balance findings** — see `LESSONS.md`. Expensive, and costly to re-derive.
2. **The round-robin harness** — `v1-rr.mjs`, reused as the skeleton of `sim/rr.mjs`.

Nothing else. No cards, no rules, no code, no numbers.

---

## The known risk

Asymmetric factions multiply the balance surface (factions × matchups × seat counts) in a project
whose stated failure is that balance never converged with a *symmetric* twelve-card set.

**The guard is constrained asymmetry:** every faction shares a chassis — same number of units,
same total printed strength, same slot costs — and differs on exactly one axis. This keeps the
exhaustive round-robin tractable, keeps seat fairness provable at 8, and keeps the cost of a
faction being wrong down to a single card.

**The fallback, if factions cannot be levelled:** a symmetric core set plus one asymmetric leader
card per player. Same identity payoff, a fraction of the surface.
