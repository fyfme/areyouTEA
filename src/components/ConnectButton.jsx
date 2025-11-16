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

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts) => {
      const a = accounts && accounts[0] ? accounts[0] : null;
      setAccount(a);
      if (onAccountChange) onAccountChange(a);
    };
    const handleChain = (chain) => {
      setChainId(chain);
    };
    window.ethereum.on?.("accountsChanged", handleAccounts);
    window.ethereum.on?.("chainChanged", handleChain);

    // initial read
    (async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const a = await signer.getAddress().catch(() => null);
        setAccount(a);
        const cid = await provider.send("eth_chainId", []).catch(() => null);
        setChainId(cid);
      } catch (e) {}
    })();

    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccounts);
      window.ethereum.removeListener?.("chainChanged", handleChain);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchToTeaSepolia() {
    if (!window.ethereum) return alert("MetaMask not found");
    setBusy(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TEA_CHAIN_ID_HEX }]
      });
    } catch (err) {
      // If the chain has not been added, error code 4902 (MetaMask)
      if (err?.code === 4902 || /Unrecognized chain/i.test(err?.message || "")) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [TEA_PARAMS]
          });
        } catch (e) {
          console.error("add chain failed", e);
          alert("Failed to add Tea Sepolia network: " + (e?.message || e));
        }
      } else {
        console.error("switch chain failed", err);
      }
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    if (!window.ethereum) return alert("MetaMask not found");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const a = accounts && accounts[0] ? accounts[0] : null;
      setAccount(a);
      if (onAccountChange) onAccountChange(a);
    } catch (e) {
      console.error(e);
    }
  }

  function disconnect() {
    // cannot programmatically disconnect MetaMask — just clear UI state
    setAccount(null);
    if (onAccountChange) onAccountChange(null);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={switchToTeaSepolia}
        className="text-xs px-3 py-1 rounded-md bg-slate-700/40 hover:bg-slate-700/60 transition"
        title="Switch network to Tea Sepolia"
        disabled={busy}
      >
        Switch to TEA Sepolia
      </button>

      {account ? (
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-300">{truncate(account)}</div>
          <button
            onClick={disconnect}
            className="text-sm px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 transition"
          >
            Disconnect
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
