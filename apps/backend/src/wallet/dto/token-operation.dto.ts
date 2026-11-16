import { BadRequestException } from "@nestjs/common";
import type { TokenOperationDto } from "../wallet.types";

export function parseTokenOperation(body: unknown): TokenOperationDto {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new BadRequestException("Request body must be a JSON object.");
  }

  const payload = body as Record<string, unknown>;
  if (typeof payload.amount !== "number" || !Number.isSafeInteger(payload.amount) || payload.amount <= 0) {
    throw new BadRequestException("Amount must be a positive whole number.");
  }
  if (payload.description !== undefined && (typeof payload.description !== "string" || payload.description.trim().length > 120)) {
    throw new BadRequestException("Description must be a string of at most 120 characters.");
  }

  return { amount: payload.amount, description: (payload.description as string | undefined)?.trim() };
}
