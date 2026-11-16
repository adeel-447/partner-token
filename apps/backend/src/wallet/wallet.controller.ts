import { BadRequestException, Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { parseTokenOperation } from "./dto/token-operation.dto";
import { WalletService } from "./wallet.service";

@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet() {
    return this.walletService.getWallet();
  }

  @Post("credit")
  credit(@Body() body: unknown, @Headers("idempotency-key") key: string | undefined) {
    return this.walletService.credit(parseTokenOperation(body), this.parseIdempotencyKey(key));
  }

  @Post("redeem")
  redeem(@Body() body: unknown, @Headers("idempotency-key") key: string | undefined) {
    return this.walletService.redeem(parseTokenOperation(body), this.parseIdempotencyKey(key));
  }

  private parseIdempotencyKey(key: string | undefined): string {
    if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
      throw new BadRequestException("A valid UUID Idempotency-Key header is required.");
    }
    return key.toLowerCase();
  }
}
