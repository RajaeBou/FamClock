import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function AddMemberPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const familyId = localStorage.getItem("familyId");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!familyId) {
      setError("Aucune famille connectée. Veuillez vous reconnecter.");
      return;
    }

    try {
      await api.post("/members", {
        familyId,
        name,
        role,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de l’ajout du membre. Veuillez réessayer."
      );
    }
  };

  return (
    <div className="add-member-page">
      <style>{`
        .add-member-page {
          min-height: 100vh;
          padding: 34px 20px;
          font-family: "Quicksand", "Inter", Arial, sans-serif;
          color: #4A4038;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .add-member-container {
          width: 100%;
          max-width: 720px;
          margin-top: 34px;
        }

        .top-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }

        .back-button,
        .home-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 999px;
          text-decoration: none;
          border: 1px solid rgba(199, 167, 125, 0.38);
          background: rgba(255, 252, 247, 0.86);
          color: #7A5C3E;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(86, 64, 45, 0.08);
          transition: all 0.2s ease;
        }

        .back-button:hover,
        .home-button:hover {
          transform: translateY(-2px);
          background: #FFF9F1;
        }

        .add-card {
          width: 100%;
          padding: 38px 34px 34px;
          border-radius: 34px;
          background: rgba(255, 252, 247, 0.88);
          border: 1px solid rgba(230, 214, 191, 0.9);
          box-shadow: 0 28px 80px rgba(86, 64, 45, 0.14);
          backdrop-filter: blur(14px);
          animation: fadeUp 0.45s ease-out;
        }

        .page-title {
          margin: 0;
          text-align: center;
          font-size: clamp(34px, 5vw, 52px);
          line-height: 1;
          color: #5F4A3D;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .page-title span {
          color: #647E68;
        }

        .page-subtitle {
          max-width: 480px;
          margin: 14px auto 30px;
          text-align: center;
          color: #8A6A4F;
          font-size: 16px;
          line-height: 1.6;
          font-weight: 700;
        }

        .member-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          margin-left: 4px;
          color: #7D6B5D;
          font-size: 14px;
          font-weight: 900;
        }

        .member-input,
        .member-select {
          width: 100%;
          min-height: 54px;
          padding: 0 17px;
          border-radius: 17px;
          border: 1px solid #E6D6BF;
          background: rgba(255,255,255,0.94);
          color: #4A4038;
          font-size: 16px;
          font-family: inherit;
          font-weight: 700;
          outline: none;
          transition: all 0.2s ease;
        }

        .member-input:focus,
        .member-select:focus {
          border-color: #8DAA91;
          box-shadow: 0 0 0 4px rgba(141, 170, 145, 0.16);
        }

        .submit-button {
          min-height: 56px;
          margin-top: 8px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(145deg, #8FA894, #647E68);
          color: white;
          font-size: 16px;
          font-family: inherit;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 18px 34px rgba(100, 126, 104, 0.24);
          transition: all 0.22s ease;
        }

        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 40px rgba(100, 126, 104, 0.28);
        }

        .error-box {
          padding: 13px;
          border-radius: 16px;
          background: #FFF1EF;
          color: #9A5C51;
          border: 1px solid #ECC7C1;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 620px) {
          .add-member-page {
            padding: 22px 16px;
          }

          .add-member-container {
            margin-top: 16px;
          }

          .top-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .back-button,
          .home-button {
            width: 100%;
          }

          .add-card {
            padding: 30px 22px 26px;
            border-radius: 28px;
          }
        }
      `}</style>

      <main className="add-member-container">
        <div className="top-actions">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Précédent
          </button>

          <Link to="/home" className="home-button">
            Accueil
          </Link>
        </div>

        <section className="add-card">
          <h1 className="page-title">
            Ajouter <span>un membre</span>
          </h1>

          <p className="page-subtitle">
            Ajoutez un membre de votre famille pour lui associer un rôle et
            préparer sa place sur l’horloge.
          </p>

          <form className="member-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nom du membre</label>
              <input
                className="member-input"
                type="text"
                placeholder="Ex : Ayoub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Rôle dans la famille</label>
              <select
                className="member-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Sélectionner un rôle</option>
                <option value="parent">Parent</option>
                <option value="enfant">Enfant</option>
                <option value="grand-parent">Grand-parent</option>
              </select>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="submit-button">
              Ajouter le membre
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default AddMemberPage;