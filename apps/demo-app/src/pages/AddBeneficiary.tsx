import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bankStore } from "../store";

export default function AddBeneficiary() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [added, setAdded] = useState(false);

  function handleSubmit() {
    if (!name.trim()) return;
    bankStore.addBeneficiary(name.trim());
    setAdded(true);
  }

  return (
    <div>
      <h1>Add Beneficiary</h1>

      {added ? (
        <div className="panel">
          <p>Beneficiary added successfully.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate("/payments/new")}>
            Make a Payment
          </button>
        </div>
      ) : (
        <div className="panel form">
          <div className="field">
            <label htmlFor="beneficiary-name">Beneficiary Name</label>
            <input
              id="beneficiary-name"
              data-testid="beneficiary-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="button-row">
            <button
              type="button"
              data-testid="add-beneficiary-submit"
              className="btn btn-primary"
              disabled={!name.trim()}
              onClick={handleSubmit}
            >
              Add Beneficiary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
