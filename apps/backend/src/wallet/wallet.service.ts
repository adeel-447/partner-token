import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { JsonStorageService } from "../common/storage/json-storage.service";
import type { TokenOperationDto, Wallet, WalletTransaction } from "./wallet.types";

const WALLET_FILE = "wallet.json";
const TRANSACTIONS_FILE = "transactions.json";
const INITIAL_WALLET: Wallet = { id: 1, name: "Demo User", tokenBalance: 1_000 };
const INITIAL_TRANSACTIONS: WalletTransaction[] = [{
  id: "txn_001", type: "credit", description: "Initial Token Credit", amount: 1_000,
  balanceAfter: 1_000, status: "completed", createdAt: "2026-11-15T10:00:00.000Z",
}];

@Injectable()
export class WalletService {
  private operationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly storage: JsonStorageService) {}

  async initialize(): Promise<void> {
    await this.storage.ensureFile(WALLET_FILE, INITIAL_WALLET);
    await this.storage.ensureFile(TRANSACTIONS_FILE, INITIAL_TRANSACTIONS);
  }

  async getWallet(): Promise<Pick<Wallet, "name" | "tokenBalance">> {
    return this.enqueue(async () => {
      await this.initialize();
      const { name, tokenBalance } = await this.storage.read<Wallet>(WALLET_FILE);
      return { name, tokenBalance };
    });
  }

  async getTransactions(): Promise<WalletTransaction[]> {
    return this.enqueue(async () => {
      await this.initialize();
      const transactions = await this.storage.read<WalletTransaction[]>(TRANSACTIONS_FILE);
      return [...transactions]
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map((transaction) => this.publicTransaction(transaction));
    });
  }

  async credit(input: TokenOperationDto, idempotencyKey: string): Promise<{ wallet: Pick<Wallet, "name" | "tokenBalance">; transaction: WalletTransaction }> {
    return this.enqueue(() => this.recordOperation("credit", input, idempotencyKey));
  }

  async redeem(input: TokenOperationDto, idempotencyKey: string): Promise<{ wallet: Pick<Wallet, "name" | "tokenBalance">; transaction: WalletTransaction }> {
    return this.enqueue(() => this.recordOperation("debit", input, idempotencyKey));
  }

  private async recordOperation(type: WalletTransaction["type"], input: TokenOperationDto, idempotencyKey: string) {
    await this.initialize();
    const wallet = await this.storage.read<Wallet>(WALLET_FILE);
    const transactions = await this.storage.read<WalletTransaction[]>(TRANSACTIONS_FILE);
    const operation = type === "credit" ? "credit" : "redeem";
    const description = input.description || (type === "credit" ? "Token Credit" : "Token Redemption");
    const fingerprint = JSON.stringify({ operation, amount: input.amount, description });
    const previous = transactions.find((entry) => entry.idempotency?.key === idempotencyKey);
    if (previous) {
      if (previous.idempotency?.fingerprint !== fingerprint) {
        throw new ConflictException("This idempotency key has already been used for a different request.");
      }
      return {
        wallet: previous.idempotency.responseWallet,
        transaction: this.publicTransaction(previous),
      };
    }

    if (type === "debit" && wallet.tokenBalance < input.amount) {
      throw new BadRequestException("Insufficient token balance.");
    }

    const nextBalance = type === "credit" ? wallet.tokenBalance + input.amount : wallet.tokenBalance - input.amount;
    if (!Number.isSafeInteger(nextBalance)) throw new BadRequestException("Token balance limit exceeded.");
    const transaction: WalletTransaction = {
      id: `txn_${randomUUID()}`,
      type,
      description,
      amount: input.amount,
      balanceAfter: nextBalance,
      status: "completed",
      createdAt: new Date().toISOString(),
      idempotency: {
        key: idempotencyKey,
        operation,
        fingerprint,
        responseWallet: { name: wallet.name, tokenBalance: nextBalance },
        status: "processed",
        createdAt: new Date().toISOString(),
      },
    };
    const nextWallet: Wallet = { ...wallet, tokenBalance: nextBalance };

    await this.storage.commit({
      [WALLET_FILE]: nextWallet,
      [TRANSACTIONS_FILE]: [...transactions, transaction],
    });

    return { wallet: { name: nextWallet.name, tokenBalance: nextWallet.tokenBalance }, transaction: this.publicTransaction(transaction) };
  }

  private publicTransaction(transaction: WalletTransaction): Omit<WalletTransaction, "idempotency"> {
    const publicRecord = { ...transaction };
    delete publicRecord.idempotency;
    return publicRecord;
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.then(() => undefined, () => undefined);
    return result;
  }
}
