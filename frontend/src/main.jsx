import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import useWalletStore from '@store/useWalletStore'
import useDealsStore from '@store/useDealsStore'

// Auto-connect previously connected wallet (reads eth_accounts silently)
useWalletStore.getState().autoConnect()

// Load deals from Studionet on startup
useDealsStore.getState().loadDeals()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
