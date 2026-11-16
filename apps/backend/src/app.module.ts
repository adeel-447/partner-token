import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WalletModule } from "./wallet/wallet.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { StorageModule } from "./common/storage/storage.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), StorageModule, WalletModule, TransactionsModule],
})
export class AppModule {}
