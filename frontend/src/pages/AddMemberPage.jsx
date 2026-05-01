import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AddMemberPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

  const familyId = localStorage.getItem("familyId");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/members", {
        familyId,
        name,
        role,
      });

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      setMessage("Erreur lors de la création du membre");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Ajouter un membre</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={styles.input}
        >
          <option value="">Sélectionner un rôle</option>
          <option value="Parent">Parent</option>
          <option value="Enfant">Enfant</option>
        </select>

        <button type="submit" style={styles.button}>
          Ajouter
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "60px auto",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "20px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default AddMemberPage;