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

---

## 2026-08-18 — D047. THE VICTORY POINT RESTORED, and the roster retuned to it. ALL GATES PASS

**The rule:** one point per ground, to the **largest contributor**, ties share. Contribution
counts **units committed** — not strength, and not survivors.

**Why:** D046 shipped one point per *surviving unit*. That paid three points for three survivors,
so a four-point target was reachable in **two battles**. It measured *well* on fairness while
being a worse game, and a player report caught it, not a gate: no time for a read on anyone, and
contribution stopped meaning what you dared to commit.

| | per-survivor (D046) | contributor (this) |
| --- | ---: | ---: |
| shortest game | 4.4 rounds | **6.5** |
| longest game | 7.9 rounds | **7.1** |
| two-round games | yes | none |

⚠️ **UNITS, NOT STRENGTH — and this is the part worth keeping.** The original game measured
contribution by base Strength, and that was fair *there* because every player held an identical
Force. Eight asymmetric rulers break it: a ruler holding a second Elephant commits 25 in a round
where another can only reach 21, so it takes the point almost every time. **Measured 10.9
deviation against a gate of 5.** Equalising deck totals reached only 9.5. Equalising the top three
commitables reached 7.4 and stopped — because on the 9/7/5/3/1 ladder **no sum of three spare
cards is shared by more than two decks**, so eight near-symmetric rulers do not exist. Counting
units is immune to all of it. `SPOILS=strength` restores the original measure for comparison.

**The retune, each slot swept over all 28 legal decks:**

* **Governor** four Riflemen → **3R 2W** — ranked 13th of 28, now 1st
* **Nawab** 3R 2C → **2R 3C**
* **Sultan** three Elephants → **2E 2R 2W** — this one came from the designer, not the sweep.
  Three Elephants was wrong for the game regardless of what it measured; of the ten legal
  two-Elephant decks the sweep then confirmed this is the best.

**Result: 9 pass · 0 warn · 0 fail** — the first in the project's history. Faction deviation
**4.8 / 4.8 / 4.7** at 7,000, 9,000 and 15,000 games. The Power Broker supply warning cleared with
it (13.1 of 15).

**Two bugs found in the online client while doing this, both worth recording:**

1. **Recovery was invisible.** `rest` alone cannot distinguish "on the ground now" from
   "recovering": a unit committed this round is set to `round + 1`, and a unit that won is set to
   `round + 2` before the round advances — so both read as `round + 1` at view time. Every
   recovering unit was labelled *committed*, so recovery looked like it never happened. The board
   is now the discriminator. Burning was always correct.
2. **A recruited Power Broker arrived silently.** There was no event feed at all. There is now,
   and it narrates every action and every battle beat.

⚠️ **METHOD, and it nearly shipped a false result.** An intermediate roster read **4.7 at 6,000
games and 6.4 at 12,000** — a pass and a warn from the same design. **Three samples are the
minimum** before a gate result is believed, exactly as `OPEN.md` warns.

---

## 2026-08-19 — D048. THE CHARGE. The ground is no longer won, and the ring became the scoring

**The game changed shape.** There is no round, no higher total, no victor and no defeat. There is
a front line, and there is killing, and you are paid for what you kill.

* Units commit **face down** into one of two armies and **stand there**.
* A **senior partner may CALL THE CHARGE**. Everything reveals, the ring fires once, the cancelled
  die, and every survivor stays on the ground **face up**.
* **One Victory Point per enemy unit your units cancelled.** Four kills wins.
* **Lose units and you recruit a Power Broker** — compensation for CASUALTIES now, not for defeat,
  because there is no defeat left to have. "Losers get the better cards" survives intact.
* Deploy, withdraw, charge and pass are **separate actions**; a turn is exactly one of them.

**Why it is better, measured:** faction deviation **4.1**, against a best of 4.7 for the old
round-and-ground game — and it holds at 2.0–4.1 across every player count. **Scoring by kills is
structurally fairer than scoring by winning**, because every ruler can kill whatever it holds,
whereas winning a ground rewarded whoever drew the better arms for that contest.

⚠️ **EQUILIBRIUM IS ALSO DEADLOCK, and withdraw is not optional.** After a charge every survivor
is by definition unable to cancel anything opposite it — that quiet front is the design's whole
appeal. But equilibrium on a FULL board means no kills are possible and no unit can enter.
Measured without withdrawal, **roughly half of all games stalled at every victory target**. Adding
it took completion from ~50% to 100% at four players and up. The mechanic that looked like a
nicety in the old game is load-bearing here.

⚠️ **The target is four and was chosen, not inherited.** Measured at 3, 4, 5, 6 and 8: four is
where every game from four players up reaches the target. Higher targets only lengthen an already
long game without improving fairness.

⚠️ **THE OPEN PROBLEM IS LENGTH.** 206 turns at eight players, against roughly 56 for the old
game. The withdrawal churn that unjams the board is exactly what inflates it. This is the one
gate still warning and the next thing to solve.

**What this obsoletes.** `sim/game.mjs` and `sim/gates-round.mjs` keep the old round-and-ground
game for reference. The rulebook, `CARDS.md`, `PLAYER_AID.md`, `web/STATE_INVENTORY.md` and the
whole online client still describe that game — **the deployed game and the designed game have
diverged**, and closing that gap is the work that follows this entry.

## 2026-08-19 — D049. Seniority passes on surviving strength, as the rulebook always said

