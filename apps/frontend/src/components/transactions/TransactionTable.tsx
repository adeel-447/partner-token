import { formatTokenAmount } from "../../lib/utils";
import type { Transaction } from "../../types/wallet";
import { TransactionStatusBadge } from "./TransactionStatusBadge";

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="table-scroll">
      <table className="transaction-table">
        <thead><tr><th scope="col">Transaction</th><th scope="col">Type</th><th scope="col">Amount</th><th scope="col">Date</th><th scope="col">Status</th></tr></thead>
        <tbody>{transactions.map((transaction) => <tr key={transaction.id}>
          <td><div className="transaction-name">{transaction.description}<span>{transaction.id}</span></div></td>
          <td><span className={`type-pill type-${transaction.type}`}>{transaction.type === "credit" ? "Credit" : "Debit"}</span></td>
          <td><span className={`amount amount-${transaction.type}`}>{transaction.type === "credit" ? "+" : "−"}{formatTokenAmount(transaction.amount)} <small>tokens</small></span></td>
          <td className="date-cell">{new Date(transaction.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</td>
          <td><TransactionStatusBadge status={transaction.status} /></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
