import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const TEA_CHAIN_ID_HEX = "0x27EA"; // 10218 decimal
const TEA_PARAMS = {
  chainId: TEA_CHAIN_ID_HEX,
  chainName: "Tea Sepolia",
  nativeCurrency: { name: "Tea", symbol: "TEA", decimals: 18 },
  rpcUrls: ["https://tea-sepolia.g.alchemy.com/public"],
  blockExplorerUrls: ["https://sepolia.tea.xyz"]
};

function truncate(addr = "", len = 6) {
  if (!addr) return "";
  return addr.slice(0, len) + "…" + addr.slice(-4);
}

export default function ConnectButton({ onAccountChange }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [busy, setBusy] = useState(false);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccounts = (accounts) => {
      const a = accounts.length ? accounts[0] : null;
      setAccount(a);
      onAccountChange?.(a);
    };

    const handleChain = (chain) => setChainId(chain);

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);

    // Initial load
    (async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const a = await signer.getAddress().catch(() => null);
        setAccount(a);
        onAccountChange?.(a);

        const cid = await provider.send("eth_chainId", []);
        setChainId(cid);
      } catch {}
    })();

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccounts);
      window.ethereum.removeListener("chainChanged", handleChain);
    };
  }, [onAccountChange]);

  // Switch/Add TEA Sepolia
  const switchToTeaSepolia = async () => {
    if (!window.ethereum) return alert("MetaMask not found");
    setBusy(true);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TEA_CHAIN_ID_HEX }]
      });
    } catch (err) {
      if (err?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [TEA_PARAMS]
          });
        } catch (e) {
          alert("Failed to add Tea Sepolia network");
        }
      }
    }
    setBusy(false);
  };

  // Connect wallet
  const connect = async () => {
    if (!window.ethereum) return alert("MetaMask not found");

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      const a = accounts[0] || null;
      setAccount(a);
      onAccountChange?.(a);
    } catch (e) {
      console.error(e);
    }
  };

  // 🔥 CHANGE WALLET (request user to pick a different account)
  const changeWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not found");

    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      const a = accounts[0] || null;
      setAccount(a);
      onAccountChange?.(a);
    } catch (e) {
      console.error("Change wallet failed", e);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={switchToTeaSepolia}
        className="text-xs px-3 py-1 rounded-md bg-slate-700/40 hover:bg-slate-700/60 transition"
        disabled={busy}
      >
        Switch to TEA Sepolia
      </button>

      {account ? (
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-300">{truncate(account)}</div>

          {/* NEW: CHANGE WALLET */}
          <button
            onClick={changeWallet}
            className="text-sm px-3 py-1 rounded-md bg-sky-500 hover:bg-sky-600 transition"
          >
            Change Wallet
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          className="text-sm px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 transition"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