**A bug, not a design change.** The rulebook has always read "after a charge, the senior partner
of each army is the player with the greatest surviving strength in it." The code reassigned
seniority **only when the incumbent had no survivors left**, so a senior partner reduced to a
Warrior 1 kept command over an ally standing with an Elephant 9.

Command is the right to call the charge, so the wrong holder is a real advantage handed
permanently to whoever happened to deploy first. Ties keep the incumbent, as written.

Measured: no movement on any gate. But the rule now **fires** — "command passes" occurs 259 times
across 40 six-player games, where before it was near-silent. That matters because seniority
became visible in the client the same week.

## 2026-08-19 — D050. THE MARKET. Three Power Brokers face up, and the worst-hurt casualty chooses

**Compensation stopped being a lottery.** Three brokers lie face up beside the supply. Every
player who lost at least one unit takes **one** — one only, however many units they lost — and
they choose in order of **total STRENGTH lost**. Ties break on units lost, then turn order. Only
three are on offer, so a fourth casualty takes nothing. The row refills after every charge.

* ⚠️ **Ordered by seniority first, and that was wrong.** Seniority is greatest *surviving*
  strength, so it handed the pick of the row to the casualty who was hurt least, and a player
  wiped out entirely picked last. Brokers exist to arm whoever is being killed most; the order
  has to run on what you LOST.
* ⚠️ **Then ordered by unit count, and that was also wrong.** Counting units made two Warriors
  (2 strength) outrank one Elephant (9). Strength is the measure; unit count is only a tiebreak.
* **D045 applies:** a choice the decision function ignores is untestable, so `chooseBroker` is a
  real preference — take the arm you are thinnest in, tie-break on strength.

Measured across 2,500 games: blind draw 5.3 faction deviation, market 6.0 (seniority) / 5.8
(damage). All inside the noise band, so **the market is balance-neutral** and was bought with
agency and public information rather than numbers.

## 2026-08-19 — D051. One unit, one turn — so defection needs a single standing unit

Defection used to move your whole contingent. It now moves **one unit, and is legal only when
that is all you have standing**. Two units cannot both cross, because that is two actions in one
turn; and one cannot cross alone, because that would leave you in both armies, which no rule
allows.

**So betrayal takes preparation.** Withdraw until one unit remains, sit through its recovery,
then cross. An ally thinning out is visibly getting ready to leave — the tell is the point.

Measured: faction deviation **6.0 → 4.1**, the best reading the game has had with the market in.
Restricting defection did more for balance than any broker tuning.

## 2026-08-19 — D053. PARITY RESTORED against THE CHARGE, and it found two real bugs

*(D052 is skipped: `sim/charge.mjs` already cites it for the ARMBITE experiment, which has not
been written up yet.)*

**`npm run parity` had been dead for a day and nobody could tell.** `web/parity.mjs` still
imported the round-and-ground `sim/game.mjs` — and called `playGame(factions, target, seed)`,
a signature `charge.mjs` no longer has, so it was seeding the model with the victory target. It
reported **3477 divergent games of 3500** and that number meant nothing at all.

⚠️ **A harness pointing at the wrong model is worse than no harness**, because it reports a
catastrophe every run and trains you to ignore it. When the model changes shape, the harness is
the first thing that has to be rewritten, not the last.

**The harness now compares turn by turn, not outcome to outcome.** `playGame` takes an optional
read-only `opts.onTurn` observer, and both sides record one line per turn — clock, seat, action,
scores, supply, and both armies down to who owns which card and whether it is face up. The report
prints the **first line they part on** with its run-up. Everything after that first line is a
consequence, not a finding.

**It immediately found two bugs, and neither was visible in the final scores.**

**1 · Bluffs were being paid for out of the game's own randomness.** `botAction` drew a bot's
declaration with `declarationFor(unit, s.rnd)` — the same stream the model uses to *choose*. A
claim decides nothing (nothing in the policy reads one), but drawing it consumed a number, and
**every decision after the first deploy came out different**. The online game had drifted off the
measured one because of a card's small talk. Declarations now run on their own stream.

**2 · The clock was ticking in the wrong place, and not at all on a charge.** The model spends
`g.turn` when a turn *starts*; the engine spent it at the end, so a withdrawn unit's `readyAt`
landed one turn early and **every withdrawal recovered a turn sooner online than in the gates**.
Worse, `case "charge"` never called `endTurn` at all — so calling the charge cost no clock, broke
no idle run, and **handed the whole table a free turn of recovery** the measured game never gives.

**Measured: 21,000 games across 2–8 players, every turn of every game identical.** Gates
unmoved (4.5 / 2.8 / 82% / 60 turns), `npm run smoke` still passes over the wire.

**The standing lesson: parity is not a formality, and it is not a statistical test.** Both bugs
were invisible in `end`/`vp`/`winners` on most games and would never have shown up in a gate —
they are the kind of drift that makes the played game quietly easier than the measured one.

## 2026-08-19 — D054. THE SIMPLE MODEL: no ring, damage only, three abilities. IT WORKS

**The ring is gone.** Nothing beats anything. A unit deals its STRENGTH as damage to ONE enemy
unit of its choosing, and dies when the damage on it reaches its strength. Strength is what you
deal and strength is what you survive, and that is the whole combat system.

> ELEPHANT 5 · CANNON 4 · RIFLEMAN 3 · HORSEMAN 2 · WARRIOR 1 · SPY 1 · SCOUT 1 · SLINGER 1

**Three abilities exist in the game**, all printed on strength-1 units: the **SLINGER** kills the
highest enemy unit, the **SPY** exchanges itself with the highest enemy unit permanently, the
**SCOUT** turns one hidden enemy unit face up. No Power Brokers, no supply, no market, no timing
keywords, no combos. Eight rulers of nine cards, 72 in the box.

