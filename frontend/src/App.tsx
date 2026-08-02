import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Volunteers from "./pages/Volunteers";
import Opportunities from "./pages/Opportunities";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/opportunities" element={<Opportunities />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
  o0uiiosudjaksjsdkalsjdlkajsdoajhsdlkiajsdkl;
}
