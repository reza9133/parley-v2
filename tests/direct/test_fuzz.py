"""Random walks through the whole contract: whatever happens, the books balance and every deal can be closed."""

import json
import random

import pytest

from conftest import (
    CANCELLED, DEFAULTED, GEN, PAGE, SETTLED, WORK_URL, ALT_URL, CLIENT_URL, act, at, deal_row, deploy, mock_court,
    stats,
)

TERMINAL = (SETTLED, CANCELLED, DEFAULTED)


def _try(fn, *args):
    try:
        fn(*args)
        return True
    except Exception as exc:  # a refused call is an expected outcome of a random walk
        assert "UserError" in type(exc).__name__ or "Error" in type(exc).__name__, repr(exc)
        return False


@pytest.mark.parametrize("seed", range(6))
def test_random_walks_keep_the_books_balanced(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, ledger, seed):
    rnd = random.Random(seed)
    c = deploy(direct_deploy, direct_vm)
    actors = [direct_alice, direct_bob, direct_charlie]
    clock = 0
    statuses = lambda: [rnd.choice((0, 1, 2)) for _ in range(4)]

    def set_world():
        direct_vm.clear_mocks()
        page = PAGE if rnd.random() < 0.85 else ""
        direct_vm.mock_web(r"work\.example\.org|mirror\.example\.net", {"status": 200 if page else 404, "body": page})
        direct_vm.mock_web(r"client\.example\.com", {"status": 200, "body": PAGE})
        mock_court(direct_vm, statuses())

    set_world()
    for _ in range(150):
        clock += rnd.choice((1, 30, 400, 3700, 90_000))
        at(direct_vm, clock)
        who = rnd.choice(actors)
        n = len(json.loads(c.list_deals(0, 60)))
        d = rnd.randrange(n) if n and rnd.random() < 0.9 else 0
        row = deal_row(c, d) if n else None
        step = rnd.randrange(16)
        if step == 0 or n == 0:
            act(direct_vm, who, GEN * rnd.choice((1, 2)) // 3)
            provider = rnd.choice(("", "", direct_bob.as_hex if hasattr(direct_bob, "as_hex") else ""))
            _try(c.open_deal, "Write a testing guide", "A guide that explains testing.", "Intro here ok\nSummary at end", provider,
                 rnd.choice((300, 3600)), rnd.choice((600, 7200)), rnd.choice((300, 3600)), rnd.choice((0, 1000, 3000)), False)
            continue
        due = int(row["bond"])
        if step == 1:
            act(direct_vm, who, due if rnd.random() < 0.9 else due + 1)
            _try(c.accept_deal, d)
        elif step == 2:
            act(direct_vm, who)
            _try(c.deliver, d, rnd.choice((WORK_URL, ALT_URL)), "done")
        elif step == 3:
            act(direct_vm, who)
            _try(c.approve, d)
        elif step == 4:
            act(direct_vm, who, int(row["deposit_due"]))
            _try(c.reject, d, "The work misses the criteria.", rnd.choice(("", CLIENT_URL)))
        elif step == 5:
            act(direct_vm, who)
            _try(c.reply, d, "Everything is on the page.", rnd.choice(("", ALT_URL)))
        elif step == 6:
            act(direct_vm, who)
            _try(c.propose_split, d, rnd.choice((0, 2500, 5000, 10_000)))
        elif step == 7:
            act(direct_vm, who)
            _try(c.accept_split, d, rnd.choice((0, 2500, 5000, 10_000)))
        elif step == 8:
            set_world()
            act(direct_vm, who)
            _try(c.rule, d)
        elif step == 9:
            act(direct_vm, who, int(row["appeal_due"]))
            _try(c.appeal, d, "The ruling is off.", "")
        elif step == 10:
            act(direct_vm, who)
            _try(c.finalize, d)
        elif step == 11:
            act(direct_vm, who)
            _try(c.expire, d)
        elif step == 12:
            act(direct_vm, who)
            _try(c.release, d)
        elif step == 13:
            act(direct_vm, who)
            _try(c.claim, d)
        elif step == 14:
            act(direct_vm, who)
            _try(c.request_extension, d, rnd.choice((300, 900)), "need a little more time")
        else:
            act(direct_vm, who)
            _try(c.answer_extension, d, rnd.random() < 0.5)

    # Drive every deal to an end, then let both parties claim.
    for _ in range(12):
        clock += 40 * 86400
        at(direct_vm, clock)
        set_world()
        mock_court(direct_vm, [2, 1, 1, 0])
        for d in range(len(json.loads(c.list_deals(0, 60)))):
            if deal_row(c, d)["state"] in TERMINAL:
                continue
            for name in ("expire", "finalize", "rule", "release"):
                act(direct_vm, direct_charlie)
                if _try(getattr(c, name), d):
                    break
    rows = [deal_row(c, d) for d in range(len(json.loads(c.list_deals(0, 60))))]
    assert all(r["state"] in TERMINAL for r in rows), [r["state"] for r in rows]
    for d in range(len(rows)):
        for who in actors:
            act(direct_vm, who)
            _try(c.claim, d)
    s = stats(c)
    assert s["deposited"] == s["paid"] == str(ledger.total()), s
    assert s["settled"] + s["cancelled"] + s["defaulted"] == len(rows)
