#!/usr/bin/env bash
# One command for everything: static check, local tests, then (when keys are set) the live run on Studionet.
#   bash scripts/run-all.sh                      lint + local tests only
#   CLIENT_KEY=0x.. PROVIDER_KEY=0x.. bash scripts/run-all.sh        also runs the live scenarios
# Extra arguments go to the live run, for example: bash scripts/run-all.sh --only approve,adversarial
cd "$(dirname "$0")/.." || exit 1
status=0
mkdir -p reports

echo "== 1/3 static check"
if command -v genvm-lint >/dev/null 2>&1; then
  genvm-lint check contracts/parley.py || status=1
else
  echo "genvm-lint is not installed (pip install -r requirements.txt); skipped"
fi

echo "== 2/3 local tests"
python3 -m pytest -q --junitxml=reports/local-tests.xml || status=1

echo "== 3/3 live run on Studionet"
if [ -n "$CLIENT_KEY" ] && [ -n "$PROVIDER_KEY" ]; then
  if [ ! -d node_modules/genlayer-js ]; then npm install --no-audit --no-fund || status=1; fi
  node scripts/e2e.mjs "$@" || status=1
else
  echo "CLIENT_KEY and PROVIDER_KEY are not set; skipped (node scripts/e2e.mjs --dry-run shows the plan)"
fi

[ "$status" -eq 0 ] && echo "ALL GOOD" || echo "SOMETHING FAILED"
exit "$status"
