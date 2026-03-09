import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ClockConfigPage() {
  const navigate = useNavigate();
  const familyId = localStorage.getItem("familyId");
  const familyName = localStorage.getItem("familyName");

  const [positions, setPositions] = useState([]);
  const [message, setMessage] = useState("");

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

    if (familyId) fetchPositions();
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

  const labelPositions = [
    { top: "12%", left: "65%" },
    { top: "35%", left: "85%" },
    { top: "65%", left: "85%" },
    { top: "88%", left: "65%" },
    { top: "88%", left: "35%" },
    { top: "65%", left: "15%" },
    { top: "35%", left: "15%" },
    { top: "12%", left: "35%" },
  ];

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

      {message && <p>{message}</p>}

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

              {positions.slice(0, 8).map((position, index) => (
                <div
                  key={position.id + "-label"}
                  style={{
                    ...styles.label,
                    top: labelPositions[index].top,
                    left: labelPositions[index].left,
                  }}
                >
                  <strong>P{position.positionNumber}</strong>
                  <div>{position.label}</div>
                </div>
              ))}

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
                  <p style={styles.cardTitle}>
                    Position {position.positionNumber}
                  </p>

                  <p style={styles.cardText}>
                    Lieu associé : {position.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
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
    fontSize: "16px",
    color: "#111",
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

  cardTitle: {
    margin: 0,
    fontWeight: "bold",
    fontSize: "17px",
  },

  cardText: {
    margin: "8px 0 0 0",
  },
};

export default ClockConfigPage;