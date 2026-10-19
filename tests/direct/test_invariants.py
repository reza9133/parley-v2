"""Rules that must hold after every single call of a random walk: per-deal books, legal state changes, records.

PARLEY_FUZZ_SEEDS=40 pytest tests/direct/test_invariants.py     runs more walks than the default eight."""

import json
import os
import random

import pytest

from conftest import (
    ACTIVE, ALT_URL, APPEALED, CANCELLED, CLIENT_URL, DEFAULTED, DELIVERED, DISPUTED, GEN, OPEN, P_RELEASED, P_RULING,
    P_SPLIT, PAGE, RULED, SETTLED, WORK_URL, act, at, deal_row, deploy, mock_court, stats,
)

TERMINAL = (SETTLED, CANCELLED, DEFAULTED)
# the states a deal can move to from each state (staying where it is counts as a refused call)
NEXT = {
    OPEN: {OPEN, ACTIVE, CANCELLED},
    ACTIVE: {ACTIVE, DELIVERED, DEFAULTED},
    DELIVERED: {DELIVERED, DISPUTED, SETTLED},
    DISPUTED: {DISPUTED, RULED, SETTLED},
    RULED: {RULED, APPEALED, SETTLED},
    APPEALED: {APPEALED, SETTLED},
    SETTLED: {SETTLED},
    CANCELLED: {CANCELLED},
    DEFAULTED: {DEFAULTED},
}
SEEDS = range(int(os.environ.get("PARLEY_FUZZ_SEEDS", "8")))


def _try(fn, *args):
    try:
        fn(*args)
        return True
    except Exception as exc:  # a refused call is an expected outcome of a random walk
        assert "Error" in type(exc).__name__, repr(exc)
        return False


def _escrow(row) -> int:
    """Everything that was paid into a deal, whatever state it is in."""
    taken = int(row["accepted_at"]) > 0
    return int(row["price"]) + (int(row["bond"]) if taken else 0) + int(row["deposit"]) + int(row["appeal_bond"])


def _check_books(c, vm, ledger, rows, before):
    s = stats(c)
    assert int(s["deposited"]) == sum(_escrow(r) for r in rows), "deposited does not match what the deals hold"
    claimed_total = 0
    for r in rows:
        d = r["id"]
        assert 0 <= r["completion"] <= 10_000 and r["state"] in NEXT
        if d in before:
            assert r["state"] in NEXT[before[d]], f"deal {d}: {before[d]} -> {r['state']}"
        if r["state"] not in TERMINAL:
            assert r["claimed"] == {"client": False, "provider": False}
            continue
        owed = {}
        for role in ("client", "provider"):
            who = r[role]
            owed[role] = int(json.loads(c.owed_of(d, who))["amount"]) if who else 0
        assert owed["client"] + owed["provider"] == _escrow(r), f"deal {d}: the two shares do not add up to the escrow"
        for role in ("client", "provider"):
            if r["claimed"][role]:
                claimed_total += owed[role]
        if r["state"] == CANCELLED:
            assert owed == {"client": int(r["price"]), "provider": 0}
        if r["state"] == DEFAULTED:
            assert owed == {"client": int(r["price"]) + int(r["bond"]), "provider": 0}
        if r["state"] == SETTLED:
            earned = int(r["price"]) * r["completion"] // 10_000
            assert owed["provider"] >= earned and owed["client"] >= int(r["price"]) - earned
    assert int(s["paid"]) == claimed_total == ledger.total(), "paid does not match the claims"


def _check_records(c, rows, actors):
    """The reputation counters add up to what the deals say."""
    profiles = [json.loads(c.profile_of(a)) for a in actors]
    s = stats(c)
    assert sum(p["opened"] for p in profiles) == len(rows)
    assert sum(p["taken"] for p in profiles) == sum(1 for r in rows if int(r["accepted_at"]) > 0)
    assert sum(p["cancelled"] for p in profiles) == s["cancelled"]
    assert sum(p["defaults"] for p in profiles) == s["defaulted"]
    assert sum(p["settled"] for p in profiles) == 2 * s["settled"]
    disputed = sum(1 for r in rows if r["state"] == SETTLED and r["path"] in (P_SPLIT, P_RULING, P_RELEASED))
    assert sum(p["disputes"] for p in profiles) == 2 * disputed
    assert sum(p["won"] for p in profiles) == sum(p["lost"] for p in profiles)
    assert sum(int(p["volume"]) for p in profiles) == 2 * int(s["volume"])


