import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <div>
      <h1>Payment successful</h1>
      <p>Your payment has been submitted and will be processed shortly.</p>
      <div className="button-row">
        <Link className="btn btn-primary" to="/payments">
          Back to Payments
        </Link>
        <Link className="btn" to="/transactions">
          View Transaction History
        </Link>
      </div>
    </div>
  );
}
