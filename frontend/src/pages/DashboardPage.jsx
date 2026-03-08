import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const navigate = useNavigate();
  const familyName = localStorage.getItem("familyName");

  const handleLogout = () => {
    localStorage.removeItem("familyId");
    localStorage.removeItem("familyName");
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.container}>
      <h1>Dashboard</h1>
      <p>Bienvenue {familyName ? `famille ${familyName}` : ""}</p>

      <button onClick={handleLogout} style={styles.button}>
        Déconnexion
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "60px auto",
    padding: "24px",
    textAlign: "center",
  },
  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default DashboardPage;