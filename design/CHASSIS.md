# THE CHASSIS

*The core loop, and why it is shaped this way. Rationale lives here; rules live in
`rules/RULEBOOK.md`; rulings and their numbers live in `DECISIONS.md`.*

**Status: measured and settled.** `sim/chassis-test.mjs` reproduces every figure below.

---

## 1. The two structural changes

The old game **totalled each army into a single number and compared them**. That is the root
cause of problem 2.

With one scalar comparison, every ability is worth exactly its conversion rate into that scalar,
and the ability with the best rate wins the game. Removal converts best of all — deleting a card
was measured at **+23.2** on its own — so removal dominated every version, and each attempt to
tame it promoted the next-best converter. Thirty versions of moving the crown.

There is no card-level fix for that. Two structural ones were measured, and both are needed.

> ### 1. The ground is three FRONTS — **Van, Centre, Rear**.
> Each army fills one slot per front. Strength is compared **front by front**. The army that wins
> **more fronts** takes the ground.
>
> **This bounds what an ability is worth.** The strongest card in the game can win one front, and
> every point above what that front needed is wasted. Removal fell **+42.6 → +27.2** on an
> unchanged card.

> ### 2. Every unit is **HORSE, FOOT or GUNS**, in a counter cycle.
> **HORSE rides down GUNS · GUNS break FOOT · FOOT holds HORSE.**
> On a front, a countered unit loses **whatever its strength**. Otherwise the higher strength wins.
>
> **This bounds what strength is worth.** A printed 1 of the right type beats a printed 9, so the
> ladder stops being a ladder.

### The measurement that decided it

Nine units, strengths 1..9, card set held fixed, structure varied:

