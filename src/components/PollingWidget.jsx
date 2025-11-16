import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { FiRefreshCw } from "react-icons/fi";
import CooldownTimer from "./CooldownTimer";
import PollingChart from "./PollingChart";

const CONTRACT_ADDRESS = "0x84eF19739811238D71321968AA96D1Aa3EcD4704";
const ABI = [
  "function voteBullish() external",
  "function voteBearish() external",
  "function getTotals() view returns (uint256,uint256)",
  "function canVote(address) view returns (bool)",
  "function secondsUntilNextVote(address) view returns (uint256)",
  "event Voted(address indexed voter, uint8 sentiment, uint256 timestamp)"
];
const RPC = "https://tea-sepolia.g.alchemy.com/public";

export default function PollingWidget({ connectedAccount }) {
  const [bull, setBull] = useState("0");
  const [bear, setBear] = useState("0");
  const [canVote, setCanVote] = useState(true);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const rpcProvider = new ethers.providers.JsonRpcProvider(RPC);
      const rpcContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, rpcProvider);
      const totals = await rpcContract.getTotals();
      setBull(totals[0].toString());
      setBear(totals[1].toString());

      if (connectedAccount && window.ethereum) {
        const web3 = new ethers.providers.Web3Provider(window.ethereum);
        const web3Contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, web3);
        const can = await web3Contract.canVote(connectedAccount);
        setCanVote(Boolean(can));
        if (!can) {
          const sec = await web3Contract.secondsUntilNextVote(connectedAccount);
          setCooldownSec(Number(sec.toString()));
        } else {
          setCooldownSec(0);
        }
      } else {
        setCanVote(true);
        setCooldownSec(0);
      }
    } catch (e) {
      console.error("load error", e);
    }
  }, [connectedAccount]);

  useEffect(() => {
    load();
    const provider = new ethers.providers.JsonRpcProvider(RPC);
    const eventContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    eventContract.on("Voted", () => load());

    return () => {
      eventContract.removeAllListeners("Voted");
    };
  }, [load]);

  useEffect(() => {
    if (!cooldownSec) return;
    const t = setInterval(() => setCooldownSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  async function vote(isBullish) {
    if (!window.ethereum) return alert("Please install MetaMask");
    setLoading(true);
    try {
      const web3 = new ethers.providers.Web3Provider(window.ethereum);
      await web3.send("eth_requestAccounts", []);
      const signer = web3.getSigner();
      const addr = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      let tx;
      if (isBullish) tx = await contract.voteBullish();
      else tx = await contract.voteBearish();

      await tx.wait();

      setCanVote(false);
      try {
        const sec = await contract.secondsUntilNextVote(addr);
        setCooldownSec(Number(sec.toString()));
      } catch (e) {
        console.error("cooldown fetch failed", e);
        await load();
      }

      await load();
    } catch (e) {
      console.error(e);
      const reason =
        e?.data?.message ||
        e?.error?.message ||
        e?.message ||
        "Transaction failed";
      alert(reason);
    }
    setLoading(false);
  }

  return (
    <motion.div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700 shadow-lg rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Communitea Vote</h2>
          <p className="text-sm text-slate-400 mt-1">
            Choose bullish or bearish — 1 vote per cooldown
          </p>
        </div>

        <button
          onClick={load}
          className="p-2 rounded-md bg-slate-700/40 hover:bg-slate-700/60 transition"
          title="Refresh"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2">
          <div className="flex gap-3">

            {/* ★★★ Cursor TEA aktif hanya di tombol vote-button ★★★ */}
            <button
              onClick={() => vote(true)}
              disabled={!canVote || loading}
              className="vote-button flex-1 py-3 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50 bg-emerald-500 hover:bg-emerald-600"
            >
              <span>🚀 Bullish</span>
            </button>

            <button
              onClick={() => vote(false)}
              disabled={!canVote || loading}
              className="vote-button flex-1 py-3 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50 bg-rose-600 hover:bg-rose-700"
            >
              <span>📉 Bearish</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="px-3 py-2 bg-slate-700/40 rounded-lg">
              <div className="text-xs text-slate-400">Bullish</div>
              <div className="text-lg font-semibold">{bull}</div>
            </div>

            <div className="px-3 py-2 bg-slate-700/40 rounded-lg">
              <div className="text-xs text-slate-400">Bearish</div>
              <div className="text-lg font-semibold">{bear}</div>
            </div>

            <div className="px-3 py-2 bg-slate-700/40 rounded-lg">
              <div className="text-xs text-slate-400">Status</div>
              <div className="text-sm font-medium mt-1">
                {connectedAccount ? (
                  canVote ? (
                    <span className="text-emerald-300">You can vote</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-rose-300">You can't vote</span>
                      <CooldownTimer
                        seconds={cooldownSec}
                        onFinish={async () => {
                          await load();
                        }}
                      />
                    </div>
                  )
                ) : (
                  <span className="text-slate-400">Wallet not connected</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <PollingChart bullish={bull} bearish={bear} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-slate-900/40 to-slate-900/20 p-4 rounded-xl border border-slate-700 text-center">
            <div className="text-xs text-slate-400">Share</div>
            <div className="mt-2 flex flex-col gap-2">
              <a
                className="text-sm text-sky-300 underline truncate"
                href={`https://sepolia.tea.xyz/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
              >
                View Contract
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="text-sm text-slate-300 underline"
              >
                Copy Page Link
              </button>

              <div className="text-xs text-slate-500 mt-2">
                Cooldown: {cooldownSec ? `${cooldownSec}s` : "0s"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
