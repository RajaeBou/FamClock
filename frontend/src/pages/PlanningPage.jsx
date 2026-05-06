import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const dayOptions = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 0, label: "Dimanche", short: "Dim" },
];

const dayOrder = [1, 2, 3, 4, 5, 6, 0];

const getPositionNumber = (position) =>
  position?.positionNumber ?? position?.position_number ?? "-";

const getPositionLabel = (position) => position?.label || "Position";

const formatTime = (time) => {
  if (!time) return "--:--";
  return String(time).slice(0, 5);
};

const getDayLabel = (dayValue) =>
  dayOptions.find((day) => day.value === dayValue)?.label || dayValue;

const getPositionTheme = (label = "") => {
  const text = label.toLowerCase();

  if (text.includes("piscine")) {
    return {
      backgroundColor: "#EAF7FA",
      borderColor: "#B8DEE6",
      color: "#39717B",
    };
  }

  if (text.includes("école") || text.includes("ecole")) {
    return {
      backgroundColor: "#FFF6DE",
      borderColor: "#EAD49B",
      color: "#8A6723",
    };
  }

  if (text.includes("travail") || text.includes("work")) {
    return {
      backgroundColor: "#EEF5EF",
      borderColor: "#C7DDCB",
      color: "#4F7456",
    };
  }

  if (text.includes("sport") || text.includes("judo")) {
    return {
      backgroundColor: "#FFF0E5",
      borderColor: "#EBC3A0",
      color: "#94582C",
    };
  }

  if (text.includes("papi") || text.includes("mamie")) {
    return {
      backgroundColor: "#FFF1EF",
      borderColor: "#ECC7C1",
      color: "#9A5C51",
    };
  }

  if (text.includes("home") || text.includes("maison")) {
    return {
      backgroundColor: "#F5F1E9",
      borderColor: "#DCC8AA",
      color: "#7D6B5D",
    };
  }

  return {
    backgroundColor: "#FFFCF7",
    borderColor: "#E6D6BF",
    color: "#7D6B5D",
  };
};

