"""Shared helpers for the direct-mode suite (genlayer-test fixtures)."""

import json
import sys
from datetime import datetime, timezone

import pytest

CONTRACT = "contracts/parley.py"
MODULE = "_contract_parley"
GEN = 10**18

# States, paths and parties (the numbers the contract reports)
OPEN, ACTIVE, DELIVERED, DISPUTED, RULED, APPEALED, SETTLED, CANCELLED, DEFAULTED = range(9)
P_NONE, P_APPROVED, P_AUTO, P_SPLIT, P_RULING, P_RELEASED = range(6)

T0 = int(datetime(2026, 10, 14, 12, 0, 0, tzinfo=timezone.utc).timestamp())

WORK_URL = "https://work.example.org/guide"
ALT_URL = "https://mirror.example.net/guide-extra"
CLIENT_URL = "https://client.example.com/notes"
CRITERIA = (
    "Has an introduction\n"
    "Includes three code examples\n"
    "Explains error handling\n"
    "Ends with a summary"
)
QUOTES = [
    "Introduction: this guide explains how to test a contract",
    "Example one shows a deposit, example two a refund, example three a dispute",
    "Errors are reported with a clear message and the state is left untouched",
    "Summary: test the money paths first and keep every test small",
]
PAGE = "<html><body><h1>Testing guide</h1><p>" + " ".join(QUOTES) + ". More words follow here for length.</p></body></html>"


def hx(a) -> str:
    """Lower-case 0x form of an address object, raw bytes or a hex string."""
    if isinstance(a, str):
        return a.lower()
    if hasattr(a, "as_hex"):
        return str(a.as_hex).lower()
    return "0x" + bytes(a).hex()


def at(vm, offset: int) -> None:
    """Move the chain clock to T0 + offset seconds."""
    vm.warp(datetime.fromtimestamp(T0 + offset, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))


def act(vm, who, value: int = 0):
    """The next call is made by `who` and carries `value`."""
    try:
        vm.deal(who, 1000 * GEN)
    except Exception:
        pass
    vm.sender = who
    vm.value = value


class Wallet:
    """Stands in for the chain-level account so that payouts can be inspected."""

    sent = []

    def __init__(self, who):
        self.who = who

    def emit_transfer(self, **kw):
        Wallet.sent.append((hx(self.who), int(kw["value"])))


class Ledger:
    def __init__(self):
        Wallet.sent = []

    @property
    def sent(self):
        return Wallet.sent

    def to(self, who) -> int:
        key = hx(who)
        return sum(v for a, v in Wallet.sent if a == key)

    def total(self) -> int:
        return sum(v for _, v in Wallet.sent)


@pytest.fixture
def ledger():
    return Ledger()


def _forget_contract_class() -> None:
    """The SDK keeps one contract class per process; drop it so every test can deploy afresh."""
    registry = sys.modules.get("genlayer.gl.genvm_contracts")
    if registry is not None:
        registry.__known_contract__ = None


def deploy(direct_deploy, direct_vm):
    at(direct_vm, 0)
    _forget_contract_class()
    c = direct_deploy(CONTRACT)
    mod = sys.modules[MODULE]
    mod._Wallet = Wallet
    Wallet.sent = []
    return c


def deal_row(c, deal_id: int) -> dict:
    return json.loads(c.get_deal(deal_id))


def stats(c) -> dict:
    return json.loads(c.stats())


def open_deal(
    c, vm, client, price=GEN, provider="", offer_for=3600, work_for=7200, review_for=3600, bond_bps=1000, pinned=False,
    title="Write a testing guide", scope="A guide that explains how to test intelligent contracts.", criteria=CRITERIA,
) -> int:
    act(vm, client, price)
    deal_id = c.open_deal(title, scope, criteria, provider, offer_for, work_for, review_for, bond_bps, pinned)
    vm.value = 0
    return deal_id


def take(c, vm, provider, deal_id) -> None:
    row = deal_row(c, deal_id)
    act(vm, provider, int(row["bond"]))
    c.accept_deal(deal_id)
    vm.value = 0


def deliver(c, vm, provider, deal_id, url=WORK_URL, note="Done") -> None:
    act(vm, provider)
    c.deliver(deal_id, url, note)


def reject(c, vm, client, deal_id, reason="The guide misses most of what we agreed.", url="") -> None:
    row = deal_row(c, deal_id)
    act(vm, client, int(row["deposit_due"]))
    c.reject(deal_id, reason, url)
    vm.value = 0


def appeal(c, vm, who, deal_id, statement="The ruling does not match the page.", url="") -> None:
    row = deal_row(c, deal_id)
    act(vm, who, int(row["appeal_due"]))
    c.appeal(deal_id, statement, url)
    vm.value = 0


def mock_page(vm, body=PAGE, url_pattern=r"work\.example\.org", status=200):
    vm.mock_web(url_pattern, {"status": status, "body": body})


def court_reply(statuses, quotes=QUOTES, source=1, summary="The guide covers most of the criteria."):
    rows = []
    for i, s in enumerate(statuses, 1):
        row = {"n": i, "status": s, "source": source}
        if s:
            row["quote"] = quotes[i - 1]
        rows.append(row)
    return {"criteria": rows, "summary": summary}


def mock_court(vm, statuses, **kw):
    """The court's answer. It only matches the ruling prompt (it carries the <criteria> block)."""
    vm.mock_llm(r"<criteria>", json.dumps(court_reply(statuses, **kw)))


def clear(vm):
    vm.clear_mocks()


def to_delivery(c, vm, client, provider, **kw) -> int:
    """Open, take and deliver a deal. Returns its id; the clock stands at 1000 s."""
    deal_id = open_deal(c, vm, client, **kw)
    at(vm, 100)
    take(c, vm, provider, deal_id)
    at(vm, 1000)
    deliver(c, vm, provider, deal_id)
    return deal_id


def to_dispute(c, vm, client, provider, **kw) -> int:
    deal_id = to_delivery(c, vm, client, provider, **kw)
    at(vm, 1500)
    reject(c, vm, client, deal_id)
    return deal_id


def run_rule(c, vm, caller, deal_id, statuses, offset, page=PAGE, **kw):
    """Ask for a ruling at `offset` seconds with the given page and court answer (earlier mocks are dropped)."""
    vm.clear_mocks()
    mock_page(vm, body=page)
    mock_court(vm, statuses, **kw)
    at(vm, offset)
    act(vm, caller)
    c.rule(deal_id)


def to_ruling(c, vm, client, provider, statuses, **kw) -> int:
    """A disputed deal that the court ruled on (at 1700 s); the first ruling is open to appeal."""
    deal_id = to_dispute(c, vm, client, provider, **kw)
    at(vm, 1600)
    act(vm, provider)
    c.reply(deal_id, "Every criterion is covered on the page.", "")
    run_rule(c, vm, client, deal_id, statuses, 1700)
    return deal_id


def settle_ruling(c, vm, deal_id, caller):
    """Let the appeal window of a ruling (given at 1700 s, window 3600 s) pass and finalize."""
    at(vm, 1700 + 3600 + 5)
    act(vm, caller)
    c.finalize(deal_id)
