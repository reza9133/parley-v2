# Parley frontend

React + Vite + Three.js. Talks to the Parley contract on GenLayer Studionet with `genlayer-js` and a browser wallet (MetaMask).

```bash
npm install
cp .env.example .env   # optional, the deployed address is the default
npm run dev
npm run build          # output in dist/, deploy to Vercel or Cloudflare Pages
```

## Configuration (all public, no secrets)

| Variable | Meaning |
| --- | --- |
| `VITE_PARLEY_ADDRESS` | Contract address. Defaults to the Studionet deployment. Set it empty for demo mode with sample data. |
| `VITE_RPC_URL` | Optional RPC override. |
| `VITE_EXPLORER_URL` | Optional explorer base URL for transaction links. |

On Vercel or Cloudflare set the same names under Environment Variables. `.env` is git-ignored, so it is not pushed.

## Where things live

- `src/lib/chain.js` reads, writes and maps contract JSON to UI deals.
- `src/store/` wallet, deals and theme state.
- `src/components/deals/DealActions.jsx` the per-deal transaction panel (take, deliver, approve, reject, court, appeal, finalize, claim).
