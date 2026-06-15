import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const SVG_SIZE = 700;
const CENTER = SVG_SIZE / 2;
const OUTER_R = 300;
const INNER_R = 110;
const SEGMENT_COUNT = 8;

// Décalage du cadran : P1 est maintenant centré en haut comme le 12 d'une horloge.
const SEGMENT_OFFSET = -22.5;

const f = (n) => Number(n).toFixed(2);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getPoint = (angleDeg, radius, offset = 0) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;

  return {
    x: CENTER + Math.cos(rad) * radius - Math.sin(rad) * offset,
    y: CENTER + Math.sin(rad) * radius + Math.cos(rad) * offset,
  };
};

const getPuzzleEdge = (angle, reverse, sign) => {
  const r1 = OUTER_R;
  const r2 = OUTER_R - 60;
  const rMid = (OUTER_R + INNER_R) / 2;
  const r3 = INNER_R + 60;
  const r4 = INNER_R;

  const amp = 35 * sign;

  const p1 = getPoint(angle, r1);
  const p2 = getPoint(angle, r2);
  const pM = getPoint(angle, rMid, amp);
  const p3 = getPoint(angle, r3);
  const p4 = getPoint(angle, r4);

  const cp1 = getPoint(angle, rMid + 50, amp * 1.1);
  const cp2 = getPoint(angle, rMid - 50, amp * 1.1);

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

const createSegmentPath = (index) => {
  const startAngle = index * 45 + SEGMENT_OFFSET;
  const endAngle = (index + 1) * 45 + SEGMENT_OFFSET;

  const pStartOut = getPoint(startAngle, OUTER_R);
  const pEndOut = getPoint(endAngle, OUTER_R);
  const pStartIn = getPoint(startAngle, INNER_R);

  const signStart = index % 2 === 0 ? 1 : -1;
  const signEnd = index % 2 === 0 ? -1 : 1;

  return `
    M ${f(pStartOut.x)} ${f(pStartOut.y)}
    A ${OUTER_R} ${OUTER_R} 0 0 1 ${f(pEndOut.x)} ${f(pEndOut.y)}
    ${getPuzzleEdge(endAngle, true, signEnd)}
    A ${INNER_R} ${INNER_R} 0 0 0 ${f(pStartIn.x)} ${f(pStartIn.y)}
    ${getPuzzleEdge(startAngle, false, signStart)}
    Z
  `;
};

const splitLabel = (label) => {
  if (!label) return ["Libre"];

  const clean = label.trim();

  if (clean.length <= 12) return [clean];

  if (clean.includes("&")) {
    const parts = clean.split("&");
    return [parts[0].trim(), `& ${parts.slice(1).join("&").trim()}`];
  }

  const words = clean.split(" ");
  if (words.length === 1) return [clean.slice(0, 13)];

  const middle = Math.ceil(words.length / 2);
  return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
};

function ClockConfigPage() {
  const navigate = useNavigate();

  const familyId = localStorage.getItem("familyId");
  const familyName = localStorage.getItem("familyName");

  const [positions, setPositions] = useState([]);
  const [message, setMessage] = useState("");

  const [selectedPosition, setSelectedPosition] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [editError, setEditError] = useState("");

  const [selectedMovePosition, setSelectedMovePosition] = useState(null);
  const [hoveredPosition, setHoveredPosition] = useState(null);

  const [selectedSwapPosition, setSelectedSwapPosition] = useState(null);
  const [targetPositionNumber, setTargetPositionNumber] = useState("");

  const [swapEffect, setSwapEffect] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  const fetchPositions = async () => {
    try {
      const response = await api.get(`/clock-positions/family/${familyId}`);
      const data = response.data.data || [];

      setPositions(
        [...data].sort((a, b) => a.positionNumber - b.positionNumber)
      );
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du chargement des emplacements");
    }
  };

  useEffect(() => {
    if (familyId) {
      fetchPositions();
    }
  }, [familyId]);

  const clearMessageAfterDelay = () => {
    setTimeout(() => setMessage(""), 3000);
  };

  const handleOpenEdit = (position) => {
    if (isReordering) return;

    setSelectedPosition(position);
    setNewLabel(position.label || "");
    setEditError("");
    setMessage("");
  };

  const handleCloseEdit = () => {
    setSelectedPosition(null);
    setNewLabel("");
    setEditError("");
  };

  const handleSaveLabel = async (e) => {
    e.preventDefault();

    if (!selectedPosition) return;

    try {
      const response = await api.put(`/clock-positions/${selectedPosition.id}`, {
        label: newLabel,
      });

      setMessage(response.data.message || "Emplacement mis à jour");
      setSelectedPosition(null);
      setNewLabel("");
      setEditError("");

      await fetchPositions();
      clearMessageAfterDelay();
    } catch (error) {
      console.error(error);
      setEditError(
        error.response?.data?.message || "Erreur lors de la sauvegarde"
      );
    }
  };

  const reorderPositions = async (sourcePosition, targetPosition) => {
    if (!familyId) {
      setMessage("Aucune famille connectée");
      return;
    }

    if (!sourcePosition || !targetPosition || sourcePosition === targetPosition) {
      setSelectedMovePosition(null);
      return;
    }

    if (isReordering) return;

    try {
      setIsReordering(true);

      setSwapEffect({
        sourcePosition,
        targetPosition,
        status: "running",
      });

      const [response] = await Promise.all([
        api.put("/clock-positions/reorder", {
          familyId,
          sourcePosition,
          targetPosition,
        }),
        wait(650),
      ]);

      setSwapEffect({
        sourcePosition,
        targetPosition,
        status: "done",
      });

      setMessage(response.data.message || "Positions échangées !");
      setSelectedMovePosition(null);
      setSelectedSwapPosition(null);
      setTargetPositionNumber("");

      await fetchPositions();

      setTimeout(() => {
        setSwapEffect(null);
        setIsReordering(false);
      }, 800);

      clearMessageAfterDelay();
    } catch (error) {
      console.error(error);

      setSwapEffect(null);
      setIsReordering(false);

      setMessage(
        error.response?.data?.message || "Erreur lors de la réorganisation"
      );
    }
  };

  const handlePieceClick = async (event, position) => {
    if (isReordering) return;
    if (event.detail > 1) return;

    if (!selectedMovePosition) {
      setSelectedMovePosition(position);
      setMessage(
        `P${position.positionNumber} sélectionnée. Cliquez une autre pièce.`
      );
      clearMessageAfterDelay();
      return;
    }

    if (selectedMovePosition.positionNumber === position.positionNumber) {
      setSelectedMovePosition(null);
      setMessage("");
      return;
    }

    await reorderPositions(
      selectedMovePosition.positionNumber,
      position.positionNumber
    );
  };

  const handleOpenSwap = (position) => {
    if (isReordering) return;

    setSelectedSwapPosition(position);
    setTargetPositionNumber("");
    setMessage("");
  };

  const handleCloseSwap = () => {
    setSelectedSwapPosition(null);
    setTargetPositionNumber("");
  };

  const handleSubmitSwap = async (e) => {
    e.preventDefault();

    const target = Number(targetPositionNumber);

    if (!selectedSwapPosition || !target) {
      setMessage("Veuillez sélectionner une position cible");
      return;
    }

    await reorderPositions(selectedSwapPosition.positionNumber, target);
  };

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes clockPageFadeIn {
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

          @keyframes swapGlow {
            0% {
              filter: drop-shadow(0 0 0 rgba(217, 119, 6, 0));
            }
            50% {
              filter: drop-shadow(0 0 18px rgba(217, 119, 6, 0.75));
            }
            100% {
              filter: drop-shadow(0 0 0 rgba(217, 119, 6, 0));
            }
          }

          @keyframes swapDone {
            0% {
              filter: drop-shadow(0 0 0 rgba(47, 133, 90, 0));
            }
            45% {
              filter: drop-shadow(0 0 22px rgba(47, 133, 90, 0.8));
            }
            100% {
              filter: drop-shadow(0 0 0 rgba(47, 133, 90, 0));
            }
          }

          @keyframes pulseRing {
            0% {
              stroke-dashoffset: 0;
              opacity: 0.95;
            }
            50% {
              opacity: 0.55;
            }
            100% {
              stroke-dashoffset: -32;
              opacity: 0.95;
            }
          }

          .clock-card {
            animation: clockPageFadeIn 0.35s ease-out;
          }

          .clock-button {
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }

          .clock-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(125, 107, 93, 0.16);
          }

          .clock-piece-swapping path:first-of-type {
            animation: swapGlow 0.75s ease-in-out infinite;
          }

          .clock-piece-done path:first-of-type {
            animation: swapDone 0.7s ease-out 1;
          }

          .clock-toast {
            animation: toastPop 0.3s ease-out;
          }

          .pulse-ring {
            animation: pulseRing 0.95s linear infinite;
          }

          @media (max-width: 1050px) {
            .clock-layout {
              grid-template-columns: 1fr !important;
            }

            .clock-side {
              position: static !important;
            }

            .clock-header {
              grid-template-columns: 1fr !important;
            }

            .clock-title-block {
              text-align: left !important;
              padding-right: 0 !important;
            }
          }

          @media (max-width: 650px) {
            .position-row {
              grid-template-columns: 48px 1fr !important;
            }

            .position-actions {
              grid-column: 1 / -1;
              justify-content: flex-start !important;
            }
          }
        `}
      </style>

      {message && (
        <div className="clock-toast" style={styles.toast}>
          {message}
        </div>
      )}

      <main style={styles.container}>
        <section className="clock-card" style={styles.hero}>
          <div className="clock-header" style={styles.heroContent}>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="clock-button"
              style={styles.backBtn}
            >
              ← Dashboard
            </button>

            <div className="clock-title-block" style={styles.heroText}>
              <h1 style={styles.title}>Configuration de l’horloge</h1>

              <p style={styles.subtitle}>
                {familyName
                  ? `Famille ${familyName} · organisez les emplacements du cadran`
                  : "Organisez les emplacements du cadran familial"}
              </p>
            </div>
          </div>
        </section>

        <section className="clock-layout" style={styles.mainContainer}>
          <div className="clock-card" style={styles.clockPanel}>
            <div style={styles.clockTopBar}>
              <p style={styles.clockMiniHelp}>
                Double-clic pour renommer · cliquez deux pièces pour inverser
              </p>
            </div>

            <div style={styles.clockBox}>
              <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} style={styles.svg}>
                <defs>
                  <radialGradient id="woodGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F7E8CE" />
                    <stop offset="100%" stopColor="#D9C2A3" />
                  </radialGradient>

                  <radialGradient id="woodGradHover" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFF4DF" />
                    <stop offset="100%" stopColor="#E5CAA5" />
                  </radialGradient>

                  <filter
                    id="pieceShadow"
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="5"
                      stdDeviation="5"
                      floodColor="#5C4028"
                      floodOpacity="0.18"
                    />
                  </filter>

                  <filter
                    id="pieceShadowActive"
                    x="-40%"
                    y="-40%"
                    width="180%"
                    height="180%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="10"
                      stdDeviation="8"
                      floodColor="#5C4028"
                      floodOpacity="0.28"
                    />
                  </filter>

                  <pattern
                    id="woodLines"
                    width="90"
                    height="90"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M-10 25 C20 8, 45 43, 100 22"
                      fill="none"
                      stroke="#8C6F4F"
                      strokeWidth="1"
                      strokeOpacity="0.08"
                    />
                    <path
                      d="M-10 50 C25 35, 45 70, 100 48"
                      fill="none"
                      stroke="#8C6F4F"
                      strokeWidth="1"
                      strokeOpacity="0.07"
                    />
                    <path
                      d="M-10 74 C30 58, 55 88, 100 70"
                      fill="none"
                      stroke="#8C6F4F"
                      strokeWidth="1"
                      strokeOpacity="0.06"
                    />
                  </pattern>
                </defs>

                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={OUTER_R + 25}
                  fill="#D9C2A3"
                  stroke="#B3997A"
                  strokeWidth="2"
                />

                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={OUTER_R + 15}
                  fill="#F7E8CE"
                  stroke="#B3997A"
                  strokeWidth="1"
                />

                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={OUTER_R + 5}
                  fill="none"
                  stroke="#8C6F4F"
                  strokeWidth="1.4"
                  strokeOpacity="0.45"
                />

                {positions.slice(0, SEGMENT_COUNT).map((position, index) => {
                  const midAngle = index * 45;

                  const textPos = getPoint(midAngle, 205);
                  const numPos = getPoint(midAngle, OUTER_R - 24);

                  const isHovered = hoveredPosition === position.id;

                  const isSelected =
                    selectedMovePosition?.positionNumber ===
                    position.positionNumber;

                  const isSwapSource =
                    swapEffect?.sourcePosition === position.positionNumber;

                  const isSwapTarget =
                    swapEffect?.targetPosition === position.positionNumber;

                  const isSwapActive = isSwapSource || isSwapTarget;

                  const isSwapRunning =
                    isSwapActive && swapEffect?.status === "running";

                  const isSwapDone =
                    isSwapActive && swapEffect?.status === "done";

                  const lines = splitLabel(position.label);

                  const liftRad = ((midAngle - 90) * Math.PI) / 180;
                  const lift = isSwapActive ? 15 : isHovered || isSelected ? 9 : 0;
                  const dx = Math.cos(liftRad) * lift;
                  const dy = Math.sin(liftRad) * lift;

                  const strokeColor = isSwapDone
                    ? "#2F855A"
                    : isSwapActive
                    ? "#D97706"
                    : isSelected
                    ? "#B7651A"
                    : "#8C6F4F";

                  return (
                    <g
                      key={position.id}
                      transform={`translate(${f(dx)} ${f(dy)})`}
                      className={`${isSwapRunning ? "clock-piece-swapping" : ""} ${
                        isSwapDone ? "clock-piece-done" : ""
                      }`}
                      style={{
                        ...styles.segmentGroup,
                        cursor: isReordering ? "wait" : "pointer",
                      }}
                      onMouseEnter={() => setHoveredPosition(position.id)}
                      onMouseLeave={() => setHoveredPosition(null)}
                      onClick={(event) => handlePieceClick(event, position)}
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        handleOpenEdit(position);
                      }}
                    >
                      <path
                        d={createSegmentPath(index)}
                        fill={
                          isHovered || isSelected || isSwapActive
                            ? "url(#woodGradHover)"
                            : "url(#woodGrad)"
                        }
                        stroke={strokeColor}
                        strokeWidth={isSelected || isSwapActive ? "4" : "2.5"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={
                          isHovered || isSelected || isSwapActive
                            ? "url(#pieceShadowActive)"
                            : "url(#pieceShadow)"
                        }
                        style={{ transition: "0.2s ease" }}
                      />

                      {isSwapRunning && (
                        <circle
                          className="pulse-ring"
                          cx={textPos.x}
                          cy={textPos.y}
                          r={isSwapSource ? 48 : 60}
                          fill="none"
                          stroke={isSwapSource ? "#B7651A" : "#D97706"}
                          strokeWidth="3"
                          strokeDasharray="8 8"
                          strokeLinecap="round"
                          opacity="0.9"
                          style={{ pointerEvents: "none" }}
                        />
                      )}

                      <path
                        d={createSegmentPath(index)}
                        fill="url(#woodLines)"
                        opacity="0.8"
                        style={{ pointerEvents: "none" }}
                      />

                      <text
                        x={numPos.x}
                        y={numPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={styles.pNum}
                      >
                        P{position.positionNumber}
                      </text>

                      <text
                        x={textPos.x}
                        y={textPos.y - (lines.length > 1 ? 8 : 0)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          ...styles.label,
                          fill: isSwapDone
                            ? "#276749"
                            : isSwapActive
                            ? "#92400E"
                            : "#4A443F",
                          fontSize: lines.length > 1 ? "15px" : "18px",
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
                  cx={CENTER}
                  cy={CENTER}
                  r={INNER_R}
                  fill="#D9C2A3"
                  stroke="#8C6F4F"
                  strokeWidth="4"
                  filter="url(#pieceShadow)"
                />

                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={INNER_R - 10}
                  fill="none"
                  stroke="#F5E6CC"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />

                <text
                  x={CENTER}
                  y={CENTER - 10}
                  textAnchor="middle"
                  style={styles.brandMain}
                >
                  WHERE
                </text>

                <text
                  x={CENTER}
                  y={CENTER + 25}
                  textAnchor="middle"
                  style={styles.brandSub}
                >
                  O’CLOCK
                </text>
              </svg>
            </div>
          </div>

          <aside className="clock-card clock-side" style={styles.infoSide}>
            <div style={styles.cardInfo}>
              <div style={styles.positionHeader}>
                <div>
                  <h2 style={styles.sideTitle}>Positions</h2>
                  <p style={styles.sideHelp}>
                    Renommez ou déplacez chaque emplacement.
                  </p>
                </div>

                <span style={styles.positionCount}>{positions.length}/8</span>
              </div>

              {selectedMovePosition && (
                <div style={styles.selectedBox}>
                  <strong>Pièce sélectionnée</strong>
                  <span>
                    P{selectedMovePosition.positionNumber} —{" "}
                    {selectedMovePosition.label}
                  </span>
                </div>
              )}

              <div style={styles.positionList}>
                {positions.map((position) => {
                  const isSwapSource =
                    swapEffect?.sourcePosition === position.positionNumber;

                  const isSwapTarget =
                    swapEffect?.targetPosition === position.positionNumber;

                  const isSwapActive = isSwapSource || isSwapTarget;

                  return (
                    <div
                      key={position.id}
                      className="position-row"
                      style={{
                        ...styles.positionRow,
                        borderColor: isSwapActive ? "#D97706" : "#E6D6BF",
                        backgroundColor: isSwapActive ? "#FFF7E8" : "#FFFCF7",
                      }}
                    >
                      <span
                        style={{
                          ...styles.positionPill,
                          backgroundColor: isSwapActive ? "#FBBF24" : "#F1DEC0",
                          color: isSwapActive ? "#78350F" : "#80552D",
                        }}
                      >
                        P{position.positionNumber}
                      </span>

                      <span style={styles.positionLabel}>
                        {position.label || "Libre"}
                      </span>

                      <div className="position-actions" style={styles.positionActions}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(position)}
                          className="clock-button"
                          style={styles.smallButton}
                          disabled={isReordering}
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenSwap(position)}
                          className="clock-button"
                          style={styles.smallButton}
                          disabled={isReordering}
                        >
                          Déplacer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      </main>

      {selectedPosition && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <p style={styles.modalBadge}>
              Position P{selectedPosition.positionNumber}
            </p>

            <h2 style={styles.modalTitle}>Modifier l’emplacement</h2>

            <form onSubmit={handleSaveLabel}>
              <input
                autoFocus
                style={styles.input}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nom du lieu..."
              />

              {editError && <p style={styles.errorText}>{editError}</p>}

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>
                  Enregistrer
                </button>

                <button
                  type="button"
                  onClick={handleCloseEdit}
                  style={styles.cancelBtn}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSwapPosition && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <p style={styles.modalBadge}>
              Position P{selectedSwapPosition.positionNumber}
            </p>

            <h2 style={styles.modalTitle}>Changer de position</h2>

            <p style={styles.modalText}>
              Déplacer <strong>{selectedSwapPosition.label}</strong> vers :
            </p>

            <form onSubmit={handleSubmitSwap}>
              <select
                value={targetPositionNumber}
                onChange={(e) => setTargetPositionNumber(e.target.value)}
                style={styles.input}
              >
                <option value="">Choisir une position cible</option>

                {positions
                  .filter(
                    (position) =>
                      position.positionNumber !==
                      selectedSwapPosition.positionNumber
                  )
                  .map((position) => (
                    <option key={position.id} value={position.positionNumber}>
                      P{position.positionNumber} - {position.label}
                    </option>
                  ))}
              </select>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>
                  Confirmer
                </button>

                <button
                  type="button"
                  onClick={handleCloseSwap}
                  style={styles.cancelBtn}
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

  mainContainer: {
    display: "grid",
    gridTemplateColumns: "1.25fr 0.75fr",
    gap: "24px",
    alignItems: "start",
  },

  clockPanel: {
    background:
      "linear-gradient(135deg, rgba(255,248,234,0.92), rgba(255,255,255,0.82))",
    border: "1px solid #D2B48C",
    borderRadius: "32px",
    padding: "22px",
    boxShadow: "0 24px 60px rgba(125, 107, 93, 0.14)",
    backdropFilter: "blur(8px)",
  },

  clockTopBar: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "4px",
  },

  clockMiniHelp: {
    margin: 0,
    padding: "8px 14px",
    borderRadius: "999px",
    backgroundColor: "rgba(255,255,255,0.78)",
    border: "1px solid #E6D6BF",
    color: "#8B6A4A",
    fontSize: "12px",
    fontWeight: "800",
  },

  clockBox: {
    maxWidth: "620px",
    margin: "0 auto",
  },

  svg: {
    width: "100%",
    height: "auto",
    display: "block",
  },

  segmentGroup: {
    transition: "transform 0.2s ease",
  },

  pNum: {
    fill: "#8C6F4F",
    fontSize: "14px",
    fontWeight: "900",
    pointerEvents: "none",
  },

  label: {
    fill: "#4A443F",
    fontWeight: "900",
    pointerEvents: "none",
  },

  brandMain: {
    fill: "#FFFFFF",
    fontSize: "32px",
    fontWeight: "900",
    letterSpacing: "2px",
    pointerEvents: "none",
  },

  brandSub: {
    fill: "#F5E6CC",
    fontSize: "14px",
    fontWeight: "bold",
    pointerEvents: "none",
  },

  infoSide: {
    position: "sticky",
    top: "24px",
  },

  cardInfo: {
    backgroundColor: "rgba(255,248,234,0.9)",
    border: "1px solid #D2B48C",
    borderRadius: "28px",
    padding: "20px",
    boxShadow: "0 20px 48px rgba(125, 107, 93, 0.1)",
    backdropFilter: "blur(6px)",
    maxHeight: "calc(100vh - 48px)",
    overflowY: "auto",
  },

  positionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
  },

  sideTitle: {
    margin: 0,
    color: "#6E5A4A",
    fontSize: "24px",
    fontWeight: "900",
  },

  sideHelp: {
    margin: "4px 0 0",
    color: "#8B6A4A",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1.4",
  },

  selectedBox: {
    marginBottom: "14px",
    padding: "12px",
    borderRadius: "16px",
    backgroundColor: "#F5E6CC",
    border: "1px solid #D2B48C",
    color: "#7D6B5D",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontWeight: "800",
    fontSize: "13px",
  },

  positionList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  positionCount: {
    backgroundColor: "#F1DEC0",
    color: "#80552D",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "900",
    flexShrink: 0,
  },

  positionRow: {
    display: "grid",
    gridTemplateColumns: "52px 1fr auto",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #E6D6BF",
    borderRadius: "14px",
    padding: "8px",
    transition: "0.2s ease",
  },

  positionPill: {
    borderRadius: "12px",
    padding: "8px 0",
    textAlign: "center",
    fontWeight: "900",
  },

  positionLabel: {
    color: "#4A443F",
    fontWeight: "900",
    fontSize: "14px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  positionActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },

  smallButton: {
    height: "34px",
    minWidth: "72px",
    padding: "0 10px",
    borderRadius: "12px",
    border: "1px solid #D2B48C",
    backgroundColor: "#FFFFFF",
    color: "#7D6B5D",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "12px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(5px)",
    padding: "20px",
  },

  modal: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "30px",
    width: "90%",
    maxWidth: "430px",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  },

  modalBadge: {
    display: "inline-block",
    margin: "0 0 10px",
    padding: "6px 12px",
    backgroundColor: "#F1DEC0",
    color: "#80552D",
    borderRadius: "999px",
    fontWeight: "900",
  },

  modalTitle: {
    color: "#7D6B5D",
    marginTop: 0,
  },

  modalText: {
    color: "#7D6B5D",
  },

  input: {
    width: "100%",
    padding: "15px",
    borderRadius: "15px",
    border: "2px solid #F5F1E9",
    fontSize: "1rem",
    marginBottom: "20px",
    boxSizing: "border-box",
    outline: "none",
  },

  modalActions: {
    display: "flex",
    gap: "10px",
  },

  saveBtn: {
    flex: 2,
    backgroundColor: "#8DAA91",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#F5F1E9",
    color: "#7D6B5D",
    border: "none",
    padding: "12px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  errorText: {
    color: "#B91C1C",
    fontWeight: "700",
    marginTop: "-8px",
  },

  toast: {
    position: "fixed",
    top: "22px",
    right: "22px",
    backgroundColor: "#8DAA91",
    color: "white",
    padding: "15px 25px",
    borderRadius: "15px",
    zIndex: 1100,
    fontWeight: "900",
    boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
  },
};

export default ClockConfigPage;