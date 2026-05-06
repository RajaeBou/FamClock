import { Link, useNavigate } from "react-router-dom";
import logoWhereOclock from "../assets/where-oclock-logo.png";

function HomePage() {
  const navigate = useNavigate();

  const familyId = localStorage.getItem("familyId");
  const familyName = localStorage.getItem("familyName");

  const handleLogout = () => {
    localStorage.removeItem("familyId");
    localStorage.removeItem("familyName");
    navigate("/home", { replace: true });
  };

  return (
    <div className="home-page">
      <style>{`
        :root {
          --cream: #F8F1E8;
          --cream-light: #FFF9F1;
          --beige: #E7D1B5;
          --wood: #8A6A4F;
          --wood-dark: #5F4A3D;
          --sage: #8FA894;
          --sage-dark: #647E68;
          --text: #4A4038;
          --muted: #83756B;
          --white-soft: rgba(255, 252, 247, 0.74);
          --shadow: 0 28px 80px rgba(86, 64, 45, 0.14);
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
            radial-gradient(circle at 15% 10%, rgba(255,255,255,0.95), transparent 32%),
            radial-gradient(circle at 86% 22%, rgba(255,255,255,0.52), transparent 28%),
            linear-gradient(135deg, #F8F1E8 0%, #F3E4D2 48%, #EBD8BE 100%);
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
          border-radius: 28px;
          background: rgba(255, 252, 247, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow: 0 18px 45px rgba(86, 64, 45, 0.08);
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
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: rgba(255, 249, 241, 0.88);
          border: 1px solid rgba(199, 167, 125, 0.32);
          box-shadow: 0 12px 28px rgba(122, 92, 62, 0.12);
          overflow: hidden;
        }

        .brand-logo img {
          width: 42px;
          height: 42px;
          object-fit: contain;
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
          margin-top: 4px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 800;
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

        .nav-active {
          color: var(--wood);
          background: rgba(232, 215, 191, 0.62);
        }

        .nav-link {
          color: var(--muted);
          background: rgba(255,255,255,0.42);
        }

        .nav-primary {
          color: white;
          background: linear-gradient(145deg, var(--sage), var(--sage-dark));
          box-shadow: 0 14px 28px rgba(100, 126, 104, 0.24);
        }

        .logout {
          color: #9A5A45;
          background: rgba(255,255,255,0.66);
          border: 1px solid rgba(199, 167, 125, 0.28) !important;
        }

        .hero {
          min-height: calc(100vh - 130px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 56px;
          padding: 56px 12px 28px;
        }

        .hero-content {
          animation: fadeUp 0.65s ease-out;
        }

        .eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 22px;
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(255, 249, 241, 0.7);
          border: 1px solid rgba(255,255,255,0.82);
          color: var(--wood);
          font-size: 13px;
          font-weight: 900;
        }

        .eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--sage);
          box-shadow: 0 0 0 6px rgba(143, 168, 148, 0.16);
        }

        .hero-title {
          margin: 0;
          font-size: clamp(48px, 7vw, 80px);
          line-height: 0.96;
          letter-spacing: -2.4px;
          color: var(--text);
          font-weight: 900;
        }

        .hero-title span {
          color: var(--sage-dark);
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
          min-height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 26px;
          border-radius: 18px;
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
          box-shadow: 0 18px 36px rgba(100, 126, 104, 0.25);
        }

        .btn-secondary {
          color: var(--wood);
          background: rgba(255, 249, 241, 0.78);
          border: 1px solid rgba(199, 167, 125, 0.36);
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
          background: rgba(255, 249, 241, 0.56);
          border: 1px solid rgba(255,255,255,0.66);
          font-size: 13px;
          font-weight: 900;
        }

        .logo-zone {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 520px;
          animation: fadeUp 0.85s ease-out;
        }

        .logo-glow {
          position: absolute;
          width: 470px;
          height: 470px;
          border-radius: 50%;
          background:
            radial-gradient(circle, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.36) 42%, transparent 72%);
          filter: blur(12px);
          animation: glowPulse 5s ease-in-out infinite;
        }

        .logo-card {
          position: relative;
          width: min(100%, 520px);
          min-height: 540px;
          padding: 34px 26px 32px;
          border-radius: 46px;
          background: rgba(255, 252, 247, 0.66);
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: var(--shadow);
          backdrop-filter: blur(20px);
          text-align: center;
          overflow: hidden;
        }

        .logo-card::before {
          content: "";
          position: absolute;
          top: -80px;
          left: -80px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: rgba(143, 168, 148, 0.12);
        }

        .logo-card::after {
          content: "";
          position: absolute;
          right: -80px;
          bottom: -80px;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          background: rgba(199, 167, 125, 0.13);
        }

        .soft-orbit {
          position: absolute;
          top: 70px;
          left: 50%;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          transform: translateX(-50%);
          border: 1px solid rgba(100, 126, 104, 0.12);
          animation: slowRotate 22s linear infinite;
        }

        .soft-orbit::before {
          content: "";
          position: absolute;
          top: 34px;
          right: 44px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: rgba(143, 168, 148, 0.5);
          box-shadow: 0 0 0 8px rgba(143, 168, 148, 0.09);
        }

        .soft-orbit::after {
          content: "";
          position: absolute;
          left: 44px;
          bottom: 64px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(199, 167, 125, 0.55);
          box-shadow: 0 0 0 8px rgba(199, 167, 125, 0.1);
        }

        .main-logo {
          position: relative;
          z-index: 2;
          width: min(380px, 82vw);
          height: auto;
          object-fit: contain;
          opacity: 0;
          transform: translateY(26px) scale(0.92);
          animation:
            logoIntro 1.35s cubic-bezier(0.2, 0.85, 0.25, 1) forwards,
            logoFloat 4.6s ease-in-out 1.35s infinite;
          filter: drop-shadow(0 18px 32px rgba(86, 64, 45, 0.12));
        }

        .logo-title {
          position: relative;
          z-index: 2;
          margin: 12px 0 0;
          font-size: clamp(36px, 5vw, 56px);
          line-height: 1;
          color: var(--wood-dark);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .logo-title span {
          color: var(--sage-dark);
        }

        .logo-separator {
          position: relative;
          z-index: 2;
          width: 220px;
          height: 1px;
          margin: 20px auto 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(122, 92, 62, 0.35),
            transparent
          );
        }

        .logo-tagline {
          position: relative;
          z-index: 2;
          margin: 18px 0 0;
          color: var(--wood);
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        @keyframes logoIntro {
          0% {
            opacity: 0;
            transform: translateY(26px) scale(0.92);
          }

          58% {
            opacity: 1;
            transform: translateY(-7px) scale(1.025);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes logoFloat {
          0% {
            transform: translateY(0) scale(1);
          }

          50% {
            transform: translateY(-8px) scale(1.01);
          }

          100% {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes glowPulse {
          0% {
            opacity: 0.62;
            transform: scale(0.96);
          }

          50% {
            opacity: 1;
            transform: scale(1.04);
          }

          100% {
            opacity: 0.62;
            transform: scale(0.96);
          }
        }

        @keyframes slowRotate {
          from {
            transform: translateX(-50%) rotate(0deg);
          }

          to {
            transform: translateX(-50%) rotate(360deg);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
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
            text-align: center;
            gap: 38px;
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

          .logo-zone {
            min-height: auto;
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

          .logo-card {
            min-height: auto;
            padding: 26px 18px 30px;
            border-radius: 34px;
          }

          .main-logo {
            width: min(310px, 82vw);
          }

          .soft-orbit {
            width: 285px;
            height: 285px;
            top: 52px;
          }

          .logo-tagline {
            font-size: 12px;
            letter-spacing: 3px;
          }
        }
      `}</style>

      <main className="home-container">
        <header className="home-header">
          <Link to="/home" className="brand">
            <span className="brand-logo">
              <img src={logoWhereOclock} alt="Where O'Clock" />
            </span>

            <span className="brand-text">
              <strong>Where O’Clock</strong>
              <small>Home · Family · Time</small>
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
              Avec Where O’Clock, l’enfant comprend sa journée en un regard. L’horloge transforme les routines familiales en repères visuels simples, doux et rassurants, tout en limitant le recours aux écrans.
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
              <span className="mini-feature">Maison</span>
              <span className="mini-feature">Famille</span>
              <span className="mini-feature">Temps</span>
              <span className="mini-feature">Routines</span>
            </div>
          </div>

          <div className="logo-zone">
            <div className="logo-glow"></div>

            <div className="logo-card">
              <div className="soft-orbit"></div>

              <img
                src={logoWhereOclock}
                alt="Logo Where O'Clock"
                className="main-logo"
              />


              <div className="logo-separator"></div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;