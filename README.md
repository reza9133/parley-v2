# Parley

Parley is an escrow for freelance-style work, written as a GenLayer intelligent contract for Studionet.

A client locks the price and writes down acceptance criteria. A provider takes the job and posts a bond. When the provider hands in a link to the work, the client can approve it, ignore it (silence counts as approval), or reject it. A rejection opens a hearing, and an AI court reads the delivered page and scores it against the agreed criteria, one by one. The provider earns the share of the price that matches the score, the rest goes back to the client, and the deposits of both sides move according to who was right.

Nobody has to trust a person to decide. The court can only judge what was agreed in advance, and it has to quote the page to give credit.

## How a deal runs

```
            withdraw_offer / expire
   OPEN ------------------------------> CANCELLED      the client claims the price back
    |
    | accept_deal (provider posts the bond)
    v
  ACTIVE ---- expire after the due date ----> DEFAULTED   the client claims price + bond
    |
    | deliver (a link to the work)
    v
 DELIVERED ---- approve / finalize (silent client) ----> SETTLED   the provider earns the whole price
    |
    | reject (client posts a deposit)
    v
 DISPUTED ---- accept_split ----> SETTLED
    |    \---- release (30 days without a ruling) ----> SETTLED
    | rule
    v
  RULED ---- finalize (nobody appealed) ----> SETTLED
    |
    | appeal (either party posts an appeal bond)
    v
 APPEALED ---- rule (final) / release ----> SETTLED
```

Money is never pushed to anyone. When a deal is over, each party calls `claim` once and the contract sends them what the outcome says they are owed.

## How the court decides

1. Every criterion gets a status: 2 = fully met, 1 = partly met, 0 = not met or not shown.
2. A status above 0 needs a quote copied word for word from a delivered page. The contract checks that the quote really appears in the text of the page it cites. A quote that is not there earns nothing, whatever the model said.
3. The completion is the credit given divided by the credit possible, in basis points (4 criteria with credits 2, 1, 0, 2 give 5 of 8, which is 6250).
4. The provider earns `price * completion / 10000`. The client gets the rest.

Only the listed criteria count. The prompt tells the court to ignore new demands, and everything that comes from a user (title, scope, criteria, filings, pages) is stripped of angle brackets and marked as untrusted data.

The deliverable has to be a public http(s) link to a real domain: no IP literals, no credentials, no custom ports, no private or wildcard-DNS hosts. If the plain page has little text, the rendered version is tried as well. An HTTP error is never read as a deliverable. The court reads the text a visitor would see: markup, scripts and styles are dropped (a `>` inside a quoted attribute does not end a tag), and character references such as `&#8217;` or `&mdash;` are turned into the characters they stand for, so a quote copied from the page is found in it.

A deal can be `pinned`. Then the deliverable (and any page the provider adds during a hearing) has to be a commit-pinned repository link or a content-addressed IPFS link, so nobody can quietly rewrite it between delivery and ruling.

### Validators

Each validator reads the pages and rules on every criterion itself. It accepts the leader's ruling when:

- both rulings are of the same kind (a ruling, or "the deliverable could not be read"),
- no criterion differs by two levels,
- the total differs by at most half as many levels as there are criteria (and at least one),
- the completion is exactly what the credits add up to,
- the summary, the page fingerprint and every stored quote and link are as short and as plain as an honest ruling's (the leader's ruling is stored as it was sent), and
- every quote of the leader appears on the validator's own copy of the page it cites.

The nondeterministic part lives in module-level functions, and the closures handed to the VM carry only plain strings, numbers and lists, so they can be serialized.

### When the page cannot be read

The ruling is retried an hour later, up to three attempts. On the last attempt even a very short page is accepted. If the deliverable is still unreadable, the work counts as not delivered (completion 0).

## Who gets what

`earned = price * completion / 10000`. The client always gets `price - earned`.

| How the deal ended | Client also gets | Provider gets |
| --- | --- | --- |
| Approved, or approved by silence | nothing | `earned` (the whole price) + bond |
| Offer withdrawn or lapsed | the price | nothing |
| Provider missed the due date | price + bond | nothing |
| Both sides agreed on a split | own deposit | `earned` + bond |
| Ruling of 80% or more | nothing | `earned` + bond + the client's deposit (the rejection was unfounded) |
| Ruling between 30% and 80% | own deposit | `earned` + bond |
| Ruling of 30% or less | provider's bond + own deposit | `earned` |
| Released after 30 days without a ruling | own deposit | `earned` (half the price, or the first ruling when an appeal was pending) + bond |

