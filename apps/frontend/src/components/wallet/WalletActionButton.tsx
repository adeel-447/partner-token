import type { ReactNode } from "react";

export function WalletActionButton({ title, detail, icon, onClick, variant }: { title: string; detail: string; icon: ReactNode; onClick: () => void; variant: "add" | "redeem" }) {
  return <button className={`action-card action-${variant}`} onClick={onClick} type="button"><span className="action-icon">{icon}</span><span className="action-copy"><strong>{title}</strong><small>{detail}</small></span><span aria-hidden="true" className="action-arrow">↗</span></button>;
}
