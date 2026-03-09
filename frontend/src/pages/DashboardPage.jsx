import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function DashboardPage() {
  const navigate = useNavigate();
  const familyName = localStorage.getItem("familyName");
  const familyId = localStorage.getItem("familyId");

  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get(`/members/family/${familyId}`);
        setMembers(response.data.data);
      } catch (error) {
        setMessage("Erreur lors du chargement des membres");
      }
    };

    if (familyId) {
      fetchMembers();
    }
  }, [familyId]);

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

      setMessage(response.data.message);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  return (
    <div style={styles.container}>
      <h1>Dashboard</h1>
      <p>Bienvenue {familyName ? `famille ${familyName}` : ""}</p>

      <div style={styles.actions}>
        <button onClick={handleGoToAddMember} style={styles.button}>
          Ajouter un membre
        </button>

        <button onClick={handleGoToClockConfig} style={styles.button}>
          Configurer l’horloge
        </button>

        <button onClick={handleLogout} style={styles.button}>
          Déconnexion
        </button>
      </div>

      <div style={styles.membersSection}>
        <h2>Membres de la famille</h2>

        {message && <p style={styles.message}>{message}</p>}

        {members.length === 0 ? (
          <p>Aucun membre enregistré pour le moment.</p>
        ) : (
          <div style={styles.membersList}>
            {members.map((member) => (
              <div key={member.id} style={styles.memberCard}>
                <div>
                  <p style={styles.memberName}>{member.name}</p>
                  <p style={styles.memberInfo}>Rôle : {member.role}</p>
                  <p style={styles.memberInfo}>
                    Aiguille n°{member.servoChannel}
                  </p>
                </div>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleEditMember(member.id)}
                    style={styles.editButton}
                  >
                    Modifier
                  </button>

                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    style={styles.deleteButton}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "60px auto",
    padding: "24px",
    textAlign: "center",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "24px",
    marginBottom: "32px",
    flexWrap: "wrap",
  },
  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },
  membersSection: {
    marginTop: "20px",
    textAlign: "left",
  },
  membersList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "16px",
  },
  memberCard: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  memberName: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold",
  },
  memberInfo: {
    margin: "4px 0",
  },
  cardActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  editButton: {
    padding: "10px 16px",
    fontSize: "15px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "10px 16px",
    fontSize: "15px",
    cursor: "pointer",
  },
  message: {
    marginBottom: "16px",
  },
};

export default DashboardPage;