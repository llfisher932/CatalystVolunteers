import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Volunteers from "./pages/Volunteers";
import Opportunities from "./pages/Opportunities";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import VolAdd from "./pages/VolAdd";
import VolEdit from "./pages/VolEdit";
import OppEdit from "./pages/OppEdit";
import OppAdd from "./pages/OppAdd";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/volunteers/add" element={<VolAdd />} />
          <Route path="/volunteers/:id/edit" element={<VolEdit />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/opportunities/:id/edit" element={<OppEdit />} />
          <Route path="/opportunities/add" element={<OppAdd />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
