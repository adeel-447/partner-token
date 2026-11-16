"use client";

import { useState, type FormEvent } from "react";
import type { WalletAction } from "../../types/wallet";
import { walletApi } from "../../lib/wallet-api";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

export function TokenActionModal({ action, onClose, onSuccess }: { action: WalletAction; onClose: () => void; onSuccess: (message: string) => void }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const isAdd = action === "add";
  const title = isAdd ? "Add tokens" : "Redeem tokens";
  const submitLabel = isAdd ? "Continue to add" : "Continue to redeem";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
      setError("Enter a whole number greater than zero.");
      return;
    }
    setIsSubmitting(true);
    try {
      const key = idempotencyKey ?? crypto.randomUUID();
      setIdempotencyKey(key);
      const result = await walletApi.operate(action, value, isAdd ? "Token Purchase" : "Token Redemption", key);
      setAmount("");
      setIdempotencyKey(null);
      onSuccess(`${value.toLocaleString()} tokens ${isAdd ? "added to" : "redeemed from"} your wallet. Balance: ${result.wallet.tokenBalance.toLocaleString()} tokens.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The transaction could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal description={isAdd ? "Choose how many tokens you’d like to add to your wallet." : "Enter the number of tokens you’d like to use for a reward."} error={error} isSubmitting={isSubmitting} onClose={onClose} onSubmit={handleSubmit} submitLabel={submitLabel} title={title}>
      <label className="field-label" htmlFor="token-amount">Token amount</label>
      <div className="amount-input-wrap"><Input autoFocus id="token-amount" inputMode="numeric" min="1" onChange={(event) => { setAmount(event.target.value); setIdempotencyKey(null); setError(""); }} placeholder="e.g. 250" type="number" value={amount} /><span>tokens</span></div>
      <p className="input-hint"><Icon name="gift" /> {isAdd ? "Tokens are ready to use as soon as they arrive." : "Your remaining balance will stay in your wallet."}</p>
    </Modal>
  );
}
