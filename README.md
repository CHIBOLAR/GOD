# DECCAN

A physical card game for **2–8 players**, in **76 cards**. Two armies form on one piece of
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

Measured on the whole game with alliances, 3000 games per player count:

| | |
| --- | ---: |
| Worst seat deviation, 2–8p | **2.6** |
| Worst faction deviation | **6.1** at two players, **2.0** at eight |
| Game length | 4.5 – 8.0 rounds |
| Games decided on the target | **100%** |
| Rounds containing an alliance, 3p+ | **83%** |
| Power Brokers drawn per game | 16.3 of 20 |

**8 gates · 7 pass · 1 warn · 0 fail.** The warning is faction deviation at two players, where
alliances almost never fire and the game is least itself; it is a deliberate trade recorded in
`DECISIONS.md` D032.

**Rulebook:** 9 glossary terms, 160 lines.

## The previous DECCAN

Archived at `OneDrive/Desktop/deccan` — ~30 versions, July–August 2026. It is research, not a
starting point. Two things were carried forward: the measured findings in `design/LESSONS.md`,
and the round-robin harness. Nothing else.