**WINNING UNITS STAND, LOSING UNITS RECOVER.** Nothing is ever destroyed: a killed unit goes home
and sits out a lap. One victory point per enemy unit killed, four to win. Deploy, withdraw,
defect and the charge are unchanged.

⚠️ **THE ONE RULE THE MODEL RESTS ON: THE BATTLE IS A SINGLE SIMULTANEOUS REVEAL.** Every blow
and every ability lands in the same instant, and nothing is conditional on its carrier living.
This was built the other way round first — abilities only for survivors — and it does not work,
for a reason worth keeping. **A strength-1 unit lives through 15% of charges at three players and
5% at six**, because every attacker can finish a 1 and almost none can finish an Elephant, so all
the spare damage lands on the smallest cards on the table. Gated behind survival, the Spy and the
Scout resolved **0.05 times per game**. They were not weak cards; they were cards that did not
exist. Simultaneous, they resolve **1.2–2.8 times**, and the signature gate moves from a 7.0 warn
to a 2.8 pass.

⚠️ **Raising their price in the policy did nothing** — at 4× the valuation the Spy still swapped
0.13 times a game. The constraint was never how much a bot wanted the card. It was the rule.

**Measured, 10,000 games per player count, placeholder roster:**

| | |
| --- | ---: |
| games decided on the target | 100% at every player count (see D055) |
| worst seat deviation | 4.1 |
| worst signature deviation | 2.8 |
| game length | 3.0–3.5 charges, 37–65 turns |
| kills per charge | 1.76 – 5.85 |

**7 gates · 7 pass · 0 warn · 0 fail**, and it holds across samples — signature deviation reads
**6.1 / 3.3 / 2.8 at 2,000 / 6,000 / 10,000** games, the usual behaviour of a max over many cells.

**THE ROSTER IS A PLACEHOLDER AND THAT IS DELIBERATE.** Ruler *i* holds one of every type plus a
second of its own, so the faction column is not a verdict on eight finished rulers — it reads
**what ONE extra card of each type is worth**, which is the evidence the real compositions get
built from. Across 3–8 players every signature lands between **0.97 and 1.04** of a fair share.
The Elephant is the best card in the game at **1.04** and the Slinger is second at **1.03** —
the heaviest unit and the card that answers it, priced within a point of each other without
anyone tuning them. **That is the trade the whole model rests on, and it holds.**

**What is NOT settled:** the eight compositions. (The two-player game was the other open item and
is closed in D055.)

## 2026-08-19 — D055. THE TWO-PLAYER GAME, and why the ground cannot pay

**Two players reached the victory target only 76% of the time**, and 40% of the failures ended
with NOBODY on any points — the game was not stalemating near the finish, it was never starting.

**The cause was the ending condition, not the design.** "Nobody can or will act" was a full lap of
passes, `n * 2` — which at eight players means sixteen refusals in a row and at TWO players means
each of them passing twice. **A floor of 8 takes 2p to 100%** and is provably free from four
players up, where `n * 2` already exceeds it. It saturates: 8, 10, 14 and 20 measure identically.
**All seven gates now pass at every player count.**

## The scoring rule: six were measured, one works

| rule | target | on target | seat | signature | turns | kills/charge | gates |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| **1 VP per kill** | 4 | 100% | 4.2 | 3.5 | 79 | **1.76** | **7 pass · 0 · 0** |
| hold — every ally in the winning army scores | 4 | 100% | 5.5 | 3.3 | 64 | 0.17 | 5 · 1 · 1 |
| hold | 7 | 100% | 4.7 | 3.0 | 121 | 0.14 | 5 · 1 · 1 |
| hold, top contributor only | 4 | 100% | **18.8** | 3.5 | 80 | — | 5 · 0 · 2 |
| hold, but only if blood was drawn | 4 | 99% | 3.7 | 7.3 | **352** | 1.43 | 5 · 1 · 1 |
| kill + hold | 4 | 100% | 7.7 | 4.1 | 24 | 0.30 | 4 · 2 · 1 |

⚠️ **WHEN THE GROUND PAYS, KILLING IS A COST WITH NO RETURN.** You spend a card to lower the
enemy's total — but the same point comes from simply HAVING the bigger total, which is cheaper.
Every version of paying-for-the-ground hits this, and the two escapes are the two failures above:
let it be bloodless (a two-player game contains 0.7 deaths across 4.1 charges, and the Slinger,
Spy and Scout each fire 0.1 times) or require blood (nothing pays until someone dies, so the game
grinds to 352 turns at target 4 and 555 at target 6). **Killing pays for itself only when killing
IS the point.**

⚠️ **Raising the victory target is not a lever on this.** Across targets 4, 5, 6 and 7 the hold
rule reads 0.17 / 0.15 / 0.14 / 0.14 kills per charge — it gets slightly MORE bloodless, because
each extra battle needed is another battle better won by comparison than by fighting. What the
target does move is seat fairness (5.5 → 4.7, passing at 7) and length (64 → 121 turns).

⚠️ **"Top contributor only" measured 18.8 seat deviation, but part of that is a bad tie-break**
copied from the killing-blow rule — ties broke on lowest seat, the exact anti-pattern D053 names.
It was not re-measured with a fair tie-break, because the design objection stands on its own:
**paying only the largest contributor makes joining an ally's army pay nothing**, which turns the
alliance into an arms race between allies. That is a rule about the politics, not about a number.

