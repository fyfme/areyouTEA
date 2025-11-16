import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#10b981", "#f43f5e"]; // green, red

export default function PollingChart({ bullish = 0, bearish = 0 }) {
  const [animatedData, setAnimatedData] = useState([
    { name: "Bullish", value: 0 },
    { name: "Bearish", value: 0 }
  ]);

  const easeOutQuad = (t) => t * (2 - t);

  // 🎥 Animate
  useEffect(() => {
    let frame = 0;
    const totalFrames = 25;
    const start = animatedData.map((d) => d.value);
    const end = [Number(bullish), Number(bearish)];

    const animate = () => {
      frame++;
      const progress = easeOutQuad(frame / totalFrames);

      const newValues = start.map((s, i) => s + (end[i] - s) * progress);

      setAnimatedData([
        { name: "Bullish", value: newValues[0] },
        { name: "Bearish", value: newValues[1] }
      ]);

      if (frame < totalFrames) requestAnimationFrame(animate);
    };

    animate();
  }, [bullish, bearish]);

  const total = animatedData[0].value + animatedData[1].value;

  // 🧮 Percentage
  const bullPct = total ? Math.round((animatedData[0].value / total) * 100) : 0;
  const bearPct = total ? Math.round((animatedData[1].value / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative w-full h-56 bg-slate-900/40 rounded-xl p-3 shadow-[0_0_20px_rgba(16,185,129,0.10)]"
    >
      {/* Glow ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-40 h-40 rounded-full blur-xl opacity-20 bg-emerald-400"></div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={animatedData}
            innerRadius={65}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={3}
            isAnimationActive={false}
          >
            {animatedData.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index]}
                style={{
                  filter:
                    index === 0
                      ? "drop-shadow(0 0 6px rgba(16,185,129,0.45))"
                      : "drop-shadow(0 0 6px rgba(244,63,94,0.45))"
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* 🥇 PERCENTAGE DISPLAY */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-lg font-bold text-white drop-shadow">
          {bullPct}% <span className="text-emerald-400">Bull</span>
        </div>
        <div className="text-sm text-slate-300 -mt-1">
          {bearPct}% <span className="text-rose-400">Bear</span>
        </div>
      </div>

      <div className="mt-2 text-center text-xs text-slate-400">
        Total votes: {Math.round(total)}
      </div>
    </motion.div>
  );
}