| Structure | Card-value spread | Draws |
| --- | ---: | ---: |
| One total, higher wins *(the old game's shape)* | 53.9 | 5.0% |
| One total + one removal card | **61.8** | 3.9% |
| Three fronts | 46.0 | 12.9% |
| Three fronts + one removal card | 46.0 | 12.9% |
| **Three fronts + types** | **11.0** | 12.0% |
| Three fronts + types + one removal card | **32.5** | 12.3% |
| **Three fronts + types + Centre tie-break** ← **adopted** | **11.0** | **4.0%** |

Gate is ≤ 20, hard fail > 30. The old game's canonical set measured **47.6**.

Under types, card value falls into three flat tiers with the three types **exactly level inside
each one** — H7 +9.7 · F8 +9.7 · G9 +9.7 — which is what constrained symmetry is supposed to look
like.

### And the one thing that must never be printed

**A single removal card takes the spread from 11.0 to 32.5 and appears in 50 of the top 50
armies.** That is the old game's terminal state reproducing itself from one card on a chassis
that had otherwise converged. `DECISIONS.md` D011: **no card removes, damages, swaps or targets
another card.** Re-run `sim/chassis-test.mjs` before ever re-proposing one.

---

## 2. The round

**Muster → Charge → Battle → Spoils.** Four steps; the old game had five plus a separate alliance
phase, now folded into Muster.

### Muster

Beginning with the start player and going clockwise, on your turn you **commit one unit face down
to an empty slot**, or **pass**. Turns lap until every player passes in succession.

- There are **two armies**. Each has one slot per front — **three units, at most three players**.
- The first player to commit to an army is its **LEADER**. To commit into an army you do not lead,
  offer the unit to its leader, who accepts or rejects **without seeing it**. Rejected, you may
  offer to the other army on the same turn; refused by both, you pass.
- You cannot hold units in **both** armies.
- Passing is not folding. You may commit on a later lap.

*One unit per turn, and the order laps, because the alternative was measured: when a turn could
commit three units in one pass round the table, the previous winner filled a fresh army before
anyone could react, every round (`LESSONS.md` F3).*

### Charge

Reveal every unit.

*There is nothing to resolve. No targeting, no ordering, no abilities that touch another card —
D011. This step is a flip.*

### Battle

Each front is decided on its own. A countered unit loses; otherwise the higher strength wins;
equal strength and neither type countering, nobody wins the front. An empty slot has strength 0
and loses to any unit.

The army that won **more fronts** takes the **ground**. Level, and the army that won the **Centre**
takes it. Neither won the Centre, and nobody does.

### Spoils

**Each player in the army that took the ground scores 1 victory point for every front they
personally won.** Then **every committed unit is SPENT** — it leaves the game. The start player
passes to the left.

---

## 3. What this deletes

| Old rule | Fate |
| --- | --- |
| **PAIRED** — conditional strength while a stronger friendly unit is present | **Cut.** Existed to make 3-unit armies matter. Fronts do that. |
| **ALONE** — conditional strength while your army holds exactly one unit | **Cut.** Existed to make 1-unit armies matter. §4 does that instead. |
| **Lone-army immunity**, and `(EXCEPT LONE UNITS)` on four cards | **Cut.** Existed only to stop ALONE bonuses being deleted for free. With no removal there is nothing to be immune to. |
| **Senior ally** — highest committed printed strength takes the point | **Cut.** Replaced by *you score the fronts you won* — one sentence, visible to the whole table, no tie-break. |
| **RECOVERING** — losing units return face up and sit out a round | **Cut.** Every committed unit is SPENT, win or lose (§5). |
| **On-reveal targeting · resolution order · targets locked at reveal · fizzle · silencing** | **Cut, all of it.** D011. |
| **Shock/Support typing with no mechanical effect** | **Replaced** by the counter cycle. The old game printed a type on every card and never used it. |

**Ten rules and eleven glossary terms removed.** The budget in D008 is ≤ 10 terms; the glossary
now reads **ARMY · FRONT · GROUND · LEADER · COMMIT · STRENGTH · SPENT · FACTION — eight.**

---

## 4. Army size is a real choice, with no bonus rules at all

The direct answer to the two-unit dead zone (`LESSONS.md` C1), at a cost of zero rules.

| Units | What it can do | Measured |
| --- | --- | ---: |
| **1** | Cannot take a contested ground outright, but posted on the **Centre** it can steal a level one. An opening, a spoiler, or a free grab if nobody contests (§4.1). | avg 4.2, best **13.8** |
| **2** | Takes the ground by winning both fronts it contests. **The cheap, focused play.** | avg 32.0, best **47.2** |
| **3** | Contests everything. Safe, and expensive. | avg 57.2, best **71.0** |

Two units and three units buy victory points at nearly the same rate — 2 cards for up to 2 VP
against 3 for up to 3. Neither is a trap and neither is correct; the choice is between certainty
and thrift. *(Compare the old game, where every 2-card army ranked below every 3-card army and
Rifleman+Elephant scored worse than either card alone.)*

⚠️ **The round-robin understates the 1-unit army** and always will — it contests every army
against every other, and §4.1 only pays when nobody contests. Same blind spot as `LESSONS.md` D1.
Judge it in the whole-game sim, not here.

**4.1 An uncontested army takes the ground.** If only one army is fielded it wins every front it
filled — so one unit on an empty field is 1 VP for 1 card, the best rate in the game, available to
anyone willing to show their hand first. The table polices it by opening the other army. *This is
deliberately the most tempting bad idea on the board.*

---

## 5. Attrition is the clock

**Every committed unit is SPENT, win or lose. Your faction is your whole life supply.**

- Committing always costs. There is no free contest.
- **Sitting out preserves your army** — this is what a skipped round buys, and it needs no
  mechanism of its own. Closes `OPEN.md` Q3.
- Scoring requires spending, so the leader burns down fastest. Self-correcting pace
  (`LESSONS.md` D5).
- The game ends on its own. No unbounded games, no deadlock rules.

⚠️ **This deliberately diverges from the old economy, where losing cost nothing.** Under that
rule contesting was free and everyone always deployed, which is incompatible with D007.

**Game end:** first to the victory target wins; if the table runs dry first, most points wins.
*Target scales with player count — tuned in Phase 4.*

---

## 6. Settled since

| | |
| --- | --- |
| The faction chassis | Same twelve numbers for everyone; only the type-allocation differs — D014 |
| The faction set | Nine: three archetypes × three arms, closed under rotation — D015, D016 |
| The victory target | 6 at 2–4 players, 5 at 5–7, 4 at 8 — D017 |
| Face-down commitment | Kept, and it turned out to be what makes the game fair — D019 |

**Everything in the chassis is now measured.** `npm run gates`: 11 gates, 11 pass.

---

## 7. The one thing to protect

The three problems in `BRIEF.md` were solved by **three structural rules and no cards**:

1. Compare three fronts instead of one total → an ability cannot be worth more than one front.
2. A counter cycle → a printed 1 beats a printed 9, so the ladder cannot run away.
3. Nothing targets anything → the entire class of effect that dominated thirty versions is
   simply not printed.

Every future addition is a threat to one of those. A card that says *anything* about another card
re-opens D011, and that was measured at 11.0 → 32.5 spread from a single card. **Run
`sim/chassis-test.mjs` before writing one.**
