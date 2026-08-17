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
