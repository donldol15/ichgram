import { useState } from "react";
import { useNavigate } from "react-router-dom";
import phones from "../../assets/phones.svg";
import logo from "../../assets/logo.svg";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your email or username and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      saveAuth(data.token, data.user);

      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);

      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-layout">
        <img
          className="login-phones"
          src={phones}
          alt="Ichgram on smartphones"
        />

        <div className="login-right">
          <section className="login-card">
            <img className="login-logo" src={logo} alt="Ichgram" />

            <form className="login-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Username, or email"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {error && <p className="login-error">{error}</p>}

              <button className="login-button" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <a
              href="#"
              className="forgot-password"
              onClick={(event) => event.preventDefault()}
            >
              Forgot password?
            </a>
          </section>

          <section className="signup-card">
            <span>Don't have an account?</span>

            <a href="/register">Sign up</a>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Login;
