import logoWhereOclock from "../assets/logo.png";

function SplashScreen() {
  return (
    <div className="splash-page">
      <style>{`
        .splash-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: "Quicksand", "Inter", Arial, sans-serif;
          background:
            radial-gradient(circle at 16% 12%, rgba(255,255,255,0.95), transparent 34%),
            radial-gradient(circle at 82% 20%, rgba(255,255,255,0.58), transparent 30%),
            linear-gradient(135deg, #F8F1E8 0%, #F3E4D2 48%, #EBD8BE 100%);
          overflow: hidden;
        }

        .splash-card {
          position: relative;
          width: min(92vw, 680px);
          min-height: 460px;
          padding: 46px 38px;
          border-radius: 46px;
          background: rgba(255, 252, 247, 0.76);
          border: 1px solid rgba(255, 255, 255, 0.82);
          box-shadow: 0 28px 80px rgba(86, 64, 45, 0.14);
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          animation: splashCardIntro 0.7s ease-out forwards;
          overflow: hidden;
        }

        .splash-card::before {
          content: "";
          position: absolute;
          top: -80px;
          left: -80px;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          background: rgba(143, 168, 148, 0.12);
        }

        .splash-card::after {
          content: "";
          position: absolute;
          right: -85px;
          bottom: -85px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(199, 167, 125, 0.14);
        }

        .splash-glow {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255,255,255,0.82) 0%,
            rgba(255,255,255,0.35) 45%,
            transparent 72%
          );
          filter: blur(12px);
          animation: splashGlow 4.5s ease-in-out infinite;
        }

        .splash-logo {
          position: relative;
          z-index: 2;
          width: 300px;
          max-width: 78vw;
          height: auto;
          object-fit: contain;
          opacity: 0;
          transform: translateY(20px) scale(0.92);
          animation:
            logoIntro 1.15s cubic-bezier(0.2, 0.85, 0.25, 1) forwards,
            logoFloat 3.8s ease-in-out 1.15s infinite;
          filter: drop-shadow(0 16px 28px rgba(86, 64, 45, 0.13));
        }

        .splash-title {
          position: relative;
          z-index: 2;
          margin: 10px 0 0;
          font-size: clamp(34px, 5vw, 52px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -1px;
          color: #5F4A3D;
        }

        .splash-title span {
          color: #647E68;
        }

        .splash-subtitle {
          position: relative;
          z-index: 2;
          margin: 14px 0 0;
          color: #8A6A4F;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        .splash-loader {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 9px;
          margin-top: 30px;
        }

        .splash-loader span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #8FA894;
          animation: dotPulse 1.2s ease-in-out infinite;
        }

        .splash-loader span:nth-child(2) {
          animation-delay: 0.18s;
        }

        .splash-loader span:nth-child(3) {
          animation-delay: 0.36s;
        }

        @keyframes splashCardIntro {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes logoIntro {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.92);
          }

          60% {
            opacity: 1;
            transform: translateY(-5px) scale(1.03);
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
            transform: translateY(-7px) scale(1.01);
          }

          100% {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes splashGlow {
          0% {
            opacity: 0.65;
            transform: scale(0.96);
          }

          50% {
            opacity: 1;
            transform: scale(1.05);
          }

          100% {
            opacity: 0.65;
            transform: scale(0.96);
          }
        }

        @keyframes dotPulse {
          0%, 100% {
            opacity: 0.35;
            transform: translateY(0) scale(1);
          }

          50% {
            opacity: 1;
            transform: translateY(-4px) scale(1.12);
          }
        }

        @media (max-width: 600px) {
          .splash-page {
            padding: 18px;
          }

          .splash-card {
            width: 100%;
            min-height: 390px;
            padding: 34px 22px;
            border-radius: 34px;
          }

          .splash-logo {
            width: 230px;
            max-width: 82vw;
          }

          .splash-title {
            font-size: 34px;
          }

          .splash-subtitle {
            font-size: 12px;
            letter-spacing: 3px;
          }

          .splash-loader {
            margin-top: 24px;
          }
        }
      `}</style>

      <div className="splash-card">
        <div className="splash-glow"></div>

        <img
          src={logoWhereOclock}
          alt="Where O'Clock"
          className="splash-logo"
        />

        <h1 className="splash-title">
          Where <span>O’Clock</span>
        </h1>

        <p className="splash-subtitle">Home · Family · Time</p>

        <div className="splash-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;