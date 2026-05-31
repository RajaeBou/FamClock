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

const planningModeOptions = [
  {
    value: "manual_only",
    label: "Manuel uniquement",
    description: "Le parent ajoute les règles lui-même dans WereO’clock.",
  },
  {
    value: "external_only",
    label: "Calendrier externe uniquement",
    description: "Le planning vient de Google Calendar ou Outlook.",
  },
  {
    value: "hybrid",
    label: "Manuel + calendrier externe",
    description:
      "Le parent peut combiner le manuel avec Google Calendar ou Outlook.",
  },
];

const sourceLabels = {
  manual: "Manuel",
  google: "Google Calendar",
  outlook: "Outlook",
};

const getPositionNumber = (position) =>
  position?.positionNumber ?? position?.position_number ?? "-";

const getPositionLabel = (position) => position?.label || "Position";

const formatTime = (time) => {
  if (!time) return "--:--";
  return String(time).slice(0, 5);
};

const getDayLabel = (dayValue) =>
  dayOptions.find((day) => day.value === Number(dayValue))?.label || dayValue;

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
  const [conflicts, setConflicts] = useState([]);

  const [calendarConnections, setCalendarConnections] = useState({
    google: { connected: false },
    outlook: { connected: false },
  });

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
    title: "",
    planningMode: "manual_only",
    provider: "none",
    source: "manual",
  });

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId),
    [members, selectedMemberId]
  );

  const isSelectedMemberParent = Boolean(
    selectedMember?.role?.toLowerCase?.().includes("parent")
  );

  const isManualOnly = formData.planningMode === "manual_only";
  const isExternalOnly = formData.planningMode === "external_only";
  const isHybrid = formData.planningMode === "hybrid";

  const showExternalProvider =
    isSelectedMemberParent && (isExternalOnly || isHybrid);

  const showManualForm = !isSelectedMemberParent || isManualOnly || isHybrid;

  const selectedPlanningMode = planningModeOptions.find(
    (mode) => mode.value === formData.planningMode
  );

  const displayedPlanningModeLabel = isSelectedMemberParent
    ? selectedPlanningMode?.label
    : "Manuel uniquement";

  const clearMessageAfterDelay = () => {
    setTimeout(() => setMessage(""), 3500);
  };

  const refreshCalendarStatus = async () => {
    if (!familyId) return;

    try {
      const response = await api.get(`/calendar-auth/status/${familyId}`);

      setCalendarConnections(
        response.data.connections || {
          google: { connected: false },
          outlook: { connected: false },
        }
      );
    } catch (error) {
      console.warn("Statut calendrier non chargé :", error);
    }
  };

  const refreshRules = async (memberId) => {
    if (!memberId) {
      setRules([]);
      setConflicts([]);
      return;
    }

    try {
      const response = await api.get(`/schedule-rules/${memberId}`);
      setRules(response.data.rules || []);

      try {
        const conflictResponse = await api.get(
          `/schedule-rules/conflicts/${memberId}`
        );
        setConflicts(conflictResponse.data.conflicts || []);
      } catch (conflictError) {
        console.warn("Conflits non chargés :", conflictError);
        setConflicts([]);
      }
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du chargement du planning");
      clearMessageAfterDelay();
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!familyId) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);

        const [membersResponse, positionsResponse] = await Promise.all([
          api.get(`/members/family/${familyId}`),
          api.get(`/clock-positions/family/${familyId}`),
        ]);

        const loadedMembers =
          membersResponse.data.data || membersResponse.data.members || [];

        const loadedPositions =
          positionsResponse.data.data || positionsResponse.data.positions || [];

        const sortedPositions = [...loadedPositions].sort((a, b) => {
          const numberA = Number(getPositionNumber(a));
          const numberB = Number(getPositionNumber(b));

          if (Number.isNaN(numberA) || Number.isNaN(numberB)) return 0;
          return numberA - numberB;
        });

        setMembers(loadedMembers);
        setPositions(sortedPositions);

        if (loadedMembers.length > 0) {
          const firstMember = loadedMembers[0];

          setSelectedMemberId(firstMember.id);

          setFormData((prev) => ({
            ...prev,
            memberId: firstMember.id,
          }));

          await refreshRules(firstMember.id);
        }

        if (sortedPositions.length > 0) {
          setFormData((prev) => ({
            ...prev,
            positionId: sortedPositions[0].id,
          }));
        }

        try {
          const settingsResponse = await api.get(
            `/schedule-rules/settings/${familyId}`
          );

          const settings = settingsResponse.data.settings;

          if (settings) {
            setFormData((prev) => ({
              ...prev,
              planningMode: settings.planning_mode || "manual_only",
              provider: settings.provider || "none",
              source:
                settings.planning_mode === "external_only"
                  ? settings.provider || "google"
                  : "manual",
            }));
          }
        } catch (settingsError) {
          console.warn("Paramètres planning non chargés :", settingsError);
        }

        await refreshCalendarStatus();

        const params = new URLSearchParams(window.location.search);
        const connected = params.get("connected");
        const provider = params.get("provider");

        if (connected === "true" && provider) {
          setMessage(
            `${sourceLabels[provider] || provider} connecté avec succès`
          );
          window.history.replaceState({}, "", window.location.pathname);
          clearMessageAfterDelay();
        }

        if (connected === "false" && provider) {
          setMessage(
            `Erreur lors de la connexion ${
              sourceLabels[provider] || provider
            }`
          );
          window.history.replaceState({}, "", window.location.pathname);
          clearMessageAfterDelay();
        }
      } catch (error) {
        console.error(error);
        setMessage("Erreur lors du chargement des données");
        clearMessageAfterDelay();
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [familyId, navigate]);

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
      const dayA = dayOrder.indexOf(Number(a.day_of_week));
      const dayB = dayOrder.indexOf(Number(b.day_of_week));

      if (dayA !== dayB) return dayA - dayB;

      return String(a.start_time).localeCompare(String(b.start_time));
    });

    return sorted[0];
  }, [rules]);

  const getDisplayedDay = () => {
    if (formData.dayOfWeek === "") return "";

    return (
      dayOptions.find((day) => day.value === Number(formData.dayOfWeek))
        ?.label || ""
    );
  };

  const getFinalSource = () => {
    if (!isSelectedMemberParent) {
      return "manual";
    }

    if (isManualOnly) {
      return "manual";
    }

    if (isExternalOnly) {
      return formData.provider === "none" ? "google" : formData.provider;
    }

    return formData.source || "manual";
  };

  const getFinalProvider = () => {
    if (!isSelectedMemberParent) {
      return "none";
    }

    if (isManualOnly) {
      return "none";
    }

    return formData.provider === "none" ? "google" : formData.provider;
  };

  const isSelectedProviderConnected = () => {
    const provider = getFinalProvider();

    if (provider === "none") {
      return false;
    }

    return Boolean(calendarConnections[provider]?.connected);
  };

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
      const nextMember = members.find((member) => member.id === value);

      const nextMemberIsParent = Boolean(
        nextMember?.role?.toLowerCase?.().includes("parent")
      );

      setSelectedMemberId(value);

      setFormData((prev) => ({
        ...prev,
        memberId: value,
        planningMode: nextMemberIsParent ? prev.planningMode : "manual_only",
        provider: nextMemberIsParent ? prev.provider : "none",
        source: nextMemberIsParent ? prev.source : "manual",
      }));

      refreshRules(value);
      return;
    }

    if (name === "planningMode") {
      if (value === "manual_only") {
        setFormData((prev) => ({
          ...prev,
          planningMode: value,
          provider: "none",
          source: "manual",
        }));
        return;
      }

      if (value === "external_only") {
        setFormData((prev) => ({
          ...prev,
          planningMode: value,
          provider: prev.provider === "none" ? "google" : prev.provider,
          source: prev.provider === "none" ? "google" : prev.provider,
        }));
        return;
      }

      if (value === "hybrid") {
        setFormData((prev) => ({
          ...prev,
          planningMode: value,
          provider: prev.provider === "none" ? "google" : prev.provider,
          source: "manual",
        }));
        return;
      }
    }

    if (name === "provider") {
      setFormData((prev) => ({
        ...prev,
        provider: value,
        source: prev.planningMode === "external_only" ? value : prev.source,
      }));
      return;
    }

    if (name === "source") {
      setFormData((prev) => ({
        ...prev,
        source: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setMessage("");

    if (!isSelectedMemberParent) {
      setMessage(
        "Les calendriers Google Calendar et Outlook sont réservés aux parents."
      );
      clearMessageAfterDelay();
      return;
    }

    try {
      await api.put(`/schedule-rules/settings/${familyId}`, {
        planningMode: formData.planningMode,
        provider: getFinalProvider(),
        syncEnabled: formData.planningMode !== "manual_only",
      });

      setMessage("Mode de planification enregistré");
      clearMessageAfterDelay();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erreur lors de l’enregistrement du mode de planification"
      );
      clearMessageAfterDelay();
    }
  };

  const handleConnectCalendar = (provider) => {
    if (!isSelectedMemberParent) {
      setMessage(
        "Les calendriers Google Calendar et Outlook sont réservés aux parents."
      );
      clearMessageAfterDelay();
      return;
    }

    const baseUrl = (api.defaults.baseURL || "http://localhost:3000/api").replace(
      /\/$/,
      ""
    );

    window.location.href = `${baseUrl}/calendar-auth/${provider}/connect?familyId=${familyId}`;
  };

  const handleImportCalendar = async () => {
    setMessage("");

    if (!isSelectedMemberParent) {
      setMessage("L'import de calendrier est réservé aux parents.");
      clearMessageAfterDelay();
      return;
    }

    const provider = getFinalProvider();

    if (provider === "none") {
      setMessage("Choisis d'abord Google Calendar ou Outlook");
      clearMessageAfterDelay();
      return;
    }

    if (!formData.memberId || !formData.positionId) {
      setMessage(
        "Choisis un membre et une position horloge par défaut pour la synchronisation"
      );
      clearMessageAfterDelay();
      return;
    }

    if (!calendarConnections[provider]?.connected) {
      setMessage(`Connecte d'abord ${sourceLabels[provider]}`);
      clearMessageAfterDelay();
      return;
    }

    try {
      const response = await api.post(`/calendar-auth/${provider}/import`, {
        familyId,
        memberId: formData.memberId,
        positionId: formData.positionId,
        days: 7,
      });

      setMessage(
        `${sourceLabels[provider]} synchronisé : ${
          response.data.imported || 0
        } ajouté(s), ${response.data.updated || 0} mis à jour, ${
          response.data.deleted || 0
        } supprimé(s), ${response.data.conflicts || 0} conflit(s)`
      );

      await refreshRules(formData.memberId);
      clearMessageAfterDelay();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          `Erreur lors de la synchronisation ${sourceLabels[provider]}`
      );
      clearMessageAfterDelay();
    }
  };

  const handleDeleteRule = async (rule) => {
    const confirmDelete = window.confirm(
      `Voulez-vous supprimer cette routine ?\n\n${
        rule.title || rule.position_label || "Événement"
      }\n${formatTime(rule.start_time)} → ${formatTime(rule.end_time)}`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/schedule-rules/${rule.id}`);

      setMessage("Routine supprimée");

      await refreshRules(selectedMemberId);
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

  const handleKeepRule = async (rule) => {
    const confirmKeep = window.confirm(
      `Garder cet événement et ignorer les événements en conflit ?\n\n${
        rule.title || rule.position_label || "Événement"
      }\n${formatTime(rule.start_time)} → ${formatTime(rule.end_time)}`
    );

    if (!confirmKeep) return;

    try {
      const response = await api.patch(`/schedule-rules/${rule.id}/keep`);

      setMessage(
        `${rule.title || "Événement"} conservé. ${
          response.data.ignoredRules || 0
        } événement(s) en conflit ignoré(s).`
      );

      await refreshRules(selectedMemberId);
      clearMessageAfterDelay();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erreur lors de la gestion du conflit"
      );
      clearMessageAfterDelay();
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
      clearMessageAfterDelay();
      return;
    }

    const selectedPosition = positions.find(
      (position) => position.id === formData.positionId
    );

    /*
      Vérification côté frontend :
      si une date de référence est choisie, on empêche la création
      d'une routine dont la date et l'heure de début sont déjà passées.
    */
    const selectedDateTime = formData.referenceDate
      ? new Date(`${formData.referenceDate}T${formData.startTime}:00`)
      : null;

    if (selectedDateTime && selectedDateTime < new Date()) {
      setMessage("Impossible de créer un planning dans le passé.");
      clearMessageAfterDelay();
      return;
    }

    try {
      await api.post("/schedule-rules", {
        familyId,
        memberId: formData.memberId,
        dayOfWeek: Number(formData.dayOfWeek),

        // Important : la date est envoyée au backend pour permettre la validation serveur.
        date: formData.referenceDate || null,

        startTime: formData.startTime,
        endTime: formData.endTime,
        positionId: formData.positionId,
        title: formData.title || selectedPosition?.label || null,
        planningMode: isSelectedMemberParent
          ? formData.planningMode
          : "manual_only",
        provider: "none",
        source: "manual",
        externalEventId: null,
      });

      setMessage("Routine ajoutée au planning");

      await refreshRules(formData.memberId);

      setFormData((prev) => ({
        ...prev,
        referenceDate: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        title: "",
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

            .planning-hero-content {
              grid-template-columns: 1fr !important;
            }

            .planning-title-block {
              text-align: left !important;
              padding-right: 0 !important;
            }

            .form-layout {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 900px) {
            .calendar-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .control-grid {
              grid-template-columns: 1fr !important;
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
                  ? `Famille ${familyName} · gérez les routines simplement`
                  : "Gérez les routines simplement"}
              </p>
            </div>
          </div>
        </section>

        <section className="planning-card" style={styles.controlPanel}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionKicker}>Configuration</p>
              <h2 style={styles.sectionTitle}>Source du planning</h2>
            </div>

            <span style={styles.memberPill}>
              {selectedMember?.name || "Aucun membre"}
            </span>
          </div>

          <div className="control-grid" style={styles.controlGrid}>
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
                    {member.name} {member.role ? `(${member.role})` : ""}
                  </option>
                ))}
              </select>
            </label>

            {isSelectedMemberParent && (
              <label style={styles.label}>
                Mode de planification
                <select
                  name="planningMode"
                  value={formData.planningMode}
                  onChange={handleChange}
                  style={styles.input}
                >
                  {planningModeOptions.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {showExternalProvider && (
              <label style={styles.label}>
                Calendrier externe
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook</option>
                </select>
              </label>
            )}

            {!isSelectedMemberParent && (
              <div style={styles.infoBox}>
                Google Calendar et Outlook sont réservés aux parents. Ce membre
                utilise uniquement le planning manuel.
              </div>
            )}
          </div>

          {isSelectedMemberParent && (
            <>
              <p style={styles.helperText}>
                {selectedPlanningMode?.description}
              </p>

              {showExternalProvider && (
                <p style={styles.warningText}>
                  En cas de conflit, la règle manuelle reste prioritaire. Les
                  événements Google ou Outlook sont marqués comme conflit à
                  vérifier.
                </p>
              )}

              <div style={styles.calendarActions}>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="planning-button"
                  style={styles.secondaryButton}
                >
                  Enregistrer le mode
                </button>

                {showExternalProvider && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConnectCalendar(getFinalProvider())}
                      className="planning-button"
                      style={styles.secondaryButton}
                    >
                      Connecter {sourceLabels[getFinalProvider()]}
                    </button>

                    <button
                      type="button"
                      onClick={handleImportCalendar}
                      className="planning-button"
                      style={{
                        ...styles.primarySmallButton,
                        opacity: isSelectedProviderConnected() ? 1 : 0.55,
                        cursor: isSelectedProviderConnected()
                          ? "pointer"
                          : "not-allowed",
                      }}
                      disabled={!isSelectedProviderConnected()}
                    >
                      Synchroniser les événements
                    </button>
                  </>
                )}
              </div>

              {showExternalProvider && (
                <div style={styles.externalStatusBox}>
                  <div>
                    <strong>{sourceLabels[getFinalProvider()]}</strong>
                    <p style={styles.statusText}>
                      {isSelectedProviderConnected()
                        ? `Connecté ${
                            calendarConnections[getFinalProvider()]
                              ?.accountEmail
                              ? `(${
                                  calendarConnections[getFinalProvider()]
                                    ?.accountEmail
                                })`
                              : ""
                          }`
                        : "Non connecté"}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.statusPill,
                      backgroundColor: isSelectedProviderConnected()
                        ? "#EEF5EF"
                        : "#FFF1EF",
                      color: isSelectedProviderConnected()
                        ? "#4F7456"
                        : "#9A5C51",
                      borderColor: isSelectedProviderConnected()
                        ? "#C7DDCB"
                        : "#ECC7C1",
                    }}
                  >
                    {isSelectedProviderConnected() ? "Actif" : "À connecter"}
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        <section className="planning-card" style={styles.summaryPanel}>
          <div className="summary-grid" style={styles.summaryGrid}>
            <div style={styles.summaryBox}>
              <span style={styles.summaryValue}>{rules.length}</span>
              <span style={styles.summaryLabel}>événement(s)</span>
            </div>

            <div style={styles.summaryBox}>
              <span style={styles.summaryValue}>{totalPlannedTime}</span>
              <span style={styles.summaryLabel}>temps planifié</span>
            </div>

            <div style={styles.summaryBox}>
              <span style={styles.summaryValue}>
                {conflicts.length > 0 ? conflicts.length : "OK"}
              </span>
              <span style={styles.summaryLabel}>conflit(s)</span>
            </div>

            <div style={styles.summaryBox}>
              <span style={styles.summaryValueSmall}>
                {displayedPlanningModeLabel}
              </span>
              <span style={styles.summaryLabel}>mode actuel</span>
            </div>
          </div>

          <div style={styles.nextRoutineBoxFull}>
            <span style={styles.nextRoutineLabel}>Prochaine routine</span>

            {nextRoutine ? (
              <span style={styles.nextRoutineText}>
                {getDayLabel(nextRoutine.day_of_week)} ·{" "}
                {formatTime(nextRoutine.start_time)} →{" "}
                {formatTime(nextRoutine.end_time)} ·{" "}
                {nextRoutine.title || nextRoutine.position_label}
              </span>
            ) : (
              <span style={styles.nextRoutineText}>
                Aucune routine enregistrée
              </span>
            )}
          </div>

          {conflicts.length > 0 && (
            <div style={styles.conflictBox}>
              <h3 style={styles.conflictTitle}>Conflits à vérifier</h3>

              {conflicts.map((conflict) => (
                <div key={conflict.id} style={styles.conflictItem}>
                  <strong>{conflict.title || "Événement sans titre"}</strong>
                  <br />
                  {sourceLabels[conflict.source] || conflict.source} —{" "}
                  {formatTime(conflict.start_time)} →{" "}
                  {formatTime(conflict.end_time)}
                  <br />
                  Position horloge :{" "}
                  {conflict.position_label || "Position inconnue"}
                  <button
                    type="button"
                    onClick={() => handleKeepRule(conflict)}
                    className="planning-button"
                    style={styles.keepButton}
                  >
                    Garder cet événement
                  </button>
                </div>
              ))}
            </div>
          )}
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

          {loading ? (
            <p style={styles.emptyText}>Chargement du planning...</p>
          ) : !selectedMemberId ? (
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
                                borderColor:
                                  rule.conflict_status === "conflict"
                                    ? "#D88C35"
                                    : theme.borderColor,
                                color: theme.color,
                              }}
                            >
                              <p style={styles.ruleTime}>
                                {formatTime(rule.start_time)} →{" "}
                                {formatTime(rule.end_time)}
                              </p>

                              <p style={styles.ruleTitle}>
                                {rule.title ||
                                  rule.position_label ||
                                  "Événement"}
                              </p>

                              <p style={styles.rulePosition}>
                                Horloge : {rule.position_label || "Non définie"}
                              </p>

                              <div style={styles.badgeRow}>
                                <span style={styles.sourceBadge}>
                                  {sourceLabels[rule.source] || "Manuel"}
                                </span>

                                {rule.conflict_status === "conflict" && (
                                  <span style={styles.conflictBadge}>
                                    Conflit
                                  </span>
                                )}
                              </div>

                              {rule.conflict_status === "conflict" && (
                                <button
                                  type="button"
                                  onClick={() => handleKeepRule(rule)}
                                  className="planning-button"
                                  style={styles.keepButton}
                                >
                                  Garder celui-ci
                                </button>
                              )}
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

        {showManualForm && (
          <section className="planning-card" style={styles.formPanel}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionKicker}>Nouvelle routine</p>
                <h2 style={styles.sectionTitle}>Ajouter manuellement</h2>
              </div>
            </div>

            <p style={styles.formIntro}>
              Choisissez une date, une heure et une position sur l’horloge. Le
              titre de l’événement peut être différent de la position.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-layout" style={styles.formLayout}>
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
                    value={getDisplayedDay()}
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
                  Position horloge
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

              </div>

              <button
                type="submit"
                className="planning-button"
                style={styles.primaryButton}
              >
                Ajouter au planning
              </button>
            </form>
          </section>
        )}

        <section className="planning-card" style={styles.rulesPanel}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionKicker}>Détails</p>
              <h2 style={styles.sectionTitle}>Événements enregistrés</h2>
            </div>
          </div>

          {!selectedMemberId ? (
            <p style={styles.emptyText}>
              Sélectionnez un membre pour voir ses événements.
            </p>
          ) : rules.length === 0 ? (
            <div style={styles.emptySummary}>
              <p style={styles.emptyTitle}>Aucun événement</p>
              <p style={styles.emptyText}>
                Les événements Google, Outlook ou les routines manuelles
                apparaîtront ici.
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
                    style={{
                      ...styles.routineRow,
                      borderColor:
                        rule.conflict_status === "conflict"
                          ? "#D88C35"
                          : "#E6D6BF",
                    }}
                  >
                    <div style={styles.routineDay}>
                      {getDayLabel(rule.day_of_week)}
                    </div>

                    <div style={styles.routineMain}>
                      <strong>
                        {formatTime(rule.start_time)} →{" "}
                        {formatTime(rule.end_time)}
                      </strong>

                      <span style={styles.routineTitle}>
                        {rule.title || "Événement"}
                      </span>

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

                      <span style={styles.routineMeta}>
                        {sourceLabels[rule.source] || "Manuel"} ·{" "}
                        {rule.conflict_status === "conflict" ? "Conflit" : "OK"}
                      </span>
                    </div>

                    <div style={styles.actionColumn}>
                      {rule.conflict_status === "conflict" && (
                        <button
                          type="button"
                          onClick={() => handleKeepRule(rule)}
                          className="planning-button"
                          style={styles.keepButton}
                        >
                          Garder
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule)}
                        className="planning-button"
                        style={styles.deleteButton}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
    maxWidth: "1180px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  hero: {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(250,241,226,0.9))",
    border: "1px solid #E6D6BF",
    borderRadius: "28px",
    padding: "22px 26px",
    boxShadow: "0 22px 50px rgba(125, 107, 93, 0.12)",
    marginBottom: "20px",
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
    fontSize: "38px",
    color: "#6E5A4A",
    margin: 0,
    fontWeight: "900",
    lineHeight: "1.1",
  },

  subtitle: {
    color: "#A68A64",
    fontSize: "14px",
    letterSpacing: "0.8px",
    margin: "8px 0 0",
    fontWeight: "700",
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

  controlPanel: {
    backgroundColor: "rgba(255,255,255,0.93)",
    border: "1px solid #E6D6BF",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 18px 42px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
    marginBottom: "20px",
  },

  controlGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    alignItems: "end",
  },

  calendarActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px",
  },

  externalStatusBox: {
    marginTop: "16px",
    border: "1px solid #E6D6BF",
    borderRadius: "18px",
    padding: "14px 16px",
    backgroundColor: "#FFFCF7",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
  },

  statusText: {
    margin: "4px 0 0",
    color: "#8B6A4A",
    fontSize: "13px",
    fontWeight: "700",
  },

  statusPill: {
    border: "1px solid",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  summaryPanel: {
    background:
      "linear-gradient(135deg, rgba(255,248,234,0.96), rgba(255,255,255,0.9))",
    border: "1px solid #D2B48C",
    borderRadius: "26px",
    padding: "22px",
    boxShadow: "0 18px 42px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
    marginBottom: "20px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  },

  summaryBox: {
    backgroundColor: "rgba(255,255,255,0.8)",
    border: "1px solid #E6D6BF",
    borderRadius: "20px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  summaryValue: {
    color: "#6E5A4A",
    fontSize: "28px",
    fontWeight: "900",
    lineHeight: "1",
  },

  summaryValueSmall: {
    color: "#6E5A4A",
    fontSize: "18px",
    fontWeight: "900",
    lineHeight: "1.2",
  },

  summaryLabel: {
    color: "#8B6A4A",
    fontSize: "12px",
    fontWeight: "800",
  },

  nextRoutineBoxFull: {
    marginTop: "14px",
    backgroundColor: "#FFFCF7",
    border: "1px solid #E6D6BF",
    borderRadius: "20px",
    padding: "15px",
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

  calendarPanel: {
    backgroundColor: "rgba(255,255,255,0.93)",
    border: "1px solid #E6D6BF",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 18px 42px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
    marginBottom: "20px",
  },

  formPanel: {
    backgroundColor: "rgba(255,255,255,0.93)",
    border: "1px solid #E6D6BF",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 18px 42px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
    marginBottom: "20px",
  },

  rulesPanel: {
    backgroundColor: "rgba(255,255,255,0.93)",
    border: "1px solid #E6D6BF",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 18px 42px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
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
    fontSize: "24px",
    fontWeight: "900",
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

  formIntro: {
    margin: "-6px 0 18px",
    color: "#8B6A4A",
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: "1.6",
  },

  formLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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

  helperText: {
    margin: "10px 0 0",
    color: "#8B6A4A",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "1.5",
  },

  warningText: {
    margin: "12px 0 0",
    color: "#9A6B38",
    fontSize: "13px",
    fontWeight: "800",
    lineHeight: "1.5",
  },

  infoBox: {
    border: "1px solid #E6D6BF",
    backgroundColor: "#FFFCF7",
    color: "#7D6B5D",
    borderRadius: "16px",
    padding: "13px",
    fontSize: "13px",
    fontWeight: "800",
    lineHeight: "1.5",
  },

  timeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  primaryButton: {
    marginTop: "18px",
    border: "none",
    backgroundColor: "#8DAA91",
    color: "#FFFFFF",
    padding: "14px 22px",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(141, 170, 145, 0.28)",
  },

  primarySmallButton: {
    border: "none",
    backgroundColor: "#8DAA91",
    color: "#FFFFFF",
    padding: "11px 16px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(141, 170, 145, 0.22)",
  },

  secondaryButton: {
    border: "1px solid #D2B48C",
    backgroundColor: "#FFFFFF",
    color: "#7D6B5D",
    padding: "11px 16px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
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
    minHeight: "245px",
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

  ruleTitle: {
    margin: "6px 0 3px",
    fontWeight: "900",
    fontSize: "14px",
  },

  rulePosition: {
    margin: "0 0 8px",
    fontWeight: "800",
    fontSize: "12px",
    opacity: 0.85,
  },

  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "6px",
  },

  sourceBadge: {
    display: "inline-block",
    border: "1px solid rgba(125, 107, 93, 0.35)",
    borderRadius: "999px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "900",
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  conflictBadge: {
    display: "inline-block",
    border: "1px solid #D88C35",
    borderRadius: "999px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "900",
    color: "#A15C00",
    backgroundColor: "#FFF3DF",
  },

  keepButton: {
    display: "block",
    marginTop: "8px",
    marginBottom: "6px",
    padding: "7px 10px",
    cursor: "pointer",
    border: "1px solid #8DAA91",
    borderRadius: "12px",
    backgroundColor: "#EEF5EF",
    color: "#4F7456",
    fontSize: "12px",
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

  routineTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#7D6B5D",
  },

  routineMeta: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#A68A64",
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

  actionColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "8px",
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

  conflictBox: {
    marginTop: "18px",
    border: "1px solid #D88C35",
    borderRadius: "20px",
    padding: "14px",
    backgroundColor: "#FFF7EA",
  },

  conflictTitle: {
    margin: "0 0 8px",
    color: "#A15C00",
    fontWeight: "900",
  },

  conflictItem: {
    padding: "12px",
    borderTop: "1px solid rgba(216,140,53,0.35)",
    color: "#7D5A37",
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