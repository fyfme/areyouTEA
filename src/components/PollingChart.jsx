import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#10b981", "#f43f5e"]; // green, red

export default function PollingChart({ bullish = 0, bearish = 0 }) {
  const total = Number(bullish) + Number(bearish);
  const data = [
    { name: "Bullish", value: Number(bullish) },
    { name: "Bearish", value: Number(bearish) }
  ];

  return (
    <div className="w-full h-44 bg-slate-900/30 rounded-lg p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={40}
            outerRadius={60}
            paddingAngle={3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, total ? `${Math.round((value/total)*100)}%` : "0%"]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center text-xs text-slate-400">Total votes: {total}</div>
    </div>
  );
}
