import { BrowserRouter, Routes, Route } from "react-router-dom";

import CreateFamilyPage from "./pages/CreateFamilyPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AddMemberPage from "./pages/AddMemberPage";
import EditMemberPage from "./pages/EditMemberPage";
import ClockConfigPage from "./pages/ClockConfigPage";
import PlanningPage from "./pages/PlanningPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/create-family" element={<CreateFamilyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members/add" element={<AddMemberPage />} />
        <Route path="/members/:id/edit" element={<EditMemberPage />} />
        <Route path="/clock-config" element={<ClockConfigPage />} />
        <Route path="/planning" element={<PlanningPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;