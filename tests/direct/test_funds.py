"""Money: every wei that goes in comes out, whatever way a deal ends."""

import itertools
import json
import sys

import pytest

from conftest import (
    CANCELLED, DEFAULTED, GEN, MODULE, OPEN, P_APPROVED, P_AUTO, P_RELEASED, P_RULING, P_SPLIT, SETTLED,
    act, appeal, at, deal_row, deploy, open_deal, reject, run_rule, settle_ruling, stats, take, to_delivery, to_dispute,
    to_ruling,
)

CLIENT, PROVIDER = 1, 2


@pytest.fixture
def funds(direct_vm, direct_deploy):
    deploy(direct_deploy, direct_vm)
    return sys.modules[MODULE]._funds


def test_funds_conserve_every_wei(funds):
    price, bond, deposit, appeal_bond = 10**18 + 7, 123_456_789_012_345, 31_000_000_000_000_003, 99_999_999_999_999_999
    completions = [0, 1, 1250, 2999, 3000, 3001, 4999, 5000, 7999, 8000, 8001, 9999, 10_000]
    for state, path, c, first_c, who, ap in itertools.product(
        (SETTLED,),
        (P_APPROVED, P_AUTO, P_SPLIT, P_RULING, P_RELEASED),
        completions,
        completions,
        (CLIENT, PROVIDER),
        (0, appeal_bond),
    ):
        to_client, to_provider = funds(state, path, c, first_c, who, price, bond, deposit, ap)
        assert to_client >= 0 and to_provider >= 0
        assert to_client + to_provider == price + bond + deposit + ap, (path, c, first_c, who, ap)
    assert funds(CANCELLED, 0, 0, 0, 0, price, bond, 0, 0) == (price, 0)
    assert funds(DEFAULTED, 0, 0, 0, 0, price, bond, 0, 0) == (price + bond, 0)
    assert funds(OPEN, 0, 0, 0, 0, price, bond, 0, 0) == (0, 0)


def test_the_provider_never_earns_more_than_the_completion(funds):
    price = 10**18
    for c in (0, 1250, 5000, 8750, 10_000):
        to_client, to_provider = funds(SETTLED, P_APPROVED if c == 10_000 else P_SPLIT, c, 0, 0, price, 0, 0, 0)
        assert to_provider == price * c // 10_000 and to_client == price - to_provider


def test_appeal_bond_goes_to_the_party_the_second_ruling_favoured(funds):
    price, appeal_bond = 10**18, 10**17
    # provider appeals a 20% ruling: 20% -> 40% is a swing of 2000, the bond comes back
    _, to_provider = funds(SETTLED, P_RULING, 4000, 2000, PROVIDER, price, 0, 0, appeal_bond)
    assert to_provider == price * 4000 // 10_000 + appeal_bond
    # a swing of exactly 1500 is enough, 1499 is not
    _, to_provider = funds(SETTLED, P_RULING, 3500, 2000, PROVIDER, price, 0, 0, appeal_bond)
    assert to_provider == price * 3500 // 10_000 + appeal_bond
    to_client, to_provider = funds(SETTLED, P_RULING, 3499, 2000, PROVIDER, price, 0, 0, appeal_bond)
    assert to_provider == price * 3499 // 10_000 and to_client == price - to_provider + appeal_bond
    # the client appeals a 90% ruling: it has to fall to 75% or lower
    to_client, _ = funds(SETTLED, P_RULING, 7500, 9000, CLIENT, price, 0, 0, appeal_bond)
    assert to_client == price - price * 7500 // 10_000 + appeal_bond
    _, to_provider = funds(SETTLED, P_RULING, 7501, 9000, CLIENT, price, 0, 0, appeal_bond)
    assert to_provider == price * 7501 // 10_000 + appeal_bond
    # a second ruling that goes the wrong way for the appellant also loses the bond
    to_client, to_provider = funds(SETTLED, P_RULING, 1000, 3000, PROVIDER, price, 0, 0, appeal_bond)
    assert to_client == price - price * 1000 // 10_000 + appeal_bond