The appeal bond goes back to the appellant when the final ruling moved the completion at least 15 points in their favour (up for the provider, down for the client). Otherwise the other party receives it. A released appeal returns the bond to the appellant.

Every wei that comes in leaves again. The contract keeps `deposited` and `paid` counters, and the tests check that they match after every kind of ending.

## Parameters

| What | Value |
| --- | --- |
| Price | at least 0.1 GEN |
| Bond (set by the client) | 0 to 30% of the price |
| Dispute deposit (client, on rejection) | 3% of the price, at least 0.005 GEN |
| Appeal bond | 10% of the price, at least 0.02 GEN |
| Offer stays open | 5 minutes to 90 days |
| Work time | 5 minutes to one year |
| Review time after delivery | 5 minutes to 30 days |
| Hearing window (replies, appeals) | the review time, clamped to 10 minutes to 7 days |
| Acceptance criteria | 1 to 6 of 6 to 160 characters (one per line, or separated by `\|`) |
| Title / scope / filing / note | 4-100 / 10-600 / 10-500 / up to 200 characters |
| Extensions | at least 5 minutes each; in total at most the work time and 30 days |
| Appeals | one per deal; the ruling after an appeal is final |
| Release | 30 days after a dispute or an appeal started |

## Interface

Writes

| Method | Who | What it does |
| --- | --- | --- |
| `open_deal(title, scope, criteria, provider, offer_for, work_for, review_for, bond_bps, pinned)` payable | client | Locks the price. An empty `provider` lets anyone take the deal. |
| `withdraw_offer(deal_id)` | client | Takes back an offer nobody has taken. |
| `accept_deal(deal_id)` payable | provider | Takes the deal and posts exactly the bond. |
| `request_extension(deal_id, extra_seconds, reason)` / `answer_extension(deal_id, grant)` | provider / client | More time before the due date. |
| `deliver(deal_id, url, note)` | provider | Hands in the work before the due date. |
| `approve(deal_id)` | client | Accepts the work. |
| `reject(deal_id, reason, url)` payable | client | Opens a hearing with exactly the deposit. The link is context for the court. |
| `reply(deal_id, statement, url)` | other party | One reply per hearing. A link added by the provider counts as an additional deliverable. |
| `propose_split(deal_id, provider_bps)` / `accept_split(deal_id, provider_bps)` | either party / the other one | Settle without the court. Accepting names the share, so an offer replaced at the last moment cannot be accepted by mistake. |
| `rule(deal_id)` | anyone | Asks the court. Available after the reply or the end of the window. |
| `appeal(deal_id, statement, url)` payable | either party | Appeals the first ruling with exactly the appeal bond. |
| `finalize(deal_id)` | anyone | Closes a delivery nobody answered, or a ruling nobody appealed, once the waiting time is over. |
| `expire(deal_id)` | anyone | Closes a lapsed offer, or a deal whose due date passed. |
| `release(deal_id)` | anyone | Closes a dispute that had no ruling for 30 days. |
| `claim(deal_id)` | client / provider | Pays out what the closed deal owes the caller. Once per party. |

Views (all return JSON text): `get_deal`, `list_deals(offset, limit)`, `deals_of(address, offset, limit)`, `owed_of(deal_id, address)`, `profile_of(address)`, `stats()`.

A deal row carries the state, the amounts, the deadlines, every filing, the court's rulings (credit, quote and source page for each criterion, a summary and the hash of the page that was read) and the claim flags. `profile_of` reports the opened, taken, settled, delivered, failed, defaulted and cancelled counts, disputes won and lost, volume, and the provider's average completion.

States are numbered 0 to 8 in the order OPEN, ACTIVE, DELIVERED, DISPUTED, RULED, APPEALED, SETTLED, CANCELLED, DEFAULTED. Paths are 0 to 5: none, approved, auto-approved, split, ruling, released.

## Design notes