@pytest.mark.parametrize("seed", SEEDS)
def test_invariants_hold_after_every_call(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, ledger, seed):
    """Most calls follow the deal's own story (the right party, the right moment); the rest are random and mostly refused."""
    rnd = random.Random(1000 + seed)
    c = deploy(direct_deploy, direct_vm)
    actors = [direct_alice, direct_bob, direct_charlie]
    hexes = [a.as_hex for a in actors]
    by_hex = {h.lower(): a for h, a in zip(hexes, actors)}
    clock = 0
    before = {}
    reached = set()

    def set_world():
        direct_vm.clear_mocks()
        page = PAGE if rnd.random() < 0.85 else ""
        direct_vm.mock_web(r"work\.example\.org|mirror\.example\.net", {"status": 200 if page else 404, "body": page})
        direct_vm.mock_web(r"client\.example\.com", {"status": 200, "body": PAGE})
        if rnd.random() < 0.1:  # a court that cannot be reached: nothing but release can close such a hearing
            direct_vm.mock_llm(r"<criteria>", "not json at all")
        else:
            mock_court(direct_vm, [rnd.choice((0, 1, 1, 2, 2)) for _ in range(4)])

    def rows():
        return [deal_row(c, d) for d in range(stats(c)["total"])]

    def party(row, role):
        return by_hex.get(row[role].lower()) if row[role] else None

    def other_than(*banned):
        return rnd.choice([a for a in actors if all(a is not b for b in banned)])

    def story(d, row):
        """One call that moves the deal along (or a deliberate near miss), made by the party it belongs to."""
        state = row["state"]
        client, provider = party(row, "client"), party(row, "provider")
        pick = rnd.random()
        if state == OPEN:
            if pick < 0.7:
                who = by_hex[row["provider"].lower()] if row["provider"] else other_than(client)
                act(direct_vm, who, int(row["bond"]))
                return c.accept_deal(d)
            act(direct_vm, client)
            return c.withdraw_offer(d)
        if state == ACTIVE:
            if pick < 0.55:
                act(direct_vm, provider)
                return c.deliver(d, rnd.choice((WORK_URL, ALT_URL)), "done")
            if pick < 0.7:
                act(direct_vm, provider)
                return c.request_extension(d, rnd.choice((300, 900)), "need a little more time")
            if pick < 0.85:
                act(direct_vm, client)
                return c.answer_extension(d, rnd.random() < 0.6)
            act(direct_vm, other_than())
            return c.expire(d)
        if state == DELIVERED:
            if pick < 0.3:
                act(direct_vm, client)
                return c.approve(d)
            if pick < 0.8:
                act(direct_vm, client, int(row["deposit_due"]))
                return c.reject(d, "The work misses the criteria.", rnd.choice(("", CLIENT_URL)))
            act(direct_vm, other_than())
            return c.finalize(d)
        if state == DISPUTED:
            if pick < 0.2:
                act(direct_vm, provider)
                return c.reply(d, "Everything is on the page.", rnd.choice(("", ALT_URL)))
            if pick < 0.4:
                act(direct_vm, rnd.choice((client, provider)))
                return c.propose_split(d, rnd.choice((0, 2500, 5000, 10_000)))
            if pick < 0.6:
                who, offer = rnd.choice(((client, row["offers"]["provider"]), (provider, row["offers"]["client"])))
                act(direct_vm, who)
                return c.accept_split(d, offer if offer is not None and rnd.random() < 0.9 else 1234)
            if pick < 0.85:
                set_world()
                act(direct_vm, other_than())
                return c.rule(d)
            act(direct_vm, other_than())
            return c.release(d)
        if state == RULED:
            if pick < 0.5:
                who = rnd.choice((client, provider))
                act(direct_vm, who, int(row["appeal_due"]))
                return c.appeal(d, "The ruling is off.", rnd.choice(("", ALT_URL)))
            act(direct_vm, other_than())
            return c.finalize(d)
        if state == APPEALED:
            if pick < 0.35:
                responder = client if row["appellant"] == 2 else provider
                act(direct_vm, responder)
                return c.reply(d, "The first ruling was right.", "")
            if pick < 0.9:
                set_world()
                act(direct_vm, other_than())
                return c.rule(d)
            act(direct_vm, other_than())
            return c.release(d)
        act(direct_vm, rnd.choice((client, provider)))
        return c.claim(d)

    def noise(d, row):
        step = rnd.randrange(1, 8)
        who = rnd.choice(actors)
        if step == 1:
            act(direct_vm, who, int(row["bond"]) + rnd.choice((0, 1)))
            return c.accept_deal(d)
        if step == 2:
            act(direct_vm, who, int(row["deposit_due"]))
            return c.reject(d, "The work misses the criteria.", "")
        if step == 3:
            act(direct_vm, who, int(row["appeal_due"]))
            return c.appeal(d, "The ruling is off.", "")
        if step == 4:
            act(direct_vm, who)
            return getattr(c, rnd.choice(("approve", "finalize", "expire", "release", "claim", "withdraw_offer")))(d)
        if step == 5:
            act(direct_vm, who)
            return c.propose_split(d, rnd.choice((0, 5000, 10_000)))
        if step == 6:
            act(direct_vm, who)
            return c.reply(d, "Everything is on the page.", "")
        set_world()
        act(direct_vm, who)
        return c.rule(d)

    set_world()
    for _ in range(220):
        clock += rnd.choices((1, 30, 400, 1500, 3700, 90_000, 31 * 86400), (5, 5, 4, 3, 3, 1, 0.4))[0]
        at(direct_vm, clock)
        current = rows()
        n = len(current)
        captured = len(direct_vm._captured_validators)
        live = [r["id"] for r in current if r["state"] not in TERMINAL]
        if n == 0 or (n < 8 and (not live or rnd.random() < 0.06)):
            owner = rnd.choice(actors)
            named = rnd.choice(("", other_than(owner).as_hex))
            act(direct_vm, owner, GEN * rnd.choice((1, 2)) // 3)
            _try(c.open_deal, "Write a testing guide", "A guide that explains testing.", "Intro here ok\nSummary at end", named,
                 rnd.choice((3600, 90_000)), rnd.choice((600, 7200)), rnd.choice((300, 3600)), rnd.choice((0, 1000, 3000)), False)
        else:
            d = rnd.choice(live) if live and rnd.random() < 0.85 else rnd.randrange(n)
            _try(noise if rnd.random() < 0.15 else story, d, current[d])

        # a hearing that just ran must be one the validators would accept (they read the same world)
        if len(direct_vm._captured_validators) > captured:
            assert direct_vm.run_validator() is True

        after = rows()
        _check_books(c, direct_vm, ledger, after, before)
        before = {r["id"]: r["state"] for r in after}
        reached.update((r["state"], r["path"]) for r in after)

    # drive every deal to its end, then let both parties claim, and check the books one last time
    for _ in range(12):
        clock += 40 * 86400
        at(direct_vm, clock)
        set_world()
        if seed % 4 == 0:  # the court stays out of reach, so disputes are closed by release
            direct_vm.mock_llm(r"<criteria>", "not json at all")
        else:
            mock_court(direct_vm, [2, 1, 1, 0])
        for d in range(stats(c)["total"]):
            if deal_row(c, d)["state"] in TERMINAL:
                continue
            for name in ("expire", "finalize", "rule", "release"):
                act(direct_vm, direct_charlie)
                if _try(getattr(c, name), d):
                    break
    final = rows()
    assert all(r["state"] in TERMINAL for r in final), [r["state"] for r in final]
    for r in final:
        for who in actors:
            act(direct_vm, who)
            _try(c.claim, r["id"])
    final = rows()
    reached.update((r["state"], r["path"]) for r in final)
    _check_books(c, direct_vm, ledger, final, before)
    _check_records(c, final, hexes)
    s = stats(c)
    assert s["deposited"] == s["paid"] == str(ledger.total())
    # every share was claimed: a deal with money in it has both parties paid (or owed nothing)
    for r in final:
        for role in ("client", "provider"):
            if r[role]:
                owed = int(json.loads(c.owed_of(r["id"], r[role]))["amount"])
                assert r["claimed"][role] or owed == 0
    test_invariants_hold_after_every_call.reached = getattr(test_invariants_hold_after_every_call, "reached", set()) | reached


def test_the_walks_reach_every_kind_of_ending():
    """Runs after the walks above (pytest keeps file order): together they have to have seen every way a deal ends."""
    reached = getattr(test_invariants_hold_after_every_call, "reached", None)
    if reached is None or len(list(SEEDS)) < 8:
        pytest.skip("needs the full set of walks")
    ends = {(SETTLED, p) for p in range(1, 6)} | {(CANCELLED, 0), (DEFAULTED, 0)}
    assert ends <= reached, sorted(ends - reached)
