import { Module } from "@nestjs/common";
import { WalletModule } from "../wallet/wallet.module";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";

@Module({ imports: [WalletModule], controllers: [TransactionsController], providers: [TransactionsService] })
export class TransactionsModule {}
