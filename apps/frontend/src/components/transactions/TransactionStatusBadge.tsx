import type { TransactionStatus } from "../../types/wallet";

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return <span className={`status-badge status-${status}`}><span />{status === "completed" ? "Completed" : "Pending"}</span>;
}
