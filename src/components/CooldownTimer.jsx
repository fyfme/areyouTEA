import React, { useEffect, useState } from "react";

export default function CooldownTimer({ seconds = 0, onFinish, className = "", showLabel = true }) {
  const [sec, setSec] = useState(() => Math.max(0, Number(seconds) || 0));

  // sync prop -> state when seconds prop changes
  useEffect(() => {
    setSec(Math.max(0, Number(seconds) || 0));
  }, [seconds]);

  // tick
  useEffect(() => {
    if (sec <= 0) {
      if (onFinish) onFinish();
      return;
    }
    const t = setInterval(() => {
      setSec((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [sec, onFinish]);

  const fmt = (n) => String(n).padStart(2, "0");
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  const timeStr = hours > 0 ? `${fmt(hours)}:${fmt(mins)}:${fmt(secs)}` : `${fmt(mins)}:${fmt(secs)}`;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {showLabel && <div className="text-xs text-slate-400">Next vote in</div>}
      <div className="mt-1 px-3 py-1 bg-slate-700/40 rounded-lg text-sm font-medium">
        {timeStr}
      </div>
    </div>
  );
}
