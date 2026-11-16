import { Icon } from "../ui/Icon";

export function WalletBalanceCard({ balance }: { balance: number }) {
  return (
    <section aria-label="Wallet balance" className="balance-card">
      <div className="balance-card-top">
        <div className="balance-icon"><Icon name="wallet" /></div>
        <span className="balance-pill"><span className="live-dot" /> Wallet active</span>
      </div>
      <p className="balance-label">Available tokens</p>
      <p className="balance-amount">{balance.toLocaleString()} <span>tokens</span></p>
      <div className="balance-bottom"><span>Your rewards, all in one place</span><Icon name="arrow-up-right" /></div>
      <div aria-hidden="true" className="balance-decoration" />
    </section>
  );
}
