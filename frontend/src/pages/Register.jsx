import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const [step, setStep] = useState("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [verificationCode, setVerificationCode] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] =
    useState(false);

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    if (!password) {
      alert("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      alert(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Registration failed."
        );

        return;
      }

      // -------------------------------------------------
      // EMAIL VERIFICATION REQUIRED
      // -------------------------------------------------

      if (data.requiresVerification) {
        setEmail(
          data.email || email.trim()
        );

        setStep("verify");

        alert(
          "Registration successful! A verification code has been sent to your email."
        );

        return;
      }

      // Fallback in case backend returns a token.
      if (data.token) {
        localStorage.setItem(
          "authToken",
          data.token
        );
      }

      if (data.student) {
        localStorage.setItem(
          "student",
          JSON.stringify(data.student)
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.student)
        );
      }

      alert("Registration successful!");

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Registration Error:",
        error
      );

      alert(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VERIFY EMAIL
  // =====================================================

  const handleVerifyEmail = async (e) => {
    e.preventDefault();

    const cleanCode =
      verificationCode.trim();

    if (!cleanCode) {
      alert(
        "Please enter the verification code."
      );

      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      alert(
        "Verification code must be exactly 6 digits."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/verify-email`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            code: cleanCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Email verification failed."
        );

        return;
      }

      alert(
        "Email verified successfully! You can now log in."
      );

      navigate("/login");
    } catch (error) {
      console.error(
        "Email Verification Error:",
        error
      );

      alert(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RESEND VERIFICATION CODE
  // =====================================================

  const handleResendCode = async () => {
    if (!email.trim()) {
      alert("Email is required.");
      return;
    }

    try {
      setResendLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/resend-verification`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Failed to resend verification code."
        );

        return;
      }

      setVerificationCode("");

      alert(
        "A new verification code has been sent to your email."
      );
    } catch (error) {
      console.error(
        "Resend Verification Error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // =====================================================
  // CHANGE EMAIL / BACK TO REGISTER
  // =====================================================

  const handleChangeEmail = () => {
    setStep("register");
    setVerificationCode("");
  };

  // =====================================================
  // VERIFICATION SCREEN
  // =====================================================

  if (step === "verify") {
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
          <h1>📧 Verify Your Email</h1>

          <p
            style={{
              textAlign: "center",
              lineHeight: "1.6",
            }}
          >
            We sent a 6-digit verification
            code to:
          </p>

          <p
            style={{
              textAlign: "center",
              fontWeight: "700",
              wordBreak: "break-word",
              marginBottom: "20px",
            }}
          >
            {email}
          </p>

          <form
            onSubmit={handleVerifyEmail}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: "8px",
            }}
          >
            <label
              htmlFor="verification-code"
              style={{
                display: "block",
                textAlign: "left",
                marginTop: "10px",
                fontWeight: "600",
              }}
            >
              Verification Code
            </label>

            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => {
                const value =
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                setVerificationCode(value);
              }}
              autoComplete="one-time-code"
              style={{
                width: "100%",
                boxSizing: "border-box",
                textAlign: "center",
                fontSize: "24px",
                letterSpacing: "8px",
                fontWeight: "700",
              }}
            />

            <button
              type="submit"
              disabled={
                loading ||
                verificationCode.length !== 6
              }
              style={{
                width: "100%",
                marginTop: "15px",
              }}
            >
              {loading
                ? "Verifying..."
                : "Verify Email"}
            </button>
          </form>

          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendLoading}
              style={{
                width: "100%",
              }}
            >
              {resendLoading
                ? "Sending..."
                : "Resend Verification Code"}
            </button>
          </div>

          <p
            style={{
              marginTop: "15px",
              textAlign: "center",
            }}
          >
            Wrong email?{" "}
            <span
              onClick={handleChangeEmail}
              style={{
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Change Email
            </span>
          </p>

          <p
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            Already verified?{" "}
            <span
              onClick={() =>
                navigate("/login")
              }
              style={{
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // REGISTRATION SCREEN
  // =====================================================

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
        <h1>🚀 AI Career Navigator</h1>

        <p>
          Create your student account
        </p>

        <form
          onSubmit={handleRegister}
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: "8px",
          }}
        >
          <label
            htmlFor="register-name"
            style={{
              display: "block",
              textAlign: "left",
              marginTop: "10px",
              fontWeight: "600",
            }}
          >
            Full Name
          </label>

          <input
            id="register-name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            autoComplete="name"
            style={{
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <label
            htmlFor="register-email"
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
            id="register-email"
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
            htmlFor="register-password"
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
            id="register-password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            autoComplete="new-password"
            style={{
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <small
            style={{
              textAlign: "left",
              opacity: 0.7,
            }}
          >
            Password must be at least 6
            characters.
          </small>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "15px",
            }}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <span
            onClick={() =>
              navigate("/login")
            }
            style={{
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;