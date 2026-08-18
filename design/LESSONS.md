# LESSONS CARRIED FORWARD

*Measured findings from DECCAN v5–v30 and the v1.0/v2.0 reset (July–August 2026), archived at
`OneDrive/Desktop/deccan`. These cost weeks to derive. They are the only thing this project
inherits besides the round-robin harness.*

**Read this before designing a card, and again before pricing one.**

> ⚠️ Every *number* below was measured against a ruleset that no longer exists. Cite them as
> **directions**, never as figures for DECCAN II. Re-measure before quoting anything.

---

## A. Resolution order is a balance lever, not a tidiness rule

**A1. Decide the resolution rule before pricing a single card.** The order sets the balance more
than the abilities do. Same Cannon, same ability, three orders:

| Order | Cannon card value |
| --- | ---: |
| Fires first (ascending) | +32.1 |
| Fires last (descending) | +28.1 |
| Simultaneous | +25.9 |

**A2. Under sequential resolution, printed strength is protection, not exposure.** This is the
most counter-intuitive fact the old project produced, and the exact inverse of what simultaneous
fire teaches. A card that sits high resolves late, so almost nothing can silence it before it
fires. **Raising a strong card always helps that card.** Under simultaneous fire, low means
*exposed*; under sequential, low means *early*, and early is what makes you answerable.

**A3. Any sequence hands one card a guarantee.** Cheapest-first ⇒ the cheap removal is
unanswerable. Highest-first ⇒ the big removal deletes the top enemy card every battle. The old
project built and measured both, then chose simultaneous — and it beat both.

**A4. "A card that was AIMED AT does not act"** (simultaneous fire, v28) is an elegant rule:
being *aimed at* silences, being *hit* does not. Two removals naming each other both take cover
and both live. Worth reaching for again if targeting survives into DECCAN II.

---

## B. How to tame a dominant card (and how not to)

**B1. You cannot fix a dominant card by giving it a bigger number.** Measured on the Cannon:
moved to 9 it *hides behind* the Elephant (the enemy shot aims at 10, not 9) and stays at +32.6.
Moved to 11, where it can finally be shot at, it still measures +31.8 — an 11-body is worth
having even silenced.

**B2. Damage tames a card; ladder position does not.** Removal silences and clears the board.
Damage leaves the target standing — still counting toward strength, still firing its own ability.
**Every configuration that reached a tight spread did it with damage, and so did every one that
put a card everybody is dealt back on top.**

| Fix tried | Card value | Spread |
| --- | ---: | ---: |
| As written (removal, ascending order) | +38.8 | 47.6 |
| Reverse the order | +33.9 | — |
| Simultaneous fire | +34.0 | — |
| Simultaneous + −8 damage instead of removal | +28.2 | — |
| **−6 damage at printed 5** | **+20.6** | **30.7** |
| **−8 damage at printed 4** | **+19.0** | **30.1** |

**B3. Every fix that isn't structural just moves the crown.** Swapping which card aims at the
strongest made the *other* card the best in the game (+22.8). Four separate v30 fixes were
rejected for the same reason. If a change makes a different card dominant, it was not a fix.

**B4. Deleting a card from the battle was worth +23.2 on its own** — removal is the single most
valuable effect class in a strength-totalling game. Price it accordingly, or don't print it.

**B5. An ability that fires after the battle is worth ~0.0 win rate.** That is why a strong
post-battle effect can safely sit at the top of the ladder, and why a battle-affecting one
cannot. It is also invisible to any evaluator that scores by rolling out the battle — such
effects must be **priced by hand**.

---

## C. Conditional strength is where the dead zones come from

**C1. Two units was a trap: every 2-card army ranked below every 3-card army.** The
Rifleman+Elephant pair scored 18.0% — *worse than either card alone*, because both alone bonuses
switched off and neither could pair. Roughly a third of the legal choice space was dead.

**Cause:** a bonus structure that rewards exactly 1 unit (ALONE) and exactly 3 (PAIRED) and
punishes 2. **In DECCAN II, make the value of an army monotonic in its size, or drop conditional
strength entirely.**

**C2. Never buff an alone bonus while lone units are untargetable.** Raising the Elephant's alone
multiplier to ×3 made a **one-card army the best army in the game at 95.6%**.

> ⚠️ **SUPERSEDED FOR DECCAN II — see `DECISIONS.md` D039.** The precondition is gone: DECCAN II
> targets lone units. A lone Sepoy is cancelled by ELEPHANT or WARRIOR and is simultaneously its
> army's strongest *and* weakest unit, so a Subhedar removes it too. Measured, a lone Sepoy takes
> the ground 23.6% at ×2, 32.7% at ×3 and **34.5% at any multiplier including infinite** — the
> ceiling is set by cancellation, not arithmetic. ×3 was adopted. **The lesson is still true as
> written; it simply no longer applies here.** Check the precondition before invoking it.

**C3. But never remove lone-unit protection while a cheap card aims at the strongest, either** —
a lone unit *is* its army's strongest, so a printed 1 deletes it. Solo play collapsed: lone
Rifleman 60.2 → 25.7, lone Elephant 53.9 → 22.7.

**C1–C3 together are the argument for cutting conditional strength.** Each of the three rules
exists only to hold the other two up.

**C4. A borrowed unit must never earn an alone bonus for the borrower.** A single Spy once beat a
lone Elephant outright by stealing it into its own one-unit army, where the Elephant fought at
20 *for the thief*.

