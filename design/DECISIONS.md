# DECISION LOG

*Append-only. One entry per ruling, newest last. Every entry carries the reason and, where the
ruling was measured, the number behind it.*

*A decision recorded here is **settled**. It is not re-proposed in a later session unless new
measurement contradicts it — in which case that measurement becomes a new entry, and the old one
is marked superseded rather than deleted.*

---

## 2026-08-17 — D001. DECCAN is being redesigned from scratch, not patched

**Ruling:** New repo, new design. The old project (`OneDrive/Desktop/deccan`) becomes a read-only
archive.

**Reason:** Three problems that thirty versions did not fix — an untenable exception count, a
balance that never converged, and a social layer that was built and then deleted. See `BRIEF.md`.

---

## 2026-08-17 — D002. The product is a physical card game. No app.

**Ruling:** The deliverables are a rulebook, a player aid and a card list. Code in this repo
simulates and balances the design and does nothing else — no client, no server, no bots as
opponents.

**Reason:** The old repo's code never once caught up with its own rules. At the end it was two
full versions behind the canonical rulebook and implemented mechanics that had been deleted.
Removing the app removes the divergence.

---

## 2026-08-17 — D003. One rulebook file. No version numbers in filenames.

**Ruling:** `rules/RULEBOOK.md` is the only rulebook. Git history is the versioning.

**Reason:** The old repo accumulated **50** rulebook files including two competing documents both
called v1.0 and a v2.0 that superseded one of them the same day. "Which one is canonical?" became
a recurring question that cost real time.

---

## 2026-08-17 — D004. Card data has exactly one source

**Ruling:** All card data lives in `sim/cards.mjs`. `rules/CARDS.md` is generated from it by
`npm run cards` and is never hand-edited.

**Reason:** With no app, rulebook-vs-harness is the only remaining way the canon can split.
Generation closes it. See `LESSONS.md` E2.

---

## 2026-08-17 — D005. 2–8 players

**Ruling:** The game supports 2 through 8 players.

**Reason:** User ruling. Note this is wider than the old game's final range (2–6) and restores the
range an earlier version supported.

---

## 2026-08-17 — D006. Asymmetric starts replace the symmetric Force

**Ruling:** Each player takes a faction with its own units, in place of every player holding an
identical 7-card hand plus cards earned from a shared supply.

**Reason:** User ruling, chosen against three alternatives. It is the strongest available answer
to the thin-social-layer problem — an identity at the table is something to read, threaten and
bargain with, which face-down deploy alone never provided.

**Constraint attached (mine, accepted into the brief):** *constrained asymmetry* — every faction
shares a chassis and differs on exactly one axis. Without it, the balance surface is
factions × matchups × seat counts in a project whose stated failure is that balance never
converged on a symmetric set.

---

## 2026-08-17 — D007. Sitting out is a real choice

**Ruling:** Not every player commits every round. The round you skip must buy you something.

**Reason:** User ruling. With two armies and up to 8 seats, the alternative is that most of the
table watches. Making abstention *purchase* position turns downtime into the negotiation layer
rather than into waiting.

**To watch:** the failure mode is downtime that feels like waiting. Measure it, don't assume it.

---

## 2026-08-17 — D008. The exception budget is a hard constraint

**Ruling:**

| Metric | Old game | Budget |
| --- | ---: | ---: |
| Glossary terms | 19 | **≤ 10** |
| Exception marks | 6 | **≤ 2** |
| Rulebook length | ~300 lines | **≤ 150 lines** |
| Teach time | untested | **≤ 5 min** |

Over budget is a design bug, not a documentation problem.

**Reason:** "Too many exceptions to teach" is one of the three stated problems. Unmeasured, it
will not be fixed — every one of the old game's 19 glossary terms was added for a good local
reason.

---

## 2026-08-17 — D009. The ground is three FRONTS, compared one at a time

**Ruling:** Van · Centre · Rear. Each army fills one slot per front. Strength is compared front by
front; the army winning more fronts takes the ground. The single army total is gone.

**Measured** (`sim/chassis-test.mjs`, nine units 1..9, structure varied and card set held fixed):

| Structure | Card-value spread | Removal card |
| --- | ---: | ---: |
| One total, higher wins | 53.9 | — |
| One total + a removal card | 61.8 | **+42.6** |
| Three fronts | 46.0 | — |
| Three fronts + a removal card | 46.0 | **+27.2** |

**Reason:** with one scalar comparison every ability is worth its conversion rate into that
scalar, so "delete their best number" dominates without limit — the mechanism behind thirty
versions of moving the crown. Fronts cap what one card can buy at one front: removal fell
**+42.6 → +27.2** on an unchanged card. Overkill is wasted; a 10 beating a 1 buys what a 2
beating a 1 buys.

⚠️ **Fronts alone were not enough.** The residual spread of 46.0 is the strength ladder itself,
which fronts do not touch. See D010.

---

## 2026-08-17 — D010. Three types, in a counter cycle. **This is the piece that converges the balance.**

**Ruling:** every unit is HORSE, FOOT or GUNS.

> **HORSE rides down GUNS · GUNS break FOOT · FOOT holds HORSE.**
>
> On a front, a countered unit loses **whatever its strength**. Otherwise the higher strength wins.

**Measured:**

| Structure | Spread | Draws |
| --- | ---: | ---: |
| Three fronts, no types | 46.0 | 12.9% |
| **Three fronts + types** | **11.0** | 12.0% |

Card value under types lands in three flat tiers with the types **exactly level inside each**:
H7 +9.7 · F8 +9.7 · G9 +9.7 — H4 +4.3 · F5 +4.3 · G6 +4.3 — H1 −1.3 · F2 −1.3 · G3 −1.3.

**Reason:** fronts bound what an *ability* is worth; the counter cycle bounds what *strength* is
worth. A printed 1 of the right type beats a printed 9, so the ladder stops being a ladder. This
is what takes the design inside the ≤ 20 gate, against the old game's **47.6**.

It also does the job PAIRED and ALONE were invented for — giving low-strength cards a reason to
exist — at a cost of one sentence instead of two conditional-strength rules, three glossary
terms and a lone-unit immunity clause. And it is the correct history: the Deccan wars were
decided by exactly this interplay of light cavalry, infantry and artillery.

---

## 2026-08-17 — D011. **No removal, and no on-reveal targeting at all**

**Ruling:** no card removes, damages, swaps or otherwise targets another card during the battle.
This closes `CHASSIS.md` §6 in favour of option 1.

**Measured** — adding one removal card to the finished chassis:

| | Spread | Removal value | Removal in top-50 armies |
| --- | ---: | ---: | ---: |
| Three fronts + types | **11.0** | — | — |
| Three fronts + types + **one removal card** | **32.5** | +25.7 | **50/50** |

**Reason:** a single removal card takes the spread from 11.0 to 32.5 — past the hard-fail line —
and appears in **every one of the top 50 armies**. That is the old game's terminal state
(Cannon +38.8, 50/50) reproducing itself from one card, on a chassis that had otherwise converged.

`LESSONS.md` B4 said it: removal was worth +23.2 on its own — *price it accordingly, or don't
print it.* Do not print it.

**What this deletes, for free:** on-reveal targeting, resolution order, targets-locked-at-reveal,
fizzle, silencing, and the entire "which card shoots which" ladder that consumed the old
project's last eight versions. The glossary loses REMOVE.

⚠️ **Do not re-propose a removal card, a damage card, or a swap card without re-running
`sim/chassis-test.mjs` first.** It is three lines to check and it has failed every time.

