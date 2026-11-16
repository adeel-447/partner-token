"use client";

import { useCallback, useEffect, useState } from "react";
import type { Transaction, Wallet, WalletAction } from "../../types/wallet";
import { walletApi } from "../../lib/wallet-api";
import { TransactionHistory } from "../transactions/TransactionHistory";
import { Icon } from "../ui/Icon";
import { AddTokensModal } from "./AddTokensModal";
import { RedeemTokensModal } from "./RedeemTokensModal";
import { WalletActionButton } from "./WalletActionButton";
import { WalletBalanceCard } from "./WalletBalanceCard";

export function WalletDashboard() {
  const [activeAction, setActiveAction] = useState<WalletAction | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refreshWallet = useCallback(async () => {
    const [nextWallet, nextTransactions] = await Promise.all([walletApi.getWallet(), walletApi.getTransactions()]);
    setWallet(nextWallet);
    setTransactions(nextTransactions);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadWallet() {
      try {
        const [nextWallet, nextTransactions] = await Promise.all([walletApi.getWallet(), walletApi.getTransactions()]);
        if (active) {
          setWallet(nextWallet);
          setTransactions(nextTransactions);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your wallet.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadWallet();
    return () => { active = false; };
  }, [refreshWallet]);

  const handleSuccess = (successMessage: string) => {
    setActiveAction(null);
    setError("");
    setMessage(successMessage);
    refreshWallet().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not refresh your wallet."));
  };

  return (
    <main className="dashboard-shell">
      <header className="topbar"><a aria-label="Kindred home" className="brand" href="#"><span className="brand-mark"><Icon name="gift" /></span><span>kindred<span className="brand-dot">.</span></span></a><div className="topbar-right"><span className="topbar-context">Rewards wallet</span><div aria-label="Alex Morgan" className="avatar">AM</div></div></header>
      <div className="dashboard-content">
        <section className="welcome-row"><div><p className="eyebrow">Your rewards wallet</p><h1>Your wallet, at a glance.</h1><p className="welcome-description">Good things add up. Here’s where your tokens stand.</p></div><div className="welcome-sparkle" aria-hidden="true">✳</div></section>
        {(message || error) && <div className={`notice ${error ? "notice-error" : "notice-success"}`} role="status">{error || message}<button aria-label="Dismiss message" onClick={() => { setError(""); setMessage(""); }} type="button">×</button></div>}
        <div className="overview-grid">
          <WalletBalanceCard balance={wallet?.tokenBalance ?? 0} />
          <section className="actions-panel" aria-labelledby="actions-title"><div className="section-heading"><div><p className="eyebrow">Make it yours</p><h2 id="actions-title">Token actions</h2></div><span className="heading-sparkle" aria-hidden="true">✳</span></div><div className="actions-list"><WalletActionButton detail="Top up your wallet" icon={<Icon name="plus" />} onClick={() => setActiveAction("add")} title="Add tokens" variant="add" /><WalletActionButton detail="Spend on something nice" icon={<Icon name="arrow-down-left" />} onClick={() => setActiveAction("redeem")} title="Redeem tokens" variant="redeem" /></div><p className="actions-note"><span>✦</span> Your tokens are ready when you are.</p></section>
        </div>
        {isLoading ? <div className="loading-state" role="status">Loading your wallet…</div> : <TransactionHistory transactions={transactions} />}
        <footer className="page-footer"><span>Made for the little things that matter.</span><span>© 2026 Kindred Rewards</span></footer>
      </div>
      {activeAction === "add" && <AddTokensModal onClose={() => setActiveAction(null)} onSuccess={handleSuccess} />}
      {activeAction === "redeem" && <RedeemTokensModal onClose={() => setActiveAction(null)} onSuccess={handleSuccess} />}
    </main>
  );
}
