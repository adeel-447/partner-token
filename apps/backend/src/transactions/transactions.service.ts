import { Injectable } from "@nestjs/common";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class TransactionsService {
  constructor(private readonly walletService: WalletService) {}

  findAll() {
    return this.walletService.getTransactions();
  }
}
