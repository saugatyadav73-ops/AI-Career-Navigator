import { NavLink, useNavigate } from "react-router-dom";

// =====================================================
// SIDEBAR MENU ITEMS
// =====================================================

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "🏠",
  },
  {
    name: "Student Profile",
    path: "/profile",
    icon: "👤",
  },
  {
    name: "Skill Assessment",
    path: "/skill-assessment",
    icon: "🧠",
  },
  {
    name: "Interest Assessment",
    path: "/interests",
    icon: "❤️",
  },
  {
    name: "Career Analysis",
    path: "/careers",
    icon: "🎯",
  },
  {
    name: "Skill Gap",
    path: "/skill-gap",
    icon: "📊",
  },
  {
    name: "Learning Roadmap",
    path: "/roadmap",
    icon: "🗺️",
  },
  {
    name: "Projects",
    path: "/projects",
    icon: "💻",
  },
  {
    name: "Career Readiness",
    path: "/readiness",
    icon: "🚀",
  },
  {
    name: "Resume Analysis",
    path: "/resume",
    icon: "📄",
  },
  {
    name: "Job Preparation",
    path: "/job-preparation",
    icon: "💼",
  },
  {
    name: "Mock Interview",
    path: "/mock-interview",
    icon: "🎤",
  },  {
    name: "AI Tools (10 features)",
    path: "/ai-tools",
    icon: "🤖",
  },
];

// =====================================================
// GET CURRENT STUDENT
// =====================================================

const getCurrentStudent = () => {
  try {
    const student = localStorage.getItem("student");

    if (!student) {
      return null;
    }

    return JSON.parse(student);
  } catch (error) {
    console.error("Error reading student:", error);
    return null;
  }
};

// =====================================================
// GET INITIALS
// =====================================================

const getInitials = (name = "") => {
  const cleanName = String(name).trim();

  if (!cleanName) {
    return "ST";
  }

  const parts = cleanName
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
};

// =====================================================
// SIDEBAR
// =====================================================

function Sidebar() {
  const navigate = useNavigate();

  const student = getCurrentStudent();

  const studentName =
    student?.name ||
    student?.fullName ||
    "Student";

  const studentEmail =
    student?.email ||
    "";

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    try {
      // Remove authentication information
      localStorage.removeItem("authToken");
      localStorage.removeItem("student");
      localStorage.removeItem("user");

      // Go to Login page
      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);

      // Fallback navigation
      window.location.href = "/login";
    }
  };

  // =====================================================
  // REGISTER NEW ACCOUNT
  // =====================================================

  const handleRegister = () => {
    navigate("/register");
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <aside className="sidebar">

      {/* =====================================================
          LOGO
      ===================================================== */}

      <div className="sidebar-logo">

        <div className="logo-icon">
          AI
        </div>

        <div className="logo-text">
          <h2>Career Navigator</h2>

          <span>
            AI Career Guidance
          </span>
        </div>

      </div>

      {/* =====================================================
          MENU
      ===================================================== */}

      <nav className="sidebar-nav">

        <p className="menu-title">
          MAIN MENU
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>
              {item.name}
            </span>
          </NavLink>
        ))}

      </nav>

      {/* =====================================================
          BOTTOM SECTION
      ===================================================== */}

      <div className="sidebar-bottom">

        {/* ===================================================
            HELP
        =================================================== */}

        <div className="sidebar-help">

          <div className="help-icon">
            ?
          </div>

          <div>
            <strong>
              Need Help?
            </strong>

            <p>
              Explore your career journey
            </p>
          </div>

        </div>

        {/* ===================================================
            ACCOUNT ACTIONS
        =================================================== */}

        <div
          className="sidebar-account"
          style={{
            marginBottom: "12px",
            padding: "10px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.05)",
          }}
        >

          {/* REGISTER */}

          <button
            type="button"
            onClick={handleRegister}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              marginBottom: "6px",
              border: "none",
              borderRadius: "8px",
              background: "transparent",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <span
              style={{
                fontSize: "16px",
              }}
            >
              📝
            </span>

            <span>
              Register New Account
            </span>
          </button>

          {/* LOGIN */}

          <button
            type="button"
            onClick={handleLogin}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              marginBottom: "6px",
              border: "none",
              borderRadius: "8px",
              background: "transparent",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <span
              style={{
                fontSize: "16px",
              }}
            >
              🔑
            </span>

            <span>
              Login
            </span>
          </button>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              border: "none",
              borderRadius: "8px",
              background: "rgba(239,68,68,0.12)",
              color: "#fca5a5",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              textAlign: "left",
            }}
          >
            <span
              style={{
                fontSize: "16px",
              }}
            >
              🚪
            </span>

            <span>
              Logout
            </span>
          </button>

        </div>

        {/* ===================================================
            CURRENT STUDENT
        =================================================== */}

        <div className="sidebar-user">

          <div className="user-avatar">
            {getInitials(studentName)}
          </div>

          <div className="user-info">

            <strong>
              {studentName}
            </strong>

            <span>
              {studentEmail
                ? studentEmail
                : "Student"}
            </span>

          </div>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;