# GOD — STATE INVENTORY

*Every state the interface must represent, derived line by line from `sim/game.mjs`,
`sim/battle.mjs` and `sim/cards.mjs`. The client is built against this file, not against an
impression of the rules.*

⚠️ **This file is a claim about the code and can rot.** Every entry cites where it comes from.
If a citation stops matching, this file is wrong and the code is right.

---

## 0. The visibility rule

`game.mjs:114` states it exactly, and it is the single most important line for the client:

> **Public information only: army sizes, whose units they are, what each player has already
> burned, and anything a Siege Elephant has revealed.**

**Public:** army sizes · who owns each committed unit · every player's burned pile · revealed
units · victory points · round · turn order · who has passed · who is in which army.

**Hidden:** the arm and strength of any face-down committed unit that is not yours · every
other player's hand · army totals during muster · the supply order.

⚠️ **THE ONE DIVERGENCE, and it is a decision, not a bug.** `OPEN.md` records that the model has
**always treated recruited Power Broker identity as PUBLIC** — `available()` filters the whole
hand and `pools` hands every opponent each unit's arm and strength. The physical game hides
them. **Every balance number in this repo was measured under public brokers.** If GOD hides
them, the online game is *not* the game that was measured. Recommendation: **show recruited
brokers publicly**, which makes the gates describe the shipped game exactly.

---

## 1. Constants

| | value | source |
| --- | ---: | --- |
| Armies | **2** | `game.mjs:26` — `ARMIES` env, default 2 |
| Units per army | **3** | `game.mjs:27` — `CAP` env, default 3 |
| Players per army | **3** | `game.mjs:28` — `MAX_PER_ARMY = ARMY_CAP` |
| **Total slots on the ground** | **6** | 2 × 3 |
| Hand at start | 8 | `cards.mjs` roster |
| Supply | 15 | 3 copies × 5 brokers |
| Points to win | 5 at 2p, else 4 | `cards.mjs` `VICTORY_TARGET` |
| Attempts per turn | 2 | `game.mjs:264` — `attempt < NUM_ARMIES` |
| Sepoy multiplier | ×3 | `battle.mjs` `SEPOY_MULT` |

⚠️ **Six slots, up to eight players.** At 7–8 players **one or two players cannot be on the
ground at all**. Sitting out is a first-class state, not an edge case — measured at 29–35% of
player-rounds at 7–8p. The seat display must say *sitting out* rather than leaving a gap.

⚠️ **`game.mjs` header is stale.** Lines 1–8 describe *three* armies and "3 armies x 3 units =
NINE slots, so eight players all get a post". The shipped game is two armies
(`RULEBOOK.md:61` — "There are only ever **two armies**"). The header describes an abandoned
design. Do not build from it.

---

## 2. Round structure

```
ROUND
 |- MUSTER          turns pass round the table until n consecutive passes
 |   \- per turn:   up to 2 attempts, then the turn ends
 |- CHARGE          both armies turn face up
 |- THE RING        cancellation, simultaneous
 |- ABILITIES       survivors only, ON REVEAL
 |- THE GROUND      higher total takes it; level totals, both take it
 |- SPOILS          1 point per surviving unit of yours, if your army took the ground
 \- SETTLE          winners recover · losers burn and recruit
```

Start player **rotates every round** — `game.mjs:341`, `g.start = (g.start + 1) % n`.

---

## 3. Piece states on the ground

Three, not two.

| state | when | shown |
| --- | --- | --- |
| **Yours** | you committed it | full face: arm, strength, your marker |
| **Hidden** | anyone else's face-down unit | back only, plus owner ring and initials |
| **Revealed** | `card.revealed === true` | full face, to **everyone** |

`revealed` is set two ways (`game.mjs:173`, `178-181`):

1. `revealed: !!unit.faceUp` — **Siege Elephant** and **Sultan Rockets** deploy face up.
2. A Siege Elephant on commitment flips **one random hidden enemy unit** face up.

`revealed` is a property of the card, not of a viewer — a revealed unit is revealed to the
whole table. There is **no per-viewer visibility** in the model, which keeps the client simple.

---

## 4. Hand states

Five. `available(p, round)` is `!spent && rest <= round` (`game.mjs:94`).

| state | condition | meaning |
| --- | --- | --- |
| **Ready** | `!spent && rest <= round` | playable now |
| **Committed** | `rest === round + 1` | on the ground this round |
| **Recovering** | `rest === round + 2` | won the ground, sits out one round, then returns |
| **Burned** | `spent === true` | lost the ground — **gone for good** |
| **Recruited, resting** | broker with `rest === round + 1` | **unusable the round you win it** |

⚠️ **A recruited broker enters at `rest = g.round + 1`** (`game.mjs:336`) — the card you are
handed for losing is unusable until the following round. The hand must say so or it reads as a
bug.

