"""Consensus: what a validator accepts, and what the nondeterministic closures are made of."""

import json
import sys

import pytest

from conftest import (
    ALT_URL, DISPUTED, MODULE, PAGE, QUOTES, RULED, WORK_URL, act, at, court_reply, deal_row, deploy, mock_court,
    mock_page, run_rule, to_dispute, to_ruling,
)


@pytest.fixture
def mod(direct_vm, direct_deploy):
    deploy(direct_deploy, direct_vm)
    return sys.modules[MODULE]


def ruling(credits, quotes=None, urls=None, completion=None):
    n = len(credits)
    quotes = quotes if quotes is not None else [QUOTES[i % 4] if x else "" for i, x in enumerate(credits)]
    urls = urls if urls is not None else [WORK_URL if x else "" for x in credits]
    return {
        "verdict": "RULED",
        "credits": list(credits),
        "quotes": quotes,
        "urls": urls,
        "completion": sum(credits) * 10_000 // (2 * n) if completion is None else completion,
        "summary": "ok",
        "hash": "",
    }


@pytest.fixture
def pages(mod):
    return {WORK_URL: mod._visible(PAGE, 6000)}


# ---- _accepts, on its own ------------------------------------------------------------------------------------------------


def test_identical_rulings_are_accepted(mod, pages):
    r = ruling([2, 2, 1, 0])
    assert mod._accepts(r, ruling([2, 2, 1, 0]), pages, 4) is True


def test_a_difference_of_one_level_is_tolerated(mod, pages):
    assert mod._accepts(ruling([2, 2, 1, 1]), ruling([1, 2, 1, 1]), pages, 4) is True
    assert mod._accepts(ruling([2, 2, 1, 1]), ruling([1, 1, 1, 1]), pages, 4) is True  # total differs by 2 = n // 2


def test_a_difference_of_two_levels_is_refused(mod, pages):
    assert mod._accepts(ruling([2, 2, 2, 2]), ruling([0, 2, 2, 2]), pages, 4) is False
    assert mod._accepts(ruling([0, 2, 2, 2]), ruling([2, 2, 2, 2]), pages, 4) is False


def test_many_small_differences_add_up(mod, pages):
    assert mod._accepts(ruling([2, 2, 2, 2]), ruling([1, 1, 1, 1]), pages, 4) is False  # total differs by 4 > 2
    assert mod._accepts(ruling([2, 2, 2, 1]), ruling([1, 1, 1, 1]), pages, 4) is False  # total differs by 3


def test_a_single_criterion_allows_one_level(mod, pages):
    assert mod._accepts(ruling([2]), ruling([1]), pages, 1) is True
    assert mod._accepts(ruling([1]), ruling([2]), pages, 1) is True
    assert mod._accepts(ruling([2]), ruling([0]), pages, 1) is False


def test_the_completion_has_to_match_the_credits(mod, pages):
    assert mod._accepts(ruling([2, 2, 1, 0], completion=9000), ruling([2, 2, 1, 0]), pages, 4) is False
    assert mod._accepts(ruling([2, 2, 1, 0], completion=6250), ruling([2, 2, 1, 0]), pages, 4) is True


def test_a_quote_has_to_be_on_the_validators_copy_of_the_page(mod, pages):
    fake = ruling([2, 2, 1, 0], quotes=["Words that nobody ever wrote on this page", QUOTES[1], QUOTES[2], ""])
    assert mod._accepts(fake, ruling([2, 2, 1, 0]), pages, 4) is False
    # quotes are compared without regard to case and spacing
    loose = ruling([2, 2, 1, 0], quotes=[QUOTES[0].upper(), QUOTES[1], "  " + QUOTES[2] + "  ", ""])
    assert mod._accepts(loose, ruling([2, 2, 1, 0]), pages, 4) is True
    short = ruling([2, 0, 0, 0], quotes=["Intro", "", "", ""])
    assert mod._accepts(short, ruling([2, 0, 0, 0]), pages, 4) is False


