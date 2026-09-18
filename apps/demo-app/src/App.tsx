import { useEffect } from "react";
import type { ReactNode } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { Trail } from "@trail-cli/sdk";
import { guardOnce } from "./sdk-init";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import NewPayment from "./pages/NewPayment";
import PaymentSuccess from "./pages/PaymentSuccess";
import TransactionHistory from "./pages/TransactionHistory";
import AddBeneficiary from "./pages/AddBeneficiary";

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Demo Bank</div>
        <nav>
          <NavLink to="/" id="view-dashboard" end>
            Dashboard
          </NavLink>
          <NavLink to="/payments">Payments</NavLink>
          <NavLink to="/transactions">Transaction History</NavLink>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // No-op unless the page was opened with ?trail=&release= (see spec #14/#34).
    guardOnce(() => void Trail.init());
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payments/new" element={<NewPayment />} />
          <Route path="/payments/success" element={<PaymentSuccess />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/beneficiaries/new" element={<AddBeneficiary />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
