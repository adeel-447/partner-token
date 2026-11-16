import type { Transaction, Wallet, WalletAction } from "../types/wallet";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Could not reach the wallet service. Check that the backend is running.");
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = typeof payload === "object" && payload !== null && "message" in payload
      ? payload.message
      : "The request could not be completed.";
    throw new Error(Array.isArray(message) ? message.join(" ") : String(message));
  }
  return response.json() as Promise<T>;
}

export interface WalletOperationResult {
  wallet: Wallet;
  transaction: Transaction;
}

export const walletApi = {
  getWallet: () => request<Wallet>("/wallet", { cache: "no-store" }),
  getTransactions: () => request<Transaction[]>("/transactions", { cache: "no-store" }),
  operate: (action: WalletAction, amount: number, description: string, idempotencyKey: string) => request<WalletOperationResult>(`/wallet/${action === "add" ? "credit" : "redeem"}`, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ amount, description }),
  }),
};
