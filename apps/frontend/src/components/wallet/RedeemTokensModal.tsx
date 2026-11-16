"use client";

import { TokenActionModal } from "./TokenActionModal";

export function RedeemTokensModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (message: string) => void }) {
  return <TokenActionModal action="redeem" onClose={onClose} onSuccess={onSuccess} />;
}
