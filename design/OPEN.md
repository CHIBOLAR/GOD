# OPEN QUESTIONS

*What is still unanswered. Everything here is flagged deliberately rather than left to be
discovered. The design itself is settled and measured — these are things a simulation cannot
decide.*

---

## Reconciliation: the rulebook agrees with the resolver

Checked line by line, 2026-08-18. Every rule in `rules/RULEBOOK.md` is implemented in
`sim/battle.mjs` and `sim/game.mjs`, and every behaviour in those files is a stated rule:

the ring and its five arms · one cancel per unit, strongest reachable target · simultaneity, so
a cancelled unit still cancels · a cancelled unit contributing nothing and firing nothing ·
abilities resolving only for survivors · highest total taking the ground and level totals paying
both · one point per surviving unit of yours · winners recovering after one round · the defeated
burning and recruiting one broker each · brokers leaving the game for good · the Siege Elephant
deploying face up and looking on deployment · the Spy's permanent exchange · two armies of three
units and three players · blind acceptance, a refusal not ending your turn, one offer per army
per turn · never both armies · the victory targets · both ending conditions.

**Nothing diverges.** This is the check the old project went eight versions without doing.

---

## The one gate that warns

**Faction deviation is 6.1 at two players**, against a self-imposed gate of 5. At three players
it is 3.8 and by eight it is 2.0.

This is a deliberate trade, recorded in `DECISIONS.md` D032: the alternative was a hill-climb
that reached 3.4 by dissolving the factions into each other. Two players is also where the game
is least itself — alliances fire in 4% of two-seat rounds against 83% at three or more.

**Not blocking. Worth re-checking if anything moves.**

---

## Playtest items — things the model cannot see

**1. Is the Spy too quiet?** A theft completes in 12% of two-player games rising to 31% at
eight (D036). A rare card that permanently rewrites two decks may be exactly right, or may feel
absent. **The lever is its arm, not its strength** — Horseman is cancelled by Rifleman and
Cannon, two of the most-played cards. Moving it would buff it twice at once, so feel it first.

**2. Does the muster drag at seven and eight players?** Turns lap until everyone passes, and each
turn can involve two offers and two blind decisions. The simulation counts rounds, not minutes.

**3. Does sitting out feel like plotting or like waiting?** Two armies hold six units, so from
five players up somebody is always outside. Measured as a real and frequent choice; whether it is
an enjoyable one is a table question.

**4. Is "the loser gets the better card" satisfying or annoying?** It is the spine of the
economy and it is what makes strong brokers safe. It also means the player in front watches
everyone else arm themselves.

**5. Do eight rulers feel distinct in play?** Three of one arm out of seven cards is a real
identity on paper. Whether a Peshwa feels different from a Maharaja across a whole game is not
something the numbers can answer.

**6. Is a permanent Spy theft too personal?** Cards change hands for good, and with eight
distinct rulers a stolen Elephant is visibly foreign in your hand. That is either the best moment
in the game or the one that starts an argument.

---

## Not designed, deliberately

**Nothing.** The ring, the card list, the eight rulers, the supply, the economy, the victory
targets and the ending conditions are all settled and measured. Every change from here should
start by running `npm run gates`.
