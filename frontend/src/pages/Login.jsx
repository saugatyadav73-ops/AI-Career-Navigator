import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Login failed.");
        return;
      }

      localStorage.setItem(
        "authToken",
        data.token
      );

      localStorage.setItem(
        "student",
        JSON.stringify(data.student)
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.student)
      );

      alert("Login successful!");

      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error:", error);

      alert(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        className="auth-card"
        style={{
          width: "100%",
          maxWidth: "430px",
          boxSizing: "border-box",
        }}
      >
        <h1>
          🚀 AI Career Navigator
        </h1>

        <p>
          Personalized AI Career Guidance Platform
        </p>

        <form
          onSubmit={handleLogin}
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: "8px",
          }}
        >
          <label
            htmlFor="login-email"
            style={{
              display: "block",
              textAlign: "left",
              marginTop: "10px",
              fontWeight: "600",
            }}
          >
            Email
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            autoComplete="email"
            style={{
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <label
            htmlFor="login-password"
            style={{
              display: "block",
              textAlign: "left",
              marginTop: "10px",
              fontWeight: "600",
            }}
          >
            Password
          </label>

          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            autoComplete="current-password"
            style={{
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "15px",
            }}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          Don't have an account?{" "}

          <span
            className="link"
            onClick={() =>
              navigate("/register")
            }
            style={{
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;