---

## 2026-08-17 — D012. A level ground is decided by the Centre

**Ruling:** if the two armies win the same number of fronts, the army that won the **Centre**
takes the ground. If neither won the Centre, nobody takes it.

**Measured:**

| | Spread | Draws | 1-unit armies (avg / best) |
| --- | ---: | ---: | ---: |
| No tie-break | 11.0 | 12.0% | 0.5 / 0.7 |
| Tie-break on total strength | 16.7 | 1.6% | 2.9 / 6.6 |
| **Tie-break on the Centre** | **11.0** | **4.0%** | **4.2 / 13.8** |

**Reason:** it is free. Draws fall from 12.0% into the 3–10% gate at **no cost to the spread**,
where a tie-break on total strength costs 5.7 points of spread by making the ladder matter again.
It also makes the Centre a decision — a lone unit posted there can steal a level ground, which
lifts the 1-unit army from ~nothing to a real if narrow play.

---

## 2026-08-17 — D013. A countered unit simply loses. The counter is not a bonus.

**Ruling:** on a front, a countered unit loses **whatever its strength**. There is no arithmetic.

**Measured** — softening the counter to "the countered unit fights at −X":

| Counter | Spread | Strength tiers (high / mid / low card value) |
| --- | ---: | --- |
| **loses outright** | **11.0** | 9.7 / 4.2 / −1.3 |
| −8 | 15.0 | 10.4 / 4.2 / −2.0 |
| −6 | 21.2 | 11.4 / 4.2 / −3.0 |
| −4 | 32.5 | 17.1 / 4.4 / −8.5 |
| −2 | 38.4 | 19.5 / 4.7 / −10.3 |

**Reason:** the case for softening was that under an outright counter, any two *different* types
settle their front on type alone — so printed strength only ever decides a **mirror**. The sweep
says the trade is bad: softening buys almost nothing for strength (high-tier card value
9.7 → 10.4 at −8) and costs real balance, and by −4 the spread is past the hard-fail line.

Strength is not decorative under the outright rule — it still carries an 11-point spread across
the ladder, through mirrors and through the Centre tie-break. And "Horse beats Guns, full stop"
is two sentences to teach where "a countered unit fights at −8" is arithmetic on every front.

---

## 2026-08-17 — D014. Every faction holds the same twelve numbers

**Ruling:** the shared multiset is **1 · 2 · 3 · 4 · 4 · 5 · 5 · 6 · 6 · 7 · 8 · 9** (twelve units,
60 strength, four of each type). Factions differ **only** in which type each number is printed on.
`sim/cards.mjs` validates this on import and refuses to run otherwise.

**Measured:** the first draft constrained only the *total* and let the distribution vary. A
faction of 1,2,8,9s measured **+1.08 VP/battle** against the whole field.

**Reason:** you choose what to commit, so you simply never commit your 1s and 2s. **Equal total
strength is not equal usable strength** — a wide distribution is strictly better than a narrow
one, because only the top half of it is ever played. Sharing the multiset closes that for good:
there is no shape to exploit when every faction has the same shape.

⚠️ Generalises. Any future "same budget, different shape" constraint has this hole in it unless
the *usable* part of the budget is what is constrained.

---

## 2026-08-17 — D015. The faction list is **closed under rotation**. Two archetypes, three arms.

**Ruling:** six factions = two archetypes × three lead arms.

| Archetype | Groups (lead arm / next / last) | Character |
| --- | --- | --- |
| **Specialist** | 6,7,8,9 / 2,4,5,6 / 1,3,4,5 | The top of the ladder in one arm and very little behind it. |
| **Blind spot** | 1,2,4,4 / 3,5,7,9 / 5,6,6,8 | Two arms that can fight anybody, and one that cannot fight at all. |

| Faction | Archetype | Arm |
| --- | --- | --- |
| The Marathas | specialist | elite HORSE |
| The Mughal Host | specialist | elite FOOT |
| Adil Shahi of Bijapur | specialist | elite GUNS |
| The Firangi | blind spot | no HORSE |
| Qutb Shahi of Golconda | blind spot | no FOOT |
| Nizam Shahi of Ahmadnagar | blind spot | no GUNS |

**Reason — this is the whole balance argument, and it is structural rather than tuned.** The
counter cycle has a rotational symmetry. If every archetype appears in all three arms, then two
factions of the same archetype are level **by symmetry, with no tuning at all**, and the entire
balance question collapses to one number: writing `v_d` for a specialist against the blind spot
`d` rotations along, every specialist scores `(v0+v1+v2)/5` and every blind spot exactly minus
that. **The set is level if and only if v0+v1+v2 = 0.**

`sim/pattern-search.mjs` searched the 9000 distinct allocations of the shared multiset for the
partner that zeroes that sum. The blind-spot shape returns **v0 −0.00 · v1 +0.02 · v2 −0.01**.

**Verified on the full six-by-six matrix** (`sim/factions.mjs`, 12000 iterations):

> **faction spread 0.001 VP/battle · worst single matchup 0.017 · duality gap 0.077**

Progression across the session: **1.476 → 0.511 → 0.001**.

⚠️ **Individual matchups are allowed to differ** — that is rock-paper-scissors between
archetypes, which is wanted. Only the sum has to vanish. Do not "fix" a lopsided single pairing.

⚠️ **A seventh faction cannot be added alone.** Factions arrive in threes, as a new archetype in
all three arms, or the symmetry that makes this provable is broken. This is the price of the
guarantee and it is worth paying.


---

## 2026-08-17 — D016. Nine factions, not six

**Ruling:** three archetypes × three arms = nine factions. The third is the **champion**:
`2,7,8,9 / 4,4,5,5 / 1,3,6,6` — the three best units in the game in one arm, a dud beside them,
and two dependable arms. The Rajput Contingents · The Berads · The Siddis of Janjira.

**Reason:** the game supports 8 players (D005) and six factions cannot seat them. The whole-game
sim reported it as a crash, not a balance problem — seats 7 and 8 were dealt `undefined`.

The alternative was duplicate factions at 7–8 players. Rejected: faction identity is the answer
to the thin-social-layer problem, and two players holding the same identity dilutes exactly the
thing being bought. Nine also follows D015's own rule that factions arrive in threes.

**Measured** (`sim/pattern-search.mjs`, then `sim/factions.mjs` on the full 9×9):

> **faction spread 0.016 VP/battle · worst single matchup 0.069 · duality gap 0.066**

The champion sums −0.065 against the specialist and −0.003 against the blind spot.

---

## 2026-08-17 — D017. The victory target scales with the player count

**Ruling:** 2–4 players **6** · 5–7 players **5** · 8 players **4**.

**Reason:** scoring is per front won, so a 2-player winner takes 2–3 points in a round while one
of three allies at an 8-player table takes 1. A flat target would make an 8-player game three
times as long per player. Tuned in `sim/seats.mjs` for a game of 6–9 rounds that ends **on the
target** rather than by running the table dry: measured 4.4 to 8.5 rounds, and the worst player
count still finishes on the target **81%** of the time.

---

## 2026-08-17 — D018. The draw-rate gate is inverted from the old game's

**Ruling:** draw rate gate is now **≤ 10%, and lower is better**. Measured at **1.9%**.

**Reason:** the inherited 3–10% band came from a game where level armies meant **both** sides
won — a scoring event worth having. In DECCAN II a level ground pays **nobody** while everyone
still spends their cards, so a draw is a wasted round. The old band would have failed a good
number for a stale reason. ⚠️ `LESSONS.md` E3 generalised: a gate inherited with its number is
as dead as a figure inherited with its number.

