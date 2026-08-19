# OPEN QUESTIONS

*What is still unanswered. Everything here is flagged deliberately rather than left to be
discovered. The design itself is settled and measured — these are things a simulation cannot
decide.*

---

## Reconciliation: the rulebook and the resolver

Checked line by line, 2026-08-18. Every rule in `rules/RULEBOOK.md` is implemented in
`sim/battle.mjs` and `sim/game.mjs`, and every behaviour in those files is a stated rule:

the ring and its five arms · one cancel per unit, strongest reachable target · simultaneity, so
a cancelled unit still cancels · a cancelled unit contributing nothing and firing nothing ·
abilities resolving only for survivors · the ON DEPLOY / ON REVEAL / ON DEFEAT timing keywords
(D037) · highest total taking the ground and level totals paying both · one point per surviving
unit of yours · winners recovering after one round · the defeated burning and recruiting one
broker each · brokers leaving the game for good · the Siege Elephant deploying face up and
looking on deployment · the Sultan Rockets deploying face up (D041) · the Spy's permanent
exchange · the borrowed-unit guard on the alone bonus (D040) · two armies of three units and
three players · blind acceptance, a refusal not ending your turn, one offer per army per turn ·
never both armies · the victory targets · both ending conditions.

⚠️ **This file previously claimed "nothing diverges." That claim was wrong.** A reconciliation
pass had missed a real divergence: the Sepoy's alone bonus had **no ownership test**, so a Spy
could steal a Sepoy into its own one-unit army and fight at the doubled value — reachable in 470
of 81,225 matchups, and a direct repeat of LESSONS C4. Found by adversarial search, not by
reading for agreement. Fixed in D040 and verified at 0.

**The standing lesson: a line-by-line read confirms what IS written and cannot find what is
MISSING.** Any future reconciliation should include an exhaustive search for the failure modes
in `LESSONS.md`, not just a comparison of rules to code.

---

## The one gate that warns

**The Power Broker supply.** Fifteen brokers are drawn down to **13.9 of 15** at eight players,
against a gate that wants 12% of the supply left undrawn. Per count, at 12,000 games:

| players | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| brokers drawn, of 15 | 3.8 | 4.8 | 7.9 | 10.5 | 12.3 | 13.3 | **13.9** |

**No game in any run ended by exhaustion.** 100% still end on the victory target at every player
count, which is the thing the gate is really protecting. The rulebook now says an emptied supply
is reshuffled from the discards, which removes the constraint entirely — but **every number in
this repo was measured without that reshuffle**, so the recycling rule is adopted and unmeasured.
It can only loosen a constraint that never bound, so nothing here rests on it.

⚠️ **Faction deviation no longer warns.** It was 5.2 at three players for the whole life of the
seven-card game; the eight-card roster (D046) measures **4.0 / 4.4 / 4.5 across three seeds**.
The fix was resolution, not cleverness — see D046 for why 15 decks could not be tuned and 35 can.

⚠️ **THIS FILE PREVIOUSLY CLAIMED THE NOISE BAND WAS "roughly ±0.4 at 4,000 games." THAT IS
WRONG BY ABOUT 3×.** The gate is a **max over 56 faction × count cells**, and on the unchanged
seven-card roster it measured **4.6 / 5.0 / 5.3 / 5.9 across four seeds at 12,000 games**. A max
over many noisy cells is dominated by whichever cell got lucky. Two comparisons were nearly
misread this way, both rescued by a dedicated two-player harness running 80,000 duels — 8× the
samples per matchup that the 12,000-game whole-game run gives the 2p column.

**Quote RMS across all cells alongside the max.** RMS moved 2.31/2.37/2.67 → 1.74/1.78/1.78 for
D046 and was consistent in every seed, while the max disagreed between seeds. **Never conclude
anything from a single seed's gate value.**

**Not blocking. Worth re-checking if anything moves.**

---

## Built but NOT adopted — decisions waiting on you

Two rules are implemented behind env levers, measured, and deliberately left off.

**1. The offer — three brokers face up (`BROKEROFFER=1`, D044).** Holds all gates. Blocked on one
signal: faction deviation came in higher in **three consecutive measurements** (5.3→5.6, 5.2→6.0,
5.2→6.0). Each move alone sits inside the noise band; three in the same direction is a pattern.
**Resolve before adopting, not after.** Two sub-rules are also unspecified — the order in which
multiple defeated players choose, and whether the offer is persistent or refreshes each round.