**ADOPTED: one victory point per enemy unit killed, first to four.** The trade the designer named
is what it delivers — commit more and you can kill more, but you have put more on the table to be
killed.

## 2026-08-19 — D056. NO WOUNDS. A unit that is not killed stands back up whole

An Elephant 5 that takes 4 and lives is an Elephant 5 again at the next charge. Damage is
resolved and forgotten; only death persists, and even death only sends a unit home to recover.

**Why it is the right rule and not just the simple one:** a wound can only ever happen to a heavy
unit. Measured over 4,000 games at six players, of every unit that stood in a charge —

| | ELEPHANT | CANNON | RIFLEMAN | HORSEMAN | WARRIOR · SPY · SCOUT · SLINGER |
| --- | ---: | ---: | ---: | ---: | ---: |
| survived **wounded** | 24% | 14% | 9% | 6% | **0%** |

**A strength-1 unit can never be wounded, because anything that reaches it kills it.** So
"wounds carry" is not a general rule at all — it is a rule about Elephants, and to a lesser
extent Cannons, and it touches nothing else in the game. It would also put a damage token on the
table in a game whose whole premise is that a card is a name and a number.

⚠️ **The WOUNDS lever was inert when first built** — the wound was written to the card in hand
and read back off the card on the ground, so `WOUNDS=1` measured identically to `WOUNDS=0` and
would have been reported as "persistent damage changes nothing". It is fixed and kept, off by
default, so the rule can be re-tested rather than re-argued. **Every gate result in D054 and D055
was measured with wounds off, which is now the adopted rule.**

## 2026-08-19 — D057. SEVEN KILLS TO WIN — five at two players — and the clock became a gate

**More battles is less variance.** Under VP-per-kill, raising the target moves fairness and
nothing else breaks:

| target | 4 | 5 | 6 | **7** | 8 | 10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| worst seat deviation | 4.6 | 3.6 | 3.6 | **3.0** | 3.1 | 3.1 |
| worst signature deviation | 4.1 | 4.1 | 4.1 | **3.5** | 3.9 | 3.7 |
| games on the target | 100% | 100% | 100% | 100% | 100% | 99% |

No single lucky charge decides as much of the game. It plateaus after seven, so seven is where
the improvement stops rather than where it was capped. **Nothing needed rebalancing to get there.**

⚠️ **THE PRICE IS PAID ENTIRELY BY THE TWO-PLAYER GAME.** An extra point costs ~19 table turns.
At 3–8 players those are shared out and the count runs 69–89 turns; at two players they land on
one person, and seven kills took heads-up to 133 turns — **66 decisions each**. Two players
therefore plays to **five**, which is 97 turns and 48 each. Precedent: the old game also gave 2p
its own target.

⚠️ **THE LENGTH GATE WAS A PROXY, AND A PROXY CAN PASS WHILE THE GAME TAKES HALF AN HOUR.**
DECCAN is a **15–20 minute game**, and no gate in this repo had ever said so — they counted turns,
which is not a unit anybody experiences. The estimate is now made out loud from two stated,
tunable numbers: **8 seconds for a plain action** (a card down, a card back) and **45 seconds for
a charge** (reveal, damage assigned and resolved, recovery sorted).

**Measured, every player count: 13–16 minutes.** Two gates were added — turns per player, because
a 133-turn game is 66 decisions at two players and 8.6 at eight and one number hides that, and
minutes, because it is the actual brief.

**9 gates · 9 pass · 0 warn · 0 fail** — seat deviation 3.0 and signature deviation 3.5, the best
fairness the game has measured.

## 2026-08-20 — D058. THE COMMANDER replaces the SLINGER, and it bought back 5 minutes

**The Slinger killed the highest enemy unit. The Commander STRIKES AT ITS STRENGTH.** Printed
strength 1; in a charge it lands a blow equal to the biggest enemy unit on the ground. Facing an
Elephant 5 it hits for 5; facing a line of Warriors it hits for 1.

**Why a scaling answer beats a binary one.** Without the ring, raw strength is simply better, and
it is measurable: over nine-card decks spanning totals 9 to 41, win rate ran **0.42 → 0.64 → 1.28
→ 2.11 → 2.74**, monotonically, with no exception. The Slinger answered that with a guillotine.
The Commander answers it with a mirror — it is exactly as big as the problem opposite it, so the
bigger the enemy's Elephant, the bigger their answer, and a cheap deck can fight an expensive one.

⚠️ **IT COPIES THE BLOW, NOT THE BODY.** Durability stays 1 — anything kills it. Letting it copy
durability too would make it *become* an Elephant for one point of printed strength, and printed
strength is the exact quantity every deck in the roster is balanced on. One big swing, and it
dies to a Warrior.

⚠️ **It copies the ENEMY's best, not its own army's.** Copying your own side was considered and
is the wrong card twice over: amplifying a strong army deepens the one imbalance the numbers
actually show, and it is dead weight in a weak army — useless precisely when its owner needs it.

**Commanders do not copy Commanders**, or two of them opposite each other define each other.

**Measured on the placeholder roster, against the same roster with Slingers:**

| | Slinger | **Commander** |
| --- | ---: | ---: |
| longest game | 133 turns | **92** |
| turns per player | 66.7 warn | **46.1 ok** |
| **minutes** | 22 warn | **17 ok** |
| kills per charge | 1.76 | **1.81** |
| signature deviation | 3.4 | 5.8 warn |
| gates | 7 pass · 2 warn | **8 pass · 1 warn** |

