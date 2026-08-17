# OPEN QUESTIONS

*Questions awaiting a ruling. When one closes it moves to `DECISIONS.md` and is deleted from
here. Everything left in this file is flagged to the user rather than left to be discovered.*

---

## Closed since this file was written

| | Question | Where it went |
| --- | --- | --- |
| Q2 | Is victory still a race to a fixed target? | Yes, and it **scales with the player count** — D017 |
| Q3 | What does a skipped round buy? | Nothing is needed. Committed units are **SPENT win or lose**, so sitting out simply preserves your faction. Measured: 2% of rounds at 2 players rising to 44% at 8 — `CHASSIS.md` §5, D007 |
| Q4 | How many factions? | **Nine** — three archetypes × three arms, so 8 seats need no duplicates — D016 |
| Q5 | Does anything still commit face down? | Yes, and it is **load-bearing rather than decorative** — D019 |

---

## Q1. Wall-clock length, and weight *(the only one a simulation cannot answer)*

`BRIEF.md` assumed ~30–45 minutes at medium-light weight. The simulation has settled everything
about it except the minutes:

* **Rounds are measured:** 4.4 at two players to 8.5 at seven.
* **Weight is measured** as far as a document can measure it: 127 lines of rules, 9 glossary
  terms, 0 exceptions.
* **Minutes are not measured and cannot be.** The unknown is the *muster*, which laps until every
  player passes and involves an offer-and-refusal negotiation at every seat. At eight players that
  is where all the time will go, and it is also where all the fun is meant to be.

**Not blocking.** If a real game runs long, the lever is the victory target in `sim/cards.mjs`,
and `npm run gates` re-verifies the whole design against a changed one in about a minute.

---

## Playtest items — things the model cannot see

**1. Does the muster drag at 7–8 players?** See Q1. The specific risk is the offer-and-refusal
loop: each turn can involve two offers and two leader decisions.

**2. Does sitting out feel like plotting or like waiting?** D007's stated failure mode. The
numbers say abstention is a real and frequent choice (44% of player-rounds at eight seats). They
cannot say whether the player enjoys it.

**3. Is a 44% abstention rate at eight players too high?** Two of eight players are forced out by
the six slots; the rest is chosen. That may read as elegant scarcity or as being locked out.

**4. Are nine factions distinguishable at the table?** They share the same twelve numbers by
design — that is what makes them provably level (D014). The risk is that "specialist HORSE" and
"champion HORSE" feel like the same faction to a player who is not counting.

**5. Does the champion archetype read as a fourth-best faction?** It measures +0.008 mean, i.e.
level. But it holds the game's only 9-with-a-2-beside-it arm, and players judge a faction by its
best card, not its integral.

**6. Is one point per front too swingy at two players?** A 3–0 ground is half a 2-player target
in one round. Measured as fair (50.0 / 50.0) and short (4.4 rounds), which may be *too* short.

---

## Not yet designed, and deliberately so

**Nothing.** The chassis, the card list, the faction set, the victory targets and the ending
conditions are all settled and measured. There are no abilities to design — D011 removed the
entire category, and re-introducing one requires re-running `sim/chassis-test.mjs` first.


---

## ⚠️ THE PROOF DOES NOT COVER ALLIANCES (raised by the designer, 2026-08-18)

`sim/prove.mjs` certifies the equilibrium value of every faction pairing to within 0.011, and
reports a spread of 0.105 points per battle. **That is a proof about a TWO-PLAYER DUEL.** It
models one faction's army against another's and nothing else.

The real game is 2-5 players, an army may hold units from up to three of them, and each player
scores per surviving unit of their own inside a winning army. None of that is in the model.

**What this most likely gets wrong.** The result names the Berads (Archer-lead) the weakest
faction at -0.065, losing ~0.095 to three others. But the Berads are three cheap Archers that
cancel Elephants — a poor solo army and possibly the single most valuable thing anyone can
contribute to somebody else's. A faction can be the worst duellist and the best ally, and the
duel model cannot tell the difference.

⚠️ `LESSONS.md` D1 says a battle-level metric cannot see the reward economy. It cannot see
alliances either. **Do not quote the 0.105 as a balance figure for DECCAN** — quote it as the
duel value, and re-prove once `sim/game.mjs` models multi-player armies.

**What a real proof needs:** the whole-game simulation with alliances, offers and refusals,
per-player scoring inside a shared army, and the recruit-on-defeat economy. That is the same
`game.mjs` wiring that everything else is waiting on.

**Also unresolved:** forcing every faction to an equal strength total (`sim/equalise.mjs`)
collapses the design — at 10 units and 50 strength the best "lean into your lead arm" vectors
give two identical factions and one mono-arm faction. Equal totals are not the fix.