⚠️ **Recovering and Committed look identical in the data** — both are "not ready" — but they mean
opposite things to a player: one is coming back, one is on the table right now. The client must
distinguish them from context, not from `rest` alone.

⚠️ **Burned piles are public** (§0). Every player's burned cards are visible to everyone.

---

## 5. Decision points

### 5.1 Your turn — MUSTER

Move space is exactly `{pass: true}` or `{unit, army}` (`legalMoves`, `game.mjs:96-112`).
**There is no separate "offer" action.** A commitment becomes an offer purely from board state.

An army is **not** available to you when any of these hold:

| rule | code |
| --- | --- |
| you are already in the other army | `mine !== undefined && mine !== a` |
| the army is full (3 units) | `m.armies[a].length >= ARMY_CAP` |
| it already holds 3 different players | `members.size >= MAX_PER_ARMY` |
| it refused you **this turn** | `m.offered.has(a)` |
| you have no ready units | `if (!units.length) return [pass]` |

⚠️ **`m.offered` is cleared at the top of every turn** (`game.mjs:262`). A refusal closes that
army **for this turn only** — it reopens on your next lap.

⚠️ **PASS is not terminal.** The round ends only after `n` *consecutive* passes
(`while (passStreak < n)`). A player who passes is reached again next lap and may act.

### 5.2 Someone sends into your army — the blind accept

Fires when `joining` is true: the sender is in no army, and your army has a leader who is not
them (`game.mjs:269-270`).

The leader sees **that a unit is offered, and by whom. Not what it is.**
Accept → it joins. Refuse → the sender's turn continues with the other army or a pass.

⚠️ The **refusal fork** — a refused unit lands in the other army instead — is **built and NOT
adopted** (`REFUSALFORK=1`, default off, `D045`). Build the baseline.

### 5.3 Defeat — recruiting

Every distinct owner in a losing army recruits one broker (`game.mjs:325-338`). Under the
baseline this is a **blind draw** from the supply, not a choice.

⚠️ The **offer** — three brokers face up, the defeated player chooses — is **built and NOT
adopted** (`BROKEROFFER=1`, default off, `D044`).

---

## 6. Events that need a moment on screen

| event | trigger | consequence |
| --- | --- | --- |
| **Cancellation** | the ring, simultaneous | a cancelled unit adds nothing and its ability never fires |
| **Subhedar** | survives reveal | removes the enemy's weakest unit |
| **Spy** | survives reveal | exchanges with the enemy's **strongest** — **PERMANENT**, the cards change hands for good (`game.mjs:300-310`) |
| **Sepoy** | alone in its army | ×3 strength — and **never** if borrowed (`battle.mjs` `borrowed` guard) |
| **Siege Elephant** | on deploy | flips one random hidden enemy unit face up for the table |
| **Sultan Rockets** | its army loses | **the winners do not recover — their whole army burns** (`game.mjs:313-320`) |

⚠️ **Rockets is the largest event in the game.** `rocketsFired` is true if *any* losing army
held Rockets, and it converts the winners' recovery into a permanent burn. It needs its own
beat in the reveal, not a line of text.

⚠️ **A Spy theft is permanent and visibly foreign.** The stolen card joins the thief's hand for
the rest of the game and belongs to another ruler's set. It must not look like your own cards.

---

## 7. Seat states

| state | meaning |
| --- | --- |
| **To act** | it is this seat's turn |
| **In Army I / II** | committed; can only ever add to that army |
| **Uncommitted** | has ready units, has not committed this round |
| **Passed this lap** | passed; will be offered another turn |
| **Sitting out** | no ready units, or no legal army — cannot act this round |
| **Defeated last round** | burned units, recruited a broker |

---

## 8. End conditions

| end | condition | code |
| --- | --- | --- |
| **target** | any player reaches the points target | `max(vp) >= target` |
| **quiet** | two consecutive rounds with nothing committed | `quiet >= 2` |
| **dry** | no player has any ready unit | `players.every(available().length === 0)` |

Winner is the highest points; **ties mean multiple winners** (`st.winners` filters on `=== top`).
Measured: 100% of games end on **target** at every player count, so `quiet` and `dry` are
correctness cases, not expected outcomes.

---

## 9. What the client must never render

* the arm or strength of a face-down committed unit that is not yours and not `revealed`
* **army totals during muster** — a total leaks strength as surely as a face does
* any other player's hand
* the supply order, or the identity of the next broker

---

## 10. Open items for the client

1. **Public brokers** (§0) — recommended, to match every measured number.
2. **Turn timer** — not in the model at all. A server concern; needs a rule for what an expiry does.
3. **Reconnect** — the model has no notion of a disconnected player.
4. **Sitting out at 7–8 players** — six slots, eight players; must read as a state, not a bug.