function PlanningPage() {
  const navigate = useNavigate();

  const familyId = localStorage.getItem("familyId");
  const familyName = localStorage.getItem("familyName");

  const [members, setMembers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [rules, setRules] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    memberId: "",
    referenceDate: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    positionId: "",
  });

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId),
    [members, selectedMemberId]
  );

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
      grouped[dayKey].sort((a, b) =>
        String(a.start_time).localeCompare(String(b.start_time))
      );
    });

    return grouped;
  }, [rules]);

  const totalPlannedTime = useMemo(() => {
    let totalMinutes = 0;

    rules.forEach((rule) => {
      if (!rule.start_time || !rule.end_time) return;

      const [startHour, startMinute] = String(rule.start_time)
        .slice(0, 5)
        .split(":")
        .map(Number);

      const [endHour, endMinute] = String(rule.end_time)
        .slice(0, 5)
        .split(":")
        .map(Number);

      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;

      if (end > start) {
        totalMinutes += end - start;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (totalMinutes === 0) return "0 min";
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${String(minutes).padStart(2, "0")}`;
  }, [rules]);

  const nextRoutine = useMemo(() => {
    if (rules.length === 0) return null;

    const sorted = [...rules].sort((a, b) => {
      const dayA = dayOrder.indexOf(a.day_of_week);
      const dayB = dayOrder.indexOf(b.day_of_week);

      if (dayA !== dayB) return dayA - dayB;

      return String(a.start_time).localeCompare(String(b.start_time));
    });

    return sorted[0];
  }, [rules]);

  const clearMessageAfterDelay = () => {
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchRules = async (memberId) => {
    if (!memberId) {
      setRules([]);
      return;
    }

    try {
      const response = await api.get(`/schedule-rules/${memberId}`);
      setRules(response.data.rules || []);
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du chargement du planning");
      clearMessageAfterDelay();
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const [membersResponse, positionsResponse] = await Promise.all([
          api.get(`/members/family/${familyId}`),
          api.get(`/clock-positions/family/${familyId}`),
        ]);

        const loadedMembers = membersResponse.data.data || [];
        const loadedPositions = positionsResponse.data.data || [];

        setMembers(loadedMembers);

        setPositions(
          [...loadedPositions].sort(
            (a, b) => getPositionNumber(a) - getPositionNumber(b)
          )
        );

        if (loadedMembers.length > 0) {
          setSelectedMemberId(loadedMembers[0].id);

          setFormData((prev) => ({
            ...prev,
            memberId: loadedMembers[0].id,
          }));

          await fetchRules(loadedMembers[0].id);
        }

        if (loadedPositions.length > 0) {
          setFormData((prev) => ({
            ...prev,
            positionId: loadedPositions[0].id,
          }));
        }
      } catch (error) {
        console.error(error);
        setMessage("Erreur lors du chargement des données");
        clearMessageAfterDelay();
      } finally {
        setLoading(false);
      }
    };

    if (familyId) {
      fetchInitialData();
    } else {
      navigate("/login", { replace: true });
    }
  }, [familyId, navigate]);

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

    if (name === "memberId") {
      setSelectedMemberId(value);

      setFormData((prev) => ({
        ...prev,
        memberId: value,
      }));

      fetchRules(value);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMemberSummaryChange = (e) => {
    const memberId = e.target.value;

    setSelectedMemberId(memberId);

    setFormData((prev) => ({
      ...prev,
      memberId,
    }));

    fetchRules(memberId);
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
      clearMessageAfterDelay();
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

      setMessage("Routine ajoutée au planning");

      await fetchRules(formData.memberId);

      setFormData((prev) => ({
        ...prev,
        referenceDate: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        positionId: positions[0]?.id || "",
      }));

      clearMessageAfterDelay();
    } catch (error) {
      console.error("Erreur complète :", error);
      console.error("Réponse backend :", error.response?.data);

      setMessage(
        error.response?.data?.message || "Erreur lors de l’ajout de la routine"
      );

      clearMessageAfterDelay();
    }
  };

  const handleDeleteRule = async (ruleId) => {
    const confirmDelete = window.confirm(
      "Voulez-vous supprimer cette routine du planning ?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/schedule-rules/${ruleId}`);

      setMessage("Routine supprimée");

      await fetchRules(selectedMemberId);

      clearMessageAfterDelay();
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "Suppression impossible. Vérifiez que la route DELETE existe côté backend."
      );
      clearMessageAfterDelay();
    }
  };

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes planningFadeIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes toastPop {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .planning-card {
            animation: planningFadeIn 0.35s ease-out;
          }

          .planning-button {
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }

          .planning-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(125, 107, 93, 0.16);
          }

          .planning-toast {
            animation: toastPop 0.3s ease-out;
          }

          .day-column {
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }

          .day-column:hover {
            transform: translateY(-3px);
            box-shadow: 0 14px 30px rgba(125, 107, 93, 0.12);
            border-color: #D2B48C;
          }

          .routine-row {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .routine-row:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(125, 107, 93, 0.10);
          }

          @media (max-width: 1050px) {
            .summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .bottom-grid {
              grid-template-columns: 1fr !important;
            }

            .planning-hero-content {
              grid-template-columns: 1fr !important;
            }

            .planning-title-block {
              text-align: left !important;
              padding-right: 0 !important;
            }
          }

          @media (max-width: 900px) {
            .calendar-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 600px) {
            .summary-grid,
            .calendar-grid {
              grid-template-columns: 1fr !important;
            }

            .time-grid {
              grid-template-columns: 1fr !important;
            }

            .routine-row-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      {message && (
        <div className="planning-toast" style={styles.toast}>
          {message}
        </div>
      )}

      <main style={styles.container}>
        <section className="planning-card" style={styles.hero}>
          <div className="planning-hero-content" style={styles.heroContent}>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="planning-button"
              style={styles.backBtn}
            >
              ← Dashboard
            </button>

            <div className="planning-title-block" style={styles.heroText}>
              <h1 style={styles.title}>Planning familial</h1>

              <p style={styles.subtitle}>
                {familyName
                  ? `Famille ${familyName} · organisez les routines de chaque membre`
                  : "Organisez les routines de chaque membre"}
              </p>
            </div>
          </div>
        </section>

        <section className="planning-card" style={styles.summaryPanel}>
          <div style={styles.summaryHeader}>
            <div>
              <p style={styles.sectionKicker}>Vue d’ensemble</p>
              <h2 style={styles.sectionTitle}>
                {selectedMember?.name
                  ? `Planning de ${selectedMember.name}`
                  : "Planning du membre"}
              </h2>
            </div>

            <select
              value={selectedMemberId}
              onChange={handleMemberSummaryChange}
              style={styles.memberSelect}
            >
              <option value="">Choisir un membre</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="summary-grid" style={styles.summaryGrid}>
            <div style={styles.summaryBox}>
              <span style={styles.summaryValue}>{rules.length}</span>
              <span style={styles.summaryLabel}>routine(s)</span>
            </div>

            <div style={styles.summaryBox}>
              <span style={styles.summaryValue}>{totalPlannedTime}</span>
              <span style={styles.summaryLabel}>temps planifié</span>
            </div>

            <div style={styles.summaryBox}>
              <span style={styles.summaryValue}>
                {rules.length > 0 ? "Actif" : "Vide"}
              </span>
              <span style={styles.summaryLabel}>statut</span>
            </div>

            <div style={styles.nextRoutineBox}>
              <span style={styles.nextRoutineLabel}>Prochaine routine</span>

              {nextRoutine ? (
                <span style={styles.nextRoutineText}>
                  {getDayLabel(nextRoutine.day_of_week)} ·{" "}
                  {formatTime(nextRoutine.start_time)} →{" "}
                  {formatTime(nextRoutine.end_time)} ·{" "}
                  {nextRoutine.position_label}
                </span>
              ) : (
                <span style={styles.nextRoutineText}>
                  Aucune routine enregistrée
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="planning-card" style={styles.calendarPanel}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionKicker}>Semaine</p>
              <h2 style={styles.sectionTitle}>Calendrier hebdomadaire</h2>
            </div>

            <span style={styles.memberPill}>
              {selectedMember?.name || "Sélectionnez un membre"}
            </span>
          </div>

          {!selectedMemberId ? (
            <p style={styles.emptyText}>
              Sélectionnez un membre pour voir son planning.
            </p>
          ) : (
            <div className="calendar-grid" style={styles.calendarGrid}>
              {dayOptions.map((day) => {
                const dayRules = groupedRules[day.value] || [];

                return (
                  <div
                    key={day.value}
                    className="day-column"
                    style={styles.dayColumn}
                  >
                    <div style={styles.dayHeader}>
                      <span style={styles.dayShort}>{day.short}</span>
                      <span style={styles.dayLabel}>{day.label}</span>
                    </div>

                    <div style={styles.dayBody}>
                      {dayRules.length > 0 ? (
                        dayRules.map((rule) => {
                          const theme = getPositionTheme(rule.position_label);

                          return (
                            <div
                              key={rule.id}
                              style={{
                                ...styles.ruleCard,
                                backgroundColor: theme.backgroundColor,
                                borderColor: theme.borderColor,
                                color: theme.color,
                              }}
                            >
                              <p style={styles.ruleTime}>
                                {formatTime(rule.start_time)} →{" "}
                                {formatTime(rule.end_time)}
                              </p>

                              <p style={styles.rulePosition}>
                                {rule.position_label}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div style={styles.emptyDayBox}>
                          <span style={styles.emptyDayTitle}>Libre</span>
                          <span style={styles.emptyDayText}>
                            Aucune routine prévue
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bottom-grid" style={styles.bottomGrid}>
          <div className="planning-card" style={styles.formPanel}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionKicker}>Nouvelle routine</p>
                <h2 style={styles.sectionTitle}>Planifier une présence</h2>
              </div>
            </div>

            <p style={styles.formIntro}>
              Choisissez un membre, une date et un lieu. Where O’Clock placera
              automatiquement la routine au bon jour de la semaine.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>
                Membre
                <select
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Choisir un membre</option>
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

              <label style={styles.label}>
                Jour détecté
                <input
                  type="text"
                  value={
                    dayOptions.find(
                      (day) => day.value === Number(formData.dayOfWeek)
                    )?.label || ""
                  }
                  readOnly
                  placeholder="Choisi automatiquement"
                  style={{
                    ...styles.input,
                    backgroundColor: "#FDF6EC",
                    color: "#8B6A4A",
                  }}
                />
              </label>

              <div className="time-grid" style={styles.timeGrid}>
                <label style={styles.label}>
                  Début
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Fin
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </label>
              </div>

              <label style={styles.label}>
                Position sur l’horloge
                <select
                  name="positionId"
                  value={formData.positionId}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Choisir une position</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      P{getPositionNumber(position)} -{" "}
                      {getPositionLabel(position)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="planning-button"
                style={styles.primaryButton}
              >
                Ajouter au planning
              </button>
            </form>
          </div>

          <div className="planning-card" style={styles.rulesPanel}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionKicker}>Détails</p>
                <h2 style={styles.sectionTitle}>Routines enregistrées</h2>
              </div>
            </div>

            {!selectedMemberId ? (
              <p style={styles.emptyText}>
                Sélectionnez un membre pour voir ses routines.
              </p>
            ) : rules.length === 0 ? (
              <div style={styles.emptySummary}>
                <p style={styles.emptyTitle}>Aucune routine</p>
                <p style={styles.emptyText}>
                  Le planning détaillé apparaîtra ici après l’ajout d’une
                  première routine.
                </p>
              </div>
            ) : (
              <div style={styles.routinesList}>
                {rules.map((rule) => {
                  const theme = getPositionTheme(rule.position_label);

                  return (
                    <div
                      key={rule.id}
                      className="routine-row routine-row-layout"
                      style={styles.routineRow}
                    >
                      <div style={styles.routineDay}>
                        {getDayLabel(rule.day_of_week)}
                      </div>

                      <div style={styles.routineMain}>
                        <strong>
                          {formatTime(rule.start_time)} →{" "}
                          {formatTime(rule.end_time)}
                        </strong>

                        <span
                          style={{
                            ...styles.positionBadge,
                            backgroundColor: theme.backgroundColor,
                            borderColor: theme.borderColor,
                            color: theme.color,
                          }}
                        >
                          {rule.position_label}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="planning-button"
                        style={styles.deleteButton}
                      >
                        Supprimer
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "transparent",
    padding: "34px 22px 70px",
    fontFamily: "'Quicksand', 'Inter', Arial, sans-serif",
    color: "#4A443F",
  },

  container: {
    maxWidth: "1220px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  hero: {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(250,241,226,0.88))",
    border: "1px solid #E6D6BF",
    borderRadius: "32px",
    padding: "24px 28px",
    boxShadow: "0 24px 60px rgba(125, 107, 93, 0.12)",
    marginBottom: "24px",
    backdropFilter: "blur(6px)",
  },

  heroContent: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: "20px",
    alignItems: "center",
  },

  heroText: {
    textAlign: "center",
    paddingRight: "150px",
  },

  title: {
    fontSize: "40px",
    color: "#6E5A4A",
    margin: 0,
    fontWeight: "900",
    lineHeight: "1.1",
  },

  subtitle: {
    color: "#A68A64",
    fontSize: "15px",
    letterSpacing: "1px",
    margin: "8px 0 0",
    fontWeight: "600",
  },

  backBtn: {
    border: "1px solid #D2B48C",
    backgroundColor: "#FFFFFF",
    color: "#7D6B5D",
    padding: "12px 18px",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(125, 107, 93, 0.12)",
  },

  summaryPanel: {
    background:
      "linear-gradient(135deg, rgba(255,248,234,0.94), rgba(255,255,255,0.86))",
    border: "1px solid #D2B48C",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
    marginBottom: "24px",
  },

  summaryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "18px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  },

  summaryBox: {
    backgroundColor: "rgba(255,255,255,0.78)",
    border: "1px solid #E6D6BF",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  summaryValue: {
    color: "#6E5A4A",
    fontSize: "30px",
    fontWeight: "900",
    lineHeight: "1",
  },

  summaryLabel: {
    color: "#8B6A4A",
    fontSize: "13px",
    fontWeight: "800",
  },

  nextRoutineBox: {
    backgroundColor: "#FFFCF7",
    border: "1px solid #E6D6BF",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  nextRoutineLabel: {
    color: "#A68A64",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  nextRoutineText: {
    color: "#6E5A4A",
    fontSize: "14px",
    fontWeight: "900",
    lineHeight: "1.4",
  },

  memberSelect: {
    minWidth: "210px",
    padding: "12px 14px",
    borderRadius: "16px",
    border: "1px solid #D2B48C",
    backgroundColor: "#FFFFFF",
    color: "#7D6B5D",
    fontWeight: "900",
    outline: "none",
  },

  calendarPanel: {
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "1px solid #E6D6BF",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
    marginBottom: "24px",
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "0.85fr 1.15fr",
    gap: "24px",
    alignItems: "start",
  },

  formPanel: {
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "1px solid #E6D6BF",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
  },

  rulesPanel: {
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "1px solid #E6D6BF",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },

  sectionKicker: {
    margin: 0,
    color: "#A68A64",
    fontWeight: "900",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },

  sectionTitle: {
    margin: "4px 0 0",
    color: "#6E5A4A",
    fontSize: "26px",
    fontWeight: "900",
  },

  formIntro: {
    margin: "-6px 0 18px",
    color: "#8B6A4A",
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: "1.6",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    fontWeight: "900",
    color: "#7D6B5D",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    fontSize: "15px",
    borderRadius: "14px",
    border: "1px solid #E6D6BF",
    backgroundColor: "#FFFFFF",
    color: "#4A443F",
    outline: "none",
    boxSizing: "border-box",
  },

  timeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  primaryButton: {
    marginTop: "4px",
    border: "none",
    backgroundColor: "#8DAA91",
    color: "#FFFFFF",
    padding: "14px 22px",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(141, 170, 145, 0.28)",
  },

  memberPill: {
    backgroundColor: "#F1DEC0",
    color: "#80552D",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "10px",
  },

  dayColumn: {
    border: "1px solid #E6D6BF",
    borderRadius: "20px",
    overflow: "hidden",
    minHeight: "230px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#FFFCF7",
  },

  dayHeader: {
    padding: "14px",
    borderBottom: "1px solid #E6D6BF",
    backgroundColor: "#FDF6EC",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  dayShort: {
    color: "#80552D",
    fontSize: "18px",
    fontWeight: "900",
  },

  dayLabel: {
    color: "#A68A64",
    fontSize: "12px",
    fontWeight: "800",
  },

  dayBody: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1,
  },

  ruleCard: {
    border: "1px solid #D2B48C",
    borderRadius: "14px",
    padding: "10px",
    boxShadow: "0 8px 16px rgba(125, 107, 93, 0.08)",
  },

  ruleTime: {
    margin: 0,
    fontWeight: "900",
    fontSize: "13px",
  },

  rulePosition: {
    margin: "5px 0 0",
    fontWeight: "800",
    fontSize: "13px",
  },

  emptyDayBox: {
    border: "1px dashed #E6D6BF",
    borderRadius: "14px",
    padding: "12px",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  emptyDayTitle: {
    color: "#A68A64",
    fontWeight: "900",
    fontSize: "13px",
  },

  emptyDayText: {
    color: "#B49A78",
    fontSize: "12px",
    fontWeight: "700",
  },

  routinesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  routineRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr auto",
    gap: "14px",
    alignItems: "center",
    backgroundColor: "#FFFCF7",
    border: "1px solid #E6D6BF",
    borderRadius: "18px",
    padding: "14px",
  },

  routineDay: {
    color: "#80552D",
    backgroundColor: "#F1DEC0",
    borderRadius: "14px",
    padding: "10px",
    textAlign: "center",
    fontWeight: "900",
  },

  routineMain: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#6E5A4A",
  },

  positionBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid",
    fontSize: "13px",
    fontWeight: "900",
  },

  deleteButton: {
    border: "1px solid #E6D6BF",
    backgroundColor: "#FFFFFF",
    color: "#A15C4B",
    padding: "10px 14px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  emptySummary: {
    marginTop: "8px",
    padding: "18px",
    borderRadius: "20px",
    backgroundColor: "#FFFCF7",
    border: "1px dashed #D2B48C",
  },

  emptyTitle: {
    margin: 0,
    color: "#6E5A4A",
    fontWeight: "900",
    fontSize: "18px",
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#8B6A4A",
    fontWeight: "700",
    lineHeight: "1.5",
  },

  toast: {
    position: "fixed",
    top: "22px",
    right: "22px",
    backgroundColor: "#8DAA91",
    color: "#FFFFFF",
    padding: "14px 22px",
    borderRadius: "16px",
    zIndex: 1000,
    fontWeight: "900",
    boxShadow: "0 14px 34px rgba(0,0,0,0.16)",
  },
};

export default PlanningPage;