import { Link, useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const familyId = localStorage.getItem("familyId");
  const familyName = localStorage.getItem("familyName");

  const handleLogout = () => {
    localStorage.removeItem("familyId");
    localStorage.removeItem("familyName");
    navigate("/home", { replace: true });
  };

  const clockPositions = [
    "Maison",
    "École",
    "Travail",
    "Sport",
    "Papi",
    "Piscine",
    "Courses",
    "Autre",
  ];

  return (
    <div className="home-page">
      <style>{`
        :root {
          --cream: #F8F1E8;
          --cream-soft: #FFF9F1;
          --beige: #E8D7BF;
          --beige-dark: #C7A77D;
          --wood: #7A5C3E;
          --text: #3F3934;
          --muted: #7B7067;
          --sage: #8FA894;
          --sage-dark: #647E68;
          --white: rgba(255, 255, 255, 0.82);
          --shadow: 0 24px 70px rgba(86, 64, 45, 0.13);
        }

        * {
          box-sizing: border-box;
        }

        .home-page {
          min-height: 100vh;
          padding: 26px;
          font-family: "Quicksand", "Inter", Arial, sans-serif;
          color: var(--text);
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.95), transparent 34%),
            linear-gradient(135deg, #F8F1E8 0%, #F1E3D0 45%, #E9D6BC 100%);
          overflow-x: hidden;
        }

        .home-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .home-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 14px 16px;
          border-radius: 26px;
          background: rgba(255, 252, 247, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.65);
          box-shadow: 0 18px 45px rgba(86, 64, 45, 0.09);
          backdrop-filter: blur(18px);
          animation: fadeIn 0.45s ease-out;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
        }

        .brand-logo {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          color: white;
          font-weight: 900;
          font-size: 20px;
          background: linear-gradient(145deg, #9B7954, #D2B48C);
          box-shadow: 0 12px 28px rgba(122, 92, 62, 0.22);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .brand-text strong {
          font-size: 17px;
          color: var(--text);
        }

        .brand-text small {
          margin-top: 3px;
          color: var(--muted);
          font-weight: 700;
          font-size: 12px;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav a,
        .nav button {
          border: none;
          text-decoration: none;
          font-family: inherit;
          font-weight: 900;
          font-size: 14px;
          padding: 10px 15px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav a:hover,
        .nav button:hover {
          transform: translateY(-1px);
        }

        .nav-link {
          color: var(--muted);
          background: rgba(255,255,255,0.45);
        }

        .nav-active {
          color: var(--wood);
          background: rgba(232, 215, 191, 0.65);
        }

        .nav-primary {
          color: white;
          background: var(--sage);
          box-shadow: 0 12px 26px rgba(143, 168, 148, 0.28);
        }

        .logout {
          color: #9A5A45;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(199, 167, 125, 0.28) !important;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 58px;
          align-items: center;
          min-height: calc(100vh - 140px);
          padding: 54px 12px 30px;
        }

        .hero-content {
          animation: fadeUp 0.55s ease-out;
        }

        .eyebrow {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 20px;
          padding: 9px 14px;
          border-radius: 999px;
          color: var(--wood);
          background: rgba(255, 249, 241, 0.68);
          border: 1px solid rgba(255,255,255,0.8);
          font-size: 13px;
          font-weight: 900;
        }

        .eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--sage);
        }

        .hero-title {
          margin: 0;
          color: var(--text);
          font-size: clamp(48px, 7vw, 78px);
          line-height: 0.96;
          letter-spacing: -2.4px;
          font-weight: 900;
        }

        .hero-title span {
          color: var(--wood);
        }

        .hero-subtitle {
          max-width: 580px;
          margin: 24px 0 0;
          color: var(--muted);
          font-size: 19px;
          line-height: 1.75;
          font-weight: 700;
        }

        .connected-card {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 22px;
          padding: 12px 15px;
          border-radius: 18px;
          background: rgba(255, 249, 241, 0.78);
          border: 1px solid rgba(255,255,255,0.76);
          color: var(--text);
          font-weight: 800;
        }

        .connected-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--sage);
          box-shadow: 0 0 0 6px rgba(143, 168, 148, 0.16);
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          padding: 0 24px;
          border-radius: 17px;
          text-decoration: none;
          font-weight: 900;
          transition: all 0.22s ease;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-primary {
          color: white;
          background: linear-gradient(145deg, var(--sage), var(--sage-dark));
          box-shadow: 0 18px 34px rgba(100, 126, 104, 0.24);
        }

        .btn-secondary {
          color: var(--wood);
          background: rgba(255, 249, 241, 0.78);
          border: 1px solid rgba(199, 167, 125, 0.35);
        }

        .mini-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 28px;
        }

        .mini-feature {
          padding: 9px 13px;
          border-radius: 999px;
          color: var(--wood);
          background: rgba(255, 249, 241, 0.58);
          border: 1px solid rgba(255,255,255,0.65);
          font-size: 13px;
          font-weight: 900;
        }

        .visual-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          animation: fadeUp 0.7s ease-out;
        }

        .visual-glow {
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.42);
          filter: blur(28px);
          top: 40px;
        }

        .clock-card {
          position: relative;
          width: min(100%, 430px);
          padding: 28px;
          border-radius: 38px;
          background: rgba(255, 252, 247, 0.68);
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: var(--shadow);
          backdrop-filter: blur(18px);
        }

        .clock-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .clock-card-title {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .clock-card-title strong {
          font-size: 17px;
          color: var(--text);
        }

        .clock-card-title small {
          color: var(--muted);
          font-weight: 800;
        }

        .status-pill {
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(143, 168, 148, 0.15);
          color: var(--sage-dark);
          font-size: 12px;
          font-weight: 900;
        }

        .clock {
          position: relative;
          width: 280px;
          height: 280px;
          margin: 0 auto;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%, #FFF9EF 0 28%, #EBD7BA 29% 63%, #C9A77D 64% 100%);
          border: 12px solid rgba(255, 249, 241, 0.72);
          box-shadow:
            inset 0 0 0 1px rgba(122, 92, 62, 0.16),
            0 24px 50px rgba(86, 64, 45, 0.16);
        }

        .clock-position {
          position: absolute;
          width: 54px;
          min-height: 30px;
          padding: 5px 7px;
          border-radius: 999px;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          text-align: center;
          color: var(--wood);
          background: rgba(255, 252, 247, 0.88);
          border: 1px solid rgba(122, 92, 62, 0.12);
          font-size: 10px;
          font-weight: 900;
          line-height: 1.05;
          box-shadow: 0 8px 18px rgba(86, 64, 45, 0.08);
        }

        .needle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 4px;
          height: 78px;
          border-radius: 999px;
          background: var(--wood);
          transform-origin: bottom center;
          transform: translate(-50%, -100%) rotate(45deg);
          box-shadow: 0 8px 18px rgba(86, 64, 45, 0.22);
        }

        .needle.second {
          height: 66px;
          background: var(--sage-dark);
          transform: translate(-50%, -100%) rotate(-75deg);
        }

        .clock-center {
          position: absolute;
          inset: 50% auto auto 50%;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          text-align: center;
          background: linear-gradient(145deg, #9B7954, #D2B48C);
          border: 5px solid rgba(255, 249, 241, 0.85);
          color: white;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.5px;
        }

        .family-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 24px;
        }

        .family-mini-card {
          padding: 13px 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.7);
        }

        .family-mini-card strong {
          display: block;
          color: var(--text);
          font-size: 14px;
          margin-bottom: 4px;
        }

        .family-mini-card small {
          color: var(--muted);
          font-weight: 800;
          font-size: 12px;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 950px) {
          .hero {
            grid-template-columns: 1fr;
            gap: 36px;
            text-align: center;
            padding-top: 44px;
          }

          .eyebrow,
          .actions,
          .mini-features {
            margin-left: auto;
            margin-right: auto;
            justify-content: center;
          }

          .hero-subtitle {
            margin-left: auto;
            margin-right: auto;
          }
        }

        @media (max-width: 680px) {
          .home-page {
            padding: 16px;
          }

          .home-header {
            flex-direction: column;
            align-items: stretch;
          }

          .brand {
            justify-content: center;
          }

          .nav {
            justify-content: center;
            flex-wrap: wrap;
          }

          .hero {
            min-height: auto;
            padding-top: 34px;
          }

          .hero-title {
            letter-spacing: -1.4px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .clock-card {
            padding: 20px;
            border-radius: 30px;
          }

          .clock {
            width: 245px;
            height: 245px;
          }

          .family-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="home-container">
        <header className="home-header">
          <Link to="/home" className="brand">
            <span className="brand-logo">W</span>

            <span className="brand-text">
              <strong>Where O’Clock</strong>
              <small>Horloge familiale connectée</small>
            </span>
          </Link>

          <nav className="nav">
            <Link to="/home" className="nav-active">
              Accueil
            </Link>

            {familyId ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Mon espace
                </Link>

                <button type="button" onClick={handleLogout} className="logout">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Connexion
                </Link>

                <Link to="/create-family" className="nav-primary">
                  Créer une famille
                </Link>
              </>
            )}
          </nav>
        </header>

        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              Simple · familial · sans écran inutile
            </div>

            <h1 className="hero-title">
              Où est chacun,
              <br />
              <span>en un regard.</span>
            </h1>

            <p className="hero-subtitle">
              Where O’Clock transforme les routines familiales en une horloge
              claire, douce et intuitive. Ajoutez vos membres, configurez vos
              lieux et planifiez la semaine facilement.
            </p>

            {familyId && (
              <div className="connected-card">
                <span className="connected-dot"></span>
                <span>
                  Famille connectée : <strong>{familyName}</strong>
                </span>
              </div>
            )}

            <div className="actions">
              {familyId ? (
                <Link to="/dashboard" className="btn btn-primary">
                  Ouvrir mon espace
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary">
                    Se connecter
                  </Link>

                  <Link to="/create-family" className="btn btn-secondary">
                    Créer une famille
                  </Link>
                </>
              )}
            </div>

            <div className="mini-features">
              <span className="mini-feature">Membres</span>
              <span className="mini-feature">Lieux</span>
              <span className="mini-feature">Planning</span>
              <span className="mini-feature">Routines</span>
            </div>
          </div>

          <div className="visual-wrapper">
            <div className="visual-glow"></div>

            <div className="clock-card">
              <div className="clock-card-top">
                <div className="clock-card-title">
                  <strong>Horloge familiale</strong>
                  <small>Aperçu de configuration</small>
                </div>

                <span className="status-pill">Démo</span>
              </div>

              <div className="clock">
                {clockPositions.map((position, index) => {
                  const angle = index * 45 - 90;
                  const radius = 108;
                  const center = 140;

                  const x =
                    center + radius * Math.cos((angle * Math.PI) / 180);
                  const y =
                    center + radius * Math.sin((angle * Math.PI) / 180);

                  return (
                    <span
                      key={position}
                      className="clock-position"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                      }}
                    >
                      {position}
                    </span>
                  );
                })}

                <span className="needle"></span>
                <span className="needle second"></span>

                <div className="clock-center">
                  WHERE
                  <br />
                  O’CLOCK
                </div>
              </div>

              <div className="family-row">
                <div className="family-mini-card">
                  <strong>Rida</strong>
                  <small>École · 08:00</small>
                </div>

                <div className="family-mini-card">
                  <strong>Maman</strong>
                  <small>Travail · 09:00</small>
                </div>

                <div className="family-mini-card">
                  <strong>Léa</strong>
                  <small>Sport · 17:30</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;