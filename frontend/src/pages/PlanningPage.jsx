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

function PlanningPage() {
  const familyId = localStorage.getItem("familyId");

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

  const selectedMember = members.find(
    (member) => member.id === selectedMemberId
  );

  const isSelectedMemberParent = Boolean(
    selectedMember?.role?.toLowerCase?.().includes("parent")
  );

  const selectedPlanningMode = planningModeOptions.find(
    (mode) => mode.value === formData.planningMode
  );

  const displayedPlanningModeLabel = isSelectedMemberParent
    ? selectedPlanningMode?.label
    : "Manuel uniquement";

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
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [membersResponse, positionsResponse] = await Promise.all([
          api.get(`/members/family/${familyId}`),
          api.get(`/clock-positions/family/${familyId}`),
        ]);

        const loadedMembers =
          membersResponse.data.data || membersResponse.data.members || [];

        const loadedPositions =
          positionsResponse.data.data || positionsResponse.data.positions || [];

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
        }

        if (connected === "false" && provider) {
          setMessage(
            `Erreur lors de la connexion ${
              sourceLabels[provider] || provider
            }`
          );
          window.history.replaceState({}, "", window.location.pathname);
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
    refreshRules(selectedMemberId);
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

    if (formData.planningMode === "manual_only") {
      return "manual";
    }

    if (formData.planningMode === "external_only") {
      return formData.provider === "none" ? "google" : formData.provider;
    }

    return formData.source || "manual";
  };

  const getFinalProvider = () => {
    if (!isSelectedMemberParent) {
      return "none";
    }

    if (formData.planningMode === "manual_only") {
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
      return;
    }

    try {
      await api.put(`/schedule-rules/settings/${familyId}`, {
        planningMode: formData.planningMode,
        provider: getFinalProvider(),
        syncEnabled: formData.planningMode !== "manual_only",
      });

      setMessage("Mode de planification enregistré");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Erreur lors de l’enregistrement du mode de planification"
      );
    }
  };

  const handleConnectCalendar = (provider) => {
    if (!isSelectedMemberParent) {
      setMessage(
        "Les calendriers Google Calendar et Outlook sont réservés aux parents."
      );
      return;
    }

    const baseUrl = api.defaults.baseURL || "http://localhost:3000/api";

    window.location.href = `${baseUrl}/calendar-auth/${provider}/connect?familyId=${familyId}`;
  };

  const handleImportCalendar = async () => {
    setMessage("");

    if (!isSelectedMemberParent) {
      setMessage("L'import de calendrier est réservé aux parents.");
      return;
    }

    const provider = getFinalProvider();

    if (provider === "none") {
      setMessage("Choisis d'abord Google Calendar ou Outlook");
      return;
    }

    if (!formData.memberId || !formData.positionId) {
      setMessage(
        "Choisis un membre et une position horloge par défaut pour la synchronisation"
      );
      return;
    }

    if (!calendarConnections[provider]?.connected) {
      setMessage(`Connecte d'abord ${sourceLabels[provider]}`);
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
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          `Erreur lors de la synchronisation ${sourceLabels[provider]}`
      );
    }
  };

  const handleDeleteRule = async (rule) => {
    const confirmDelete = window.confirm(
      `Supprimer cette règle ?\n\n${
        rule.title || rule.position_label || "Événement"
      }\n${rule.start_time} → ${rule.end_time}`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/schedule-rules/${rule.id}`);

      setMessage("Règle supprimée avec succès");

      await refreshRules(selectedMemberId);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handleKeepRule = async (rule) => {
    const confirmKeep = window.confirm(
      `Garder cet événement et ignorer les événements en conflit ?\n\n${
        rule.title || rule.position_label || "Événement"
      }\n${rule.start_time} → ${rule.end_time}`
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
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message || "Erreur lors de la gestion du conflit"
      );
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

    const finalSource = getFinalSource();
    const finalProvider = getFinalProvider();

    const selectedPosition = positions.find(
      (position) => position.id === formData.positionId
    );

    try {
      await api.post("/schedule-rules", {
        familyId,
        memberId: formData.memberId,
        dayOfWeek: Number(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        positionId: formData.positionId,
        title: formData.title || selectedPosition?.label || null,
        planningMode: isSelectedMemberParent
          ? formData.planningMode
          : "manual_only",
        provider: finalProvider,
        source: finalSource,
        externalEventId:
          finalSource !== "manual" ? `${finalSource}_${Date.now()}` : null,
      });

      setMessage("Règle ajoutée avec succès");

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

      {isSelectedMemberParent && (
        <div style={styles.modePanel}>
          <h2>Source du planning</h2>

          <div style={styles.modeGrid}>
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

            {formData.planningMode !== "manual_only" && (
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

            {formData.planningMode === "hybrid" && (
              <label style={styles.label}>
                Source de cette règle
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="manual">Manuel</option>
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook</option>
                </select>
              </label>
            )}
          </div>

          <p style={styles.helperText}>{selectedPlanningMode?.description}</p>

          <p style={styles.warningText}>
            En cas de conflit, la règle manuelle reste prioritaire. Les événements
            Google ou Outlook sont marqués comme conflit à vérifier.
          </p>

          <div style={styles.calendarActions}>
            <button
              type="button"
              onClick={handleSaveSettings}
              style={styles.smallButton}
            >
              Enregistrer le mode
            </button>

            {formData.planningMode !== "manual_only" && (
              <>
                <button
                  type="button"
                  onClick={() => handleConnectCalendar(getFinalProvider())}
                  style={styles.smallButton}
                >
                  Connecter {sourceLabels[getFinalProvider()]}
                </button>

                <button
                  type="button"
                  onClick={handleImportCalendar}
                  style={styles.smallButton}
                  disabled={!isSelectedProviderConnected()}
                >
                  Synchroniser les événements
                </button>
              </>
            )}
          </div>

          {formData.planningMode !== "manual_only" && (
            <div style={styles.connectionBox}>
              <p>
                <strong>Google Calendar :</strong>{" "}
                {calendarConnections.google?.connected
                  ? `connecté (${
                      calendarConnections.google.accountEmail || "compte Google"
                    })`
                  : "non connecté"}
              </p>

              <p>
                <strong>Outlook :</strong>{" "}
                {calendarConnections.outlook?.connected
                  ? `connecté (${
                      calendarConnections.outlook.accountEmail || "compte Outlook"
                    })`
                  : "non connecté"}
              </p>
            </div>
          )}
        </div>
      )}

      {selectedMemberId && !isSelectedMemberParent && (
        <div style={styles.modePanel}>
          <h2>Planning manuel</h2>
          <p style={styles.helperText}>
            Les calendriers Google Calendar et Outlook sont réservés aux parents.
            Pour un enfant, le planning est ajouté manuellement par le parent.
          </p>
        </div>
      )}

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
                    {member.name} {member.role ? `(${member.role})` : ""}
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
                value={getDisplayedDay()}
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
              Position horloge
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

            <p style={styles.helperText}>
              Cette position correspond à l’emplacement de l’aiguille sur
              l’horloge. Le titre de l’événement peut être différent.
            </p>

            <label style={styles.label}>
              Titre de l’événement
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Exemple : Réunion, École, Sport..."
                style={styles.input}
              />
            </label>

            <div style={styles.currentSourceBox}>
              Source utilisée :{" "}
              <strong>{sourceLabels[getFinalSource()]}</strong>
            </div>

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
                <strong>Rôle :</strong> {selectedMember?.role || "-"}
              </p>
              <p style={styles.summaryLine}>
                <strong>Nombre de règles :</strong> {rules.length}
              </p>
              <p style={styles.summaryLine}>
                <strong>Conflits :</strong> {conflicts.length}
              </p>
              <p style={styles.summaryLine}>
                <strong>Mode :</strong> {displayedPlanningModeLabel}
              </p>
            </div>
          )}

          {conflicts.length > 0 && (
            <div style={styles.conflictBox}>
              <h3>Conflits à vérifier</h3>

              {conflicts.map((conflict) => (
                <div key={conflict.id} style={styles.conflictItem}>
                  <strong>{conflict.title || "Événement sans titre"}</strong>
                  <br />
                  {sourceLabels[conflict.source] || conflict.source} —{" "}
                  {conflict.start_time} → {conflict.end_time}
                  <br />
                  Position horloge :{" "}
                  {conflict.position_label || "Position inconnue"}
                  <button
                    type="button"
                    onClick={() => handleKeepRule(conflict)}
                    style={styles.keepButton}
                  >
                    Garder cet événement
                  </button>
                </div>
              ))}
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

                        <p style={styles.ruleTitle}>
                          {rule.title || rule.position_label || "Événement"}
                        </p>

                        <p style={styles.rulePosition}>
                          Position horloge :{" "}
                          {rule.position_label || "Non définie"}
                        </p>

                        <span style={styles.badge}>
                          {sourceLabels[rule.source] || "Manuel"}
                        </span>

                        {rule.conflict_status === "conflict" && (
                          <span style={styles.conflictBadge}>Conflit</span>
                        )}

                        {rule.conflict_status === "conflict" && (
                          <button
                            type="button"
                            onClick={() => handleKeepRule(rule)}
                            style={styles.keepButton}
                          >
                            Garder celui-ci
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule)}
                          style={styles.deleteSmallButton}
                        >
                          Supprimer
                        </button>
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
                <th style={styles.th}>Événement</th>
                <th style={styles.th}>Position horloge</th>
                <th style={styles.th}>Source</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Action</th>
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
                  <td style={styles.td}>{rule.title || "-"}</td>
                  <td style={styles.td}>{rule.position_label || "-"}</td>
                  <td style={styles.td}>
                    {sourceLabels[rule.source] || "Manuel"}
                  </td>
                  <td style={styles.td}>
                    {rule.conflict_status === "conflict" ? "Conflit" : "OK"}
                  </td>
                  <td style={styles.td}>
                    {rule.conflict_status === "conflict" && (
                      <button
                        type="button"
                        onClick={() => handleKeepRule(rule)}
                        style={styles.keepButton}
                      >
                        Garder
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule)}
                      style={styles.deleteButton}
                    >
                      Supprimer
                    </button>
                  </td>
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
  modePanel: {
    border: "1px solid #444",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  modeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },
  calendarActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px",
  },
  connectionBox: {
    marginTop: "16px",
    border: "1px solid #555",
    borderRadius: "10px",
    padding: "12px",
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
    marginTop: "8px",
    marginBottom: "0",
    fontSize: "14px",
    opacity: 0.8,
  },
  warningText: {
    fontSize: "14px",
    opacity: 0.9,
    marginTop: "10px",
  },
  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
  },
  smallButton: {
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "0",
  },
  currentSourceBox: {
    border: "1px solid #555",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "14px",
  },
  summaryCard: {
    border: "1px solid #444",
    borderRadius: "10px",
    padding: "16px",
  },
  summaryLine: {
    margin: "8px 0",
  },
  conflictBox: {
    marginTop: "18px",
    border: "1px solid #8a5a00",
    borderRadius: "10px",
    padding: "14px",
  },
  conflictItem: {
    padding: "10px",
    borderTop: "1px solid #555",
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
  ruleTitle: {
    margin: "6px 0 4px 0",
    fontWeight: "bold",
  },
  rulePosition: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    opacity: 0.8,
  },
  badge: {
    display: "inline-block",
    border: "1px solid #777",
    borderRadius: "999px",
    padding: "3px 8px",
    fontSize: "12px",
    marginRight: "6px",
  },
  conflictBadge: {
    display: "inline-block",
    border: "1px solid #b36b00",
    borderRadius: "999px",
    padding: "3px 8px",
    fontSize: "12px",
    marginLeft: "6px",
  },
  keepButton: {
    display: "block",
    marginTop: "8px",
    marginBottom: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    border: "1px solid #4f8cff",
    borderRadius: "8px",
    background: "transparent",
    color: "#bcd6ff",
    fontSize: "12px",
  },
  deleteButton: {
    padding: "8px 12px",
    cursor: "pointer",
    border: "1px solid #8a2d2d",
    borderRadius: "8px",
    background: "transparent",
    color: "#ffb3b3",
  },
  deleteSmallButton: {
    display: "block",
    marginTop: "8px",
    padding: "5px 8px",
    cursor: "pointer",
    border: "1px solid #8a2d2d",
    borderRadius: "8px",
    background: "transparent",
    color: "#ffb3b3",
    fontSize: "12px",
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