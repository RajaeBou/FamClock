import { useEffect, useState } from "react";
import api from "../services/api";

const dayOptions = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

function PlanningPage() {
  const familyId = localStorage.getItem("familyId");

  const [members, setMembers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [rules, setRules] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [formData, setFormData] = useState({
    memberId: "",
    dayOfWeek: 1,
    startTime: "",
    endTime: "",
    positionId: "",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [membersResponse, positionsResponse] = await Promise.all([
          api.get(`/members/family/${familyId}`),
          api.get(`/clock-positions/family/${familyId}`),
        ]);

        const loadedMembers = membersResponse.data.data || [];
        const loadedPositions = positionsResponse.data.data || [];

        setMembers(loadedMembers);
        setPositions(loadedPositions);

        if (loadedMembers.length > 0) {
          setSelectedMemberId(loadedMembers[0].id);
          setFormData((prev) => ({
            ...prev,
            memberId: loadedMembers[0].id,
          }));
        }

        if (loadedPositions.length > 0) {
          setFormData((prev) => ({
            ...prev,
            positionId: loadedPositions[0].id,
          }));
        }
      } catch (error) {
        console.error(error);
        setMessage("Erreur lors du chargement des membres ou des positions");
      }
    };

    if (familyId) {
      fetchInitialData();
    }
  }, [familyId]);

  useEffect(() => {
    const fetchRules = async () => {
      if (!selectedMemberId) {
        setRules([]);
        return;
      }

      try {
        const response = await api.get(`/schedule-rules/${selectedMemberId}`);
        setRules(response.data.rules || []);
      } catch (error) {
        console.error(error);
        setMessage("Erreur lors du chargement du planning");
      }
    };

    fetchRules();
  }, [selectedMemberId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "memberId") {
      setSelectedMemberId(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !formData.memberId ||
      !formData.dayOfWeek ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.positionId
    ) {
      setMessage("Tous les champs sont obligatoires");
      return;
    }

    try {
      await api.post("/schedule-rules", {
        familyId,
        memberId: formData.memberId,
        dayOfWeek: Number(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        positionId: formData.positionId,
      });

      setMessage("Règle ajoutée avec succès");

      const response = await api.get(`/schedule-rules/${formData.memberId}`);
      setRules(response.data.rules || []);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Erreur lors de l’ajout de la règle"
      );
    }
  };

  return (
    <div style={styles.container}>
      <h1>Planning des membres</h1>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.section}>
        <h2>Ajouter une règle</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Membre
            <select
              name="memberId"
              value={formData.memberId}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">-- Choisir un membre --</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Jour
            <select
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleChange}
              style={styles.input}
            >
              {dayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Heure début
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Heure fin
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Position
            <select
              name="positionId"
              value={formData.positionId}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">-- Choisir une position --</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.position_number} - {position.label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={styles.button}>
            Ajouter règle
          </button>
        </form>
      </div>

      <div style={styles.section}>
        <h2>Règles existantes</h2>

        {!selectedMemberId ? (
          <p>Sélectionne un membre pour voir son planning.</p>
        ) : rules.length === 0 ? (
          <p>Aucune règle enregistrée pour ce membre.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Jour</th>
                <th style={styles.th}>Début</th>
                <th style={styles.th}>Fin</th>
                <th style={styles.th}>Position</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td style={styles.td}>
                    {dayOptions.find(
                      (day) => day.value === rule.day_of_week
                    )?.label || rule.day_of_week}
                  </td>
                  <td style={styles.td}>{rule.start_time}</td>
                  <td style={styles.td}>{rule.end_time}</td>
                  <td style={styles.td}>{rule.position_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "60px auto",
    padding: "24px",
  },
  section: {
    marginTop: "32px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "400px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontWeight: "bold",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "16px",
  },
  th: {
    border: "1px solid #ccc",
    padding: "12px",
    textAlign: "left",
  },
  td: {
    border: "1px solid #ccc",
    padding: "12px",
  },
  message: {
    marginTop: "16px",
    fontWeight: "bold",
  },
};

export default PlanningPage;