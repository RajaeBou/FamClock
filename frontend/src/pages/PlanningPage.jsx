import { useEffect, useMemo, useState } from "react";
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
    referenceDate: "",
    dayOfWeek: "",
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

  const groupedRules = useMemo(() => {
    const grouped = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      0: [],
    };

    for (const rule of rules) {
      grouped[rule.day_of_week]?.push(rule);
    }

    Object.keys(grouped).forEach((dayKey) => {
      grouped[dayKey].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  }, [rules]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "referenceDate") {
      const selectedDate = new Date(`${value}T12:00:00`);

      if (!isNaN(selectedDate.getTime())) {
        const computedDay = selectedDate.getDay();

        setFormData((prev) => ({
          ...prev,
          referenceDate: value,
          dayOfWeek: computedDay,
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        referenceDate: value,
        dayOfWeek: "",
      }));
      return;
    }

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
      formData.dayOfWeek === "" ||
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

      setFormData((prev) => ({
        ...prev,
        referenceDate: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        positionId: positions[0]?.id || "",
      }));
    } catch (error) {
      console.error("Erreur complète :", error);
      console.error("Réponse backend :", error.response?.data);

      setMessage(
        error.response?.data?.message || "Erreur lors de l’ajout de la règle"
      );
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Planning des membres</h1>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.topGrid}>
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
              Date de référence
              <input
                type="date"
                name="referenceDate"
                value={formData.referenceDate}
                onChange={handleChange}
                style={styles.input}
              />
            </label>

            <p style={styles.helperText}>
              Le jour est déterminé automatiquement à partir de la date choisie.
            </p>

            <label style={styles.label}>
              Jour
              <input
                type="text"
                value={
                  dayOptions.find(
                    (day) => day.value === Number(formData.dayOfWeek)
                  )?.label || ""
                }
                readOnly
                style={styles.input}
              />
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
          <h2>Résumé du membre</h2>

          {!selectedMemberId ? (
            <p>Sélectionne un membre.</p>
          ) : rules.length === 0 ? (
            <p>Aucune règle enregistrée pour ce membre.</p>
          ) : (
            <div style={styles.summaryCard}>
              <p style={styles.summaryLine}>
                <strong>Membre :</strong>{" "}
                {members.find((m) => m.id === selectedMemberId)?.name || "-"}
              </p>
              <p style={styles.summaryLine}>
                <strong>Nombre de règles :</strong> {rules.length}
              </p>
              <p style={styles.summaryLine}>
                <strong>Vue :</strong> planning hebdomadaire
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h2>Calendrier hebdomadaire</h2>

        {!selectedMemberId ? (
          <p>Sélectionne un membre pour voir son planning.</p>
        ) : (
          <div style={styles.calendarGrid}>
            {dayOptions.map((day) => (
              <div key={day.value} style={styles.dayColumn}>
                <div style={styles.dayHeader}>{day.label}</div>

                <div style={styles.dayBody}>
                  {groupedRules[day.value]?.length > 0 ? (
                    groupedRules[day.value].map((rule) => (
                      <div key={rule.id} style={styles.ruleCard}>
                        <p style={styles.ruleTime}>
                          {rule.start_time} → {rule.end_time}
                        </p>
                        <p style={styles.rulePosition}>{rule.position_label}</p>
                      </div>
                    ))
                  ) : (
                    <p style={styles.emptyDay}>Aucune règle</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
                    {dayOptions.find((day) => day.value === rule.day_of_week)
                      ?.label || rule.day_of_week}
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
    maxWidth: "1200px",
    margin: "40px auto",
    padding: "24px",
  },
  title: {
    fontSize: "3rem",
    marginBottom: "20px",
  },
  message: {
    marginBottom: "16px",
    fontWeight: "bold",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    alignItems: "start",
  },
  section: {
    marginTop: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "420px",
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
  helperText: {
    marginTop: "-8px",
    marginBottom: "0",
    fontSize: "14px",
    opacity: 0.8,
  },
  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
  },
  summaryCard: {
    border: "1px solid #444",
    borderRadius: "10px",
    padding: "16px",
  },
  summaryLine: {
    margin: "8px 0",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "12px",
    marginTop: "16px",
  },
  dayColumn: {
    border: "1px solid #555",
    borderRadius: "10px",
    overflow: "hidden",
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
  },
  dayHeader: {
    padding: "12px",
    fontWeight: "bold",
    textAlign: "center",
    borderBottom: "1px solid #555",
  },
  dayBody: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1,
  },
  ruleCard: {
    border: "1px solid #666",
    borderRadius: "8px",
    padding: "10px",
  },
  ruleTime: {
    margin: 0,
    fontWeight: "bold",
  },
  rulePosition: {
    margin: "6px 0 0 0",
  },
  emptyDay: {
    opacity: 0.7,
    fontStyle: "italic",
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
};

export default PlanningPage;