import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const MAX_POSITIONS = 8;
const MAX_SERVOS = 8;

const MINI_SVG_SIZE = 420;
const MINI_CENTER = MINI_SVG_SIZE / 2;
const MINI_OUTER_R = 175;
const MINI_INNER_R = 62;
const MINI_SEGMENT_COUNT = 8;

const f = (n) => Number(n).toFixed(2);

const getMiniPoint = (angleDeg, radius, offset = 0) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;

  return {
    x: MINI_CENTER + Math.cos(rad) * radius - Math.sin(rad) * offset,
    y: MINI_CENTER + Math.sin(rad) * radius + Math.cos(rad) * offset,
  };
};

const getMiniPuzzleEdge = (angle, reverse, sign) => {
  const r1 = MINI_OUTER_R;
  const r2 = MINI_OUTER_R - 34;
  const rMid = (MINI_OUTER_R + MINI_INNER_R) / 2;
  const r3 = MINI_INNER_R + 34;
  const r4 = MINI_INNER_R;

  const amp = 22 * sign;

  const p1 = getMiniPoint(angle, r1);
  const p2 = getMiniPoint(angle, r2);
  const pM = getMiniPoint(angle, rMid, amp);
  const p3 = getMiniPoint(angle, r3);
  const p4 = getMiniPoint(angle, r4);

  const cp1 = getMiniPoint(angle, rMid + 32, amp * 1.1);
  const cp2 = getMiniPoint(angle, rMid - 32, amp * 1.1);

  if (reverse) {
    return `
      L ${f(p1.x)} ${f(p1.y)}
      L ${f(p2.x)} ${f(p2.y)}
      C ${f(cp1.x)} ${f(cp1.y)} ${f(pM.x)} ${f(pM.y)} ${f(pM.x)} ${f(pM.y)}
      C ${f(pM.x)} ${f(pM.y)} ${f(cp2.x)} ${f(cp2.y)} ${f(p3.x)} ${f(p3.y)}
      L ${f(p4.x)} ${f(p4.y)}
    `;
  }

  return `
    L ${f(p4.x)} ${f(p4.y)}
    L ${f(p3.x)} ${f(p3.y)}
    C ${f(cp2.x)} ${f(cp2.y)} ${f(pM.x)} ${f(pM.y)} ${f(pM.x)} ${f(pM.y)}
    C ${f(pM.x)} ${f(pM.y)} ${f(cp1.x)} ${f(cp1.y)} ${f(p2.x)} ${f(p2.y)}
    L ${f(p1.x)} ${f(p1.y)}
  `;
};

const createMiniSegmentPath = (index) => {
  const startAngle = index * 45;
  const endAngle = (index + 1) * 45;

  const pStartOut = getMiniPoint(startAngle, MINI_OUTER_R);
  const pEndOut = getMiniPoint(endAngle, MINI_OUTER_R);
  const pStartIn = getMiniPoint(startAngle, MINI_INNER_R);

  const signStart = index % 2 === 0 ? 1 : -1;
  const signEnd = index % 2 === 0 ? -1 : 1;

  return `
    M ${f(pStartOut.x)} ${f(pStartOut.y)}
    A ${MINI_OUTER_R} ${MINI_OUTER_R} 0 0 1 ${f(pEndOut.x)} ${f(pEndOut.y)}
    ${getMiniPuzzleEdge(endAngle, true, signEnd)}
    A ${MINI_INNER_R} ${MINI_INNER_R} 0 0 0 ${f(pStartIn.x)} ${f(pStartIn.y)}
    ${getMiniPuzzleEdge(startAngle, false, signStart)}
    Z
  `;
};

const splitMiniLabel = (label) => {
  if (!label) return ["Libre"];

  const clean = label.trim();

  if (clean.length <= 11) return [clean];

  if (clean.includes("&")) {
    const parts = clean.split("&");
    return [parts[0].trim(), `& ${parts.slice(1).join("&").trim()}`];
  }

  const words = clean.split(" ");
  if (words.length === 1) return [clean.slice(0, 11)];

  const middle = Math.ceil(words.length / 2);
  return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
};