---

## 2026-08-17 — D019. Units commit face down. This is now the only hidden information.

**Ruling:** yes, kept. Closes `OPEN.md` Q5.

**Reason, and it arrived as a bug.** The first whole-game policy read the opposing unit's type
and strength when choosing where to commit. The tell was unmistakable: **the start player was
the worst seat at every player count, and 2-player split 36 / 64.** Under an outright counter,
whoever moves second with full information simply counters what they can see, and it is a
landslide.

Correcting the policy to public information only — which fronts are occupied, whose card sits on
each, and what each player has already burned — moved 2-player to **49.3 / 50.7** and brought
every count from 2 to 8 inside the fairness gate on that single change.

So the face-down rule is not decoration: **it is what makes the game fair.** And under fronts it
hides *placement*, which is richer than hiding identity — everyone knows the Firangi have no
cavalry; nobody knows what went on the Van.

---

## 2026-08-17 — D020. The canon is written, and every gate passes

`npm run gates` — **11 gates, 11 pass, 0 warn, 0 fail.**

| Gate | Result |
| --- | ---: |
| faction chassis intact | 0 problems |
| faction spread (VP/battle) | 0.016 |
| worst single faction matchup | 0.069 |
| worst card-value spread within a faction | 15.3 |
| weakest army size, at its best | 12.6 |
| draw rate | 1.9% |
| worst seat-position deviation, 2–8p | 3.9 |
| worst faction deviation in play, 2–8p | 4.7 |
| shortest / longest game | 4.4 / 8.5 rounds |
| games decided on the target, worst count | 81% |

**Exception budget (D008) met:**

| | Old game | Budget | DECCAN II |
| --- | ---: | ---: | ---: |
| Glossary terms | 19 | ≤ 10 | **9** |
| Exception marks | 6 | ≤ 2 | **0** |
| Rulebook lines | ~300 | ≤ 150 | **127** |

---

## 2026-08-17 — D021. Reconciliation: you reinforce your own army freely

**Ruling:** a player already in an army adds further units to it **without asking the leader**.
Only *joining* an army requires an offer.

**Reason:** found by reading the rulebook against `sim/battle.mjs` and `sim/game.mjs` line by
line, which is the check the old project went eight versions without doing (`LESSONS.md` E2). The
draft rulebook said "an army you do not **lead**", which would have made the second and third
member of a three-player army ask permission for every reinforcement; the resolver said "an army
you are not already **in**". The resolver had the better rule and the rulebook was corrected to
match.

Everything else reconciled clean: the counter, the strength comparison, equal strength, empty
slots, more-fronts-takes-the-ground, the Centre tie-break, the uncontested army, per-front
scoring, spend-on-commit, one offer per army per turn, both-armies prohibition, lapping until all
pass, shared wins on a tie, and both ending conditions.

---

## 2026-08-17 — D024. The card economy, ruled

**Ruling:**

* **Win** — your committed units **recover**: they sit out the next round and return after it.
* **Lose** — your committed units are **gone for good**, and you **recruit 1 Power Broker**,
  **one per defeat whatever you committed**.

**Reason:** the designer's inversion of the old flow. Its point is that Power Brokers reach
only players who have just lost, so a broker can be made genuinely strong without creating a
runaway — the leader never recruits one. This is the structural repair for the failure that
ended the old game, where **winners** drew brokers and the best card measured **+38.8, present
in all 50 of the top 50 armies**.

⚠️ **I flagged this reading as a runaway risk and was wrong on the merits.** The
"irrespective of units committed" clause defuses it, and it is the best thing in the economy:

> **Losing with one unit costs one card and gains a broker — card-neutral, and quality-positive.
> Losing with three costs three and gains the same one.**

So a defeated player controls their own bleed, and the correct play when behind is to commit
small and farm brokers, while a player who wants points must commit big enough to win. That is
a live decision every single turn and it self-corrects without a rule saying so.

**Consequence worth keeping:** the **Sepoy** is now aimed squarely at the winner's reward — a
losing army's Sepoy kills the recovering units the victory was supposed to give back. The one
card that punishes winning, held only by players who lost.

**Still to measure, and it is the decisive number of the project:** whether removal is safe
under this flow. The Slinger and the Spy are exactly the effect class that broke the old game.
The Spy at 2 — taking the enemy's strongest for a printed 2 — is the sharpest card in the set
and the first place to look if anything is wrong.

---

## 2026-08-18 — D025. Power Brokers leave the game. Nothing recycles.

**Ruling:** a Power Broker that is lost is **out of the game**. It does not return to the
supply. The designer: *"game ends before pbs are recycled."*

**Reason:** the supply is a one-way tap — 25 cards, and every one that leaves stays gone. No
recycling pile to track at the table, and no rule needed for an exhausted supply beyond "it
draws nothing".

**Consistent with D024, and worth stating on the card:**

* A broker committed to a **winning** army **recovers** to your hand like any other unit.
* A broker committed to a **losing** army is **gone for good**, with the rest of that army.

So a broker is only spent when it fails. Holding one is free; using one is a wager.

⚠️ **This makes the supply a real clock, and it should be measured as one.** At 5 players a
defeat draws one broker per defeated player, so 1.5–2 leave the supply per round on top of any
lost in battle. Over a 7-round game that is comfortably inside 25 — but it is the assumption
behind "25 is enough", and it is the number to re-check if games ever run long.

**Settled in D026:** one per defeated **player**.


---

## 2026-08-18 — D026. One Power Broker per defeated PLAYER

**Ruling:** every player with a unit in the defeated army recruits **one** Power Broker,
whatever they committed. A three-player losing army draws three.

**Reason:** designer ruling, and it is the stronger catch-up. Contrast the old game, which drew
one per winning **army** and handed it to the senior ally alone (Law 7.3–7.4) — scarce, and
concentrated on the player already winning. This is the opposite on both axes: plentiful, and
spread across everyone who is behind.

**Rate:** ~1.5–2 brokers leave the supply per round at 5 players, so a 7-round game uses
11–14 of the 25. Comfortable, but it is the assumption behind "25 is enough" (D025).

⚠️ **The interaction to measure, and it is the sharpest edge in the economy.** Joining a losing
army with ONE cheap unit costs one card and pays one broker — card-neutral and
quality-positive. Three players can do that at once, so a defeated army can become a shared
broker farm. What stops it being degenerate is that the *winning* army is where the victory
points are, and points are what end the game: aiming to lose is aiming not to win. That is
probably enough. **Measure it** — specifically, whether a player who never tries to win can
out-tempo the table on brokers alone.

---

## 2026-08-18 — D027. Countering is a BONUS, and every counter fights at 10

**Ruling:** a unit that faces either of the arms it beats gains its bonus. Bonuses are
**9 / 7 / 5 / 3 / 1**, so Archer, Horseman, Warrior, Rifleman and Elephant all counter at
exactly **10**. Cancellation is gone.

**Measured** — the designer's first draft used bonuses of 5/4/3/2/1, and **3 of the 10 counter
relationships still lost**:

| | | |
| --- | --- | --- |
| Archer 1+5 = 6 | vs Rifleman 7 | **loses** |
| Archer 1+5 = 6 | vs Elephant 9 | **loses** |
| Horseman 3+4 = 7 | vs Elephant 9 | **loses** |

