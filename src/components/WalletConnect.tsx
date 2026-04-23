"use client";

import { useState, useEffect } from "react";
import { connectWallet } from "@/lib/contract";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EthProvider = any;

declare global {
  interface Window {
    ethereum?: EthProvider;
  }
}

export default function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("walletAddress");
    if (stored) setAddress(stored);

    if (typeof window !== "undefined" && window.ethereum?.on) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
          localStorage.removeItem("walletAddress");
        } else {
          setAddress(accounts[0]);
          localStorage.setItem("walletAddress", accounts[0]);
        }
      });
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      localStorage.setItem("walletAddress", addr);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
        <span className="text-sm text-slate-300 font-mono">{shortAddress(address)}</span>
        <button
          onClick={() => {
            setAddress(null);
            localStorage.removeItem("walletAddress");
          }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="btn-primary text-sm py-1.5 px-3"
    >
      {loading ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
