// Live test run of Parley on Studionet, with a report that updates after every transaction.
//
//   npm install
//   CLIENT_KEY=0x.. PROVIDER_KEY=0x.. node scripts/e2e.mjs            (deploys a fresh contract first)
//   PARLEY_ADDRESS=0x.. CLIENT_KEY=0x.. PROVIDER_KEY=0x.. node scripts/e2e.mjs --only approve,adversarial
//   node scripts/e2e.mjs --dry-run                                     (prints the plan, touches no network)
//
// Scenarios (run in this order unless --only says otherwise)
//   cancel       open an offer, withdraw it, claim the price back
//   adversarial  calls that must be refused: wrong amounts, wrong callers, wrong states, private links
//   approve      open, take, deliver, approve, both claim
//   split        reject the delivery, agree on a split, both claim
//   silent       the client never answers; finalize approves the work
//   default      the provider misses the due date; the client claims price + bond
//   court        reject, reply, ask the court for a ruling, let it stand, both claim (needs a readable WORK_URL)
//
// Environment
//   CLIENT_KEY, PROVIDER_KEY   two different accounts funded on Studionet (the client needs about 1 GEN in total)
//   OUTSIDER_KEY               optional third account used as the stranger (a random one is used by default)
//   PARLEY_ADDRESS             an existing deployment; without it the script deploys contracts/parley.py
//   WORK_URL                   the page the provider delivers (default: a public documentation page)
//   CRITERIA                   acceptance criteria separated by "|" (default fits the default WORK_URL)
//   PRICE_GEN                  price of every deal in GEN (default 0.1, the minimum)
//   REPORT_DIR                 where reports are written (default ./reports)
//
// Reports: reports/parley-e2e-<time>.json, .md and .html. The HTML page refreshes itself while the run is going.
// The exit code is 1 when any check failed.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { outcome } from "./receipt.mjs";

const GEN = 10n ** 18n;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const die = (m) => {
  console.error(m);
  process.exit(1);
};
const replacer = (_k, v) => (typeof v === "bigint" ? v.toString() : v);
const fmt = (w) => {
  w = BigInt(w);
  const s = (w < 0n ? -w : w).toString().padStart(19, "0");
  const frac = s.slice(-18).replace(/0+$/, "");
  return `${w < 0n ? "-" : ""}${s.slice(0, -18)}${frac ? "." + frac : ""} GEN`;
};

// ---- command line --------------------------------------------------------------------------------------------------

const ALL = ["cancel", "adversarial", "approve", "split", "silent", "default", "court"];
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const option = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const only = option("only");
const SCENARIOS = only ? only.split(",").map((s) => s.trim()).filter(Boolean) : ALL;
for (const s of SCENARIOS) if (!ALL.includes(s)) die(`Unknown scenario "${s}". Choose from: ${ALL.join(", ")}`);
const DRY = flag("dry-run");

const WORK_URL = process.env.WORK_URL || "https://www.iana.org/help/example-domains";
const CRITERIA =
  process.env.CRITERIA || "The page explains what example domains are|The page names who maintains them|The page mentions reserved domain names";
const PRICE_GEN = Number(process.env.PRICE_GEN || 0.1);
if (!Number.isFinite(PRICE_GEN)) die("PRICE_GEN must be a number of GEN, such as 0.1.");
const PRICE = BigInt(Math.round(PRICE_GEN * 1e6)) * (GEN / 10n ** 6n);
const BOND_BPS = 1000;
const BOND = (PRICE * BigInt(BOND_BPS)) / 10_000n;
const DEPOSIT = PRICE * 300n / 10_000n > 5n * 10n ** 15n ? (PRICE * 300n) / 10_000n : 5n * 10n ** 15n;
const REPORT_DIR = process.env.REPORT_DIR || "reports";
if (PRICE < 10n ** 17n) die("PRICE_GEN must be at least 0.1.");

const STATE = ["OPEN", "ACTIVE", "DELIVERED", "DISPUTED", "RULED", "APPEALED", "SETTLED", "CANCELLED", "DEFAULTED"];
const PATH = ["none", "approved", "auto", "split", "ruling", "released"];

