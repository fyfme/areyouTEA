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

// Format address
function short(addr) {
  return addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "";
}

// Format timestamp
function formatDate(ts) {
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleString();
}

export default function PollingWidget({ connectedAccount }) {
  const [bull, setBull] = useState("0");
  const [bear, setBear] = useState("0");

  const [canVote, setCanVote] = useState(true);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- RECENT VOTERS SYSTEM ---
  const [recentBatch, setRecentBatch] = useState([]); // always 5 max
  const [pending, setPending] = useState([]); // pending updates after first batch
  const [initialized, setInitialized] = useState(false); // used to load history only once

  // LOAD TOTALS & STATUS
  const load = useCallback(async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      const totals = await contract.getTotals();
      setBull(totals[0].toString());
      setBear(totals[1].toString());

      if (connectedAccount) {
        const web3 = new ethers.providers.Web3Provider(window.ethereum);
        const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, web3);

        const can = await c.canVote(connectedAccount);
        setCanVote(Boolean(can));

        if (!can) {
          const sec = await c.secondsUntilNextVote(connectedAccount);
          setCooldownSec(Number(sec.toString()));
        } else {
          setCooldownSec(0);
        }
      }
    } catch (err) {
      console.error("load error:", err);
    }
  }, [connectedAccount]);

  // LOAD INITIAL 5 MOST RECENT VOTES
  async function loadInitialBatch() {
    const provider = new ethers.providers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const events = await contract.queryFilter("Voted", -5000);

    const mapped = events
      .map((e) => ({
        voter: e.args.voter,
        sentiment: Number(e.args.sentiment),
        ts: e.args.timestamp.toString()
      }))
      .reverse(); // newest first

    if (mapped.length <= 5) {
      // show ALL the first voters normally
      setRecentBatch(mapped);
      setPending([]);
    } else {
      // show only last 5
      setRecentBatch(mapped.slice(0, 5));
      setPending([]);
    }

    setInitialized(true);
  }

  // EVENT LISTENER: real time votes
  useEffect(() => {
    load();

    if (!initialized) loadInitialBatch();

    const provider = new ethers.providers.JsonRpcProvider(RPC);
    const eventContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    eventContract.on("Voted", (voter, sentiment, ts) => {
      const newVote = { voter, sentiment: Number(sentiment), ts: ts.toString() };

      setPending((prevPending) => {
        // If pending empty & recentBatch <5 → add directly to recentBatch
        if (recentBatch.length < 5) {
          setRecentBatch((prev) => [newVote, ...prev].slice(0, 5));
          return prevPending; // no pending yet
        }

        // After batch full → wait for 5 new votes
        const updated = [newVote, ...prevPending];

        if (updated.length >= 5) {
          // Replace batch
          setRecentBatch(updated.slice(0, 5));
          return []; // reset pending
        }

        return updated;
      });

      load();
    });

    return () => {
      eventContract.removeAllListeners("Voted");
    };
  }, [load, initialized, recentBatch]);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownSec) return;
    const t = setInterval(() => {
      setCooldownSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  // Handle voting
  async function vote(isBullish) {
    if (!window.ethereum) return alert("Please install MetaMask");
    setLoading(true);

    try {
      const web3 = new ethers.providers.Web3Provider(window.ethereum);
      await web3.send("eth_requestAccounts", []);
      const signer = web3.getSigner();
      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = isBullish ? await c.voteBullish() : await c.voteBearish();
      await tx.wait();

      load();
    } catch (e) {
      alert(e?.message || "Transaction failed");
    }

    setLoading(false);
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700 shadow-lg rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold font-tea">Communitea Vote</h2>
          <p className="text-sm text-slate-400 mt-1">
            Choose bullish or bearish — 1 vote per cooldown
          </p>
        </div>

        <button
          onClick={load}
          className="p-2 rounded-md bg-slate-700/40 hover:bg-slate-700/60"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* GRID */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LEFT */}
        <div className="lg:col-span-2">
          
          {/* VOTE BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={() => vote(true)}
              disabled={!canVote || loading}
              className="flex-1 py-3 rounded-xl text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
            >
              🚀 Bullish
            </button>

            <button
              onClick={() => vote(false)}
              disabled={!canVote || loading}
              className="flex-1 py-3 rounded-xl text-lg font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
            >
              📉 Bearish
            </button>
          </div>

          {/* STATS */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div className="flex items-center gap-2">
                      <span className="text-rose-300">You can't vote</span>
                      <CooldownTimer seconds={cooldownSec} />
                    </div>
                  )
                ) : (
                  <span className="text-slate-400">Wallet not connected</span>
                )}
              </div>
            </div>
          </div>

          {/* CHART */}
          <div className="mt-6">
            <PollingChart bullish={bull} bearish={bear} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* SHARE BOX */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700 text-center">
            <div className="text-xs text-slate-400">Share</div>
            <div className="mt-2 flex flex-col gap-2">
              <a
                className="text-sm text-sky-300 underline"
                href={`https://sepolia.tea.xyz/address/${CONTRACT_ADDRESS}`}
                target="_blank"
              >
                View Contract
              </a>

              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="text-sm text-slate-300 underline"
              >
                Copy Page Link
              </button>

              <div className="text-xs text-slate-500 mt-2">
                Cooldown: {cooldownSec}s
              </div>
            </div>
          </div>

          {/* RECENT VOTERS */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold mb-3">Recent Voters</h3>

            {recentBatch.length === 0 ? (
              <div className="text-xs text-slate-500">No recent votes</div>
            ) : (
              recentBatch.map((v, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm py-1 border-b border-white/5"
                >
                  <div className="text-slate-300">{short(v.voter)}</div>
                  <div className={v.sentiment === 0 ? "text-emerald-400" : "text-rose-400"}>
                    {v.sentiment === 0 ? "Bull" : "Bear"}
                  </div>
                </div>
              ))
            )}

            {/* REMOVE waiting indicator for first batch */}
            {recentBatch.length === 5 && pending.length > 0 && (
              <div className="text-xs text-slate-500 mt-3">
                {pending.length}/5 new votes collected…
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
