import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import logoWhereOclock from "../assets/logo.png";

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

      localStorage.setItem("familyId", response.data.data.id);
      localStorage.setItem("familyName", response.data.data.familyName);

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur de connexion. Vérifiez vos identifiants."
      );
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <style>
        {`
          @keyframes fadeUpLogin {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes logoFloatLogin {
            0% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-5px) scale(1.02);
            }
            100% {
              transform: translateY(0) scale(1);
            }
          }

          @keyframes softGlowLogin {
            0% {
              opacity: 0.55;
              transform: scale(0.96);
            }
            50% {
              opacity: 1;
              transform: scale(1.04);
            }
            100% {
              opacity: 0.55;
              transform: scale(0.96);
            }
          }

          .login-card {
            animation: fadeUpLogin 0.45s ease-out;
          }


          .login-input:focus {
            border-color: #8DAA91 !important;
            box-shadow: 0 0 0 4px rgba(141, 170, 145, 0.16);
          }

          .login-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 26px rgba(141, 170, 145, 0.28);
          }

          .login-link:hover {
            color: #4F7456 !important;
          }
        `}
      </style>

      <div className="login-card" style={styles.container}>
        <div style={styles.logoSection}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoGlow}></div>

            <img
              src={logoWhereOclock}
              alt="Where O'Clock"
              className="login-logo"
              style={styles.logo}
            />
          </div>

          <h1 style={styles.title}>
            Where <span style={styles.titleAccent}>O’Clock</span>
          </h1>

          <p style={styles.subtitle}>Heureux de vous revoir</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nom de la famille</label>
            <input
              className="login-input"
              type="text"
              placeholder="Ex : Les Dupont"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Code PIN</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.errorContainer}>{error}</div>}

          <button className="login-button" type="submit" style={styles.button}>
            Se connecter
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Pas encore de famille ?{" "}
            <Link className="login-link" to="/create-family" style={styles.link}>
              Créer votre famille
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "34px 20px",
    backgroundColor: "transparent",
    fontFamily: "'Quicksand', 'Inter', Arial, sans-serif",
    color: "#4A443F",
  },

  container: {
    width: "100%",
    maxWidth: "460px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,252,247,0.88))",
    padding: "42px 34px 34px",
    borderRadius: "32px",
    border: "1px solid #E6D6BF",
    boxShadow: "0 24px 70px rgba(125, 107, 93, 0.14)",
    textAlign: "center",
    backdropFilter: "blur(8px)",
  },

  logoSection: {
    marginBottom: "32px",
  },

  logoWrapper: {
    position: "relative",
    width: "138px",
    height: "138px",
    margin: "0 auto 16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  logoGlow: {
    position: "absolute",
    width: "118px",
    height: "118px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(232,215,191,0.42) 45%, transparent 72%)",
    filter: "blur(8px)",
    animation: "softGlowLogin 4s ease-in-out infinite",
  },

  logo: {
    position: "relative",
    zIndex: 2,
    width: "200px",
    height: "200pxpx",
    objectFit: "contain",
    filter: "drop-shadow(0 12px 22px rgba(86, 64, 45, 0.12))",
  },

  title: {
    fontSize: "34px",
    margin: "0 0 6px",
    color: "#5F4A3D",
    letterSpacing: "-0.6px",
    fontWeight: "900",
  },

  titleAccent: {
    color: "#647E68",
  },

  subtitle: {
    fontSize: "16px",
    color: "#A68A64",
    margin: 0,
    fontWeight: "700",
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
    fontWeight: "900",
    color: "#7D6B5D",
    marginLeft: "4px",
  },

  input: {
    padding: "15px 17px",
    fontSize: "16px",
    borderRadius: "16px",
    border: "1px solid #E6D6BF",
    backgroundColor: "rgba(255,255,255,0.92)",
    color: "#4A443F",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },

  button: {
    padding: "16px",
    fontSize: "16px",
    fontWeight: "900",
    backgroundColor: "#8DAA91",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    marginTop: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 22px rgba(141, 170, 145, 0.24)",
  },

  errorContainer: {
    backgroundColor: "#FFF1EF",
    color: "#9A5C51",
    padding: "13px",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: "800",
    border: "1px solid #ECC7C1",
    textAlign: "center",
  },

  footer: {
    marginTop: "32px",
    borderTop: "1px solid #E6D6BF",
    paddingTop: "24px",
  },

  footerText: {
    fontSize: "15px",
    color: "#7D6B5D",
    margin: 0,
    fontWeight: "700",
  },

  link: {
    color: "#668A6E",
    textDecoration: "none",
    fontWeight: "900",
    transition: "color 0.2s ease",
  },
};

export default LoginPage;