**Reason, and it generalises.** Under 5/4/3/2/1 the boosted ladder reads 6, 7, 8, 9, 10 —
**the same order as the base ladder** 1, 3, 5, 7, 9. Every unit moved up and none overtook, so
a boosted weak unit still lost to a stronger unit that was not even boosted. The Archer never
beat either thing its own card said it countered.

⚠️ **A counter has to reorder the ladder, not shift it.** Levelling every counter at 10 does
that in one sentence — *"when you counter, you fight at 10"* — and it cannot be mutual, because
in a five-ring nothing counters its own counter.

**The ring itself was verified correct:** all ten ability lines agree exactly with
ELEPHANT → RIFLEMAN → WARRIOR → HORSEMAN → ARCHER.

---

## 2026-08-18 — D028. The Slinger takes the weakest; brokers have no arm

**Ruling:** the **Slinger** removes the **weakest** enemy unit. The **Spy** keeps the strongest.
**Power Brokers have no arm** — they neither give nor take a counter bonus.

**Reason:** as first drafted, Slinger and Spy both targeted the strongest — the same
two-cards-one-target collision that took four separate rulings to clear in the old game. The
line is now fully separated: the Slinger takes the bottom of the enemy's, the Spy the top.

Brokers sitting outside the ring keeps them from disturbing its five-fold symmetry, and it is
one less thing on the card.

**Kept, and worth protecting:** the Force is **odd** (1,3,5,7,9) and the brokers are **even**
(2,4,6,8,10). A Force unit and a broker can never tie, and every broker slots between two Force
units.


---

## 2026-08-18 — D029. Asymmetric arms, brokers in the ring, cancelled units do not act

**Ruling:** back to cancellation (RPS), with three changes the designer proposed together:

* **Factions differ by how many of each arm they hold**, not by strength. Strength is fixed to
  the arm: an Archer is always 1, an Elephant always 9.
* **Power Brokers are inside the ring.** Each has an arm and can be cancelled like anything else.
* **A cancelled unit does not act** — no strength, and its ability never fires.

**Reason:** with a symmetric Force both players always hold every answer, so the ring collapses
into pure guessing — which is why the counter measured so flat there (card-value spread 4.1 on
the bonus rule, 8.1 on cancellation). Asymmetry turns the question from *what will they guess*
into *do I even have the answer*, which is where identity and negotiation live.

Brokers inside the ring is the structural fix for the failure that ended the old game: a broker
measured **+38.8, in all 50 of the top 50 armies**, because nothing could answer it. A broker
with an arm is answerable.

**The supply became an upgraded shadow of the Force — one broker per arm, each +1 over its
counterpart:** Archer 1 / Slinger 2 · Horseman 3 / Spy 4 · Warrior 5 / Senapati 6 ·
Rifleman 7 / Sepoy 8 · Elephant 9 / Siege Elephant 10. Odd and even, so the two can never tie.

⚠️ **The cost, stated plainly: balance is no longer PROVEN.** When every faction shared one
strength multiset, rotating a faction preserved its total and the five-fold symmetry guaranteed
the matchups level. With strength welded to the arm, rotating changes the total, and balance
has to be measured.

**Measured** across eight distribution patterns:

| pattern | faction spread | raw totals | |
| --- | ---: | --- | --- |
| 4,3,2,1,0 | 11.9 | 70 50 40 40 50 | fail |
| 3,3,2,1,1 | 7.1 | 62 52 42 42 52 | warn |
| 4,2,2,1,1 | 6.5 | 64 54 44 44 44 | warn |
| **3,2,2,2,1** | **3.5** | 58 48 48 48 48 | **adopted** |
| 3,3,2,2,0 | 8.1 | — | fail |
| 2,2,2,2,2 | 0.0 | all 50 | passes, but symmetric — no asymmetry left |
| 4,3,1,1,1 | 9.1 | — | fail |
| 3,3,3,1,0 | 12.7 | — | fail |

**The ring compresses raw strength hard but not completely.** Under 4/3/2/1/0 the richest
faction had **75% more raw strength** and scored only **14% better**, and two factions on an
identical raw 50 scored 57.3% and 51.7% — so composition already matters more than total. It
just cannot absorb a 30-point gap, which is what rules out the steep patterns.

---

## 2026-08-18 — D030. The Siege Elephant deploys FACE UP

**Ruling:** the Siege Elephant is played face up. Its reveal happens in the open.

**Reason — the designer's, and it is the physical-components test that `LESSONS.md` E6 records
as the most valuable kind of objection.** A hidden reveal-card is **unenforceable**: nobody at
the table can check that you actually held one, so a player could simply claim the peek and
take it. The same argument killed a card in the old game that had survived three rounds of
analysis.

**And it makes the card self-balancing.** The strongest card in the game is now the one that
announces itself — an ELEPHANT face up on the table invites every Archer and Rifleman present,
both of which cancel it. You buy information by giving information away.

---

## 2026-08-18 — D031. The strength arrangement, the Paltan, and per-faction counts

Three changes that together take the design from a hard failure to every gate passing, all
measured on the **whole game with alliances** — the duel numbers in `sim/prove.mjs` are
superseded and should not be quoted.

**1. Strengths rearranged around the ring: `9,3,7,5,1`.**

| Arm | Force | Broker |
| --- | --- | --- |
| ELEPHANT | Elephant 9 | Siege Elephant 10 |
| PALTAN | Paltan 7 | Senapati 8 |
| HORSEMAN | Horseman 5 | Spy 6 |
| RIFLEMAN | Rifleman 3 | Sepoy 4 |
| ARCHER | Archer 1 | Slinger 2 |

All 24 distinct arrangements were measured. **The tidy one we had — 9,7,5,3,1 descending
round the ring — ranked 21st of 24 at deviation 10.6.** The best is 9,3,7,5,1 at 5.88. The
ring the designer specified is untouched: only which number sits on which arm moved, and the
odd/even split survives exactly.

It is also the better history. Matchlocks in the Deccan were slow, few and unreliable while
massed infantry was the backbone of every army in the field, so a **Rifleman at 3 and a Paltan
at 7** is closer to those wars than a Rifleman at 7. The descending ladder was never a design
property — just an accident of the order we happened to write the arms down in.

**2. The Warrior is now the PALTAN** — a formation, not one man. Designer's call, and it pairs
with the Senapati who commands it.

**3. Per-faction unit counts, hill-climbed from the pure rotation.** Exactly one faction needed
adjusting: **the Mughal Host trades its last Rifleman for a third Archer**, taking the worst
mean faction deviation from 4.21 to 1.66. The great infantry host now fields **no firearms at
all**, which is a better identity than the rotation gave it.

| Faction | Lead | Hand |
| --- | --- | --- |
| Qutb Shahi of Golconda | ELEPHANT | E9 E9 E9 R3 R3 P7 P7 H5 H5 A1 |
| The Firangi | RIFLEMAN | E9 R3 R3 R3 P7 P7 H5 H5 A1 A1 |
| The Mughal Host | PALTAN | E9 E9 P7 P7 P7 H5 H5 A1 A1 A1 |
| The Marathas | HORSEMAN | E9 E9 R3 R3 P7 H5 H5 H5 A1 A1 |
| The Berads | ARCHER | E9 E9 R3 R3 P7 P7 H5 A1 A1 A1 |

⚠️ The cost: the factions are no longer one pattern rotated, so there is no symmetry argument
left at all. Balance here is measured and must be **re-measured whenever anything moves**.

