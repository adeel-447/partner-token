"use client";

import { TokenActionModal } from "./TokenActionModal";

export function AddTokensModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (message: string) => void }) {
  return <TokenActionModal action="add" onClose={onClose} onSuccess={onSuccess} />;
}
