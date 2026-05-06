import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SplashScreen from "./components/SplashScreen";

import HomePage from "./pages/HomePage";
import CreateFamilyPage from "./pages/CreateFamilyPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AddMemberPage from "./pages/AddMemberPage";
import EditMemberPage from "./pages/EditMemberPage";
import ClockConfigPage from "./pages/ClockConfigPage";
import PlanningPage from "./pages/PlanningPage";

function ProtectedRoute({ children }) {
  const familyId = localStorage.getItem("familyId");

  if (!familyId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-family" element={<CreateFamilyPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Routes privées */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/members/add"
          element={
            <ProtectedRoute>
              <AddMemberPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/members/:id/edit"
          element={
            <ProtectedRoute>
              <EditMemberPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clock-config"
          element={
            <ProtectedRoute>
              <ClockConfigPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/planning"
          element={
            <ProtectedRoute>
              <PlanningPage />
            </ProtectedRoute>
          }
        />

        {/* Route inconnue */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;