**4. Two players need a longer game: victory target 5, everyone else 4.** At two seats
alliances almost never fire (4% of rounds against 87% at three), so the game collapses into a
duel where the asymmetry bites hardest and a short game cannot regress it. Swept: target 4
gives deviation 4.96 over 3.7 rounds, **target 5 gives 3.82 over 4.7**, target 8 drifts back
to 5.42.

### Where it landed — `npm run gates`, 3000 games per player count

| Gate | Result |
| --- | ---: |
| worst seat deviation, 2–5p | **2.1** |
| worst faction deviation, 2–5p | **4.3** |
| game length | 4.4 – 6.0 rounds |
| games decided on the target | **100%** |
| rounds containing an alliance (3p+) | **87%** |
| Power Brokers drawn per game | 10.7 of 25 |

**8 gates, 8 pass, 0 warn, 0 fail.**

The supply figure settles the designer's question: **25 is comfortable**, with the longest
games drawing under half of it.


---

## 2026-08-18 — D032. Faction identity beats the balance gate

**Ruling:** every faction must hold **strictly more of its lead arm than of any other**. Counts
are hill-climbed for balance *subject to that constraint*, not freely.

| Faction | Lead | Hand |
| --- | --- | --- |
| Qutb Shahi of Golconda | ELEPHANT | E9 E9 E9 R3 R3 C7 C7 H5 H5 W1 |
| The Firangi | RIFLEMAN | E9 E9 R3 R3 R3 C7 C7 H5 H5 W1 |
| The Mughal Host | CANNON | E9 E9 C7 C7 C7 C7 H5 H5 W1 W1 |
| The Marathas | HORSEMAN | E9 E9 R3 R3 C7 H5 H5 H5 W1 W1 |
| The Berads | WARRIOR | E9 E9 R3 R3 C7 C7 H5 W1 W1 W1 |

**Reason.** An unconstrained hill-climb reached faction deviation **3.4** and passed all eight
gates — by dissolving the factions. It produced a **Cannon faction holding three elephants and
two cannons**, two different factions each holding three elephants, and a Firangi hand down at
a raw total of 38 against Qutb's 58. The metric was satisfied and the game read worse.

Constrained, the climb stalls at **6.6** — one warn.

⚠️ **The gate of 5 is ours, not a law.** It was written in Phase 1 by analogy with the old
game's seat-fairness standard, and it is not worth a defect every player meets on their first
read. A Cannon faction that fields more elephants than cannons is visible immediately; a 6.6%
win-rate skew takes dozens of games to feel.

**And the skew sits where it matters least.** At five players it is **2.8**, well inside the
gate. The 6.6 is concentrated at two players — the seat count where alliances almost never fire
(4% of rounds against 87% at three) and the game is least itself.

⚠️ **Lesson worth keeping, and it is the second time this session:** a hill-climb optimises what
you measure and spends anything you did not. The first time it took a Rifleman off the Mughal
Host and improved the game; this time it took their cannons and ruined them. **Constrain the
identity, then optimise inside it.**

---

## 2026-08-18 — D033. Extreme hands do NOT balance better. Measured and rejected.

**Question asked:** could factions skip arms entirely — hold zero of two or three of them — and
would that extra freedom balance them better?

**Measured.** There are 170 legal hands per faction (10 units, lead arm strictly largest).
Sampled 260 whole combinations at random:

| worst deviation | empty arms across the five hands |
| ---: | ---: |
| **4.38** | **1** — the adopted hands |
| 9.96 | 4 |
| 10.96 | 5 |
| 11.44 | 5 |
| 11.88 | 10 |
| 13.73 | 8 |

**Not one sample beat the adopted hands, and the correlation is monotone: more empty arms,
worse balance.** The best random hand is more than twice as skewed.

**Why, and this is the reusable part: a faction with no answer to an arm is HARD-COUNTERED.**
Hold zero of something and an opponent who leans on the arm it cancels has a free win every
round for the whole game. Extremes do not average out — they open a hole that can be aimed at
indefinitely. Mild distributions are self-correcting; sharp ones are exploitable.

This retro-justifies the Mughal Host's single empty arm as about the right amount of
extremity: **one hole is a characteristic, four is a weakness.**

⚠️ 260 samples of a 170^5 space is not proof. But all five best samples are worse than the
adopted hands and the trend is consistent, so the direction is not in doubt.

---

## 2026-08-18 — D034. CORRECTION to D033: the variable is COVERAGE, not the number of empty arms

D033 concluded "one hole is a characteristic, four is a weakness". That was a curve fit
dressed as a principle, and the designer challenged it: why is the Mughal Host's missing
Rifleman fine when dropping arms elsewhere is not?

**The real mechanism, computed.** An arm you hold cancels the two arms it beats, so what
matters is whether your hand can still ANSWER all five arms:

| arms held | hands that can answer all five |
| --- | --- |
| **4 of 5** | **5 of 5** — dropping one arm never costs coverage |
| 3 of 5 | 5 of 10 — depends which two you drop |
| 2 of 5 | **0 of 10** — always a permanent blind spot |

**The Mughal Host holds ELEPHANT, CANNON, HORSEMAN, WARRIOR and answers all five arms.** It
cannot *field* riflemen but it can still *cancel* them, because Elephant and Warrior both beat
that arm and it holds four of one and two of the other. The hole is pure flavour and costs
nothing structural.

A hand missing three arms can have an arm it **can never cancel, for the entire game**. That is
not "worse against" — it is an opponent leaning on one arm every round with no possible answer.

**The rule to state on any future faction:**

> Drop one arm freely. Drop two only if they are not adjacent on the ring. Drop three and you
> have a hole that can be aimed at forever.

⚠️ Lesson: D033's numbers were right and its explanation was invented. When a measurement shows
a correlation, find the mechanism before writing the rule — the correlation with empty-arm
COUNT was real, but the cause was coverage, and the two come apart exactly where the designer
was pointing.


---

## 2026-08-18 — D035. Six of your own arm, one of everything else

**Ruling:** every faction holds **six of its lead arm and one of each of the other four**. One
sentence describes all five.

| Faction | Lead | Hand | Raw total |
| --- | --- | --- | ---: |
| Qutb Shahi of Golconda | ELEPHANT | E9 x6 · C7 H5 R3 W1 | 70 |
| The Mughal Host | CANNON | C7 x6 · E9 H5 R3 W1 | 60 |
| The Marathas | HORSEMAN | H5 x6 · E9 C7 R3 W1 | 50 |
| The Firangi | RIFLEMAN | R3 x6 · E9 C7 H5 W1 | 40 |
| The Berads | WARRIOR | W1 x6 · E9 C7 H5 R3 | 30 |

**Reason.** The designer rejected the previous compositions as bland, and was right: four of the
five were 2/2/2/2 with one arm bumped to 3, so a faction's "speciality" was three cards out of
ten. Only the Mughal Host read as anything.

⚠️ **I had foreclosed this space on a bad reading of my own data.** D033 found extreme hands
measured worse, but D034 established the cause was **coverage**, not extremity — and the random
sampler had only ever generated extreme hands with three and four EMPTY arms, which fail for a
different reason entirely. Bold hands that keep one of every arm were never tested.

**Measured, and the boldest option is also the best balanced:**

| Uniform pattern | Seat deviation | Faction deviation | |
| --- | ---: | ---: | --- |
| **6/1/1/1/1** | 3.6 | **5.0** | **8 gates, 8 pass, 0 warn, 0 fail** |
| 5/2/1/1/1 | 1.7 | 8.8 | warn |
| 4/2/2/1/1 | 2.5 | 10.9 | **fail** |
| 3/2/2/2/1 (previous) | 3.4 | 6.6 | warn |