**2. The refusal fork (`REFUSALFORK=1`, D045).** A refused unit lands in the other army. Holds all
gates, fires on 17–28% of offers, and measurably relocates the game's decision density: sitting
out roughly halves at 4–5 players, alliances rise. **The trade is real** — sitting out was a
designed choice, not an accident. Needs a table test, because the appeal is a bluff and a
probability cannot bluff.

---

## Playtest items — things the model cannot see

**1. Is the Spy too quiet?** A theft completes in 12% of two-player games rising to 31% at eight
(D036), and it is the only broker with a *negative* ground marginal, −6.8 (D042). It is also the
only broker under 20% pick share at every assumption setting tested (D043). A rare card that
permanently rewrites two decks may be exactly right, or may feel absent. **The lever is its arm,
not its strength** — Horseman is cancelled by Rifleman and Cannon, two of the most-played cards.

**2. Does the face-up Sultan Rockets actually deter?** D041 adopted it, and the gates say it is
balance-neutral — but they **cannot test the hypothesis**, because `rockets` appears nowhere in
`scoreMove`. The simulated players never fear the burn. Whether a visible scorch makes a winning
side hesitate is a pure table question.

**3. Does the muster drag at seven and eight players?** Turns lap until everyone passes, and each
turn can involve two offers and two blind decisions. The simulation counts rounds, not minutes.

**4. Does sitting out feel like plotting or like waiting?** Measured as a real and frequent
choice; whether it is an enjoyable one is a table question. **The refusal fork (D045) roughly
halves it** — decide what this moment is worth before adopting that rule.

**5. Is "the loser gets the better card" satisfying or annoying?** It is the spine of the economy
and it is what makes strong brokers safe. It also means the player in front watches everyone else
arm themselves.

**6. Do eight rulers feel distinct in play?** Three or four of one arm out of eight cards is a real
identity on paper. Whether a Peshwa feels different from a Maharaja across a whole game is not
something the numbers can answer.

**7. Is a permanent Spy theft too personal?** Cards change hands for good, and with eight distinct
rulers a stolen Elephant is visibly foreign in your hand. That is either the best moment in the
game or the one that starts an argument.

---

## Assumptions the model rests on

**The three off-axis broker values (D043)** — information 0.25, denial 0.35, permanent theft 0.40
— are **stated judgements, not measurements**, and cannot be derived from this repo. They are
env-tunable (`V_SIEGE`, `V_ROCKETS`, `V_SPY`) so that any conclusion can be sensitivity-tested.
**A conclusion that moves when they move is an assumption, not a finding.** D043 records which
current conclusions are which.

**Broker identity is treated as PUBLIC** by every number this project has produced. `available()`
filters the whole hand, recruited brokers included, and `pools` hands every opponent their arm and
strength via `scoreMove`. The physical game currently hides them. **The offer (D044) would close
that gap**; until then, the gates describe a slightly more readable game than the one in the box.

---

## Not designed, deliberately

**One thing: the reshuffle.** The rule that an emptied Power Broker supply is reshuffled from
the discards is adopted but **never measured** — every number in this repo was produced with
brokers leaving the game for good. It can only loosen a constraint that no run ever hit, so
nothing rests on it, but it is the one rule here with no measurement behind it.

Everything else — the ring, the card list, the eight rulers, the supply, the economy, the victory
targets and the ending conditions — is settled and measured. Every change from here should start
by running `npm run gates` — **at 12,000 games, not the default 4,000, and across more than one
seed, if the result is going to be believed.**

## Are the Spy and the Scout worth their slots? — ONLY A TABLE CAN ANSWER (D059)

Both are INFORMATION cards, and `sim/simple.mjs` cannot price information: the policy reads a
hidden enemy as a flat average, `V_SPY`/`V_SCOUT` are stated judgements, and no bot bluffs, reads
a face-down commitment, or changes when it calls the charge because of what it just learned. They
measure at zero. ⚠️ **That zero is the model's silence and must never be quoted as a verdict on
the cards** — the same objection D045 makes about any rule the decision function ignores.

What a table has to answer: does knowing one face-down unit change WHEN you charge? Does taking
the enemy's best card permanently feel like the swing its text promises? If the answer is no at a
table too, then they are decoration — but that is a table's finding to make, not this repo's.