⚠️ **IT SOLVED THE TWO-PLAYER LENGTH PROBLEM THAT D057 HAD PAID FOR.** Seven kills at every
count cost heads-up 22 minutes and 66 decisions each — accepted deliberately, to avoid an
exception. Because the Commander scales, charges bite harder and the board resolves instead of
grinding: **17 minutes, at every player count, with the single target intact.**

⚠️ **FOUR IN ONE DECK IS TOO MANY.** A Peshwa holding four Commanders measured **1.28** of a fair
share — the strongest ruler in the game — because each copies the enemy's best, so they multiply:
four heavy blows for four points of printed strength. No ruler holds more than three of anything,
which also makes every identity read the same way at the table: three of yours, one of everything
else, and two spare.

**Open:** the compositions were tuned against the Slinger and must be re-searched. The Commander
is now the most load-bearing card in the game — the brake on strength AND the reason a game
finishes in 17 minutes — which makes it the one most worth a sensitivity check before print.

## 2026-08-20 — D059. ARMY COMMAND, measured and NOT adopted — and what it exposed instead

The designer's reading was that the three abilities are not being priced into the roster, and the
proposal was **army command**: once you stand in an army you may act on any unit in it, so you can
pull a comrade's Scout out of the line on your own turn and deny the enemy the kill. Both halves
were measured. The first is **correct and worse than stated**. The second **does not follow from
it**, and the reason is a mechanism, not a tuning number.

### The readout was broken, so the busiest ability read as a dead card

`gates-simple.mjs` printed a "slinger kills" column fed by `kills.filter(k => k.by.u.arm ===
"SLINGER")`. D058 deleted the Slinger. The filter has therefore matched nothing since, and the
ability table has printed **0.00 for the Commander in every run after D058** — including the runs
that chose the strength ladder. Counting the Commander instead: **1.6 kills a game at two players
rising to 4.6 at eight.** It was never inert; nothing was looking at it.

⚠️ **A READOUT THAT CANNOT FAIL REPORTS A CARD AS INERT WHETHER IT IS INERT OR NOT.** The same
shape as D045 — a rule the decision function ignores is untestable — one layer further out: a
card the *measurement* ignores is untestable too, and it fails silently, as a plausible zero.

### The roster prices an ability at its printed strength, which is a DISCOUNT

`roster.mjs` enumerates every nine-card deck at a fixed **printed strength** total and searches
only inside that band. Spy, Scout and Commander are printed 1 — one *less* than the cheapest
fighter, the Warrior 2 — so in the only currency the search has, taking an ability is not merely
free, it **hands a point back to spend elsewhere**. The search still will not take them: the box
has to be stocked by the `MINCOPIES=6` quota, and the comment on that quota records what happened
without it — every spare slot filled with Scouts, ten in the box, and the answer to an Elephant
appearing twice.

**A quota is standing where a price should be.** That is the defect, and it is upstream of any
roster: the search cannot want a card whose value its cost model cannot see.

### ⚠️ AND THE VALUE IT CANNOT SEE MEASURES AT ZERO — IN A MODEL THAT CANNOT SEE IT EITHER

**Read the table below with the designer's objection attached, because the objection is right.**
The Spy and the Scout are INFORMATION cards, and this simulation cannot price information. The
policy reads a hidden enemy as a flat average and a revealed one as its strength, so a bot that
learns something barely changes what it does; `V_SPY` and `V_SCOUT` are stated judgements, not
measurements; and no bot bluffs, reads a face-down commitment, or changes WHEN it calls the charge
because of what it just learned. **A zero here is the model's silence, not the card's.**

That is D045 turned on its author: a rule the decision function ignores is untestable, and its
measurement is an artifact of the omission rather than a reading of the card. It condemns the
Commander readout in the section above and it condemns this number in the same breath. **The Spy
and the Scout are NOT hereby judged decoration.** They are unmeasured, and in this chassis they
are unmeasurable — the question goes to OPEN.md, where only a table can answer it.

⚠️ **DO NOT CUT A CARD ON THE STRENGTH OF A NUMBER THIS MODEL IS NOT ENTITLED TO PRODUCE.**

**What survives the objection**, because neither depends on the policy at all: the readout bug,
and the cost model. The search would price a Spy at 1 however good or blank the card is.

### The numbers themselves

Abilities switched off one at a time on the placeholder roster (`OFF=`, 2,000 games/count), which
leaves the unit in the game as a plain strength-1 body and isolates the ABILITY:

| ruler, mean over 7 counts | abilities on | its own ability off | all three off |
| --- | ---: | ---: | ---: |
| spy | 1.02 | — | 0.92 |
| scout | 0.96 | — | 0.96 |
| commander | 0.98 | — | 0.97 |
| **elephant** | **1.09** | 1.15 *(COMMANDER off)* | **1.19** |

⚠️ **THE ABILITIES HOLD THE ELEPHANT DOWN FOR THE WHOLE TABLE AND NOBODY IS PAID FOR CARRYING
ONE — AS THESE BOTS PLAY THEM.** Turning all three off moves the ruler that holds a second copy by ≤0.02 — under noise —
and moves the ELEPHANT ruler from 1.09 to 1.19. The Commander alone accounts for about half of
that. The board work is real (spy swaps 1.5–6.2 a game, scout reveals 1.4–5.5, commander kills
1.6–4.6); **none of it accrues to the player who brought the card.** ⚠️ Only the COMMANDER's line
here is trustworthy — a blow is a blow whoever throws it. The other two are the model's silence.

