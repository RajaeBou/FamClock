import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function LoginPage() {
  const [familyName, setFamilyName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/families/login", {
        familyName,
        pin,
      });

      // Stockage des informations de session
      localStorage.setItem("familyId", response.data.data.id);
      localStorage.setItem("familyName", response.data.data.familyName);

      // Redirection vers le tableau de bord
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion. Vérifiez vos identifiants.");
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        
        {/* En-tête avec Logo Visuel */}
        <div style={styles.logoSection}>
          <div style={styles.clockIcon}>
            <div style={styles.handLong}></div>
            <div style={styles.handShort}></div>
            <div style={styles.centerDot}></div>
          </div>
          <h1 style={styles.title}>Where O’Clock</h1>
          <p style={styles.subtitle}>Heureux de vous revoir</p>
        </div>

        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nom de la famille</label>
            <input
              type="text"
              placeholder="Ex: Les Dupont"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Code PIN</label>
            <input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              style={styles.input}
              required
            />
          </div>

          {error && (
            <div style={styles.errorContainer}>
              {error}
            </div>
          )}

          <button type="submit" style={styles.button}>
            Se connecter
          </button>
        </form>

        {/* Footer de la page */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Pas encore de famille ?{" "}
            <Link to="/create-family" style={styles.link}>
              Créer votre horloge
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "var(--cream)",
    padding: "20px",
  },
  container: {
    maxWidth: "420px",
    width: "100%",
    backgroundColor: "var(--white)",
    padding: "40px 30px",
    borderRadius: "28px",
    boxShadow: "0 10px 30px var(--shadow)",
    textAlign: "center",
  },
  logoSection: {
    marginBottom: "32px",
  },
  clockIcon: {
    width: "64px",
    height: "64px",
    border: "3px solid var(--sage)",
    borderRadius: "50%",
    margin: "0 auto 16px",
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--white)",
  },
  centerDot: {
    width: "6px",
    height: "6px",
    backgroundColor: "var(--wood)",
    borderRadius: "50%",
    zIndex: 3,
  },
  handLong: {
    position: "absolute",
    width: "2px",
    height: "22px",
    backgroundColor: "var(--sage)",
    bottom: "50%",
    transformOrigin: "bottom",
    transform: "rotate(35deg)",
    borderRadius: "2px",
  },
  handShort: {
    position: "absolute",
    width: "3px",
    height: "16px",
    backgroundColor: "var(--wood)",
    bottom: "50%",
    transformOrigin: "bottom",
    transform: "rotate(-70deg)",
    borderRadius: "2px",
  },
  title: {
    fontSize: "32px",
    margin: "0 0 4px 0",
    color: "var(--wood)",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#A0968E",
    margin: 0,
    fontWeight: "400",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--wood)",
    marginLeft: "4px",
  },
  input: {
    padding: "14px 16px",
    fontSize: "16px",
    borderRadius: "14px",
    border: "1px solid var(--beige-light)",
    backgroundColor: "#FDFCFB",
    color: "var(--text-main)",
    outline: "none",
    transition: "all 0.2s ease",
  },
  button: {
    padding: "16px",
    fontSize: "16px",
    fontWeight: "700",
    backgroundColor: "var(--sage)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    marginTop: "10px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(141, 170, 145, 0.3)",
  },
  errorContainer: {
    backgroundColor: "#FFF2F2",
    color: "var(--error)",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "14px",
    border: "1px solid #FFE0E0",
  },
  footer: {
    marginTop: "32px",
    borderTop: "1px solid var(--beige-light)",
    paddingTop: "24px",
  },
  footerText: {
    fontSize: "15px",
    color: "#7A726C",
    margin: 0,
  },
  link: {
    color: "var(--sage-dark)",
    textDecoration: "none",
    fontWeight: "700",
  },
};

export default LoginPage;