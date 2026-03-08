import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const navigate = useNavigate();
  const familyName = localStorage.getItem("familyName");

  const handleLogout = () => {
    localStorage.removeItem("familyId");
    localStorage.removeItem("familyName");
    navigate("/login", { replace: true });
  };

  const handleGoToAddMember = () => {
    navigate("/members/add");
  };

  return (
    <div style={styles.container}>
      <h1>Dashboard</h1>
      <p>Bienvenue {familyName ? `famille ${familyName}` : ""}</p>

      <div style={styles.actions}>
        <button onClick={handleGoToAddMember} style={styles.button}>
          Ajouter un membre
        </button>

        <button onClick={handleLogout} style={styles.button}>
          Déconnexion
        </button>
      </div>
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
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "24px",
  },
  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default DashboardPage;