> ⚠️ **THIS RECURRED IN DECCAN II AND WAS SHIPPED UNNOTICED — see `DECISIONS.md` D040.** The
> Sepoy's alone bonus had no ownership test; a Spy could steal it into a one-unit army and fight
> at double. Reachable in **470 of 81,225 matchups**. It survived a line-by-line reconciliation
> that reported "nothing diverges", because reading for agreement cannot find a missing guard.
> **Writing a lesson down does not prevent it. Only a test does** — this one is now guarded by a
> `borrowed` flag set on *both* exchanged cards, so future conditional bonuses inherit it.

**C5. A unit that copies or banks a value must not keep it after the source leaves.** Live
exploit, closed once and re-opened by the reset. Whatever the equivalent is in DECCAN II,
define it in the same sentence that creates it.

---

## D. Economy and reward

**D1. A round-robin cannot see the reward economy.** It weights every army equally when they are
not equally available. "Armies holding X dominate" is not "X is everywhere" — if X costs a battle
won and is 4 of 20 cards in a supply, a player who wins a whole game has a ~62% chance of ever
seeing one. **Carry this caveat into every claim about an earned card.** Rare + earned +
overwhelming is a coherent design; it just cannot be read off the leaderboard.

**D2. Denying a leader their earned resources is not runaway.** To lose them you must first have
won some, so such an effect can only reach players who are also winning. A trailing player is
immune by construction. **The real risk to measure is kingmaking, not runaway** — A knocks out
B, uninvolved C benefits. Measured at 46.7% at 6 players in the old game.

**D3. Check whether a "degenerate economy" is already gated by scarcity before writing a rule
against it.** A rule was once invented to stop a lone-army loop that turned out to be
self-limiting: the bonus was printed on exactly two unique cards, both discarded by the win that
used them. The rule also made two different army sizes cost the same, contradicting the game's
own best advice.

**D4. Free-money bugs get fixed the moment they are seen.** Hedging into both armies was a
guaranteed reward with zero risk — a scoring army paid every member and a beaten army cost
nothing. It was noticed once and filed as "pre-existing". Don't do that.

**D5. Attrition should be stated as the clock, not patched in.** Winning costs cards, losing
costs nothing — so only winning drains you, and the leader burns down fastest. That is a
self-correcting pace mechanism and it reads as one sentence.

---

## E. Rules-writing discipline

**E1. If a rule and an FAQ answer disagree, the rule wins** — but this should never come up. It
came up for eight straight versions.

**E2. Reconcile the rulebook against the resolver line by line, every time.** The old project
went eight versions without it and accumulated: a stated 10-card hand that was 7, a stated 3-point
target that was 4, four passages pricing defeat under an economy replaced nine versions earlier,
and a section calling identical armies *beaten* while another called them *winners*.

**E3. Never quote a figure measured under a superseded rule.** The single most repeated error in
the project's history. When a rule changes, every number is dead until re-measured.

**E4. "Discarded" must be defined.** The distinction between *leaves the game for good* and
*returns to a recyclable pile* is load-bearing for every attrition argument and for any card that
destroys. It was defined, then dropped in a reset, and immediately caused ambiguity.

**E5. A correct engine gets reported as a glitch when the display hides the reason.** A damaged
card that still showed its printed number, with the army total sitting lower, was reported as a
bug twice. Physical equivalent: if a rule changes a number, the card must be *marked* — design
the token, not just the rule.

**E6. Prefer the physical-components test to the elegant rule.** A rule requiring players to
discard a card type they cannot identify in hand is unenforceable at a real table — "people will
just hoard it." This objection killed a card that had survived three rounds of analysis.

**E7. A distinct card back is a feature, not an enforcement device.** Units deploy face down, so a
second back lets the table *see* an earned card land without seeing what it is. That is readable
information — the thing a game with no bluffing layer is starved of.

---

## F. Multiplayer and seats

**F1. Seat fairness must be measured at every player count, separately.** The old game reached
fairness at 2/3/4/6/8 exactly once, and 6-player had failed in the version immediately before.
Fairness at 4 says nothing about fairness at 6.

**F2. "Each player takes a turn" and "turns continue until all pass" are different games.** The
singular reading makes every 2-player game two lone armies, forever.

**F3. Deploying first is worth an army unless a rule stops it.** When a turn could commit three
units in one pass round the table, the previous winner filled a fresh army before anyone could
react — every round. Fix: one unit per turn, and the order laps. Three-unit armies stay legal but
cost three answered turns.

**F4. A player must not be able to commit to both sides.** Obvious in hindsight; it was legal for
several versions and was pure profit.

**F5. Don't give a bystander a lever over a battle they are not in.** An early tie-break rule
handed ability ordering to the starting player, who in a 6-player game is often in neither army.

---

## G. Method

**G1. Define the balance gates before tuning the cards**, so they cannot be moved to fit the
result. `sim/gates.mjs` exists for this.

**G2. Change one thing, re-measure, log the ruling with its number.** `DECISIONS.md`.

**G3. Enumerate before ruling.** "The player chooses" was suspected of hiding a real decision;
enumeration proved every tie in the game was between functionally identical cards, so no ruling
was needed at all.

**G4. Check your own alarm before raising it.** The Cannon panic was real but overstated, and the
caveat that defused it (D1) was found by re-reading the metric, not the game.

**G5. When the user rules against your analysis, log the ruling and stop re-proposing it.**
Several fixes were re-litigated across sessions because the decision was recorded as a suggestion
rather than as settled.
