import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function EditMemberPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const familyName = localStorage.getItem("familyName");

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [servoChannel, setServoChannel] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await api.get(`/members/${id}`);
        const member = response.data.data;

        setName(member.name || "");
        setRole(member.role || "");
        setServoChannel(
          member.servoChannel !== undefined && member.servoChannel !== null
            ? member.servoChannel
            : 0
        );
      } catch (error) {
        console.error(error);
        setMessageType("error");
        setMessage("Erreur lors du chargement du membre");
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  const getInitial = (value) => {
    if (!value) return "?";
    return value.trim().charAt(0).toUpperCase();
  };

  const getRoleStyle = () => {
    const normalizedRole = role.toLowerCase();

    if (normalizedRole.includes("parent")) {
      return {
        backgroundColor: "#F1DEC0",
        color: "#80552D",
        border: "1px solid #E5C393",
      };
    }

    if (normalizedRole.includes("enfant")) {
      return {
        backgroundColor: "#E6F0E8",
        color: "#4F7456",
        border: "1px solid #C7DDCB",
      };
    }

    return {
      backgroundColor: "#F5F1E9",
      color: "#7D6B5D",
      border: "1px solid #E6D6BF",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name.trim() || !role) {
      setMessageType("error");
      setMessage("Veuillez compléter le nom et le rôle du membre.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(`/members/${id}`, {
        name: name.trim(),
        role,
        servoChannel: Number(servoChannel),
      });

      setMessageType("success");
      setMessage(response.data.message || "Membre modifié avec succès");

      setTimeout(() => {
        navigate("/dashboard");
      }, 900);
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Erreur lors de la modification"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes editFadeIn {
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

          @keyframes avatarFloat {
            0% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
            100% {
              transform: translateY(0);
            }
          }

          .edit-card {
            animation: editFadeIn 0.35s ease-out;
          }

          .edit-button {
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }

          .edit-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(125, 107, 93, 0.16);
          }

          .edit-avatar {
            animation: avatarFloat 4s ease-in-out infinite;
          }

          .edit-toast {
            animation: toastPop 0.3s ease-out;
          }

          @media (max-width: 900px) {
            .edit-layout {
              grid-template-columns: 1fr !important;
            }

            .edit-hero-content {
              grid-template-columns: 1fr !important;
            }

            .edit-title-block {
              text-align: left !important;
              padding-right: 0 !important;
            }
          }
        `}
      </style>

      {message && (
        <div
          className="edit-toast"
          style={{
            ...styles.toast,
            backgroundColor: messageType === "error" ? "#B91C1C" : "#8DAA91",
          }}
        >
          {message}
        </div>
      )}

      <main style={styles.container}>
        <section className="edit-card" style={styles.hero}>
          <div className="edit-hero-content" style={styles.heroContent}>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="edit-button"
              style={styles.backBtn}
            >
              ← Dashboard
            </button>

            <div className="edit-title-block" style={styles.heroText}>
              <h1 style={styles.title}>Modifier un membre</h1>

              <p style={styles.subtitle}>
                {familyName
                  ? `Famille ${familyName} · mettez à jour le profil et l’aiguille associée`
                  : "Mettez à jour le profil et l’aiguille associée"}
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="edit-card" style={styles.loadingCard}>
            <p style={styles.loadingText}>Chargement du membre...</p>
          </section>
        ) : (
          <section className="edit-layout" style={styles.layout}>
            <div className="edit-card" style={styles.formPanel}>
              <div style={styles.sectionHeader}>
                <div>
                  <p style={styles.sectionKicker}>Profil</p>
                  <h2 style={styles.sectionTitle}>Informations du membre</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                <label style={styles.label}>
                  Nom du membre
                  <input
                    type="text"
                    placeholder="Ex : Rida, Léa, Papa..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Rôle dans la famille
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Sélectionner un rôle</option>
                    <option value="Parent">Parent</option>
                    <option value="Enfant">Enfant</option>
                  </select>
                </label>

                <label style={styles.label}>
                  Aiguille physique associée
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
                </label>

                <p style={styles.helperText}>
                  L’aiguille permet de relier ce membre à un moteur servo
                  physique sur l’horloge.
                </p>

                <div style={styles.actions}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="edit-button"
                    style={{
                      ...styles.primaryButton,
                      opacity: saving ? 0.75 : 1,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="edit-button"
                    style={styles.secondaryButton}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>

            <aside className="edit-card" style={styles.previewPanel}>
              <p style={styles.sectionKicker}>Aperçu</p>

              <div className="edit-avatar" style={styles.avatar}>
                {getInitial(name)}
              </div>

              <h2 style={styles.previewName}>{name || "Nom du membre"}</h2>

              <div style={styles.previewBadges}>
                <span style={{ ...styles.badge, ...getRoleStyle() }}>
                  {role || "Rôle"}
                </span>

                <span style={styles.servoBadge}>
                  Aiguille n°{servoChannel}
                </span>
              </div>

              <div style={styles.infoBox}>
                <strong>Where O’Clock</strong>
                <span>
                  Ce membre sera affiché sur l’horloge selon son planning et son
                  aiguille physique.
                </span>
              </div>
            </aside>
          </section>
        )}
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
    maxWidth: "1040px",
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
    letterSpacing: "0.5px",
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

  layout: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "24px",
    alignItems: "start",
  },

  formPanel: {
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "1px solid #E6D6BF",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
  },

  previewPanel: {
    background:
      "linear-gradient(135deg, rgba(255,248,234,0.94), rgba(255,255,255,0.86))",
    border: "1px solid #D2B48C",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
    textAlign: "center",
  },

  loadingCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "1px solid #E6D6BF",
    borderRadius: "28px",
    padding: "40px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    textAlign: "center",
  },

  loadingText: {
    margin: 0,
    color: "#7D6B5D",
    fontWeight: "900",
  },

  sectionHeader: {
    marginBottom: "22px",
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

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    fontWeight: "900",
    color: "#7D6B5D",
    fontSize: "14px",
    textAlign: "left",
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
    margin: "-4px 0 0",
    color: "#8B6A4A",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "1.5",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "8px",
  },

  primaryButton: {
    border: "none",
    backgroundColor: "#8DAA91",
    color: "#FFFFFF",
    padding: "14px 22px",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(141, 170, 145, 0.28)",
    flex: 1,
  },

  secondaryButton: {
    border: "1px solid #D2B48C",
    backgroundColor: "#FFFFFF",
    color: "#7D6B5D",
    padding: "14px 22px",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
    flex: 1,
  },

  avatar: {
    width: "96px",
    height: "96px",
    borderRadius: "32px",
    background: "linear-gradient(135deg, #F1DEC0 0%, #D9C2A3 100%)",
    color: "#80552D",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "42px",
    margin: "24px auto 18px",
    boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.45)",
  },

  previewName: {
    margin: 0,
    color: "#6E5A4A",
    fontSize: "28px",
    fontWeight: "900",
  },

  previewBadges: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
  },

  servoBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    backgroundColor: "#FDF6EC",
    color: "#8B6A4A",
    border: "1px solid #E6D6BF",
    fontSize: "13px",
    fontWeight: "900",
  },

  infoBox: {
    marginTop: "24px",
    padding: "18px",
    borderRadius: "20px",
    backgroundColor: "#FFFCF7",
    border: "1px solid #E6D6BF",
    color: "#7D6B5D",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    lineHeight: "1.5",
    fontWeight: "700",
  },

  toast: {
    position: "fixed",
    top: "22px",
    right: "22px",
    color: "#FFFFFF",
    padding: "14px 22px",
    borderRadius: "16px",
    zIndex: 1000,
    fontWeight: "900",
    boxShadow: "0 14px 34px rgba(0,0,0,0.16)",
  },
};

export default EditMemberPage;