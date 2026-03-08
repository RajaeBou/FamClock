import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div style={styles.container}>
      <h1>FamClock</h1>

      <p>Horloge familiale intelligente</p>

      <div style={styles.buttons}>
        <Link to="/login">
          <button style={styles.button}>Se connecter</button>
        </Link>

        <Link to="/create-family">
          <button style={styles.button}>Créer une famille</button>
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "100px",
  },
  buttons: {
    marginTop: "30px",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  },
  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default HomePage;