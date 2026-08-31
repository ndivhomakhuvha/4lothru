import { useSyncExternalStore } from "react";
import { bankStore } from "../store";

export default function TransactionHistory() {
  const transactions = useSyncExternalStore(bankStore.subscribe, bankStore.getTransactions);

  return (
    <div>
      <h1>Transaction History</h1>
      <div className="panel">
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
