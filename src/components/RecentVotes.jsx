import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function RecentVotes({ recent = [] }) {
  const [index, setIndex] = useState(0);

  // Auto rotate every 5 seconds
  useEffect(() => {
    if (recent.length === 0) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % recent.length);
    }, 5000);

    return () => clearInterval(t);
  }, [recent]);

  if (!recent.length) {
    return (
      <div className="mt-6 text-center text-slate-500 text-sm">
        No votes yet.
      </div>
    );
  }

  const item = recent[index];
  const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <motion.div
      className="mt-8 bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-center"
      key={index}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-xs text-slate-400">Recent Vote</div>

      <div className="mt-2 text-lg font-semibold text-slate-200">
        {short(item.voter)}
      </div>

      <div
        className={`mt-1 text-sm ${
          item.sentiment === 1 ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {item.sentiment === 1 ? "🚀 Bullish" : "📉 Bearish"}
      </div>

      <div className="text-xs text-slate-500 mt-1">
        {new Date(item.timestamp * 1000).toLocaleString()}
      </div>
    </motion.div>
  );
}
