import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ClockConfigPage() {
  const navigate = useNavigate();
  const familyId = localStorage.getItem("familyId");
  const familyName = localStorage.getItem("familyName");

  const [positions, setPositions] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await api.get(`/clock-positions/family/${familyId}`);
        setPositions(response.data.data || []);
      } catch (error) {
        console.error(error);
        setMessage("Erreur lors du chargement des emplacements");
      }
    };

    if (familyId) {
      fetchPositions();
    }
  }, [familyId]);

  const pizzaColors = [
    "#f4f4f4",
    "#e9edf2",
    "#f4f4f4",
    "#e9edf2",
    "#f4f4f4",
    "#e9edf2",
    "#f4f4f4",
    "#e9edf2",
  ];

  const handleOpenEdit = (position) => {
    setSelectedPosition(position);
    setNewLabel(position.label);
    setMessage("");
  };

  const handleCloseEdit = () => {
    setSelectedPosition(null);
    setNewLabel("");
  };

  const handleSaveLabel = async (e) => {
    e.preventDefault();

    if (!selectedPosition) return;

    try {
      const response = await api.put(`/clock-positions/${selectedPosition.id}`, {
        label: newLabel,
      });

      setPositions((prevPositions) =>
        prevPositions.map((position) =>
          position.id === selectedPosition.id
            ? { ...position, label: newLabel.trim() }
            : position
        )
      );

      setMessage(response.data.message);
      handleCloseEdit();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Erreur lors de la mise à jour"
      );
    }
  };

  return (
    <div style={styles.container}>
      <h1>Configuration de l’horloge</h1>

      <p>
        {familyName
          ? `Emplacements configurables de la famille ${familyName}`
          : ""}
      </p>

      <div style={styles.actions}>
        <button onClick={() => navigate("/dashboard")} style={styles.button}>
          Retour au dashboard
        </button>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      {positions.length > 0 && (
        <>
          <div style={styles.pizzaWrapper}>
            <div style={styles.pizza}>
              {positions.slice(0, 8).map((position, index) => (
                <div
                  key={position.id}
                  style={{
                    ...styles.slice,
                    background: `conic-gradient(
                      from ${index * 45}deg,
                      ${pizzaColors[index]} 0deg 45deg,
                      transparent 45deg
                    )`,
                  }}
                />
              ))}

              {positions.slice(0, 8).map((position, index) => {
                const angle = index * 45 - 67.5;
                const radius = 180;
                const center = 260;

                const x = center + radius * Math.cos((angle * Math.PI) / 180);
                const y = center + radius * Math.sin((angle * Math.PI) / 180);

                return (
                  <button
                    key={position.id + "-label"}
                    type="button"
                    onClick={() => handleOpenEdit(position)}
                    style={{
                      ...styles.label,
                      left: `${x}px`,
                      top: `${y}px`,
                    }}
                  >
                    <div style={styles.positionNumber}>
                      P{position.positionNumber}
                    </div>
                    <div style={styles.positionText}>{position.label}</div>
                  </button>
                );
              })}

              <div style={styles.separatorVertical}></div>
              <div style={styles.separatorHorizontal}></div>
              <div style={styles.separatorDiag1}></div>
              <div style={styles.separatorDiag2}></div>

              <div style={styles.centerCircle}>
                <span style={styles.centerText}>FamClock</span>
              </div>
            </div>
          </div>

          <div style={styles.listSection}>
            <h2>Liste des emplacements</h2>

            <div style={styles.list}>
              {positions.map((position) => (
                <div key={position.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div>
                      <p style={styles.cardTitle}>
                        Position {position.positionNumber}
                      </p>
                      <p style={styles.cardText}>
                        Lieu associé : {position.label}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(position)}
                      style={styles.editButton}
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedPosition && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Modifier un emplacement</h2>
            <p>Position {selectedPosition.positionNumber}</p>

            <form onSubmit={handleSaveLabel} style={styles.form}>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nom du lieu"
                style={styles.input}
              />

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  Enregistrer
                </button>

                <button
                  type="button"
                  onClick={handleCloseEdit}
                  style={styles.cancelButton}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "24px",
    textAlign: "center",
  },

  actions: {
    margin: "20px 0",
  },

  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },

  message: {
    marginTop: "16px",
    marginBottom: "16px",
  },

  pizzaWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "30px",
    marginBottom: "50px",
  },

  pizza: {
    position: "relative",
    width: "520px",
    height: "520px",
    borderRadius: "50%",
    overflow: "hidden",
    border: "4px solid #2f2f2f",
    backgroundColor: "#ffffff",
  },

  slice: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
  },

  label: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    color: "#111",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    width: "110px",
    padding: "4px 8px",
    lineHeight: "1.3",
  },

  positionNumber: {
    fontWeight: "700",
    marginBottom: "6px",
    fontSize: "17px",
  },

  positionText: {
    fontSize: "20px",
    fontWeight: "500",
  },

  separatorVertical: {
    position: "absolute",
    top: 0,
    left: "50%",
    width: "2px",
    height: "100%",
    backgroundColor: "#cfcfcf",
    transform: "translateX(-50%)",
  },

  separatorHorizontal: {
    position: "absolute",
    top: "50%",
    left: 0,
    width: "100%",
    height: "2px",
    backgroundColor: "#cfcfcf",
    transform: "translateY(-50%)",
  },

  separatorDiag1: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "2px",
    height: "140%",
    backgroundColor: "#cfcfcf",
    transform: "translate(-50%, -50%) rotate(45deg)",
  },

  separatorDiag2: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "2px",
    height: "140%",
    backgroundColor: "#cfcfcf",
    transform: "translate(-50%, -50%) rotate(-45deg)",
  },

  centerCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    backgroundColor: "#2b2b2b",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "3px solid #444",
  },

  centerText: {
    fontSize: "22px",
    fontWeight: "bold",
  },

  listSection: {
    marginTop: "10px",
    textAlign: "left",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "16px",
  },

  card: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "14px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },

  cardTitle: {
    margin: 0,
    fontWeight: "bold",
    fontSize: "17px",
  },

  cardText: {
    margin: "8px 0 0 0",
  },

  editButton: {
    padding: "10px 16px",
    fontSize: "15px",
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  modal: {
    backgroundColor: "#fff",
    color: "#111",
    padding: "24px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "420px",
    textAlign: "center",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "16px",
  },

  input: {
    padding: "12px",
    fontSize: "16px",
  },

  modalActions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
  },

  saveButton: {
    padding: "10px 16px",
    fontSize: "15px",
    cursor: "pointer",
  },

  cancelButton: {
    padding: "10px 16px",
    fontSize: "15px",
    cursor: "pointer",
  },
};

export default ClockConfigPage;