- **Criteria are fixed before the work starts.** The client cannot raise the bar after delivery, and the court is told to ignore anything that is not on the list.
- **Partial credit.** A page that meets three of four criteria is paid three quarters of the price. There is no all-or-nothing cliff.
- **Skin in the game on both sides.** The provider's bond makes a missed deadline costly, the client's deposit makes a frivolous rejection costly, and the appeal bond makes an appeal a real bet (the 15-point swing rule is what turns the bet into a win).
- **Silence is an answer.** A client who never responds approves the work after the review time; a provider who never replies is ruled against on what the page shows.
- **Pull payments.** Claims are marked before the transfer is sent, so a second claim finds nothing to take.
- **No funds get stuck.** Every state has a way out: expire, finalize, release or an agreement.

## Limits

- The court reads text. Images, video and anything that needs a login are out of reach, and a page that changes between the first reading and the validators' reading can make a ruling fail and be retried.
- A deliverable that is not pinned can still change after delivery. Use `pinned` when that matters.
- If nobody asks for a ruling for 30 days, `release` can close the dispute with the neutral split. The provider should call `rule` once the hearing window is over.
- Model variance is real. The tolerance in the validators and the 15-point appeal swing are there so that small differences do not decide who pays.

## Run it

```bash
pip install -r requirements.txt

# static checks
genvm-lint check contracts/parley.py

# deploy to Studionet
genlayer network set studionet
genlayer deploy --contract contracts/parley.py

# tests: in-memory, no VM or network, the web and the model are mocked
pytest
PARLEY_FUZZ_SEEDS=40 pytest tests/direct/test_invariants.py    # more guided random walks than the default eight
```

## Live test run on Studionet

Deployed contract on Studionet: `0x5d084E85056Acc332793f34667b8a9890f7B2Bd9` (also stored in `.parley-address`, which `scripts/e2e.mjs` reads when `PARLEY_ADDRESS` is not set, so the run uses this deployment instead of deploying a new one).

`scripts/e2e.mjs` drives a deployed contract with real accounts and writes a report that updates after every transaction.

```bash
npm install
# two accounts funded from the Studio faucet (the client needs about 1 GEN in all)
export CLIENT_KEY=0x... PROVIDER_KEY=0x...
node scripts/e2e.mjs                       # deploys a fresh contract, then runs every scenario
PARLEY_ADDRESS=0x... node scripts/e2e.mjs --only approve,adversarial
node scripts/e2e.mjs --dry-run             # prints the plan and touches nothing
bash scripts/run-all.sh                    # lint, local tests and the live run in one go
```

| Scenario | What it proves |
| --- | --- |
| `cancel` | an unclaimed offer can be withdrawn and the price comes back |
| `adversarial` | more than thirty calls are refused (wrong amounts, wrong callers, wrong states, private links, double claims) and none of them moves money |
| `approve` | take, deliver, approve, both claim |
| `split` | rejection, competing offers, an offer replaced at the last moment, agreement |
| `silent` | a silent client means approval (waits for the review window) |
| `default` | a provider who misses the due date forfeits the bond (waits for the due date) |
| `court` | a real hearing on a real page: reply, ruling, quote and credit checks, finalize, payout |

Reports are written to `reports/parley-e2e-<time>.html`, `.md` and `.json`; the HTML page refreshes itself while the run is going. The script exits with 1 when a check fails. Optional settings: `OUTSIDER_KEY` (the stranger account), `WORK_URL`, `CRITERIA`, `PRICE_GEN`, `REPORT_DIR`. A refusal only counts when the transaction reached the network and the contract decided it as an error. The `court` scenario depends on a real model, so it checks the shape and the arithmetic of the ruling, not a fixed score.

## Layout

```
contracts/parley.py        the intelligent contract
tests/direct/conftest.py   fixtures: clock, payouts recorder, deal builders, court mocks
tests/direct/test_deals.py       opening, taking, extensions, delivery, approval, paging
tests/direct/test_court.py       replies, rulings, quotes, retries, offers, appeals, release
tests/direct/test_funds.py       payout rules and "every wei comes out" checks
tests/direct/test_validators.py  validator acceptance rules and the serialized closures
tests/direct/test_hardening.py   links, page text, call order, unknown deals
tests/direct/test_fuzz.py        random walks that must always leave the books balanced
tests/direct/test_invariants.py  guided random walks: per-deal books, legal state changes and records after every call
scripts/e2e.mjs            live scenarios on Studionet with a self-updating report
scripts/deploy.mjs         deploys the contract
scripts/receipt.mjs        reads the result of a decided transaction (shared by the two scripts)
scripts/run-all.sh         lint, local tests and the live run
```
