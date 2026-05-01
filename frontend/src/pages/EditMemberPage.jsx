import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function EditMemberPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [servoChannel, setServoChannel] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await api.get(`/members/${id}`);
        const member = response.data.data;

        setName(member.name);
        setRole(member.role);
        setServoChannel(member.servoChannel);
      } catch (error) {
        setMessage("Erreur lors du chargement du membre");
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await api.put(`/members/${id}`, {
        name,
        role,
        servoChannel: Number(servoChannel),
      });

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Erreur lors de la modification"
      );
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Modifier un membre</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Modifier un membre</h1>

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

        <select
          value={servoChannel}
          onChange={(e) => setServoChannel(e.target.value)}
          style={styles.input}
        >
          {Array.from({ length: 16 }, (_, index) => (
            <option key={index} value={index}>
              Aiguille n°{index}
            </option>
          ))}
        </select>

        <button type="submit" style={styles.button}>
          Enregistrer les modifications
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={styles.secondaryButton}
        >
          Retour
        </button>
      </form>

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "520px",
    margin: "60px auto",
    padding: "24px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "24px",
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
  secondaryButton: {
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
  },
  message: {
    marginTop: "16px",
  },
};

export default EditMemberPage;