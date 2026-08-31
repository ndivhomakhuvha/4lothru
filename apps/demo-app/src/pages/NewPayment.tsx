import { useState, useSyncExternalStore } from "react";
import { useNavigate, Link } from "react-router-dom";
import { bankStore } from "../store";

export default function NewPayment() {
  const beneficiaries = useSyncExternalStore(bankStore.subscribe, bankStore.getBeneficiaries);
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string | null>(null);

  const canSubmit = amount.trim().length > 0 && !!selectedBeneficiary;

  function handleSubmit() {
    if (!canSubmit || !selectedBeneficiary) return;
    bankStore.addTransaction(amount, selectedBeneficiary);
    navigate("/payments/success");
  }

  return (
    <div>
      <h1>New Payment</h1>
      <p>
        Need a new beneficiary first? <Link to="/beneficiaries/new">Add one</Link>.
      </p>

      <div className="panel form">
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="field">
          {/* Clicking selects the first available beneficiary, keeping the guide to a single "click" step. */}
          <button
            type="button"
            className="dropdown-trigger"
            onClick={() => setSelectedBeneficiary(beneficiaries[0]?.name ?? null)}
          >
            Beneficiary
          </button>
          {selectedBeneficiary && <p className="selected-hint">Selected: {selectedBeneficiary}</p>}
        </div>

        <div className="button-row">
          <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
            Submit Payment
          </button>
        </div>
      </div>
    </div>
  );
}
