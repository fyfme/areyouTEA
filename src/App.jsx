import React, { useState } from "react";
import PollingWidget from "./components/PollingWidget";
import ConnectButton from "./components/ConnectButton";
import Logo from "./components/Logo";

export default function App() {
  const [account, setAccount] = useState(null);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white p-6">

      {/* Background Layers */}
      <div className="bg-tea-image"></div>
      <div className="aurora-bg"></div>
      <div className="noise-bg"></div>

      <div className="w-full max-w-5xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <Logo size={48} />

            <div>
              <h1 className="text-3xl font-extrabold font-tea">AreYouTea</h1>

              {/* NEW TAGLINE */}
              <p className="text-sm text-slate-300 mt-1">
                <span style={{ color: "#8AFFC7", fontWeight: 600 }}>
                  TEA Protocol
                </span>
                {" — What’s the Community Feeling?"}
              </p>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-slate-300 bg-slate-800/40 px-3 py-1 rounded-md border border-slate-700">
              Contract:
              <span className="font-medium ml-1">
                0x84eF19739811238D71321968AA96D1Aa3EcD4704
              </span>
            </div>

            <ConnectButton onConnected={(acc) => setAccount(acc)} />
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main>
          <PollingWidget connectedAccount={account} />
        </main>

        {/* FOOTER */}
        <footer className="mt-10 text-center text-sm text-slate-500">
          Built with ❤️ And 🍵
        </footer>
      </div>
    </div>
  );
}