if (DRY) {
  console.log("Parley live test plan (dry run)");
  console.log(`scenarios: ${SCENARIOS.join(", ")}`);
  console.log(`price ${fmt(PRICE)}, bond ${fmt(BOND)}, dispute deposit ${fmt(DEPOSIT)}`);
  console.log(`deliverable ${WORK_URL}`);
  console.log(`criteria: ${CRITERIA.split("|").join(" / ")}`);
  console.log("Waits the run will need: default 5 min, silent 5 min, court about 10 min, approve and split none.");
  process.exit(0);
}

const sdk = await import("genlayer-js");
const { studionet } = await import("genlayer-js/chains");

const need = (k) => {
  const v = process.env[k];
  if (!/^0x[0-9a-fA-F]{64}$/.test(v ?? "")) die(`Set ${k} to a private key (0x...) of an account funded on Studionet.`);
  return v;
};
const RPC = studionet?.rpcUrls?.default?.http?.[0];
if (!RPC) die("The studionet chain definition has no RPC url.");

function actor(name, key) {
  const account = sdk.createAccount(key);
  return { name, address: account.address, client: sdk.createClient({ chain: studionet, account }) };
}
const client = actor("client", need("CLIENT_KEY"));
const provider = actor("provider", need("PROVIDER_KEY"));
const outsider = actor("outsider", process.env.OUTSIDER_KEY || "0x" + randomBytes(32).toString("hex"));
if (new Set([client, provider, outsider].map((a) => a.address.toLowerCase())).size !== 3) die("CLIENT_KEY, PROVIDER_KEY and OUTSIDER_KEY must be three different accounts.");

// ---- the network clock (deadlines are judged by chain time) ----------------------------------------------------