def test_a_quote_cannot_cite_a_page_the_validator_did_not_read(mod, pages):
    cited = ruling([2, 2, 1, 0], urls=[ALT_URL, WORK_URL, WORK_URL, ""])
    assert mod._accepts(cited, ruling([2, 2, 1, 0]), pages, 4) is False
    nothing = ruling([2, 2, 1, 0], urls=[None, WORK_URL, WORK_URL, ""])
    assert mod._accepts(nothing, ruling([2, 2, 1, 0]), pages, 4) is False


def test_quotes_of_unscored_criteria_are_ignored(mod, pages):
    r = ruling([2, 0, 0, 0], quotes=[QUOTES[0], "made up", "", ""], urls=[WORK_URL, "nowhere", "", ""])
    assert mod._accepts(r, ruling([2, 0, 0, 0]), pages, 4) is True


@pytest.mark.parametrize(
    "tweak",
    [
        lambda r: r.update(credits=[2, 2, 1]),
        lambda r: r.update(credits=[2, 2, 1, 0, 0]),
        lambda r: r.update(credits="2210"),
        lambda r: r.update(credits=[2, 2, 3, 0]),
        lambda r: r.update(credits=[2, 2, -1, 0]),
        lambda r: r.update(credits=[2, 2, True, 0]),
        lambda r: r.update(credits=[2, 2, 1.0, 0]),
        lambda r: r.update(credits=[2, 2, "1", 0]),
        lambda r: r.update(quotes=QUOTES[:3]),
        lambda r: r.update(urls=[WORK_URL]),
        lambda r: r.pop("credits"),
        lambda r: r.pop("quotes"),
        lambda r: r.pop("urls"),
        lambda r: r.pop("completion"),
        lambda r: r.update(verdict="UNREADABLE"),
        lambda r: r.update(verdict=None),
    ],
)
def test_malformed_leader_rulings_are_refused(mod, pages, tweak):
    r = ruling([2, 2, 1, 0])
    tweak(r)
    assert mod._accepts(r, ruling([2, 2, 1, 0]), pages, 4) is False


@pytest.mark.parametrize(
    "tweak",
    [
        lambda r: r.update(summary="x" * 161),
        lambda r: r.update(summary="a <b>tag</b> in the summary"),
        lambda r: r.update(summary=None),
        lambda r: r.update(summary=["not", "text"]),
        lambda r: r.pop("summary"),
        lambda r: r.update(hash="not a hash"),
        lambda r: r.update(hash="A" * 64),
        lambda r: r.update(hash="a" * 65),
        lambda r: r.update(hash=None),
        lambda r: r.pop("hash"),
        lambda r: r.update(quotes=[QUOTES[0], QUOTES[1], QUOTES[2], "x" * 241]),  # an unscored entry is stored too
        lambda r: r.update(quotes=[QUOTES[0], QUOTES[1], QUOTES[2], "<script>alert(1)</script>"]),
        lambda r: r.update(quotes=[QUOTES[0], QUOTES[1], QUOTES[2], None]),
        lambda r: r.update(urls=[WORK_URL, WORK_URL, WORK_URL, "u" * 301]),
        lambda r: r.update(urls=[WORK_URL, WORK_URL, WORK_URL, None]),
        lambda r: r.update(urls=[WORK_URL, WORK_URL, WORK_URL, "<b>"]),
    ],
)
def test_oversized_or_odd_fields_in_a_leader_ruling_are_refused(mod, pages, tweak):
    """The ruling is stored as the leader sent it, so no field may be bigger or stranger than an honest one."""
    r = ruling([2, 2, 1, 0])
    tweak(r)
    assert mod._accepts(r, ruling([2, 2, 1, 0]), pages, 4) is False


def test_fields_at_their_limits_are_accepted(mod, pages):
    r = ruling([2, 2, 1, 0])
    r["summary"] = "s" * 160
    r["hash"] = "0123456789abcdef" * 4
    r["quotes"][3] = "q" * 240  # not scored, so it is not looked up on the page
    r["urls"][3] = "https://work.example.org/" + "u" * 200
    assert mod._accepts(r, ruling([2, 2, 1, 0]), pages, 4) is True


