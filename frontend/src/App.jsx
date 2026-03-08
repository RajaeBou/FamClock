import { BrowserRouter, Routes, Route } from "react-router-dom";

import CreateFamilyPage from "./pages/CreateFamilyPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AddMemberPage from "./pages/AddMemberPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/create-family" element={<CreateFamilyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members/add" element={<AddMemberPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;