### Army command: measured at three strengths, and it is a turn sink

`ARMYCMD=1` — you may withdraw any unit in your army, not only your own. It is a **withdrawal**
rule only: deploying another player's card would spend your turn to hand them the kill and the
point. An ally's unit is scored for what it DENIES (`V_DENY`, a stated judgement, env-tunable).

| 5 players | turns | minutes | covers/game |
| --- | ---: | ---: | ---: |
| off | 84 | **15** | — |
| on, `V_DENY=0.05` | 115 | 19 | 12.8 |
| on, `V_DENY=0.3` | 194 | **30** | 41.5 |

Monotonic in the weight, with no free setting. The cause is structural rather than numeric:
covering is almost always worth a little, and it is available to **every player against every unit
in the line, every lap** — so it is taken over and over and the front becomes the shuffling
contest that the recovery rule exists to prevent.

Two brakes bring it back inside every gate. **`ARMYSEEN=1` — you may only pull back a comrade you
can SEE, a face-up unit** — is the one that binds: 16 minutes, 1.9–2.6 covers a game, 8 pass · 1
warn, the same scorecard as the rule switched off. `ARMYONCE=1` (one cover between charges) costs
3–5 minutes and, stacked on SEEN, changes nothing (2.62 → 2.53 covers): under SEEN the cap never
binds.

### ⚠️ BUT IT SAVES ELEPHANTS, NOT SCOUTS — AND IT CANNOT DO OTHERWISE

Share of all covers, by what was covered, under the version that fits:

| ELEPHANT 6 | CANNON 5 | RIFLEMAN 4 | HORSEMAN 3 | WARRIOR 2 | SPY 1 | SCOUT 1 | COMMANDER 1 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 29.6% | 25.2% | 17.5% | 12.4% | 6.5% | 2.3% | 2.3% | 4.2% |

**8.8% of covers reach the three ability cards** — the exact cards the proposal was meant to
protect — and the ability rulers gain nothing: spy 1.05 → 0.97, scout 0.96 → 0.95, commander
0.97 → 0.98, elephant 1.14 → 1.14.

Two reasons, and the second is the general one:

* The brake that makes the rule affordable is the brake that excludes the fragile cards. **A
  strength-1 unit almost never survives a charge, so it is almost never face up** — SEEN can only
  reach the units that were already durable enough not to need saving.
* ⚠️ **A KILL PAYS ONE POINT WHATEVER DIED.** Denying a kill on an Elephant is worth exactly what
  denying one on a Scout is worth, and saving the Elephant *also* keeps six points of blow in the
  line. So covering will always flow to the biggest unit, at any weight, under any brake.
  **Army command cannot make abilities matter, because nothing in the scoring rule knows an
  ability exists.**

