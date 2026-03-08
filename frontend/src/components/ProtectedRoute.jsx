import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const familyId = localStorage.getItem("familyId");

  if (!familyId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;