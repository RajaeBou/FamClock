import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function LoginPage() {
  const [familyName, setFamilyName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/families/login", {
        familyName,
        pin,
      });

      localStorage.setItem("familyId", response.data.data.id);
      localStorage.setItem("familyName", response.data.data.familyName);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Connexion famille</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Nom de la famille"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Se connecter
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      <p>
        Pas encore de famille ? <Link to="/create-family">Créer une famille</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "420px",
    margin: "60px auto",
    padding: "24px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "20px",
  },
  input: {
    padding: "12px",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginTop: "12px",
  },
};

export default LoginPage;