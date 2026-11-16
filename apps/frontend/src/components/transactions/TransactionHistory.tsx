import { Icon } from "../ui/Icon";
import { TransactionTable } from "./TransactionTable";
import type { Transaction } from "../../types/wallet";

export function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  return (
    <section aria-labelledby="transactions-title" className="history-card">
      <div className="history-heading"><div><div className="eyebrow"><Icon name="clock" /> Wallet activity</div><h2 id="transactions-title">Recent transactions</h2><p>A little history goes a long way.</p></div><span className="transaction-count">{transactions.length} transactions</span></div>
      {transactions.length ? <TransactionTable transactions={transactions} /> : <p className="empty-history">No wallet activity yet.</p>}
      <div className="history-footer"><span>Showing your latest activity</span><button className="history-link" type="button">View all activity <span aria-hidden="true">↗</span></button></div>
    </section>
  );
}
