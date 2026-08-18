# DECCAN

A physical card game for **2–8 players**, in **79 cards**. Two armies form on one piece of
ground; the players decide who fights in them, and the losers get the better cards.

This repository holds the **design** — the rulebook, the card list, and the simulation used to
balance them — and **`web/`**, which is *GOD (Gambit of Deccan)*, the same game playable online.
The online engine imports `sim/` unchanged and is proven identical to it by `npm run parity`, so
the game people play is the game that was measured.

**The whole game in five lines.** Commit units face down into one of two armies. Every unit
cancels one enemy unit of an arm it beats — a Warrior 1 cancels an Elephant 9 — and a cancelled
unit adds nothing and does nothing. The higher surviving total takes the ground, and the ground
pays **one point to its largest contributor**, counted in units committed, so a unit the ring
killed still counts. Win and your units come home; **lose and you recruit a Power Broker**, which
is the only way anyone ever gets one.

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
| Worst seat deviation, 2–8p | **3.4** |
| Worst faction deviation | **4.8** at four players, **2.6** at eight |
| Game length | 6.5 – 7.1 rounds |
| Games decided on the target | **100%** |
| Rounds containing an alliance, 3p+ | **84%** |
| Power Brokers drawn per game | 13.1 of 15 |

**9 gates · 9 pass · 0 warn · 0 fail.** Every gate passes, and it holds across samples —
faction deviation reads **4.8 / 4.8 / 4.7** at 7,000, 9,000 and 15,000 games per player count.
See `DECISIONS.md` D047.

⚠️ **Quote more than one sample.** The headline gate is a maximum over 56 faction-by-count cells,
so it swings by more than a point between runs. An intermediate roster read **4.7 at 6,000 games
and 6.4 at 12,000** — a false pass and a false warn from the same design. Three samples are the
minimum before a gate result is believed.

**Rulebook:** 9 glossary terms, 160 lines.

## The previous DECCAN

Archived at `OneDrive/Desktop/deccan` — ~30 versions, July–August 2026. It is research, not a
starting point. Two things were carried forward: the measured findings in `design/LESSONS.md`,
and the round-robin harness. Nothing else.