`VPMODE=strength` (a kill pays the victim's strength, `TARGET=21`) was tried as the obvious answer
and is worse: it pays you most for killing the biggest thing, which dies anyway, and the Elephant
ruler goes **1.14 → 1.18**, or 1.28 with abilities off. The ability rulers do not move.

**NOT ADOPTED.** Kept behind `ARMYCMD` / `ARMYSEEN` / `ARMYONCE`, default off, with `sim/armycmd.mjs`
as the A/B harness. The Commander readout fix IS adopted — it is a bug.

**The live question it leaves, and it is a COST question, not a card question:** the roster search
prices every ability at its printed strength, so it cannot stock the box on merit whether the card
is brilliant or blank. **Fix the price.** Whether the Spy and the Scout deserve their slots is a
separate question, it is in OPEN.md, and nothing in this repo can answer it.

## 2026-08-20 — D060. THE NUMBER IS CALLED VALUE, and AGILITY breaks the one thing nothing else could

Two changes from the designer, one free and one structural.

### VALUE, not STRENGTH — and horse before foot

One number does damage, durability, seniority and now initiative. **"Strength" names only the
first of those**, so the stat is renamed **VALUE** throughout the simple model. `VALUE` replaces
`STR`, `u.v` replaces `u.s`, and the env lever is `VALUE=`. ⚠️ Verified **byte-identical gate
output** before and after, in both resolution modes — a rename that changes a number is a rename
that changed something else too.

**The rename immediately paid for itself.** Under the old name nothing objected to a WARRIOR 2
and a HORSEMAN 3. The moment the number also decides who moves first, a man on foot striking
before a man on a horse is absurd, so the two swap: **WARRIOR 3 · HORSEMAN 2.** The Horseman is
the light, quick, fragile one; the Warrior is the one who stands. Also inert — the ladder is
still 6,5,4,3,2,1,1,1 and the placeholder decks are the same multiset, so this costs nothing and
buys the theme.

⚠️ **A NAME THAT UNDERSTATES WHAT A NUMBER DOES WILL HIDE A DESIGN ERROR FOR AS LONG AS IT
STANDS.** The ladder was wrong from the moment agility was proposed, and the only thing that
found it was calling the stat what it actually is.

### AGILITY — value is also initiative, inverted

`AGILITY=1`. The battle stops being one instant and becomes a ladder: **everything printed 1
strikes, then 2, then 3, up to the Elephant 6. A unit killed before its band comes up never
strikes.** Ties resolve as a band — everything at one value strikes together — so the three
ability cards need no order among themselves and ganging works within a band as well as across.

⚠️ **IT REVERSES THE RULE THIS CHASSIS WAS BUILT ON, AND IT IS THE ONE REVERSAL THAT DOES NOT
RE-BREAK WHAT THAT RULE PROTECTED.** D054 threw out the survival test because a value-1 card
lived through 5% of charges, so the Spy and the Scout resolved 0.05 times a game — "not weak
cards, cards that did not exist." Under agility the 1s act FIRST, before anything can reach them.
The old failure cannot recur: nothing resolves before band 1, so an ability card gets its text off
unconditionally.

**Gates, placeholder roster, 2,000 games/count:**

| | one instant | **AGILITY** |
| --- | ---: | ---: |
| **signature deviation** | 6.5 warn | **4.7 ok** |
| **elephant ruler** | **1.14** | **0.99** |
| seat deviation | 2.7 | 2.7 |
| kills per charge | 1.70 | 1.41 |
| charges | 6.2 | 6.8 |
| minutes | 18 | 19 |
| gates | 8 pass · 1 warn | 8 pass · 1 warn |

**The signature gate passes clean for the first time**, and the Elephant ruler lands on its fair
share. Nothing else has done that — not the ladder sweep, not the Commander, not a scoring rule.

### ⚠️ AND IT DOES IT BY A DIFFERENT MECHANISM THAN THE ONE PROPOSED

The proposal was that cheap units gang up and drop the Elephant before it swings. Survival per
unit, 1,500 games at 3/5/8 players (`sim/who.mjs`), says something better:

| | ELEP 6 | CANN 5 | RIFL 4 | WARR 3 | HORS 2 | SPY 1 | SCOUT 1 | CMDR 1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| one instant | **51.7%** | 43.4% | 35.9% | 28.9% | 20.8% | 7.1% | 8.1% | 11.9% |
| **AGILITY** | 48.7% | **54.3%** | 52.3% | 43.6% | 32.4% | 18.5% | 19.1% | 31.8% |

**The Elephant barely dies more — it falls 51.7% to 48.7%. What changes is that everything else
stops being wiped out.** Under one instant, survival is strictly monotonic in value: 51.7 > 43.4 >
35.9 > 28.9 > 20.8 > 8. **Value literally buys survival, in order, with no exception** — which is
the "raw value is strictly better" problem the Commander was printed to brake. Under the ladder
that ordering BREAKS: the **Cannon 5 outlives the Elephant 6**, and the Rifleman 4 draws level
with it. Value stops being monotonically better, structurally, without a card to enforce it.

The reason is the rule itself: a unit killed in an early band never strikes, so the damage that
used to land on the cheap units is never thrown. Cheap units do not win — **they stop being free
kills.**

⚠️ **AND IT HANDS THE ABILITY CARDS BACK THEIR SURVIVAL.** Spy 7.1 → 18.5%, Scout 8.1 → 19.1%,
Commander 11.9 → 31.8%. A card that lives is a card that can be played again, which is the
condition D054 was chasing when it removed the survival test in the first place. The open Spy and
Scout question in OPEN.md should be re-asked at a table under AGILITY, not under one instant.

**The price:** kills per charge 1.70 → 1.41, because the dead no longer answer, and one extra
minute. Both cheap.

**Status: measured, recommended, DEFAULT STILL OFF** (`AGILITY=1`) pending the designer's call,
because it reverses a recorded core rule and that is not a change to make on a subagent's opinion.
The VALUE rename and the horse-before-foot swap ARE adopted — both are provably inert.

## 2026-08-20 — D061. AGILITY ADOPTED. And a policy that priced initiative played 2:1 WORSE

**`AGILITY` is now the default** (`AGILITY=0` restores the single instant). Value is also
initiative, inverted: everything printed 1 strikes, then 2, up to the Elephant 6, and a unit
killed before its band never strikes. Gates on the placeholder roster: **9 gates · 8 pass · 1
warn · 0 fail**, signature deviation **4.7**, Elephant ruler **0.99**, 19 minutes. The evidence is
in D060.

### ⚠️ THE POLICY WAS TAUGHT TO PRICE INITIATIVE AND IT GOT WORSE. 32-35% AGAINST 65-68%

The reasoning was sound and the result was not. If value decides who strikes first, a policy
written for one simultaneous instant is blind to the central new fact, and measuring abilities
with it would repeat exactly the artifact D059 was corrected for. So `expectedPreempt` was added —
the chance a card is silenced before it swings, counting only enemies of strictly lower value,
since a tie is the same band — and the kill term and the ability term were both gated on surviving
to act.

**It broke the game.** Kills per charge fell 1.41 → 0.96, the longest game went 102 turns → 217,
and two gates hard-failed at 37 minutes. Two corrections were tried. Making the pre-emption a
SHARE of the enemy's early damage rather than the sum of it — because the aim heuristic spreads
blows across the line — recovered 3 minutes. Adding `V_SOAK`, the credit a silenced body earns by
eating early blows that would otherwise have finished two cheap cards, recovered 3 more across a
sweep from 0 to 1.3. Neither came close: the best configuration still ran 28 minutes at 1.15 kills
a charge, against 19 minutes and 1.41 for the policy that ignores initiative entirely.

So the two policies were sat at the same table, alternating seats, rotating the offset every game
(`sim/tempo-h2h.mjs`, 4,000 games each at 4, 6 and 8 players):

| | tempo-aware | tempo-blind |
| --- | ---: | ---: |
| 4 players | 31.6% | **68.4%** |
| 6 players | 32.9% | **67.1%** |
| 8 players | 34.6% | **65.4%** |

⚠️ **A POLICY THAT PLAYS WORSE MEASURES WORSE, WHATEVER IT UNDERSTANDS.** Reverted to default off,
kept behind `TEMPO=1` as a recorded failure. It is also a finding about the GAME and not only
about the code: **being pre-empted costs far less than the term charges for it.** A silenced
Elephant 6 has still eaten six points of early blows, and the bots that simply play value and
ignore who moves first beat the ones that fret about it two to one.

### The abilities, re-measured under agility — and STILL NOT ADMISSIBLE

The designer's argument for re-measuring was that agility gives the cards real texture: the Spy
trades into a bigger unit but inherits its slowness, the Scout's information now says WHEN a card
acts and not merely how big it is, and a value-1 card can be thrown out as bait. Ability survival
does triple under agility (D060), so the cards at least persist. `sim/ability.mjs`, 1,200 games at
3, 5 and 8 players, its own ability switched off so the body stays and only the text goes:

| | kills/charge | spy ruler | scout ruler | commander ruler |
| --- | ---: | ---: | ---: | ---: |
| all on | 3.29 | 0.94 | 0.99 | 0.99 |
| `OFF=SPY` | 3.24 | **1.01** | — | — |
| `OFF=SCOUT` | 3.24 | — | **0.99** | — |
| `OFF=COMMANDER` | 3.18 | — | — | **0.93** |

**The Scout is flat to three decimal places of nothing: 0.99 with its text, 0.99 without.** The
Spy's ruler gets BETTER when the ability is switched off, 0.94 → 1.01. The Commander is worth
about 0.06, which is at the noise floor. Columns that should not have moved at all swing ±0.07
between runs, so the honest reading of every one of these numbers is ZERO.

⚠️ **AND THAT READING IS STILL NOT ENTITLED TO A VERDICT, FOR THE REASON IN D059.** Agility made
the cards SURVIVE; it did not make the model able to price INFORMATION. No bot bluffs, none baits,
none re-times a charge on what it just learned, and none values trading into a big slow card
against staying quick — the term that would have priced exactly that trade is the one measured
above as playing 2:1 worse. **Every hypothesis the designer offered for why agility should rescue
these cards names a behaviour this simulation does not have.**

The Spy and the Scout remain in OPEN.md. Nothing here cuts them, and nothing here should be quoted
as though it could.

## 2026-08-20 — D062. THE SPY WITHDRAWS AN ENEMY. And the mutual clause was wrong, twice over

**The Spy stops exchanging and starts removing.** ON REVEAL, one enemy unit LEAVES WITHOUT A
FIGHT — no choice, it does not strike, it cannot be killed, and nobody scores off it. Under
AGILITY the Spy is band 1 and nothing acts before band 1, so the withdrawal lands before contact.
`SPYMODE=exchange` restores the printed card.

Three verbs, three value-1 cards, no overlap: the **Commander hits**, the **Spy removes**, the
**Scout looks**.

### ⚠️ THE MUTUAL CLAUSE WAS RECOMMENDED ON A PREDICTION AND THE PREDICTION WAS WRONG

The argument for spending the Spy along with its target was that an unconditional withdrawal at
band 1 always resolves and cannot be answered — a value-1 card deleting a 6 from every charge, for
free — which is the shape `LESSONS.md` records as what ended the old game: the broker that
measured +38.8 and sat in all 50 of the top 50 armies because nothing could answer it.

Both halves of that were tested and both failed.

| | exchange | withdraw, **mutual** | withdraw, **solo** |
| --- | ---: | ---: | ---: |
| kills per charge | 1.41 | 1.24 | **1.35** |
| charges | 6.8 | 8.6 | 7.6 |
| minutes | 19 | **22** warn | **20** ok |
| turns per player | 51 | **61** warn | 53 |
| signature deviation | 4.7 ok | **5.3** warn | **4.5** ok |
| seat deviation | 2.7 | 2.4 | 3.8 |
| **spy ruler** | **0.95** | **0.95** | **0.99** |
| gates | 8 pass · 1 warn | **6 pass · 3 warn** | **8 pass · 1 warn** |

**Solo is better than mutual on every gate**, and it is not remotely overpowered: the ruler
holding two of them measures **0.99**, closer to a fair share than either alternative and than the
printed card. Spending the Spy made the game longer, the charges smaller and the signature gate
worse, and bought nothing.

⚠️ **AND THE LESSONS.md ANALOGY DID NOT APPLY, FOR A REASON WORTH KEEPING.** That broker was
+38.8 because it **won you the ground** — a payoff that landed in one pair of hands. **Denial is
not private.** Removing the enemy's Elephant helps everyone facing it, and its owner captures only
a fraction. An unanswerable card cannot run away with the game when its output is shared. "Nothing
can answer it" is only dangerous when it is also **paid to one person** — the two properties were
conflated, and only the second one is the hazard.

This is the same mechanism D059 found holding every ability at zero, seen from the other side: it
caps the ceiling as surely as it caps the floor.

### What it costs, and what it does not fix

Against the printed exchange, solo costs **0.06 kills per charge and one minute**, and moves seat
deviation 2.7 → 3.8 (inside the gate, worth watching). The prediction that a denial mechanic would
shrink charges and stretch the game held in direction for all three variants — mildly for solo,
badly for mutual.

⚠️ **It still does not PAY its owner.** 0.99 is a fair share, not a premium: the Spy remains a card
you carry rather than a card that wins. The cost problem D059 recorded is untouched — the roster
search still prices it at its printed 1.

**ADOPTED: `solo` is the default.** The enemy unit leaves; the Spy stays and fights on.
`SPYMODE=mutual` keeps the spent-Spy variant and `SPYMODE=exchange` the printed card, both as
recorded failures rather than live options.
