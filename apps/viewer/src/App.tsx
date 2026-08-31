import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GuidePage from "./pages/GuidePage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/g/:release/:guideId" element={<GuidePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