def test_every_way_a_deal_can_end_pays_out_exactly_what_came_in(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, ledger):
    """Many deals in one contract, each closed another way; nothing is left over and nothing is missing."""
    c = deploy(direct_deploy, direct_vm)
    clock = 0

    def later(delta):
        nonlocal clock
        clock += delta
        at(direct_vm, clock)

    def settle_both(deal_id):
        for who in (direct_alice, direct_bob):
            act(direct_vm, who)
            try:
                c.claim(deal_id)
            except Exception as exc:  # a party that is owed nothing (or is no party) cannot claim
                assert "Nothing to claim" in str(exc) or "Only the client and the provider" in str(exc)

    # 1 approved
    later(10)
    d = to_delivery(c, direct_vm, direct_alice, direct_bob)
    act(direct_vm, direct_alice)
    c.approve(d)
    settle_both(d)
    # 2 auto-approved
    clock = 100_000
    at(direct_vm, clock)
    d = to_delivery(c, direct_vm, direct_alice, direct_bob)
    at(direct_vm, clock + 1000 + 3601)
    act(direct_vm, direct_charlie)
    c.finalize(d)
    settle_both(d)
    # 3 ruling, no appeal
    clock = 200_000
    at(direct_vm, clock)
    d = to_ruling(c, direct_vm, direct_alice, direct_bob, [2, 1, 1, 0])
    settle_ruling(c, direct_vm, d, direct_charlie)
    settle_both(d)
    # 4 cancelled offer
    clock = 300_000
    at(direct_vm, clock)
    d = open_deal(c, direct_vm, direct_alice, price=GEN * 3 // 2)
    act(direct_vm, direct_alice)
    c.withdraw_offer(d)
    settle_both(d)
    # 5 provider default
    clock = 400_000
    at(direct_vm, clock)
    d = open_deal(c, direct_vm, direct_alice, bond_bps=3000)
    at(direct_vm, clock + 100)
    take(c, direct_vm, direct_bob, d)
    at(direct_vm, clock + 100 + 7200)
    act(direct_vm, direct_charlie)
    c.expire(d)
    settle_both(d)
    # 6 settled by agreement
    clock = 500_000
    at(direct_vm, clock)
    d = to_dispute(c, direct_vm, direct_alice, direct_bob)
    act(direct_vm, direct_bob)
    c.propose_split(d, 7000)
    act(direct_vm, direct_alice)
    c.accept_split(d, 7000)
    settle_both(d)

    s = stats(c)
    assert s["deposited"] == s["paid"] == str(ledger.total())
    assert deal_row(c, d)["state"] == SETTLED


def test_a_zero_bond_deal_still_balances(direct_vm, direct_deploy, direct_alice, direct_bob, ledger):
    c = deploy(direct_deploy, direct_vm)
    d = to_delivery(c, direct_vm, direct_alice, direct_bob, bond_bps=0, price=GEN // 3)
    act(direct_vm, direct_alice)
    c.approve(d)
    for who in (direct_alice, direct_bob):
        act(direct_vm, who)
        try:
            c.claim(d)
        except Exception as exc:
            assert "Nothing to claim" in str(exc)
    assert ledger.to(direct_bob) == GEN // 3 and ledger.to(direct_alice) == 0
    s = stats(c)
    assert s["deposited"] == s["paid"] == str(GEN // 3)


def test_odd_prices_do_not_lose_dust(direct_vm, direct_deploy, direct_alice, direct_bob, ledger):
    c = deploy(direct_deploy, direct_vm)
    price = GEN + 3  # not divisible by anything useful
    d = to_dispute(c, direct_vm, direct_alice, direct_bob, price=price, bond_bps=777)
    run_rule(c, direct_vm, direct_alice, d, [2, 1, 1, 0], 1500 + 3600)  # 4 of 8
    at(direct_vm, 1500 + 3600 + 3600 + 10)
    act(direct_vm, direct_alice)
    c.finalize(d)
    for who in (direct_alice, direct_bob):
        act(direct_vm, who)
        c.claim(d)
    row = deal_row(c, d)
    assert ledger.total() == int(row["price"]) + int(row["bond"]) + int(row["deposit"])
    s = stats(c)
    assert s["deposited"] == s["paid"] == str(ledger.total())


def test_owed_of_matches_what_is_claimed(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, ledger):
    from conftest import hx

    c = deploy(direct_deploy, direct_vm)
    d = to_ruling(c, direct_vm, direct_alice, direct_bob, [2, 2, 2, 2])
    owed = json.loads(c.owed_of(d, hx(direct_bob)))
    assert owed["role"] == "provider" and owed["amount"] == "0"  # not settled yet
    settle_ruling(c, direct_vm, d, direct_charlie)
    owed = json.loads(c.owed_of(d, hx(direct_bob)))
    assert owed["role"] == "provider" and owed["claimed"] is False and int(owed["amount"]) > 0
    stranger = json.loads(c.owed_of(d, hx(direct_charlie)))
    assert stranger == {"role": "none", "amount": "0", "claimed": False}
    act(direct_vm, direct_bob)
    c.claim(d)
    assert ledger.to(direct_bob) == int(owed["amount"])
    assert json.loads(c.owed_of(d, hx(direct_bob)))["claimed"] is True


def test_the_ruling_boundaries_are_inclusive_where_documented(funds):
    price, bond, deposit = 10**18, 10**17, 3 * 10**16
    # at or below 30% the work counts as not delivered: the client takes the provider's bond
    to_client, to_provider = funds(SETTLED, P_RULING, 3000, 3000, 0, price, bond, deposit, 0)
    assert to_provider == price * 3000 // 10_000 and to_client == price - to_provider + bond + deposit
    to_client, to_provider = funds(SETTLED, P_RULING, 3001, 3001, 0, price, bond, deposit, 0)
    assert to_provider == price * 3001 // 10_000 + bond and to_client == price - price * 3001 // 10_000 + deposit
    # at or above 80% the rejection was unfounded: the provider also takes the client's deposit
    to_client, to_provider = funds(SETTLED, P_RULING, 8000, 8000, 0, price, bond, deposit, 0)
    assert to_provider == price * 8000 // 10_000 + bond + deposit
    to_client, to_provider = funds(SETTLED, P_RULING, 7999, 7999, 0, price, bond, deposit, 0)
    earned = price * 7999 // 10_000
    assert to_provider == earned + bond and to_client == price - earned + deposit
