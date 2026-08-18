# DECCAN

A physical card game for **2–8 players**, in **79 cards**. Two armies form on one piece of
ground; the players decide who fights in them, and the losers get the better cards.

This repository holds the **design**: the rulebook, the card list, and the simulation used to
balance them. There is no app.

**The whole game in four lines.** Commit units face down into one of two armies. Every unit
cancels one enemy unit of an arm it beats — a Warrior 1 cancels an Elephant 9 — and a cancelled
unit adds nothing and does nothing. The higher surviving total takes the ground. Win and your
units come home; **lose and you recruit a Power Broker**, which is the only way anyone ever gets
one.

## Where the canon lives

| | |
| --- | --- |
| `rules/RULEBOOK.md` | **The** rulebook. One file, no version number — git is the versioning. |
| `rules/PLAYER_AID.md` | One page, both sides. |
| `rules/CARDS.md` | **Generated.** Edit `sim/cards.mjs` and run `npm run cards`. |
| `design/DECISIONS.md` | Every ruling, dated, with the number behind it. |
| `design/OPEN.md` | What is still unanswered, and what only a table can answer. |
| `design/LESSONS.md` | Measured findings inherited from the previous DECCAN. |

## The simulation

Plain Node ESM, no dependencies.

```bash
npm run cards    # regenerate rules/CARDS.md from sim/cards.mjs
npm run gates    # every balance gate. exit 0 means the design holds
npm run prove    # certified equilibrium value of every faction matchup (duel model)
```

`sim/battle.mjs` is a **pure** resolver and the only implementation of the rules.
`sim/game.mjs` is the only model that contains alliances, per-player scoring inside a shared
army, and the recruit-on-defeat economy — **quote its numbers, not the duel model's.**

## Where it landed

Measured on the whole game with alliances, 12,000 games per player count:

| | |
| --- | ---: |
| Worst seat deviation, 2–8p | **3.9** |
| Worst faction deviation | **4.4** at four players, **1.8** at eight |
| Game length | 4.4 – 7.9 rounds |
| Games decided on the target | **100%** |
| Rounds containing an alliance, 3p+ | **86%** |
| Power Brokers drawn per game | 13.9 of 15 |

**9 gates · 8 pass · 1 warn · 0 fail.** The warning is the Power Broker supply, which is drawn
down to 13.9 of 15 at eight players. No game in any run ended by exhaustion — 100% still end on
the victory target — and an emptied supply is reshuffled from the discards. See `DECISIONS.md`
D046.

**Rulebook:** 9 glossary terms, 160 lines.

## The previous DECCAN

Archived at `OneDrive/Desktop/deccan` — ~30 versions, July–August 2026. It is research, not a
starting point. Two things were carried forward: the measured findings in `design/LESSONS.md`,
and the round-robin harness. Nothing else.
