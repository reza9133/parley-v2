# Parley — Frontend

> **Intelligent Escrow for Freelancers** · Built on [GenLayer Studionet](https://studio.genlayer.com)

![Parley](./public/favicon.svg)

Parley is a Web3 escrow DApp powered by GenLayer's AI-native smart contracts. Clients and providers lock funds, deliver work, and resolve disputes — all enforced on-chain without human intermediaries.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🌐 Deployment

### Vercel
1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set **Framework Preset** → `Vite`
4. Set **Root Directory** → `frontend`
5. Deploy — routing handled by `vercel.json`

### Cloudflare Pages
1. Push to GitHub
2. Create project in [Cloudflare Pages](https://pages.cloudflare.com)
3. Set **Build command** → `npm run build`
4. Set **Build output** → `dist`
5. Set **Root directory** → `frontend`
6. Deploy — routing handled by `public/_redirects`

---

## 🦊 MetaMask Setup

Parley connects to **GenLayer Studionet**. The app will prompt MetaMask to add the network automatically on first connect.

**Manual network config (if needed):**

| Field | Value |
|---|---|
| Network Name | GenLayer Studionet |
| RPC URL | `https://studio.genlayer.com/api` |
| Chain ID | `49344` (0xC0C0) |
| Currency | GEN |
| Explorer | `https://studio.genlayer.com` |

---

## 📄 Contract

| Field | Value |
|---|---|
| Address | `0x5d084E85056Acc332793f34667b8a9890f7B2Bd9` |
| Network | GenLayer Studionet |
| Type | GenLayer Intelligent Contract |

---

## 🎨 Features

- **3 Themes** — Dark 🌑, Dim 🌙, Light ☀️ (persisted in localStorage)
- **5 Custom Spinners** — ParleySpinner, MochiSpinner, HexSpinner, CourtSpinner, OrbitSpinner
- **Interactive 3D Mochi** — Three.js + @react-three/fiber, hover/click animations
- **Real Blockchain** — ethers.js v6, live reads & writes on Studionet
- **9 Pages** — Landing, Dashboard, Deals, Deal Detail, Create Deal, My Deals, Profile, Docs, Court
- **Animations** — Framer Motion page transitions, GSAP scroll reveals, animated counters

---

## 🗂 Project Structure

```
src/
├── App.jsx                  # Router + layout shell
├── main.jsx                 # Entry: autoConnect + loadDeals
├── index.css                # 3-theme CSS variables + global styles
├── store/
│   ├── useThemeStore.js     # Zustand (persisted) — dark/dim/light
│   ├── useWalletStore.js    # MetaMask + Studionet connection
│   └── useDealsStore.js     # Deals cache + filter state
├── data/
│   ├── contract.js          # ABI + RPC constants
│   ├── parleyService.js     # All ethers.js blockchain calls
│   └── mockData.js          # Fallback demo data (15 deals)
├── hooks/
│   ├── useAnimatedCounter.js
│   ├── useScrollReveal.js
│   └── useSound.js
├── components/
│   ├── 3d/MochiCanvas.jsx   # Three.js 3D Mochi mascot
│   ├── layout/              # Navbar, Footer
│   ├── ui/                  # ParleyLogo, GenLayerBadge, ThemeToggle
│   ├── spinners/Spinners.jsx # All 5 custom spinners
│   └── deals/               # DealCard, StateFlow
└── pages/
    ├── Landing.jsx
    ├── Dashboard.jsx
    ├── Deals.jsx
    ├── DealDetail.jsx
    ├── CreateDeal.jsx
    ├── MyDeals.jsx
    ├── Profile.jsx
    ├── Docs.jsx
    └── Court.jsx
```

---

## 🔑 Deal States

| # | State | Color | Meaning |
|---|---|---|---|
| 0 | OPEN | 🟡 Amber | Posted, awaiting provider |
| 1 | ACTIVE | 🔵 Blue | Provider accepted, work in progress |
| 2 | DELIVERED | 🩵 Cyan | Provider submitted delivery |
| 3 | DISPUTED | 🔴 Red | Client rejected, in AI court |
| 4 | RULED | 🟣 Purple | AI court issued ruling |
| 5 | APPEALED | 🩷 Pink | Ruling appealed |
| 6 | SETTLED | 🟢 Green | Funds distributed |
| 7 | CANCELLED | ⚫ Gray | Deal withdrawn |
| 8 | DEFAULTED | 🔴 Dark Red | Provider missed deadline |

---

## 🤝 About GenLayer

Parley is built on [GenLayer](https://genlayer.com) — the first AI-native blockchain where smart contracts can access the internet and run AI models natively on-chain.

The Mochi mascot 🐾 belongs to the GenLayer ecosystem.

---

*Made with 💜 by the Parley team*