**Why 6/1/1/1/1 is uniquely good:** it is the only pattern where a faction's NON-LEAD arms are
all identical. The asymmetry is exactly one-dimensional — which arm you hold six of — so the
five factions are pure rotations of one another. Give a faction a secondary arm and you add a
second axis, and the ring cannot flatten two at once.

**And it is a striking demonstration that the ring works.** Raw totals run from **30 to 70**,
more than double, and the factions still measure level. Nothing else in the design would
survive that.

⚠️ **Lesson, third time this session:** the constraint I imposed to protect the design (D032's
"lead arm strictly largest") was doing real work, but the SEARCH inside it was too timid. A
timid search inside a good constraint still produces a bland answer.

---

## 2026-08-18 — D036. A Spy's theft is PERMANENT

**Ruling:** when a Spy swaps, the two cards **change owner for good**. The stolen unit joins the
thief's force and the Spy joins the victim's, for the rest of the game.

**Reason:** the designer plays it this way and remembers it as the card's whole point. Their old
Law defined SWAP but left *"which army a swapped unit follows after the battle"* explicitly
undefined, so both readings were live.

**Measured, and it is free:** faction deviation 6.7 (battle-only) against 7.0 (permanent) —
inside the noise. Every other gate identical.

⚠️ **But be clear WHY it is free: the Spy seldom gets through.** A theft completes in only
**12% of two-player games, rising to 31% at eight.** Four filters stack — you must lose a
battle to recruit at all, draw the Spy from five broker types, choose to commit it, and get it
past the ring, where a Rifleman 3 or a Cannon 7 cancels it.

Taken anyway. A card that appears in one game in four and changes that game's shape for good is
worth more than one that fires every round and nudges a total. **If it should fire more often,
the lever is the Spy's arm** — HORSEMAN is cancelled by Rifleman and Cannon, two of the
commonest cards in the game.

---

## 2026-08-18 — D037. Every Power Broker states WHEN it acts: ON DEPLOY / ON REVEAL / ON DEFEAT

**Ruling:** three timing keywords, printed on every broker.

| | |
| --- | --- |
| **ON DEPLOY** | As the card is committed, before anything is revealed. **Beats the ring** — the card has not been contested yet. Siege Elephant only, and it is face up *because* it acts before the ring. |
| **ON REVEAL** | The abilities step of the battle: ring first, then abilities. **Survivors only.** |
| **ON DEFEAT** | After the ground is decided, if the card survived the ring and its army did not take the ground. |

**Reason:** the ordering rule existed but lived only in a rulebook sentence — *"the Siege
Elephant's look happens when you deploy it… every other ability needs its card to survive the
ring first."* Nothing on the card said so, and *"does my Spy still steal if a Rifleman cancelled
it?"* was answerable only by going back to the book.

**The keywords also shorten the cards.** The Rockets no longer say "if your army loses" and the
Spy no longer explains what permanence means — the keyword carries it.

**ON REVEAL is the abilities step, NOT the Charge.** Both armies turn face up at the Charge, but
nothing resolves until the ring has been read off them.

⚠️ **The Sepoy is ON REVEAL and does not need a fourth static keyword.** Its condition (ALONE) is
fixed the moment both armies turn face up and cannot change afterwards, and because the effect
touches only the Sepoy's own strength, a cancelled Sepoy totals 0 whether doubled or not — the
timing is inert for it. ALONE counts the **revealed** army, so a cancelled army-mate still counts
as company. This matches `battle.mjs` exactly (`army.length === 1`), which was already the
behaviour before the keyword named it.

**Consequence:** the Siege Elephant's effect verb became **LOOK**, freeing REVEAL to be a timing
word. That was the rulebook's own original wording.

**Measured: nothing.** The change is documentation — the resolver reads `faceUp`, never `text` or
`when`. Verified by stashing and re-running: gates bit-identical.

---

## 2026-08-18 — D038. The supply gate derives its own size

**Ruling:** the "Power Brokers drawn per game" gate takes its thresholds from `SUPPLY_SIZE`
(88% of the supply to pass, running it dry to fail) instead of the literals 22 and 25.

**Reason:** `gates.mjs` reported `"of 25"` and gated at `pass <= 22 / fail > 25` — thresholds
inherited from a 25-card supply. The supply is 20. **Against 20 those thresholds could never
bind**, so a gate reading "the supply must not run dry" had silently stopped measuring anything.
It now reads `16.3 … the supply of 20 must not run dry` and has real headroom.

⚠️ **The general lesson: a gate with a hardcoded literal stops being a gate the moment the design
moves.** Every threshold that describes a proportion should be written as one.

---

## 2026-08-18 — D039. The Sepoy's alone bonus is ×3

**Ruling:** `SEPOY_MULT = 3`. A lone Sepoy fights at 12.

**Measured** — a lone Sepoy against all 55 possible enemy armies of 1–3 Force units:

| multiplier | fights at | takes the ground |
| --- | ---: | ---: |
| ×2 | 8 | 23.6% |
| **×3** | **12** | **32.7%** |
| ×4 | 16 | 34.5% |
| ×∞ | — | 34.5% |

⚠️ **The multiplier saturates, and the ceiling is structural.** 36 of the 55 armies contain an
ELEPHANT or a WARRIOR — the two arms that cancel RIFLEMAN — and a cancelled unit contributes 0
however large the multiplier. At ×4 the losses are *exactly* those 36. **A Warrior 1, the
cheapest card in the game and held by every ruler, blanks a lone Sepoy at any multiplier.**

×3 buys 95% of the available headroom; ×4 buys 1.8 points more and nothing beyond. Whole-game
gates are flat across all three: faction deviation 5.2 / 5.3 / 5.3.

**LESSONS C2 no longer binds, and is marked superseded for DECCAN II.** C2 records that a ×3
alone multiplier once made a one-card army the best army in the game at 95.6%. That happened
**because lone units were untargetable**. DECCAN II targets them: a lone Sepoy is its army's
strongest *and* weakest unit, so the ring cancels it and a Subhedar removes it. The win rate is
capped at 34.5% by construction and the C2 failure cannot recur.

**Not a lever for making the Sepoy matter more:** every arm has exactly two killers, so every
arm's ceiling is the same 19-of-55. Moving the ability changes *which* armies blank it, not how
many. The only lever that raises the ceiling is cancellation immunity.

---

## 2026-08-18 — D040. CORRECTION: a borrowed unit never earns the alone bonus (LESSONS C4)

**Ruling:** a unit that changed hands through a Spy's exchange fights at its printed strength for
its new army, however alone it is left there. `battle.mjs` marks both exchanged cards `borrowed`
and the alone bonus checks the flag.

**This was a live bug, not a clarification.** `value()` checked only
`broker === "sepoy" && army.length === 1`, with **no ownership test**, and totals are computed
*after* swaps. A Spy could steal a Sepoy into its own one-unit army and fight at the doubled
value. Exhaustive search: **reachable in 470 of 81,225 matchups**, e.g.
`[Warrior+Warrior+Sepoy] vs [Cannon+Spy]` — the thief takes the ground **6 to 12**, on a card
they do not own.

**This is exactly LESSONS C4**, recorded from the old game — *"a single Spy once beat a lone
Elephant outright by stealing it into its own one-unit army"* — and it had been reintroduced.
D039's ×3 raised its payoff from 8 to 12, which is what prompted the search.

**Fixed and verified: 470 → 0.** Gates unchanged at 5.2.

