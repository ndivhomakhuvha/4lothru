import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { bankStore } from "../store";

export default function Payments() {
  const transactions = useSyncExternalStore(bankStore.subscribe, bankStore.getTransactions);

  return (
    <div>
      <h1>Payments</h1>
      <div className="button-row">
        <Link className="btn btn-primary" to="/payments/new">
          New Payment
        </Link>
      </div>

      <div className="panel">
        <h2>Recent Payments</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Beneficiary</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.date}</td>
                <td>{tx.beneficiary}</td>
                <td>${tx.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
