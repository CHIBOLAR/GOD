# DECCAN II

A physical card game for **2–8 players**. Two armies form on one piece of ground, three fronts
wide. You do not command an army — you put units *into* one, and it pays out to whoever actually
won the fighting.

This repository holds the **design**: the rulebook, the card list, and the simulation used to
balance them. There is no app.

**The whole game in four lines.** Commit units face down onto Van, Centre or Rear. HORSE rides
down GUNS, GUNS break FOOT, FOOT holds HORSE — a countered unit loses whatever its strength;
otherwise the bigger number wins the front. More fronts takes the ground. You score one point per
front *you* won, and every unit you commit is gone for good.

---

## Where the canon lives

| | |
| --- | --- |
| `rules/RULEBOOK.md` | **The** rulebook. There is only ever one, and it carries no version number — git is the versioning. |
| `rules/PLAYER_AID.md` | One page, both sides. |
| `rules/CARDS.md` | **Generated.** Never hand-edit it; edit `sim/cards.mjs` and run `npm run cards`. |
| `design/BRIEF.md` | What this game must be. Locked. |
| `design/DECISIONS.md` | Every ruling, dated, with the reason and the number behind it. |
| `design/OPEN.md` | Questions not yet ruled on. |
| `design/LESSONS.md` | Measured findings inherited from the previous DECCAN. Read before designing or pricing a card. |

## The simulation

Plain Node ESM. No dependencies.

```bash
npm run cards   # regenerate rules/CARDS.md from sim/cards.mjs
npm run rr      # exhaustive army round-robin: rankings, per-card value, ceiling checks
npm run seats   # whole-game simulation; seat fairness at 2/4/6/8
npm run gates   # every balance gate. exit 0 means the design holds
```

`sim/battle.mjs` is a **pure** resolver and is the only implementation of the rules. The
round-robin and the whole-game simulation both call it, so they cannot drift apart.

## Balance gates

Defined before the cards were tuned, so they cannot be moved to fit a result. `npm run gates`
runs all of them and exits non-zero on any hard failure.

| Gate | Pass | Hard fail | Measured |
| --- | --- | --- | ---: |
| Faction chassis intact | 0 problems | any | **0** |
| Faction spread (VP/battle) | ≤ 0.10 | > 0.25 | **0.016** |
| Worst single faction matchup | ≤ 0.20 | > 0.40 | **0.069** |
| Card-value spread within a faction | ≤ 20 | > 30 | **15.3** |
| Weakest army size, at its best | ≥ 5% | < 2% | **12.6%** |
| Draw rate — a draw wastes a round, so low is good | ≤ 10% | > 15% | **1.9%** |
| Seat-position deviation, 2–8p | ≤ 5 | > 10 | **3.9** |
| Faction deviation in play, 2–8p | ≤ 5 | > 10 | **4.7** |
| Game length | 4–10 rounds | <3 or >14 | **4.4 – 8.5** |
| Games decided on the target | ≥ 80% | < 60% | **81%** |

**Exception budget** — the answer to "too many exceptions to teach":

| | Previous DECCAN | Budget | This game |
| --- | ---: | ---: | ---: |
| Glossary terms | 19 | ≤ 10 | **9** |
| Exception marks | 6 | ≤ 2 | **0** |
| Rulebook lines | ~300 | ≤ 150 | **127** |

## The previous DECCAN

Archived at `OneDrive/Desktop/deccan` — ~30 versions, July–August 2026. It is research, not a
starting point. Two things were carried forward: the measured findings in `design/LESSONS.md`,
and the round-robin harness. Nothing else.
