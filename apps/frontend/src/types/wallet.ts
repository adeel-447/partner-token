export type TransactionType = "credit" | "debit";
export type TransactionStatus = "completed" | "pending";

export interface Wallet {
  name: string;
  tokenBalance: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  createdAt: string;
  status: TransactionStatus;
}

export type WalletAction = "add" | "redeem";
