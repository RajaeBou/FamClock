import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function CreateFamilyPage() {
  const [familyName, setFamilyName] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await api.post("/families", {
        familyName,
        pin,
      });

      setMessage(response.data.message || "Famille créée avec succès");

      localStorage.setItem("familyId", response.data.data.id);
      localStorage.setItem("familyName", response.data.data.familyName);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création de la famille");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Créer une famille</h1>

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
  placeholder="Mot de passe familial"
  value={pin}
  onChange={(e) => setPin(e.target.value)}
  minLength={12}
  maxLength={128}
  style={styles.input}
/>

        <button type="submit" style={styles.button}>
          Créer
        </button>
      </form>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <p>
        Déjà une famille ? <Link to="/login">Se connecter</Link>
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
  success: {
    color: "green",
    marginTop: "12px",
  },
  error: {
    color: "red",
    marginTop: "12px",
  },
};

export default CreateFamilyPage;