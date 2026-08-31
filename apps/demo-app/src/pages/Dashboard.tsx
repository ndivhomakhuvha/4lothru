import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { bankStore } from "../store";

export default function Dashboard() {
  const transactions = useSyncExternalStore(bankStore.subscribe, bankStore.getTransactions);
  const balance = 18450.32;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card-grid">
        <div className="card">
          <div className="card-label">Available Balance</div>
          <div className="card-value">${balance.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="card-label">Recent Transactions</div>
          <div className="card-value">{transactions.length}</div>
        </div>
      </div>

      <div className="panel">
        <h2>Quick Actions</h2>
        <div className="button-row">
          <Link className="btn btn-primary" to="/payments/new">
            New Payment
          </Link>
          <Link className="btn" to="/transactions">
            View Transaction History
          </Link>
        </div>
      </div>
    </div>
  );
}