async function rpc(method, params) {
  const res = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${body.error.message ?? JSON.stringify(body.error)}`);
  return { result: body.result, date: res.headers.get("date") };
}
let clockOffset = 0;
async function syncClock() {
  try {
    const { date } = await rpc("eth_chainId", []);
    const ms = date ? Date.parse(date) : NaN;
    if (Number.isFinite(ms)) {
      const off = Math.round(ms / 1000) - Math.floor(Date.now() / 1000);
      clockOffset = Math.abs(off) <= 86400 ? off : 0;
    }
  } catch {
    /* keep the local clock */
  }
}
const netNow = () => Math.floor(Date.now() / 1000) + clockOffset;
async function waitUntil(ts, label) {
  const target = ts + 8; // a margin for block time
  while (netNow() < target) {
    const left = target - netNow();
    console.log(`  ... ${left}s until ${label}`);
    await sleep(Math.min(20, Math.max(1, left)) * 1000);
  }
}
const balanceOf = async (addr) => BigInt((await rpc("eth_getBalance", [addr, "latest"])).result);

// ---- the report ------------------------------------------------------------------------------------------------

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
mkdirSync(REPORT_DIR, { recursive: true });
const base = `${REPORT_DIR}/parley-e2e-${stamp}`;
const report = {
  title: "Parley live test on Studionet",
  network: "studionet",
  rpc: RPC,
  contract: null,
  startedAt: new Date().toISOString(),
  finishedAt: null,
  finished: false,
  accounts: { client: client.address, provider: provider.address, outsider: outsider.address },
  inputs: { scenarios: SCENARIOS, price: PRICE.toString(), bond: BOND.toString(), workUrl: WORK_URL, criteria: CRITERIA },
  statsBefore: null,
  statsAfter: null,
  scenarios: [],
  summary: { checks: 0, passed: 0, failed: 0, transactions: 0 },
};
let current = null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function renderMarkdown() {
  const L = [];
  L.push(`# ${report.title}`, "");
  L.push(`- contract: \`${report.contract ?? "not deployed yet"}\``);
  L.push(`- started: ${report.startedAt}${report.finished ? `, finished: ${report.finishedAt}` : " (still running)"}`);
  L.push(`- result: ${report.summary.passed} of ${report.summary.checks} checks passed, ${report.summary.failed} failed, ${report.summary.transactions} transactions`, "");
  for (const sc of report.scenarios) {
    L.push(`## ${sc.name}: ${sc.status}`, "");
    if (sc.note) L.push(sc.note, "");
    L.push("| # | step | caller | result | transaction |", "| --- | --- | --- | --- | --- |");
    sc.steps.forEach((s, i) => L.push(`| ${i + 1} | ${s.label} | ${s.caller} | ${s.ok ? "ok" : s.expectedFail ? "refused (expected)" : "FAILED"} (${s.status ?? "-"}) | ${s.hash ? s.hash.slice(0, 14) + "..." : ""} |`));
    L.push("", "Checks", "");
    for (const c of sc.checks) L.push(`- ${c.ok ? "PASS" : "FAIL"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
    L.push("");
  }
  if (report.statsBefore) L.push("## Contract totals", "", "```json", JSON.stringify({ before: report.statsBefore, after: report.statsAfter }, null, 2), "```", "");
  return L.join("\n");
}
function renderHtml() {
  const rows = report.scenarios
    .map((sc) => {
      const steps = sc.steps
        .map((s) => `<tr class="${s.ok || s.expectedFail ? "" : "bad"}"><td>${esc(s.label)}</td><td>${esc(s.caller)}</td><td>${s.ok ? "ok" : s.expectedFail ? "refused as expected" : "FAILED"} <small>${esc(s.status ?? "")}</small></td><td><code>${esc((s.hash ?? "").slice(0, 18))}</code></td></tr>`)
        .join("");
      const checks = sc.checks.map((c) => `<li class="${c.ok ? "pass" : "fail"}">${c.ok ? "PASS" : "FAIL"} ${esc(c.name)} ${c.detail ? `<small>${esc(c.detail)}</small>` : ""}</li>`).join("");
      return `<section><h2>${esc(sc.name)} <span class="tag ${esc(sc.status)}">${esc(sc.status)}</span></h2><p>${esc(sc.note ?? "")}</p><table><tr><th>step</th><th>caller</th><th>result</th><th>transaction</th></tr>${steps}</table><ul>${checks}</ul></section>`;
    })
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${report.finished ? "" : '<meta http-equiv="refresh" content="5">'}<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(report.title)}</title>
<style>:root{color-scheme:light dark}body{font:15px/1.5 system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #8884;padding:.3rem .5rem;text-align:left}tr.bad{background:#c0392b33}.tag{font-size:.75rem;padding:.1rem .5rem;border-radius:1rem;background:#8883}.tag.passed{background:#2e7d3255}.tag.failed{background:#c0392b66}li.pass{color:#2e7d32}li.fail{color:#c0392b;font-weight:600}code{font-size:.8rem}</style></head><body>
<h1>${esc(report.title)}</h1><p>contract <code>${esc(report.contract ?? "not deployed yet")}</code><br>${report.finished ? `finished ${esc(report.finishedAt)}` : "running, this page refreshes every 5 seconds"}</p>
<p><b>${report.summary.passed}</b> of ${report.summary.checks} checks passed, <b>${report.summary.failed}</b> failed, ${report.summary.transactions} transactions.</p>${rows}</body></html>`;
}
function flush() {
  writeFileSync(`${base}.json`, JSON.stringify(report, replacer, 2));
  writeFileSync(`${base}.md`, renderMarkdown());
  writeFileSync(`${base}.html`, renderHtml());
}

function check(name, ok, detail = "") {
  ok = Boolean(ok);
  current.checks.push({ name, ok, detail: String(detail) });
  report.summary.checks++;
  ok ? report.summary.passed++ : report.summary.failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
  flush();
  return ok;
}

// ---- transactions and reads --------------------------------------------------------------------------------------------

let CONTRACT = null;
const reader = sdk.createClient({ chain: studionet });
const read = async (fn, args = []) => JSON.parse(String(await reader.readContract({ address: CONTRACT, functionName: fn, args })));
const row = (id) => read("get_deal", [id]);
const stats = () => read("stats");
let shownRaw = false;

async function quoteFees(who, call) {
  const pick = (e) => (e?.distribution && !e.gasless ? { distribution: e.distribution, feeValue: e.feeValue } : undefined);
  if (typeof who.client.estimateTransactionFeesForWrite === "function") {
    try {
      return pick(await who.client.estimateTransactionFeesForWrite(call));
    } catch {
      /* fall through */
    }
  }
  return undefined;
}

/** Sends one transaction and records it. With expectFail the transaction is supposed to be refused. */
async function send(who, fn, args, { value = 0n, label = fn, expectFail = false, retries = 1, pause = 60 } = {}) {
  for (let attempt = 1; ; attempt++) {
    const call = { address: CONTRACT, functionName: fn, args, ...(value ? { value } : {}) };
    let step = { label, fn, caller: who.name, value: value.toString(), expectedFail: expectFail, attempt };
    try {
      const fees = await quoteFees(who, call);
      const hash = await who.client.writeContract(fees ? { ...call, fees } : call);
      step.hash = hash;
      const opts = { hash, retries: 400, interval: 3000 };
      const receipt = typeof who.client.waitForDecision === "function" ? await who.client.waitForDecision(opts) : await who.client.waitForTransactionReceipt({ ...opts, status: "ACCEPTED" });
      const out = outcome(receipt);
      step.ok = out.ok;
      step.status = out.status;
      if (!out.known && !shownRaw) {
        shownRaw = true;
        console.log(`  note: the receipt has no readable result, so this transaction counts as failed. Receipt: ${out.raw}`);
      }
      if (!out.ok && !expectFail) console.log(`  details of the failed ${label}: ${out.detail ?? out.raw ?? ""}`);
      step.receipt = receipt;
    } catch (err) {
      step.ok = false; // the node refused it before it was even sent
      step.status = `rejected: ${String(err?.shortMessage ?? err?.message ?? err).slice(0, 140)}`;
    }
    const kept = { ...step };
    delete kept.receipt;
    current.steps.push(kept);
    report.summary.transactions++;
    console.log(`  ${step.ok ? "ok " : expectFail ? "no " : "ERR"} ${label} by ${who.name} ${step.hash ?? ""} (${step.status})`);
    flush();
    if (expectFail || step.ok || attempt >= retries) return step;
    console.log(`  retrying ${label} in ${pause}s`);
    await sleep(pause * 1000);
  }
}
const mustWork = async (who, fn, args, opts = {}) => {
  const s = await send(who, fn, args, opts);
  check(`${opts.label ?? fn} succeeds`, s.ok, s.status);
  return s;
};
const mustFail = async (who, fn, args, opts = {}) => {
  const before = (await stats()).deposited;
  const s = await send(who, fn, args, { ...opts, expectFail: true });
  const after = (await stats()).deposited;
  // Only a transaction that reached the network and was decided as an error counts as a refusal by the contract.
  check(`${opts.label ?? fn} is refused by the contract`, !s.ok && Boolean(s.hash), s.hash ? s.status : `no transaction was sent (${s.status})`);
  check(`${opts.label ?? fn} moved no money`, before === after, `deposited ${after}`);
};
async function untilFinal(who, step) {
  if (!step?.hash) return;
  const opts = { hash: step.hash, retries: 400, interval: 3000 };
  try {
    typeof who.client.waitForFinalization === "function" ? await who.client.waitForFinalization(opts) : await who.client.waitForTransactionReceipt({ ...opts, status: "FINALIZED" });
  } catch (err) {
    console.log(`  could not confirm finalization: ${String(err?.message ?? err).slice(0, 100)}`);
  }
}

async function openDeal(who, o = {}) {
  const args = [
    o.title ?? "Live test deal",
    o.scope ?? "A short page that documents what example domains are for.",
    o.criteria ?? CRITERIA,
    o.provider ?? "",
    o.offerFor ?? 3600,
    o.workFor ?? 3600,
    o.reviewFor ?? 300,
    o.bondBps ?? BOND_BPS,
    Boolean(o.pinned),
  ];
  const before = (await stats()).total;
  const s = await mustWork(who, "open_deal", args, { value: o.price ?? PRICE, label: o.label ?? "open_deal" });
  if (!s.ok) return null;
  for (let i = 0; i < 30; i++) {
    if ((await stats()).total > before) break;
    await sleep(2000);
  }
  const mine = await read("deals_of", [who.address, 0, 1]);
  const id = mine[0]?.id ?? null;
  check("the new deal is the newest one of the account", id !== null && id >= before, `id ${id}, deals before ${before}`);
  return id !== null && id >= before ? id : null;
}
const take = (id) => mustWork(provider, "accept_deal", [id], { value: BOND });
const deliver = (id, url = WORK_URL) => mustWork(provider, "deliver", [id, url, "Delivered by the live test"]);

/** Both parties claim what they are owed; the amounts are checked against the contract's own view. */
async function claimBoth(id, expectClient, expectProvider) {
  for (const [who, expected] of [[client, expectClient], [provider, expectProvider]]) {
    const owed = await read("owed_of", [id, who.address]);
    check(`owed_of ${who.name}`, expected === undefined || BigInt(owed.amount) === expected, `${fmt(owed.amount)}${expected === undefined ? "" : `, expected ${fmt(expected)}`}`);
    if (BigInt(owed.amount) > 0n) {
      const s = await mustWork(who, "claim", [id]);
      await untilFinal(who, s);
      const again = await read("owed_of", [id, who.address]);
      check(`${who.name} is marked as paid`, again.claimed === true);
      await mustFail(who, "claim", [id], { label: `second claim by ${who.name}` });
    }
  }
}

async function scenario(name, note, fn) {
  current = { name, note, status: "running", startedAt: new Date().toISOString(), endedAt: null, steps: [], checks: [] };
  report.scenarios.push(current);
  console.log(`\n== ${name}: ${note}`);
  flush();
  try {
    await fn();
  } catch (err) {
    check("the scenario ran to its end", false, String(err?.message ?? err).slice(0, 200));
  }
  current.status = current.checks.every((c) => c.ok) ? "passed" : "failed";
  current.endedAt = new Date().toISOString();
  flush();
}

// ---- scenarios -----------------------------------------------------------------------------------------------------

const scenarios = {
  cancel: () =>
    scenario("cancel", "an offer nobody takes is withdrawn and the price comes back", async () => {
      const id = await openDeal(client);
      if (id === null) return;
      let r = await row(id);
      check("the deal is open and holds the price", r.state === 0 && r.price === PRICE.toString());
      await mustFail(outsider, "withdraw_offer", [id], { label: "withdraw by a stranger" });
      await mustWork(client, "withdraw_offer", [id]);
      r = await row(id);
      check("the deal is cancelled", STATE[r.state] === "CANCELLED");
      await mustFail(provider, "accept_deal", [id], { value: BOND, label: "taking a cancelled deal" });
      await claimBoth(id, PRICE, 0n);
    }),

  adversarial: () =>
    scenario("adversarial", "calls that must be refused, with the contract's money checked after each one", async () => {
      const good = ["Live test deal", "A short page that documents what example domains are for.", CRITERIA, "", 3600, 3600, 300, BOND_BPS, false];
      const bad = (i, v) => good.map((x, k) => (k === i ? v : x));
      await mustFail(client, "open_deal", good, { value: PRICE / 100n, label: "a price below the minimum" });
      await mustFail(client, "open_deal", bad(0, "ab"), { value: PRICE, label: "a too short title" });
      await mustFail(client, "open_deal", bad(2, ""), { value: PRICE, label: "no criteria" });
      await mustFail(client, "open_deal", bad(2, "a|b|c|d|e|f|g"), { value: PRICE, label: "seven criteria" });
      await mustFail(client, "open_deal", bad(3, "not-an-address"), { value: PRICE, label: "a broken provider address" });
      await mustFail(client, "open_deal", bad(3, "0x" + "0".repeat(40)), { value: PRICE, label: "the zero address as provider" });
      await mustFail(client, "open_deal", bad(3, client.address), { value: PRICE, label: "the client as provider" });
      await mustFail(client, "open_deal", bad(7, 3001), { value: PRICE, label: "a bond above 30%" });
      await mustFail(client, "open_deal", bad(4, 10), { value: PRICE, label: "an offer time below 5 minutes" });

      // A long review window: this scenario sends dozens of transactions after the delivery, and the checks on
      // "finalizing inside the review window" and "rejecting" must not be overtaken by the clock.
      const id = await openDeal(client, { provider: provider.address, reviewFor: 3600, label: "open_deal reserved for the provider" });
      if (id === null) return;
      await mustFail(outsider, "accept_deal", [id], { value: BOND, label: "a stranger takes a reserved deal" });
      await mustFail(client, "accept_deal", [id], { value: BOND, label: "the client takes their own deal" });
      await mustFail(provider, "accept_deal", [id], { value: BOND + 1n, label: "taking with a wrong bond" });
      await mustFail(provider, "deliver", [id, WORK_URL, "too early"], { label: "delivering before taking the deal" });
      await mustFail(client, "approve", [id], { label: "approving an open deal" });
      await mustFail(outsider, "claim", [id], { label: "claiming an open deal" });
      await take(id);

      await mustFail(client, "deliver", [id, WORK_URL, "not mine"], { label: "the client delivers" });
      await mustFail(provider, "deliver", [id, "http://127.0.0.1/secret", "private"], { label: "a private address as deliverable" });
      await mustFail(provider, "deliver", [id, "https://user:pw@example.com/x", "credentials"], { label: "a link with credentials" });
      await mustFail(provider, "deliver", [id, "ftp://files.example.org/a", "ftp"], { label: "a non-http link" });
      await mustFail(provider, "request_extension", [id, 10, "too short"], { label: "an extension below 5 minutes" });
      await mustFail(client, "request_extension", [id, 600, "not the provider"], { label: "the client asks for an extension" });
      await mustFail(client, "answer_extension", [id, true], { label: "answering a missing extension request" });
      await mustFail(client, "approve", [id], { label: "approving before delivery" });
      await mustFail(outsider, "expire", [id], { label: "expiring a deal that is on time" });
      await deliver(id);

      const dep = DEPOSIT;
      await mustFail(provider, "reject", [id, "I reject my own work, honestly.", ""], { value: dep, label: "the provider rejects" });
      await mustFail(outsider, "reject", [id, "A stranger rejecting the work.", ""], { value: dep, label: "a stranger rejects" });
      await mustFail(client, "reject", [id, "The deposit is one wei short.", ""], { value: dep - 1n, label: "rejecting with a short deposit" });
      await mustFail(client, "reject", [id, "short", ""], { value: dep, label: "a one-word reason" });
      await mustFail(outsider, "approve", [id], { label: "a stranger approves" });
      await mustFail(outsider, "finalize", [id], { label: "finalizing inside the review window" });
      await mustFail(outsider, "rule", [id], { label: "asking for a ruling without a dispute" });
      await mustFail(provider, "propose_split", [id, 5000], { label: "an offer without a dispute" });
      await mustFail(client, "appeal", [id, "Nothing to appeal yet.", ""], { value: PRICE / 10n, label: "an appeal without a ruling" });
      await mustFail(outsider, "release", [id], { label: "releasing a healthy deal" });
      await mustWork(client, "approve", [id]);
      await mustFail(client, "approve", [id], { label: "approving twice" });
      await mustFail(outsider, "claim", [id], { label: "a stranger claims" });
      await claimBoth(id, 0n, PRICE + BOND);

      let failed = false;
      try {
        await read("get_deal", [999999999]);
      } catch {
        failed = true;
      }
      check("reading a deal that does not exist fails", failed);
    }),

  approve: () =>
    scenario("approve", "the plain path: take, deliver, approve, claim", async () => {
      const id = await openDeal(client, { provider: provider.address });
      if (id === null) return;
      await take(id);
      await deliver(id);
      await mustWork(client, "approve", [id]);
      const r = await row(id);
      check("the deal is settled by approval", STATE[r.state] === "SETTLED" && PATH[r.path] === "approved" && r.completion === 10000);
      await claimBoth(id, 0n, PRICE + BOND);
      const p = await read("profile_of", [provider.address]);
      check("the provider's record shows a delivered job", p.delivered >= 1 && p.settled >= 1);
    }),

  split: () =>
    scenario("split", "the client rejects, both sides agree on a split and skip the court", async () => {
      const id = await openDeal(client, { provider: provider.address });
      if (id === null) return;
      await take(id);
      await deliver(id);
      await mustWork(client, "reject", [id, "The page misses two of the three criteria.", ""], { value: DEPOSIT });
      await mustWork(client, "propose_split", [id, 2000], { label: "client offers 20%" });
      await mustWork(provider, "propose_split", [id, 7000], { label: "provider offers 70%" });
      await mustFail(provider, "accept_split", [id, 7000], { label: "accepting your own offer" });
      await mustFail(provider, "accept_split", [id, 1999], { label: "accepting a share that was not offered" });
      await mustWork(provider, "accept_split", [id, 2000], { label: "provider accepts the client's 20%" });
      const r = await row(id);
      check("settled by agreement at 20%", STATE[r.state] === "SETTLED" && PATH[r.path] === "split" && r.completion === 2000);
      const earned = (PRICE * 2000n) / 10_000n;
      await claimBoth(id, PRICE - earned + DEPOSIT, earned + BOND);
    }),

  silent: () =>
    scenario("silent", "the client says nothing, so the delivery counts as approved", async () => {
      const id = await openDeal(client, { provider: provider.address, reviewFor: 300 });
      if (id === null) return;
      await take(id);
      await deliver(id);
      const r = await row(id);
      await mustFail(outsider, "finalize", [id], { label: "finalizing too early" });
      await syncClock();
      await waitUntil(r.review_end, "the review window to end");
      await mustWork(outsider, "finalize", [id]);
      const after = await row(id);
      check("settled by silence", STATE[after.state] === "SETTLED" && PATH[after.path] === "auto");
      await claimBoth(id, 0n, PRICE + BOND);
    }),

  default: () =>
    scenario("default", "the provider never delivers and loses the bond", async () => {
      const id = await openDeal(client, { provider: provider.address, workFor: 300 });
      if (id === null) return;
      await take(id);
      const r = await row(id);
      await mustFail(outsider, "expire", [id], { label: "expiring before the due date" });
      await syncClock();
      await waitUntil(r.due, "the due date");
      await mustFail(provider, "deliver", [id, WORK_URL, "late"], { label: "delivering late" });
      await mustWork(outsider, "expire", [id]);
      check("the deal is defaulted", STATE[(await row(id)).state] === "DEFAULTED");
      await claimBoth(id, PRICE + BOND, 0n);
      const p = await read("profile_of", [provider.address]);
      check("the default is on the provider's record", p.defaults >= 1);
    }),

  court: () =>
    scenario("court", "a real hearing: reject, reply, ruling, finalize and payout", async () => {
      const id = await openDeal(client, { provider: provider.address, reviewFor: 300 });
      if (id === null) return;
      await take(id);
      await deliver(id);
      await mustWork(client, "reject", [id, "The page does not cover every agreed criterion.", ""], { value: DEPOSIT });
      await mustFail(outsider, "rule", [id], { label: "a ruling before the provider replied" });
      await mustWork(provider, "reply", [id, "Every criterion is covered on the page I delivered.", ""]);
      const ruled = await send(outsider, "rule", [id], { label: "rule", retries: 3, pause: 90 });
      check("the court produced a transaction that was accepted", ruled.ok, ruled.status);
      let r = await row(id);
      if (STATE[r.state] !== "RULED") {
        check("the dispute reached a ruling", false, `state ${STATE[r.state]}, ${r.note}`);
        return;
      }
      const ruling = r.ruling ?? {};
      check("the ruling has one credit per criterion", Array.isArray(ruling.credits) && ruling.credits.length === CRITERIA.split("|").length);
      check("every credited criterion carries a quote and a source", (ruling.credits ?? []).every((c, i) => c === 0 || (ruling.quotes?.[i]?.length >= 12 && ruling.urls?.[i])));
      check("the completion matches the credits", ruling.completion === Math.floor(((ruling.credits ?? []).reduce((a, b) => a + b, 0) * 10000) / (2 * (ruling.credits ?? []).length)));
      check("the page hash is recorded", /^[0-9a-f]{64}$/.test(ruling.hash ?? ""));
      await mustFail(outsider, "finalize", [id], { label: "finalizing inside the appeal window" });
      await syncClock();
      await waitUntil(r.ruled_at + r.hearing_window, "the appeal window to end");
      await mustWork(outsider, "finalize", [id]);
      r = await row(id);
      check("the ruling stands", STATE[r.state] === "SETTLED" && PATH[r.path] === "ruling" && r.completion === ruling.completion, `completion ${r.completion}`);
      const total = PRICE + BOND + DEPOSIT;
      const co = await read("owed_of", [id, client.address]);
      const po = await read("owed_of", [id, provider.address]);
      check("the two shares add up to everything that was put in", BigInt(co.amount) + BigInt(po.amount) === total, `${fmt(BigInt(co.amount) + BigInt(po.amount))} of ${fmt(total)}`);
      await claimBoth(id);
    }),
};

// ---- the run ---------------------------------------------------------------------------------------------------------------

console.log(`Parley live test on Studionet: ${SCENARIOS.join(", ")}`);
await syncClock();

CONTRACT = process.env.PARLEY_ADDRESS || (existsSync(new URL("../.parley-address", import.meta.url)) ? readFileSync(new URL("../.parley-address", import.meta.url), "utf8").trim() : "");
if (!CONTRACT) {
  console.log("No PARLEY_ADDRESS given, deploying contracts/parley.py first ...");
  process.env.DEPLOY_KEY = process.env.CLIENT_KEY;
  const { deploy } = await import("./deploy.mjs");
  CONTRACT = (await deploy()).address;
}
if (!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT)) die(`Not a contract address: ${CONTRACT}`);
report.contract = CONTRACT;
console.log(`contract ${CONTRACT}`);
console.log(`reports: ${base}.{html,md,json}`);

let start;
try {
  start = { client: await balanceOf(client.address), provider: await balanceOf(provider.address) };
} catch (err) {
  die(`Cannot reach the Studionet RPC (${RPC}): ${String(err?.cause?.message ?? err?.message ?? err)}`);
}
console.log(`balances: client ${fmt(start.client)}, provider ${fmt(start.provider)}`);
if (start.client < PRICE * 4n || start.provider < BOND * 4n) console.log("warning: the accounts may be short of GEN for every scenario; fund them from the Studio faucet.");
report.statsBefore = await stats();
flush();

for (const name of SCENARIOS) await scenarios[name]();

current = { name: "totals", note: "the contract's own books after the run", status: "running", steps: [], checks: [] };
report.scenarios.push(current);
report.statsAfter = await stats();
const spent = BigInt(report.statsAfter.deposited) - BigInt(report.statsBefore.deposited);
const paid = BigInt(report.statsAfter.paid) - BigInt(report.statsBefore.paid);
check("everything deposited during the run was paid out by claims", spent === paid, `deposited ${fmt(spent)}, paid ${fmt(paid)}`);
current.status = current.checks.every((c) => c.ok) ? "passed" : "failed";

report.finished = true;
report.finishedAt = new Date().toISOString();
flush();
console.log(`\n${report.summary.passed} of ${report.summary.checks} checks passed, ${report.summary.failed} failed.`);
console.log(`report: ${base}.html`);
process.exit(report.summary.failed ? 1 : 0);