function DashboardPage() {
  const navigate = useNavigate();

  const familyName = localStorage.getItem("familyName");
  const familyId = localStorage.getItem("familyId");

  const [members, setMembers] = useState([]);
  const [clockPositions, setClockPositions] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const usedServos = members.filter(
    (member) =>
      member.servoChannel !== null && member.servoChannel !== undefined
  ).length;

  const clockReady = members.length > 0;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [membersResponse, positionsResponse] = await Promise.all([
          api.get(`/members/family/${familyId}`),
          api.get(`/clock-positions/family/${familyId}`),
        ]);

        setMembers(membersResponse.data.data || []);

        setClockPositions(
          [...(positionsResponse.data.data || [])].sort(
            (a, b) => a.positionNumber - b.positionNumber
          )
        );
      } catch (error) {
        console.error(error);
        setMessage("Erreur lors du chargement du dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (familyId) {
      fetchDashboardData();
    } else {
      navigate("/login", { replace: true });
    }
  }, [familyId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("familyId");
    localStorage.removeItem("familyName");
    navigate("/login", { replace: true });
  };

  const handleGoToAddMember = () => {
    navigate("/members/add");
  };

  const handleGoToClockConfig = () => {
    navigate("/clock-config");
  };

  const handleGoToPlanning = () => {
    navigate("/planning");
  };

  const handleEditMember = (memberId) => {
    navigate(`/members/${memberId}/edit`);
  };

  const handleDeleteMember = async (memberId, memberName) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${memberName} ?`
    );

    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/members/${memberId}`);

      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== memberId)
      );

      setMessage(response.data.message || "Membre supprimé avec succès");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const getInitial = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  const getRoleStyle = (role) => {
    const normalizedRole = (role || "").toLowerCase();

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

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes dashboardFadeIn {
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

          @keyframes clockFloat {
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

          .dashboard-card {
            animation: dashboardFadeIn 0.35s ease-out;
          }

          .dashboard-button {
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }

          .dashboard-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(125, 107, 93, 0.16);
          }

          .member-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }

          .member-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 34px rgba(125, 107, 93, 0.13);
            border-color: #D2B48C;
          }

          .clock-preview {
            animation: clockFloat 4s ease-in-out infinite;
          }

          .toast {
            animation: toastPop 0.3s ease-out;
          }

          @media (max-width: 1000px) {
            .stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .dashboard-layout {
              grid-template-columns: 1fr !important;
            }

            .hero-content {
              grid-template-columns: 1fr !important;
            }

            .hero-actions {
              justify-content: flex-start !important;
            }
          }

          @media (max-width: 620px) {
            .stats-grid {
              grid-template-columns: 1fr !important;
            }

            .member-card {
              flex-direction: column;
              align-items: flex-start !important;
            }

            .member-actions {
              width: 100%;
              justify-content: flex-start !important;
            }
          }
        `}
      </style>

      {message && (
        <div className="toast" style={styles.toast}>
          {message}
        </div>
      )}

      <main style={styles.container}>
        <section className="dashboard-card" style={styles.hero}>
          <div className="hero-content" style={styles.heroContent}>
            <div>
              <p style={styles.kicker}>Espace famille</p>

              <h1 style={styles.title}>
                Bienvenue{familyName ? `, famille ${familyName}` : ""}
              </h1>

              <p style={styles.subtitle}>
                Gérez vos membres, configurez les positions de l’horloge et
                organisez le planning familial.
              </p>
            </div>

            <div className="hero-actions" style={styles.heroActions}>
              <button
                className="dashboard-button"
                onClick={handleGoToClockConfig}
                style={styles.primaryButton}
              >
                Configurer l’horloge
              </button>

              <button
                className="dashboard-button"
                onClick={handleGoToAddMember}
                style={styles.secondaryButton}
              >
                Ajouter un membre
              </button>

              <button
                className="dashboard-button"
                onClick={handleGoToPlanning}
                style={styles.secondaryButton}
              >
                Gérer le planning
              </button>

              <button
                className="dashboard-button"
                onClick={handleLogout}
                style={styles.logoutButton}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </section>

        <section className="stats-grid" style={styles.statsGrid}>
          <div className="dashboard-card" style={styles.statCard}>
            <p style={styles.statLabel}>Membres</p>
            <h2 style={styles.statValue}>{members.length}</h2>
            <p style={styles.statText}>profils liés à la famille</p>
          </div>

          <div className="dashboard-card" style={styles.statCard}>
            <p style={styles.statLabel}>Positions</p>
            <h2 style={styles.statValue}>{MAX_POSITIONS}</h2>
            <p style={styles.statText}>emplacements configurables</p>
          </div>

          <div className="dashboard-card" style={styles.statCard}>
            <p style={styles.statLabel}>Aiguilles</p>
            <h2 style={styles.statValue}>
              {usedServos} / {MAX_SERVOS}
            </h2>
            <p style={styles.statText}>aiguilles physiques utilisées</p>
          </div>

          <div className="dashboard-card" style={styles.statCard}>
            <p style={styles.statLabel}>Statut</p>
            <h2 style={styles.statValue}>
              {clockReady ? "Prête" : "À préparer"}
            </h2>
            <p style={styles.statText}>
              {clockReady
                ? "horloge prête à configurer"
                : "ajoutez un premier membre"}
            </p>
          </div>
        </section>

        <section className="dashboard-layout" style={styles.dashboardLayout}>
          <div className="dashboard-card" style={styles.membersPanel}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionKicker}>Famille</p>
                <h2 style={styles.sectionTitle}>Membres de la famille</h2>
              </div>

              <button
                className="dashboard-button"
                onClick={handleGoToAddMember}
                style={styles.smallPrimaryButton}
              >
                Ajouter
              </button>
            </div>

            {loading ? (
              <div style={styles.emptyState}>Chargement des membres...</div>
            ) : members.length === 0 ? (
              <div style={styles.emptyState}>
                <h3 style={styles.emptyTitle}>Aucun membre enregistré</h3>

                <p style={styles.emptyText}>
                  Ajoutez votre premier membre pour commencer à configurer
                  l’horloge familiale.
                </p>

                <button
                  className="dashboard-button"
                  onClick={handleGoToAddMember}
                  style={styles.primaryButton}
                >
                  Ajouter un membre
                </button>
              </div>
            ) : (
              <div style={styles.membersList}>
                {members.map((member) => (
                  <article
                    key={member.id}
                    className="member-card"
                    style={styles.memberCard}
                  >
                    <div style={styles.memberLeft}>
                      <div style={styles.avatar}>{getInitial(member.name)}</div>

                      <div>
                        <h3 style={styles.memberName}>{member.name}</h3>

                        <div style={styles.badges}>
                          <span
                            style={{
                              ...styles.badge,
                              ...getRoleStyle(member.role),
                            }}
                          >
                            {member.role}
                          </span>

                          <span style={styles.servoBadge}>
                            Aiguille physique n°
                            {member.servoChannel ?? "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="member-actions" style={styles.cardActions}>
                      <button
                        className="dashboard-button"
                        onClick={() => handleEditMember(member.id)}
                        style={styles.editButton}
                      >
                        Modifier
                      </button>

                      <button
                        className="dashboard-button"
                        onClick={() =>
                          handleDeleteMember(member.id, member.name)
                        }
                        style={styles.deleteButton}
                      >
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="dashboard-card" style={styles.sidePanel}>
            <p style={styles.sideKicker}>Aperçu du cadran</p>

            <div className="clock-preview" style={styles.clockPreview}>
              <svg
                viewBox={`0 0 ${MINI_SVG_SIZE} ${MINI_SVG_SIZE}`}
                style={styles.miniSvg}
              >
                <defs>
                  <radialGradient id="miniWoodGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F7E8CE" />
                    <stop offset="100%" stopColor="#D9C2A3" />
                  </radialGradient>

                  <pattern
                    id="miniWoodLines"
                    width="70"
                    height="70"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M-10 22 C20 8, 42 38, 80 20"
                      fill="none"
                      stroke="#8C6F4F"
                      strokeWidth="1"
                      strokeOpacity="0.08"
                    />
                    <path
                      d="M-10 44 C22 30, 45 60, 80 44"
                      fill="none"
                      stroke="#8C6F4F"
                      strokeWidth="1"
                      strokeOpacity="0.06"
                    />
                  </pattern>

                  <filter
                    id="miniClockShadow"
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="8"
                      stdDeviation="8"
                      floodColor="#5C4028"
                      floodOpacity="0.18"
                    />
                  </filter>
                </defs>

                <circle
                  cx={MINI_CENTER}
                  cy={MINI_CENTER}
                  r={MINI_OUTER_R + 16}
                  fill="#D9C2A3"
                  stroke="#B3997A"
                  strokeWidth="2"
                  filter="url(#miniClockShadow)"
                />

                <circle
                  cx={MINI_CENTER}
                  cy={MINI_CENTER}
                  r={MINI_OUTER_R + 8}
                  fill="#F7E8CE"
                  stroke="#B3997A"
                  strokeWidth="1"
                />

                {(clockPositions.length > 0
                  ? clockPositions.slice(0, MINI_SEGMENT_COUNT)
                  : Array.from({ length: MINI_SEGMENT_COUNT }, (_, index) => ({
                      id: index + 1,
                      positionNumber: index + 1,
                      label: `P${index + 1}`,
                    }))
                ).map((position, index) => {
                  const midAngle = index * 45 + 22.5;
                  const textPos = getMiniPoint(midAngle, 121);
                  const numberPos = getMiniPoint(
                    midAngle - 13,
                    MINI_OUTER_R - 17
                  );
                  const lines = splitMiniLabel(position.label);

                  return (
                    <g key={position.id || index}>
                      <path
                        d={createMiniSegmentPath(index)}
                        fill="url(#miniWoodGrad)"
                        stroke="#8C6F4F"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d={createMiniSegmentPath(index)}
                        fill="url(#miniWoodLines)"
                        opacity="0.9"
                        style={{ pointerEvents: "none" }}
                      />

                      <text
                        x={numberPos.x}
                        y={numberPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={styles.miniNumber}
                      >
                        P{position.positionNumber}
                      </text>

                      <text
                        x={textPos.x}
                        y={textPos.y - (lines.length > 1 ? 6 : 0)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          ...styles.miniLabel,
                          fontSize: lines.length > 1 ? "12px" : "14px",
                        }}
                      >
                        <tspan
                          x={textPos.x}
                          dy={lines.length > 1 ? "-0.2em" : "0"}
                        >
                          {lines[0]}
                        </tspan>

                        {lines[1] && (
                          <tspan x={textPos.x} dy="1.25em">
                            {lines[1]}
                          </tspan>
                        )}
                      </text>
                    </g>
                  );
                })}

                <circle
                  cx={MINI_CENTER}
                  cy={MINI_CENTER}
                  r={MINI_INNER_R}
                  fill="#D9C2A3"
                  stroke="#8C6F4F"
                  strokeWidth="4"
                />

                <circle
                  cx={MINI_CENTER}
                  cy={MINI_CENTER}
                  r={MINI_INNER_R - 8}
                  fill="none"
                  stroke="#F5E6CC"
                  strokeWidth="2"
                  strokeDasharray="4,5"
                />

                <text
                  x={MINI_CENTER}
                  y={MINI_CENTER - 6}
                  textAnchor="middle"
                  style={styles.miniBrandMain}
                >
                  WHERE
                </text>

                <text
                  x={MINI_CENTER}
                  y={MINI_CENTER + 18}
                  textAnchor="middle"
                  style={styles.miniBrandSub}
                >
                  O’CLOCK
                </text>
              </svg>
            </div>

            <div style={styles.compactStatus}>
              <span
                style={{
                  ...styles.statusDot,
                  backgroundColor: clockReady ? "#8DAA91" : "#D2B48C",
                }}
              ></span>

              <span style={styles.compactStatusText}>
                {clockReady
                  ? `${members.length} membre(s) · ${usedServos}/${MAX_SERVOS} aiguille(s)`
                  : "Configuration à compléter"}
              </span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflowX: "hidden",
    backgroundColor: "transparent",
    fontFamily: "'Quicksand', 'Inter', Arial, sans-serif",
    color: "#4A443F",
    padding: "34px 22px 70px",
  },

  container: {
    maxWidth: "1180px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  hero: {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(250,241,226,0.86))",
    border: "1px solid #E6D6BF",
    borderRadius: "32px",
    padding: "32px",
    boxShadow: "0 24px 60px rgba(125, 107, 93, 0.12)",
    marginBottom: "24px",
    backdropFilter: "blur(6px)",
  },

  heroContent: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "28px",
    alignItems: "center",
  },

  kicker: {
    display: "inline-block",
    margin: "0 0 10px",
    padding: "7px 14px",
    borderRadius: "999px",
    backgroundColor: "#F1DEC0",
    color: "#80552D",
    fontWeight: "900",
    fontSize: "13px",
    letterSpacing: "0.3px",
  },

  title: {
    margin: 0,
    color: "#6E5A4A",
    fontSize: "42px",
    lineHeight: "1.08",
    fontWeight: "900",
  },

  subtitle: {
    margin: "14px 0 0",
    maxWidth: "620px",
    color: "#8B6A4A",
    fontSize: "17px",
    lineHeight: "1.6",
    fontWeight: "600",
  },

  heroActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
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
  },

  secondaryButton: {
    border: "1px solid #D2B48C",
    backgroundColor: "#FFFFFF",
    color: "#7D6B5D",
    padding: "14px 20px",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
  },

  logoutButton: {
    border: "1px solid #E6D6BF",
    backgroundColor: "#FDFBF7",
    color: "#9B5A4A",
    padding: "14px 20px",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  statCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    border: "1px solid #E6D6BF",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 14px 34px rgba(125, 107, 93, 0.08)",
    backdropFilter: "blur(5px)",
  },

  statLabel: {
    margin: 0,
    color: "#A68A64",
    fontWeight: "900",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },

  statValue: {
    margin: "8px 0 2px",
    color: "#6E5A4A",
    fontSize: "30px",
    fontWeight: "900",
  },

  statText: {
    margin: 0,
    color: "#8B6A4A",
    fontSize: "13px",
    fontWeight: "600",
  },

  dashboardLayout: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "24px",
    alignItems: "start",
  },

  membersPanel: {
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
    alignItems: "center",
    gap: "18px",
    marginBottom: "20px",
  },

  sectionKicker: {
    margin: 0,
    color: "#A68A64",
    fontWeight: "900",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },

  sectionTitle: {
    margin: "5px 0 0",
    color: "#6E5A4A",
    fontSize: "26px",
    fontWeight: "900",
  },

  smallPrimaryButton: {
    border: "none",
    backgroundColor: "#8DAA91",
    color: "#FFFFFF",
    padding: "12px 18px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  membersList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  memberCard: {
    backgroundColor: "rgba(255,252,247,0.94)",
    border: "1px solid #E6D6BF",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
  },

  memberLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minWidth: 0,
  },

  avatar: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #F1DEC0 0%, #D9C2A3 100%)",
    color: "#80552D",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "24px",
    boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.45)",
    flexShrink: 0,
  },

  memberName: {
    margin: 0,
    color: "#4A443F",
    fontSize: "20px",
    fontWeight: "900",
  },

  badges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "8px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
  },

  servoBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "#FDF6EC",
    color: "#8B6A4A",
    border: "1px solid #E6D6BF",
    fontSize: "13px",
    fontWeight: "900",
  },

  cardActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  editButton: {
    border: "none",
    backgroundColor: "#8DAA91",
    color: "#FFFFFF",
    padding: "10px 15px",
    borderRadius: "13px",
    fontWeight: "900",
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid #E6D6BF",
    backgroundColor: "#FFFFFF",
    color: "#A15C4B",
    padding: "10px 15px",
    borderRadius: "13px",
    fontWeight: "900",
    cursor: "pointer",
  },

  emptyState: {
    border: "1px dashed #D2B48C",
    backgroundColor: "#FFFCF7",
    borderRadius: "22px",
    padding: "28px",
    textAlign: "center",
    color: "#7D6B5D",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "22px",
    color: "#6E5A4A",
  },

  emptyText: {
    margin: "0 0 18px",
    color: "#8B6A4A",
    lineHeight: "1.6",
  },

  sidePanel: {
    backgroundColor: "rgba(255,248,234,0.88)",
    border: "1px solid #D2B48C",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    textAlign: "center",
    backdropFilter: "blur(6px)",
  },

  sideKicker: {
    margin: "0 0 14px",
    color: "#A68A64",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    fontWeight: "900",
  },

  clockPreview: {
    display: "flex",
    justifyContent: "center",
  },

  miniSvg: {
    width: "100%",
    maxWidth: "380px",
    height: "auto",
    display: "block",
  },

  miniNumber: {
    fill: "#8C6F4F",
    fontSize: "11px",
    fontWeight: "900",
    pointerEvents: "none",
  },

  miniLabel: {
    fill: "#4A443F",
    fontWeight: "900",
    pointerEvents: "none",
  },

  miniBrandMain: {
    fill: "#FFFFFF",
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "1.2px",
    pointerEvents: "none",
  },

  miniBrandSub: {
    fill: "#F5E6CC",
    fontSize: "9px",
    fontWeight: "900",
    pointerEvents: "none",
  },

  compactStatus: {
    margin: "12px auto 0",
    padding: "12px 14px",
    borderRadius: "16px",
    backgroundColor: "#FFFCF7",
    border: "1px solid #E6D6BF",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },

  statusDot: {
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  compactStatusText: {
    color: "#7D6B5D",
    fontSize: "13px",
    fontWeight: "900",
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

export default DashboardPage;