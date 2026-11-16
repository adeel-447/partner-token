export interface Wallet {
  id: number;
  name: string;
  tokenBalance: number;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  description: string;
  amount: number;
  balanceAfter: number;
  status: "completed";
  createdAt: string;
  idempotency?: {
    key: string;
    operation: "credit" | "redeem";
    fingerprint: string;
    responseWallet: Pick<Wallet, "name" | "tokenBalance">;
    status: "processed";
    createdAt: string;
  };
}

export interface TokenOperationDto {
  amount: number;
  description?: string;
}