@pytest.mark.parametrize("theirs", [None, [], "RULED", 7, {"verdict": "RULED"}])
def test_a_leader_result_that_is_not_a_ruling_is_refused(mod, pages, theirs):
    assert mod._accepts(theirs, ruling([2, 2, 1, 0]), pages, 4) is False


def test_unreadable_has_to_be_unreadable_on_both_sides(mod, pages):
    bad = {"verdict": "UNREADABLE", "summary": "The deliverable could not be read."}
    assert mod._accepts(dict(bad), dict(bad), {}, 4) is True
    assert mod._accepts(dict(bad), ruling([2, 2, 1, 0]), pages, 4) is False
    assert mod._accepts(ruling([2, 2, 1, 0]), dict(bad), {}, 4) is False


# ---- the real closures ---------------------------------------------------------------------------------------------------


def _captured(vm):
    assert vm._captured_validators, "the call did not run a hearing"
    return vm._captured_validators[-1]


def test_the_validator_accepts_the_leader_it_would_have_been(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    d = to_ruling(c, direct_vm, direct_alice, direct_bob, [2, 2, 1, 0])
    assert direct_vm.run_validator() is True
    assert deal_row(c, d)["state"] == RULED


def test_the_validator_refuses_when_its_own_reading_differs(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    to_ruling(c, direct_vm, direct_alice, direct_bob, [2, 2, 2, 2])
    # the page the validator sees has none of the quoted words
    direct_vm.clear_mocks()
    mock_page(direct_vm, body="<p>" + "A page about something else entirely, long enough to count as readable text. " * 5 + "</p>")
    mock_court(direct_vm, [2, 2, 2, 2])
    assert direct_vm.run_validator() is False
    # the validator cannot read the page at all
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"work\.example\.org", {"status": 404, "body": "missing"})
    mock_court(direct_vm, [2, 2, 2, 2])
    assert direct_vm.run_validator() is False


def test_the_validator_follows_its_own_model_within_the_tolerance(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    to_ruling(c, direct_vm, direct_alice, direct_bob, [2, 2, 1, 1])
    for statuses, expected in (([2, 2, 1, 1], True), ([2, 1, 1, 1], True), ([1, 1, 1, 1], True), ([2, 0, 1, 1], False), ([0, 0, 0, 0], False)):
        direct_vm.clear_mocks()
        mock_page(direct_vm)
        mock_court(direct_vm, statuses)
        assert direct_vm.run_validator() is expected, statuses


def test_the_validator_refuses_a_leader_that_failed_or_lied(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    to_ruling(c, direct_vm, direct_alice, direct_bob, [2, 2, 1, 0])
    assert direct_vm.run_validator(leader_error=Exception("the leader crashed")) is False
    stored = dict(_captured(direct_vm)[0])
    stored["credits"] = [2, 2, 2, 2]  # a higher score with the same quotes and completion
    assert direct_vm.run_validator(leader_result=stored) is False
    stored = dict(_captured(direct_vm)[0])
    stored["completion"] = 10_000
    assert direct_vm.run_validator(leader_result=stored) is False


def test_a_court_that_answers_with_junk_never_produces_a_ruling(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    d = to_dispute(c, direct_vm, direct_alice, direct_bob)
    for junk in ("[1, 2, 3]", "null", "42", '"hello"', "not json at all"):
        direct_vm.clear_mocks()
        mock_page(direct_vm)
        direct_vm.mock_llm(r"<criteria>", junk)
        at(direct_vm, 1500 + 3600)
        act(direct_vm, direct_alice)
        with direct_vm.expect_revert("LLM_ERROR"):
            c.rule(d)
        row = deal_row(c, d)
        assert row["state"] == DISPUTED and row["tries"] == 0 and row["ruling"] is None


def test_a_court_that_answers_with_a_json_string_is_understood(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    d = to_dispute(c, direct_vm, direct_alice, direct_bob)
    fenced = "```json\n" + json.dumps(court_reply([2, 2, 2, 2])) + "\n```"
    direct_vm.clear_mocks()
    mock_page(direct_vm)
    direct_vm.mock_llm(r"<criteria>", fenced)
    at(direct_vm, 1500 + 3600)
    act(direct_vm, direct_alice)
    c.rule(d)
    assert deal_row(c, d)["completion"] == 10_000


def test_odd_court_rows_are_ignored_not_trusted(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    d = to_dispute(c, direct_vm, direct_alice, direct_bob)
    rows = [
        {"n": 1, "status": 1, "source": 1, "quote": QUOTES[0]},
        {"n": 1, "status": 2, "source": 1, "quote": QUOTES[0]},  # the first row for a criterion is the one that counts
        {"n": 9, "status": 2, "source": 1, "quote": QUOTES[1]},  # no such criterion
        {"n": 2, "status": 7, "source": 1, "quote": QUOTES[1]},  # no such status
        {"n": "3", "status": "2", "source": "1", "quote": QUOTES[2]},  # numbers as strings are fine
        "junk",
        {"n": 4, "status": True, "source": 1, "quote": QUOTES[3]},  # a boolean is not a status
    ]
    direct_vm.clear_mocks()
    mock_page(direct_vm)
    direct_vm.mock_llm(r"<criteria>", json.dumps({"criteria": rows, "summary": "Odd answer."}))
    at(direct_vm, 1500 + 3600)
    act(direct_vm, direct_alice)
    c.rule(d)
    assert deal_row(c, d)["ruling"]["credits"] == [1, 0, 2, 0]


# ---- what the closures carry ---------------------------------------------------------------------------------------------


PLAIN = (str, int, float, bool, type(None))


def _is_plain(value, depth=0) -> bool:
    if depth > 6:
        return False
    if isinstance(value, PLAIN):
        return True
    if isinstance(value, (list, tuple)):
        return all(_is_plain(x, depth + 1) for x in value)
    if isinstance(value, dict):
        return all(_is_plain(k, depth + 1) and _is_plain(x, depth + 1) for k, x in value.items())
    return False


def test_the_closures_carry_only_plain_values(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy, direct_vm)
    to_ruling(c, direct_vm, direct_alice, direct_bob, [2, 2, 1, 0])
    _, leader_fn, validator_fn = _captured(direct_vm)
    for fn in (leader_fn, validator_fn):
        for name, cell in zip(fn.__code__.co_freevars, fn.__closure__ or ()):
            value = cell.cell_contents
            if callable(value):
                continue  # the sibling closures; they are checked on their own
            assert _is_plain(value), f"{fn.__name__} captures {name}: {type(value).__name__}"


def test_the_closures_can_be_pickled(direct_vm, direct_deploy, direct_alice, direct_bob):
    cloudpickle = pytest.importorskip("cloudpickle")
    c = deploy(direct_deploy, direct_vm)
    to_ruling(c, direct_vm, direct_alice, direct_bob, [2, 2, 1, 0])
    _, leader_fn, validator_fn = _captured(direct_vm)
    assert cloudpickle.dumps(leader_fn) and cloudpickle.dumps(validator_fn)


def test_the_hearing_code_never_touches_storage_types(mod):
    banned = {"Deal", "Filing", "Rep", "Parley", "_Wallet", "Address", "DynArray", "TreeMap"}
    seen = set()

    def walk(code):
        seen.update(code.co_names)
        for const in code.co_consts:
            if hasattr(const, "co_names"):
                walk(const)

    for name in ("_run_hearing", "_accepts", "_hear", "_fetch", "_ask", "_court_prompt", "_visible", "_tidy", "_clean", "_norm", "_int", "_digest"):
        walk(getattr(mod, name).__code__)
    assert not (seen & banned), seen & banned
