"""Direct-mode tests: opening, taking, delivering, approving and expiring deals.

Run:  pytest tests/direct -v   (Python 3.12, genlayer-test installed)
"""

import json

import pytest

from conftest import (
    ACTIVE, ALT_URL, CANCELLED, CRITERIA, DEFAULTED, DELIVERED, GEN, OPEN, P_APPROVED, P_AUTO, SETTLED, WORK_URL, act,
    at, deal_row, deliver, deploy, hx, open_deal, stats, take, to_delivery,
)


# ---- opening ---------------------------------------------------------------

def test_open_deal_stores_a_clean_row(direct_vm, direct_deploy, direct_alice):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(
        c, direct_vm, direct_alice, price=2 * GEN, title="  Write   a <b>guide</b> ", bond_bps=2500,
        criteria="Has an <i>introduction</i>  | Ends with a summary\n\n  Covers errors  ",
    )
    row = deal_row(c, deal_id)
    assert deal_id == 0
    assert row["title"] == "Write a (b)guide(/b)"
    assert row["criteria"] == ["Has an (i)introduction(/i)", "Ends with a summary", "Covers errors"]
    assert row["state"] == OPEN and row["open_to_any"] is True and row["provider"] == ""
    assert row["client"].lower() == hx(direct_alice).lower()
    assert row["price"] == str(2 * GEN)
    assert row["bond"] == str(GEN // 2)  # 25% of the price
    assert row["deposit_due"] == str(6 * 10**16)  # 3% of 2 GEN
    assert row["offer_until"] == row["created"] + 3600
    s = stats(c)
    assert s["total"] == 1 and s["deposited"] == str(2 * GEN) and s["paid"] == "0"


def test_deposit_and_appeal_amounts_scale_with_the_price(direct_vm, direct_deploy, direct_alice):
    c = deploy(direct_deploy, direct_vm)
    small = open_deal(c, direct_vm, direct_alice, price=GEN // 10)
    big = open_deal(c, direct_vm, direct_alice, price=100 * GEN)
    a, b = deal_row(c, small), deal_row(c, big)
    assert a["deposit_due"] == str(5 * 10**15) and a["appeal_due"] == str(2 * 10**16)  # the floors
    assert b["deposit_due"] == str(3 * GEN) and b["appeal_due"] == str(10 * GEN)  # 3% and 10%


def test_open_deal_rejects_bad_input(direct_vm, direct_deploy, direct_alice):
    c = deploy(direct_deploy, direct_vm)
    good = dict(title="Write a guide", scope="A guide about testing contracts.", criteria=CRITERIA, provider="",
                offer_for=3600, work_for=7200, review_for=3600, bond_bps=1000, pinned=False)

    def call(value=GEN, **over):
        a = {**good, **over}
        act(direct_vm, direct_alice, value)
        return c.open_deal(a["title"], a["scope"], a["criteria"], a["provider"], a["offer_for"], a["work_for"],
                           a["review_for"], a["bond_bps"], a["pinned"])

    cases = [
        (dict(title="abc"), "title needs"),
        (dict(title="x" * 101), "title needs"),
        (dict(scope="too short"), "scope needs"),
        (dict(scope="s" * 601), "scope needs"),
        (dict(criteria=""), "between 1 and 6"),
        (dict(criteria="\n".join(f"Criterion number {i}" for i in range(7))), "between 1 and 6"),
        (dict(criteria="short"), "Each criterion"),
        (dict(criteria="c" * 161), "Each criterion"),
        (dict(offer_for=10), "offer has to stay open"),
        (dict(offer_for=91 * 86400), "offer has to stay open"),
        (dict(work_for=10), "work time"),
        (dict(work_for=366 * 86400), "work time"),
        (dict(review_for=10), "review time"),
        (dict(review_for=31 * 86400), "review time"),
        (dict(bond_bps=-1), "at most 30%"),
        (dict(bond_bps=3001), "at most 30%"),
        (dict(provider="not-an-address"), "not a valid address"),
        (dict(provider="0x" + "0" * 40), "not a valid address"),
        (dict(provider=hx(direct_alice)), "cannot be the provider"),
        (dict(value=GEN // 20), "minimum price"),
    ]
    for over, message in cases:
        with direct_vm.expect_revert(message):
            call(**over)
    assert stats(c)["total"] == 0 and stats(c)["deposited"] == "0"
    call(bond_bps=3000)  # the limits themselves are fine
    call(offer_for=300, work_for=300, review_for=300, bond_bps=0)
    call(offer_for=90 * 86400, work_for=365 * 86400, review_for=30 * 86400)
    assert stats(c)["total"] == 3


# ---- taking a deal ---------------------------------------------------------

def test_accept_rules(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, provider=hx(direct_bob))
    at(direct_vm, 50)

    act(direct_vm, direct_alice, GEN // 10)
    with direct_vm.expect_revert("cannot take their own"):
        c.accept_deal(deal_id)
    act(direct_vm, direct_charlie, GEN // 10)
    with direct_vm.expect_revert("reserved for another provider"):
        c.accept_deal(deal_id)
    act(direct_vm, direct_bob, GEN // 10 + 1)
    with direct_vm.expect_revert("exactly the bond"):
        c.accept_deal(deal_id)
    act(direct_vm, direct_bob, 0)
    with direct_vm.expect_revert("exactly the bond"):
        c.accept_deal(deal_id)
    with direct_vm.expect_revert("No such deal"):
        c.accept_deal(7)

    take(c, direct_vm, direct_bob, deal_id)
    row = deal_row(c, deal_id)
    assert row["state"] == ACTIVE
    assert row["accepted_at"] == row["created"] + 50 and row["due"] == row["accepted_at"] + 7200
    assert stats(c)["deposited"] == str(GEN + GEN // 10)
    act(direct_vm, direct_charlie, GEN // 10)
    with direct_vm.expect_revert("already been taken"):
        c.accept_deal(deal_id)


def test_an_offer_cannot_be_taken_after_it_lapses(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, offer_for=600)
    at(direct_vm, 600)
    act(direct_vm, direct_bob, GEN // 10)
    with direct_vm.expect_revert("offer has lapsed"):
        c.accept_deal(deal_id)


def test_an_open_deal_can_be_taken_by_anyone_and_is_indexed(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice)
    assert json.loads(c.deals_of(hx(direct_bob), 0, 10)) == []
    take(c, direct_vm, direct_bob, deal_id)
    row = deal_row(c, deal_id)
    assert row["provider"].lower() == hx(direct_bob).lower() and row["state"] == ACTIVE
    assert [r["id"] for r in json.loads(c.deals_of(hx(direct_bob), 0, 10))] == [deal_id]
    assert [r["id"] for r in json.loads(c.deals_of(hx(direct_alice), 0, 10))] == [deal_id]
    assert json.loads(c.deals_of(hx(direct_charlie), 0, 10)) == []
    assert json.loads(c.profile_of(hx(direct_bob)))["taken"] == 1


def test_a_deal_without_a_bond_is_taken_for_nothing(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, bond_bps=0)
    assert deal_row(c, deal_id)["bond"] == "0"
    act(direct_vm, direct_bob, 1)
    with direct_vm.expect_revert("exactly the bond"):
        c.accept_deal(deal_id)
    take(c, direct_vm, direct_bob, deal_id)
    assert deal_row(c, deal_id)["state"] == ACTIVE


# ---- withdrawing and expiring ----------------------------------------------

def test_withdraw_offer_refunds_the_client(direct_vm, direct_deploy, direct_alice, direct_bob, ledger):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, price=3 * GEN)
    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("Only the client"):
        c.withdraw_offer(deal_id)
    act(direct_vm, direct_alice)
    with direct_vm.expect_revert("not a valid address"):
        c.deals_of("zzz", 0, 1)
    c.withdraw_offer(deal_id)
    assert deal_row(c, deal_id)["state"] == CANCELLED
    with direct_vm.expect_revert("already been taken"):
        c.withdraw_offer(deal_id)
    c.claim(deal_id)
    assert ledger.to(direct_alice) == 3 * GEN
    with direct_vm.expect_revert("Already claimed"):
        c.claim(deal_id)
    assert stats(c)["cancelled"] == 1 and stats(c)["paid"] == str(3 * GEN)
    assert json.loads(c.profile_of(hx(direct_alice)))["cancelled"] == 1


def test_a_taken_deal_cannot_be_withdrawn(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice)
    take(c, direct_vm, direct_bob, deal_id)
    act(direct_vm, direct_alice)
    with direct_vm.expect_revert("already been taken"):
        c.withdraw_offer(deal_id)


def test_expire_cancels_a_lapsed_offer(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, ledger):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, offer_for=1000)
    act(direct_vm, direct_charlie)
    at(direct_vm, 999)
    with direct_vm.expect_revert("Nothing has expired"):
        c.expire(deal_id)
    at(direct_vm, 1000)
    c.expire(deal_id)  # anyone can call it
    assert deal_row(c, deal_id)["state"] == CANCELLED
    act(direct_vm, direct_alice)
    c.claim(deal_id)
    assert ledger.to(direct_alice) == GEN
    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("Only the client and the provider"):
        c.claim(deal_id)


def test_a_provider_who_misses_the_due_date_forfeits_the_bond(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, ledger):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, price=2 * GEN, bond_bps=2000)
    at(direct_vm, 100)
    take(c, direct_vm, direct_bob, deal_id)
    due = deal_row(c, deal_id)["due"] - deal_row(c, deal_id)["created"]
    act(direct_vm, direct_charlie)
    at(direct_vm, due - 1)
    with direct_vm.expect_revert("Nothing has expired"):
        c.expire(deal_id)
    at(direct_vm, due)
    c.expire(deal_id)
    row = deal_row(c, deal_id)
    assert row["state"] == DEFAULTED
    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("Nothing to claim"):
        c.claim(deal_id)
    act(direct_vm, direct_alice)
    c.claim(deal_id)
    assert ledger.to(direct_alice) == 2 * GEN + 2 * GEN * 2000 // 10000
    s = stats(c)
    assert s["defaulted"] == 1 and s["deposited"] == s["paid"]
    prof = json.loads(c.profile_of(hx(direct_bob)))
    assert prof["defaults"] == 1 and prof["failed"] == 1 and prof["settled"] == 0
    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("Nothing has expired"):
        c.expire(deal_id)


# ---- extensions ------------------------------------------------------------

def test_extension_requests(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, work_for=1000)
    take(c, direct_vm, direct_bob, deal_id)
    due = deal_row(c, deal_id)["due"]

    act(direct_vm, direct_charlie)
    with direct_vm.expect_revert("Only the provider"):
        c.request_extension(deal_id, 500, "need time")
    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("not available"):
        c.request_extension(deal_id, 100, "too short")
    with direct_vm.expect_revert("not available"):
        c.request_extension(deal_id, 1001, "more than the work time")
    c.request_extension(deal_id, 600, "The data source is late")
    row = deal_row(c, deal_id)
    assert row["ext_ask"] == 600 and row["ext_note"] == "The data source is late"
    with direct_vm.expect_revert("already waiting"):
        c.request_extension(deal_id, 300, "again")

    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("Only the client"):
        c.answer_extension(deal_id, True)
    act(direct_vm, direct_alice)
    c.answer_extension(deal_id, True)
    row = deal_row(c, deal_id)
    assert row["due"] == due + 600 and row["ext_used"] == 600 and row["ext_ask"] == 0
    with direct_vm.expect_revert("no extension request"):
        c.answer_extension(deal_id, True)

    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("not available"):
        c.request_extension(deal_id, 401, "over the total")  # 600 + 401 > the original work time
    c.request_extension(deal_id, 400, "last one")
    act(direct_vm, direct_alice)
    c.answer_extension(deal_id, False)  # declined: nothing changes
    row = deal_row(c, deal_id)
    assert row["due"] == due + 600 and row["ext_used"] == 600 and row["ext_ask"] == 0


def test_extensions_stop_at_the_due_date(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, work_for=1000)
    take(c, direct_vm, direct_bob, deal_id)
    act(direct_vm, direct_bob)
    c.request_extension(deal_id, 500, "need time")
    at(direct_vm, 1000)
    act(direct_vm, direct_alice)
    with direct_vm.expect_revert("due date has passed"):
        c.answer_extension(deal_id, True)
    act(direct_vm, direct_bob)
    c.expire(deal_id)
    with direct_vm.expect_revert("not active"):
        c.request_extension(deal_id, 300, "too late")


def test_extension_is_capped_at_thirty_days(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, work_for=100 * 86400)
    take(c, direct_vm, direct_bob, deal_id)
    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("not available"):
        c.request_extension(deal_id, 30 * 86400 + 1, "too long")
    c.request_extension(deal_id, 30 * 86400, "a month")


# ---- delivering and approving ----------------------------------------------

def test_deliver_rules(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, work_for=1000, review_for=900)
    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("not active"):
        c.deliver(deal_id, WORK_URL, "early")
    take(c, direct_vm, direct_bob, deal_id)
    act(direct_vm, direct_charlie)
    with direct_vm.expect_revert("Only the provider"):
        c.deliver(deal_id, WORK_URL, "not mine")
    act(direct_vm, direct_bob)
    for bad in ("ftp://work.example.org/x", "https://localhost/x", "http://127.0.0.1/x", "https://example.com:8080/x",
                "https://user@example.com/x", "https://example.local/x", "https://work.example.org/a b", "not a link", ""):
        with direct_vm.expect_revert("single public http(s) link"):
            c.deliver(deal_id, bad, "bad link")
    at(direct_vm, 1000)
    with direct_vm.expect_revert("due date has passed"):
        c.deliver(deal_id, WORK_URL, "late")
    at(direct_vm, 999)
    c.deliver(deal_id, WORK_URL + "  ", "  All   done <b>now</b> ")
    row = deal_row(c, deal_id)
    assert row["state"] == DELIVERED and row["url"] == WORK_URL and row["note"] == "All done (b)now(/b)"
    assert row["delivered_at"] == row["created"] + 999 and row["review_end"] == row["delivered_at"] + 900
    with direct_vm.expect_revert("not active"):
        c.deliver(deal_id, ALT_URL, "twice")


def test_a_pinned_deal_needs_a_pinned_link(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    deal_id = open_deal(c, direct_vm, direct_alice, pinned=True)
    take(c, direct_vm, direct_bob, deal_id)
    act(direct_vm, direct_bob)
    sha = "a" * 40
    for bad in (WORK_URL, "https://github.com/acme/guide", "https://github.com/acme/guide/blob/main/README.md",
                f"https://github.com/acme/guide/blob/{'A' * 40}/README.md", f"https://github.com/acme/guide/blob/{'a' * 39}/README.md",
                "https://work.example.org/ipfs/notacid"):
        with direct_vm.expect_revert("commit-pinned or content-addressed"):
            c.deliver(deal_id, bad, "not pinned")
    c.deliver(deal_id, f"https://github.com/acme/guide/blob/{sha}/README.md", "pinned")
    assert deal_row(c, deal_id)["state"] == DELIVERED


def test_pinned_link_shapes_are_accepted(direct_vm, direct_deploy, direct_alice, direct_bob):
    good = [
        f"https://github.com/acme/guide/commit/{'b' * 40}",
        f"https://gitlab.com/acme/guide/-/blob/{'c' * 40}/docs/guide.md",
        f"https://codeberg.org/acme/guide/tree/{'d' * 40}",
        "https://gateway.example.org/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/guide.md",
        "https://gateway.example.org/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    ]
    for url in good:
        c = deploy(direct_deploy, direct_vm)
        deal_id = open_deal(c, direct_vm, direct_alice, pinned=True)
        take(c, direct_vm, direct_bob, deal_id)
        act(direct_vm, direct_bob)
        c.deliver(deal_id, url, "pinned")
        assert deal_row(c, deal_id)["url"] == url


def test_approve_pays_the_provider_everything(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, ledger):
    c = deploy(direct_deploy, direct_vm)
    deal_id = to_delivery(c, direct_vm, direct_alice, direct_bob, price=2 * GEN, bond_bps=1000)
    act(direct_vm, direct_bob)
    with direct_vm.expect_revert("Only the client"):
        c.approve(deal_id)
    act(direct_vm, direct_alice)
    c.approve(deal_id)
    row = deal_row(c, deal_id)
    assert row["state"] == SETTLED and row["path"] == P_APPROVED and row["completion"] == 10000
    with direct_vm.expect_revert("no delivery"):
        c.approve(deal_id)
    act(direct_vm, direct_alice)
    with direct_vm.expect_revert("Nothing to claim"):
        c.claim(deal_id)
    act(direct_vm, direct_charlie)
    with direct_vm.expect_revert("Only the client and the provider"):
        c.claim(deal_id)
    act(direct_vm, direct_bob)
    c.claim(deal_id)
    assert ledger.to(direct_bob) == 2 * GEN + GEN // 5  # the price and the returned bond
    with direct_vm.expect_revert("Already claimed"):
        c.claim(deal_id)
    s = stats(c)
    assert s["settled"] == 1 and s["volume"] == str(2 * GEN) and s["deposited"] == s["paid"] == str(2 * GEN + GEN // 5)
    prof = json.loads(c.profile_of(hx(direct_bob)))
    assert prof["delivered"] == 1 and prof["settled"] == 1 and prof["average_completion"] == 10000 and prof["disputes"] == 0


def test_a_silent_client_means_approval(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, ledger):
    c = deploy(direct_deploy, direct_vm)
    deal_id = to_delivery(c, direct_vm, direct_alice, direct_bob, review_for=3600)
    act(direct_vm, direct_charlie)
    at(direct_vm, 1000 + 3599)
    with direct_vm.expect_revert("still open"):
        c.finalize(deal_id)
    at(direct_vm, 1000 + 3600)
    c.finalize(deal_id)  # anyone can call it
    row = deal_row(c, deal_id)
    assert row["state"] == SETTLED and row["path"] == P_AUTO and row["completion"] == 10000
    act(direct_vm, direct_bob)
    c.claim(deal_id)
    assert ledger.to(direct_bob) == GEN + GEN // 10
    with direct_vm.expect_revert("nothing to finalize"):
        c.finalize(deal_id)


def test_the_client_cannot_reject_after_the_review_window(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    deal_id = to_delivery(c, direct_vm, direct_alice, direct_bob, review_for=3600)
    at(direct_vm, 1000 + 3600)
    row = deal_row(c, deal_id)
    act(direct_vm, direct_alice, int(row["deposit_due"]))
    with direct_vm.expect_revert("review window has closed"):
        c.reject(deal_id, "A reason that is long enough.", "")
    # approving is still possible until somebody finalizes
    act(direct_vm, direct_alice)
    c.approve(deal_id)
    assert deal_row(c, deal_id)["state"] == SETTLED


def test_views_page_through_deals(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    ids = [open_deal(c, direct_vm, direct_alice, title=f"Deal number {i}") for i in range(5)]
    listed = json.loads(c.list_deals(0, 10))
    assert [r["id"] for r in listed] == [4, 3, 2, 1, 0]
    assert [r["id"] for r in json.loads(c.list_deals(1, 2))] == [3, 2]
    assert json.loads(c.list_deals(10, 5)) == [] and json.loads(c.list_deals(0, 0)) == []
    assert json.loads(c.list_deals(-3, 2))[0]["id"] == 4
    assert [r["id"] for r in json.loads(c.deals_of(hx(direct_alice), 2, 2))] == [2, 1]
    with direct_vm.expect_revert("No such deal"):
        c.get_deal(5)
    with direct_vm.expect_revert("No such deal"):
        c.get_deal(-1)
    assert ids == [0, 1, 2, 3, 4]
    empty = json.loads(c.profile_of(hx(direct_bob)))
    assert empty["opened"] == 0 and empty["average_completion"] is None
    assert json.loads(c.profile_of(hx(direct_alice)))["opened"] == 5
