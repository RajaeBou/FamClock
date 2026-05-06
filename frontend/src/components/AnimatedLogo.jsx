import "./AnimatedLogo.css";
import logo from "../assets/logo-whereoclock.png";

function AnimatedLogo() {
  return (
    <div className="logo-wrapper">
      <img
        src={logo}
        alt="Where O'clock logo"
        className="animated-logo"
      />
    </div>
  );
}

export default AnimatedLogo;