⚠️ **`OPEN.md` claimed "checked line by line… nothing diverges."** It did diverge. A
reconciliation pass that reads for agreement will not find a missing guard — only adversarial
search will. The flag is set on **both** exchanged cards so any future conditional bonus inherits
the guard rather than having to remember it (LESSONS C5).

---

## 2026-08-18 — D041. The Sultan Rockets deploy FACE UP

**Ruling:** the Rockets are committed face up. Two brokers now trade in information — the Siege
Elephant **buys** it, the Rockets **are** it.

**Reason:** a hidden scorch does not create a read. Broker identity was a 4-of-20 shuffle; times
the chance the card is committed, times it surviving CANNON's killers, the prior is mostly noise.
A threat nobody can price is variance, not deduction. Face up, the winning side can decide in the
open whether a ground is worth their recovery, and the holder pays surprise for it.

**Measured: balance-neutral.** Faction deviation 5.2 → 5.1 at 12,000 games; all eight gates keep
their verdict. (At 4,000 games it read 5.6 → 6.0, which did not survive the larger sample — a
reminder that this gate's noise band is roughly ±0.4.)

⚠️ **The gates could NOT test the actual hypothesis, and this must not be read as if they had.**
`rockets` appears nowhere in `scoreMove`; it exists only in resolution and in the stats counters.
The simulated players never fear the burn and never price their recovery. What the run measured
is the **ring channel** — a visible CANNON 8 that opponents route around — which is a side effect
of the change, not the change. Whether the deterrent is *fun* is a table question.

**One real signal from the ring channel:** the worst faction shifts from badshah to peshwa at
5p/6p/8p and holds at 12,000 games. A visible cannon lets the arms that fear cannon dodge it,
while the cannon specialist loses the surprise it was trading on.

---

## 2026-08-18 — D042. The five brokers pay in different currencies

**Not a ruling — a measurement**, recorded because it governs every future "is this broker weak?"
question.

Each broker in every army of 1–3 against every enemy army of 1–3, compared with its own arm's
Force unit (the "+1 shadow" of D029):

| broker | vs counterpart | takes the ground | marginal |
| --- | --- | ---: | ---: |
| Sepoy 4 | Rifleman 3 | 67.4% | +10.0 |
| Siege Elephant 10 | Elephant 9 | 65.1% | +0.4 |
| **Subhedar 2** | Warrior 1 | 64.1% | **+12.1** |
| Sultan Rockets 8 | Cannon 7 | 60.5% | +0.4 |
| Spy 6 | Horseman 5 | 52.1% | **−6.8** |

**The Subhedar has the highest marginal value in the set.** Remove-the-weakest is not a weak
ability and does not need replacing — a question asked twice and now answered with a number.
(Caveat: marginals are measured against different baselines. The Warrior 1 is the worst card in
the game, so the Subhedar has the most headroom; the **absolute** column is the fairer read, and
there it sits third of five.)

**Two brokers contribute essentially nothing to taking the ground** (+0.4 each) and one is
actively **negative** (−6.8). That is by design, not a fault: the Siege Elephant trades in
information, the Rockets in denying a winner their recovery, the Spy in permanent card advantage
across the whole game. **No single metric can rank this set**, and any that appears to is
measuring one currency and calling it value.

---

## 2026-08-18 — D043. The recruit chooser must be ability-aware

**Ruling:** `pickFromOffer` scores a broker as expected points —
`pSurvive × (0.5 + GROUND) + live × OFFAXIS` — where `GROUND` is the measured marginal from D042
and `live` uses the D037 timing keyword (ON DEPLOY beats the ring, so the Siege Elephant's
information does not require the card to survive).

**Reason:** the first version scored strength × survival. Being blind to what a card *does*, it
ranked the printed 2 last **by construction** and reported the Subhedar as the least-wanted
broker at 15.2% — when D042 shows it is the highest-marginal card in the set. A chooser that
cannot see abilities will answer every "which broker is weak" question with the strength order.

⚠️ **`OFFAXIS` is a STATED JUDGEMENT, not a measurement, and cannot be measured from this repo** —
information, denial and permanent theft are invisible to a ground metric. The three values (siege
0.25, rockets 0.35, spy 0.40) are documented with their reasoning in `game.mjs` and are
env-tunable **so that conclusions can be sensitivity-tested rather than believed.**

**Pick rates, and what survives the sweep:**

| off-axis | Elephant | Rockets | Spy | Sepoy | Subhedar | worst gap from 20% |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| zero (ground only) | **15.9** | 22.1 | 19.0 | 21.9 | 21.0 | 4.1 |
| halved | 22.0 | 21.7 | 18.0 | 20.0 | 18.3 | **2.0** |
| default | 22.6 | 21.9 | 18.7 | 19.5 | 17.3 | 2.7 |
| doubled | 22.8 | 22.1 | 19.9 | 18.9 | **16.3** | 3.7 |
| flat 0.33 | 22.8 | 21.8 | 18.2 | 19.6 | 17.6 | 2.8 |

**Robust — holds at every setting:** the Rockets are always the most-taken (21.7–22.1%), even at
zero ability value, purely on survival odds; the Spy is always under 20%.

**Assumption-driven — NOT findings:** the Siege Elephant swings 15.9% → 22.8%, the widest in the
set. **At zero information value, a printed 10 is the worst card in the offer**, because ELEPHANT
is cancelled by WARRIOR, the cheapest and most abundant card in the game. The entire case for the
Siege Elephant is that ON DEPLOY beats the ring. The Subhedar swings 21.0% → 16.3% and *changes
sign*.

**On the design goal that all five choices be equal: they effectively are** — worst gap 2.0–4.1
points depending on assumptions, across five cards paying in three currencies.

---

## 2026-08-18 — D044. THE OFFER: three brokers face up. Built, measured, NOT adopted

**Status: implemented behind `BROKEROFFER=1`, default off, pending one unresolved signal.**

**The rule:** three brokers lie face up from setup. A defeated player **chooses** one and it is
topped straight back up to three.

**Reason:** a blind 4-of-20 draw makes broker identity unreadable, so any decision keyed to *"do
they hold X"* is a gamble rather than a deduction. Face up, taking is a public choice that tells
the table what you think you need, and what you hold becomes countable exactly like a Force — the
property that makes a read possible at all.

**The choice bites, mildly.** Blind draw comes out uniform to within 0.2% (a clean check that the
harness measures what it claims); the offer opens a 5–7 point spread. See D043.

⚠️ **Emergent: the offer becomes a sink for the card nobody wants.** With three slots and five
kinds, the least-wanted broker clogs a slot and the live choice is effectively two, not three.

⚠️ **THE FINDING THAT MATTERS MOST: the simulation has ALWAYS assumed broker identity is
public.** `available()` filters the whole hand — recruited brokers included — and `pools` hands
every opponent their arm and strength via `scoreMove`. **Every balance number this project has
ever produced was computed under public brokers.** Two consequences: the gates cannot show the
offer's deduction benefit, because the baseline already had it; and the change brings the physical
game into line with what the model has assumed all along, which makes the existing gates *more*
trustworthy under the offer than under a blind draw.

⚠️ **Why it is not adopted yet.** Faction deviation with the offer has come in higher in **three
consecutive measurements** (5.3→5.6, 5.2→6.0, 5.2→6.0) against a fail line of 10. Each move alone
sits inside the ±0.4 noise band; three in the same direction is a pattern. **Resolve before
adopting, not after.**

**Sub-rules still unspecified:** multiple defeated players currently choose in the order they
committed — turn order and fewest-points-first are both live candidates, and it matters, because
first pick of three is a real edge. Also unresolved: whether the offer is persistent (as built) or
**refreshes each round**, discarding what was not taken — that reading would clear the clog by
itself but burn through a 20-card supply far faster.

---

## 2026-08-18 — D045. THE REFUSAL FORK: built, measured, NOT adopted

**Status: implemented behind `REFUSALFORK=1`, default off. A rules change, awaiting a table test.**

**The rule:** a refused unit **lands in the other army** instead of vanishing, unless there is
nowhere legal for it to go.

**Reason:** the blind accept/refuse is the best yomi moment in the game and carries almost no
stake, because "a refusal does not end your turn." Making the refusal *re-aim* the card turns it
into a two-sided read — *"accept me, or I strengthen the people you are fighting"* — and adds
**zero cards**.

**It fires hard:** 17.1% (8p) to 27.7% (2p) of all offers are re-aimed. Offers themselves fall
(70.6k → 57.7k at 8p) because leaders accept more readily.

**Measured, stable at 4,000 and 12,000 games:**

* **Sitting out collapses** — 9%→5% at 4p, 16%→11% at 5p, 36%→33% at 8p.
* **Alliances rise** — 83%→90% at 3p; at two players 3%→7%.
* Rounds, game length and the on-target rate are untouched.
* Faction deviation is **inconclusive**: 5.6→5.4 at 4,000 games but 5.2→5.6 at 12,000. It moved
  both directions depending on sample, so the honest reading is *no detectable effect*.

⚠️ **The trade, stated plainly: sitting out was designed, not accidental.** *"Passing is not
folding"*, and `OPEN.md` records it as a real and frequent choice. The fork **relocates decision
density** — from "should I commit at all" (a solo decision) to "should I accept this" (a two-sided
read). That is arguably the upgrade, but it is a trade, and it reshapes the 5–8p game most.

⚠️ **What the model cannot see:** `accepts()` is two fixed probabilities keyed on army size. **A
probability cannot bluff, and cannot be bluffed** — and the bluff is the entire appeal. The run
shows the rule is structurally safe and moves the game's shape measurably; it cannot show whether
the bluff plays well. Two players needs a specific look: there, "the other army" is your
opponent's.

**Method note, applying to D041 and D044 as well:** the decision logic was changed *with* the
rule, and **without a new tuned constant** — the leader keeps the same two probabilities, and only
the board being compared changes ("would another army be bigger than mine once my refusal lands
there?"). **A mechanic whose decision function ignores it is untestable**: the lever adds noise
and the gates measure nothing. That is precisely what happened with the face-up Rockets in D041,
and it is the trap to check for before trusting any lever in this repo.

---

## 2026-08-18 — D046. EIGHT CARDS PER RULER: 64 units + 15 brokers = 79 cards. ADOPTED

**The change:** every ruler's Force goes from seven units to **eight**, the supply from twenty
Power Brokers to **fifteen** (three of each rather than four), and the box from 76 cards to 79.
Eight rulers is unchanged.

**Reason: the seven-card deck space was too coarse to tune with, and that is measurable.**
Seven cards over five arms with no zeroes leaves two spare cards, so exactly **15 decks exist**.
Every legal single-card move swung a faction **5–9 points** of win rate against a **5-point
gate** — the only available lever had worse resolution than the target. Two rulers could not be
fixed at all: Peshwa (+4.2) had four legal moves, two of which duplicated another ruler and two
of which measured worse; Badshah (−4.7) sat between "3 Cannon" (too weak) and "2 Elephant +
2 Cannon" (+5.9, too strong) with **nothing in between**, because those two decks differ by two
points of raw strength and nine points of win rate. At eight cards there are three spares and
**35 decks**, and a slot can be re-aimed without overshooting.

**Result — every gate passes, and the faction warn that stood for the whole project is gone:**

| | 7 cards (shipped) | 8 cards (this) |
| --- | ---: | ---: |
| worst faction deviation, 3 seeds | 4.6 / 5.3 / 5.9 | **4.0 / 4.4 / 4.5** |
| RMS over all faction × count cells | 2.31 / 2.37 / 2.67 | **1.74 / 1.78 / 1.78** |
| worst at two players (80k duels) | 5.0 | **3.0** |
| decks available to tune with | 15 | 35 |

**THE PATTERN THE SWEEPS FOUND: a ruler needs the arm that answers its own predator.** Sultan's
Elephants die to Warriors, so the Sultan fields Warriors (`4E` → `3E 2W`, fixing −5.6 at two
players). Badshah `4C` → `3C 2W` fixed −6.1 at three. Rana `4W` → `3W 2H` fixed −6.4 at two.
Three independent slot sweeps landed on the same shape, and it is the same Cannon+Warrior move
that was the only working fix found in the seven-card game.

⚠️ **ROTATION IS DEAD AS A ROSTER GENERATOR.** Every earlier roster was one shape rotated to each
lead arm. That cannot be fair while **strength is welded to the arm** — the same note already
recorded against the strength ladder. Measured on a nine-card variant: the shape `3-2-2-1-1`
gives the Horseman-led ruler three Elephant-killers *and* two Elephants (+7.0) and the
Elephant-led ruler Riflemen and Cannons (−8.0). Identical shape, 15 points apart. Rotating the
pairs onto different arms only moved the crown (gate 8.0 → 11.2). The roster is now written out
arm by arm and each ruler is chosen by sweeping its slot against the whole roster.

**Rejected on the way:**
* **Badshah as a V-shape dropping the Warrior** (`1E 1R 2C 2H 0W`) — a wash at 12,000 games
  (gate 5.0 → 5.1). The 3p gain that made it look good was a 4,000-game artifact.
* **Seven rulers of nine cards** (63 + 15 = 78). The economy held — 100% on target — but every
  rotation-built roster measured worse (gate 8.0 and 11.2), and 9 cards is more card than the
  tuning problem needs.
* **Fixing Governor and Nawab.** Both were swept over all 28 legal decks against the final
  roster and both **already rank 1st**. Decks that flatten Governor itself (−4.0 → −0.8) make the
  roster worse (RMS 1.76 → 1.92), because deviations are win shares and sum to zero: the slack
  has to sit somewhere, and spread thin across two rulers is the flattest arrangement there is.

**The roster is coordinate-wise optimal:** no single ruler's deck can be changed to improve it.
That is weaker than a global optimum and is stated as such.

⚠️ **NEW WARN: the Power Broker supply.** Fifteen brokers are drawn down to **13.9 of 15** at
eight players, against a gate wanting 12% left undrawn. **No game in any run ended by
exhaustion** — 100% still end on the victory target at every count — and the rulebook now says an
emptied supply is reshuffled from the discards. Every number in this entry was measured **without**
that reshuffle, so the recycling rule is adopted but **unmeasured**; it can only loosen a
constraint that never bound.

**METHOD NOTE, and it invalidates some earlier readings.** The headline gate is a **max over 56
noisy cells**, and it swings **4.6 → 5.9 across seeds at 12,000 games** on the unchanged shipped
roster. `OPEN.md` recorded "±0.4 at 4,000 games", which understates the real spread by about 3×.
Two comparisons in this session flipped sign between seeds while a dedicated 2-player harness —
80,000 duels, 8× the samples per matchup — was unanimous. **RMS across all cells is the stable
statistic and should be quoted alongside the max.** Any conclusion drawn from a single seed's
gate value is unsafe.
