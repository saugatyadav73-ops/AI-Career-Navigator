
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// =====================================================
// MODULES
// =====================================================

const modules = [
  {
    title: "Student Profile",
    description:
      "Complete your personal and academic information.",
    path: "/profile",
    icon: "👤",
    storageKey: "studentProfile",
  },
  {
    title: "Skill Assessment",
    description:
      "Test your programming and technical knowledge.",
    path: "/skill-assessment",
    icon: "🧠",
    storageKey: "skillAssessment",
  },
  {
    title: "Interest Assessment",
    description:
      "Discover your interests and preferred career areas.",
    path: "/interests",
    icon: "❤️",
    storageKey: "interestAssessment",
  },
  {
    title: "Career Analysis",
    description:
      "Analyze your profile and identify suitable careers.",
    path: "/careers",
    icon: "🎯",
    storageKey: "careerAnalysis",
  },
  {
    title: "Skill Gap Analysis",
    description:
      "Find the skills you need to improve.",
    path: "/skill-gap",
    icon: "📊",
    storageKey: "skillGap",
  },
  {
    title: "Learning Roadmap",
    description:
      "Follow a personalized path toward your career.",
    path: "/roadmap",
    icon: "🗺️",
    storageKey: "roadmap",
  },
  {
    title: "Project Recommendation",
    description:
      "Get projects that match your career goals.",
    path: "/projects",
    icon: "💻",
    storageKey: "projects",
  },
  {
    title: "Career Readiness",
    description:
      "Check how prepared you are for your target career.",
    path: "/readiness",
    icon: "🚀",
    storageKey: "readiness",
  },
  {
    title: "Resume Analysis",
    description:
      "Analyze and improve your resume.",
    path: "/resume",
    icon: "📄",
    storageKey: "resume",
  },
  {
    title: "Job Preparation",
    description:
      "Prepare for interviews and your first job.",
    path: "/job-preparation",
    icon: "💼",
    storageKey: "jobPreparation",
  },
  {
    title: "Mock Interview",
    description:
      "Practice technical interview questions for your career.",
    path: "/mock-interview",
    icon: "🎤",
    storageKey: "mockInterview",
  },
];

// =====================================================
// LOCAL STORAGE
// =====================================================

function getStorageData(storageKey) {
  const data = localStorage.getItem(storageKey);

  if (!data) {
    return {};
  }

  try {
    const parsedData = JSON.parse(data);

    if (parsedData === null) {
      return {};
    }

    return parsedData;
  } catch {
    return {};
  }
}

// =====================================================
// MODULE COMPLETION
// =====================================================

function isModuleCompleted(storageKey) {
  const data = localStorage.getItem(storageKey);

  if (!data) {
    return false;
  }

  try {
    const parsedData = JSON.parse(data);

    if (parsedData === null) {
      return false;
    }

    if (Array.isArray(parsedData)) {
      return parsedData.length > 0;
    }

    if (typeof parsedData === "object") {
      return Object.keys(parsedData).length > 0;
    }

    return true;
  } catch {
    return data.trim() !== "";
  }
}

// =====================================================
// FIND CAREER
// =====================================================

function findCareer(...objects) {
  const careerKeys = [
    "recommendedCareer",
    "recommendedCareerName",
    "career",
    "careerName",
    "targetCareer",
    "selectedCareer",
    "bestCareer",
    "topCareer",
  ];

  for (const object of objects) {
    if (!object || typeof object !== "object") {
      continue;
    }

    for (const key of careerKeys) {
      if (
        typeof object[key] === "string" &&
        object[key].trim() !== ""
      ) {
        return object[key].trim();
      }
    }
  }

  return "";
}

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refreshDashboard = () => {
      setRefreshKey((previous) => previous + 1);
    };

    window.addEventListener(
      "mockInterviewUpdated",
      refreshDashboard
    );

    window.addEventListener(
      "readinessUpdated",
      refreshDashboard
    );

    window.addEventListener(
      "storage",
      refreshDashboard
    );

    return () => {
      window.removeEventListener(
        "mockInterviewUpdated",
        refreshDashboard
      );

      window.removeEventListener(
        "readinessUpdated",
        refreshDashboard
      );

      window.removeEventListener(
        "storage",
        refreshDashboard
      );
    };
  }, []);

  void refreshKey;

  // ===================================================
  // DATA
  // ===================================================

  const profile = getStorageData("studentProfile");

  const careerAnalysis =
    getStorageData("careerAnalysis");

  const careerRecommendation =
    getStorageData("careerRecommendation");

  // ===================================================
  // PROGRESS
  // ===================================================

  const completedModules = modules.filter((module) =>
    isModuleCompleted(module.storageKey)
  ).length;

  const progress = Math.round(
    (completedModules / modules.length) * 100
  );

  // ===================================================
  // NEXT MODULE
  // ===================================================

  const nextModule =
    modules.find(
      (module) =>
        !isModuleCompleted(module.storageKey)
    ) || modules[modules.length - 1];

  // ===================================================
  // CAREER
  // ===================================================

  let career = findCareer(
    careerRecommendation,
    careerAnalysis,
    profile
  );

  if (!career) {
    career = "Not decided yet";
  }

  // ===================================================
  // USER NAME
  // ===================================================

  const userName =
    profile.name ||
    profile.fullName ||
    "Saugat Yadav";

  // ===================================================
  // RETURN
  // ===================================================

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-header">

        <div className="welcome-area">

          <span className="eyebrow">
            AI CAREER NAVIGATOR
          </span>

          <h1>
            Welcome back, {userName} 👋
          </h1>

          <p>
            Continue your journey toward the
            right career.
          </p>

        </div>

        <div className="dashboard-user">

          <div className="dashboard-avatar">
            {String(userName)
              .split(" ")
              .map((word) => word.charAt(0))
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {userName}
            </strong>

            <span>
              Computer Science Student
            </span>
          </div>

        </div>

      </div>

      {/* CAREER HERO */}

      <section className="career-hero">

        <div className="hero-content">

          <span className="hero-label">
            YOUR RECOMMENDED CAREER
          </span>

          <h2>
            {career}
          </h2>

          <p>
            Your AI Career Navigator journey is{" "}
            {progress}% complete. Continue the
            remaining modules to improve your
            career readiness.
          </p>

          <button
            className="hero-button"
            onClick={() =>
              navigate(nextModule.path)
            }
          >
            Continue Journey →
          </button>

        </div>

        <div className="hero-progress">

          <div
            className="progress-circle"
            style={{
              background:
                `conic-gradient(#2563eb ${
                  progress * 3.6
                }deg, #e2e8f0 0deg)`,
            }}
          >

            <div className="progress-circle-inner">

              <strong>
                {progress}%
              </strong>

              <span>
                Complete
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* STAT CARDS */}

      <section className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon stat-blue">
            ✓
          </div>

          <div>
            <span>
              Completed
            </span>

            <strong>
              {completedModules}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon stat-orange">
            🔒
          </div>

          <div>
            <span>
              Remaining
            </span>

            <strong>
              {modules.length - completedModules}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon stat-green">
            📈
          </div>

          <div>
            <span>
              Progress
            </span>

            <strong>
              {progress}%
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon stat-purple">
            🎯
          </div>

          <div>
            <span>
              Career Goal
            </span>

            <strong
              style={{
                fontSize: "14px",
              }}
            >
              {career}
            </strong>
          </div>

        </div>

      </section>

      {/* CAREER NAVIGATOR MODULES */}

      <section className="modules-section">

        <div className="section-heading">

          <div>

            <span className="section-label">
              LEARNING PATH
            </span>

            <h2>
              Career Navigator Modules
            </h2>

            <p>
              Complete each step to unlock your
              personalized career journey.
            </p>

          </div>

          <div className="module-count">

            {completedModules}/{modules.length}

            <span>
              {" "}completed
            </span>

          </div>

        </div>

        <div className="modules-grid">

          {modules.map((module, index) => {

            const completed =
              isModuleCompleted(
                module.storageKey
              );

            const previousCompleted =
              index === 0 ||
              isModuleCompleted(
                modules[index - 1].storageKey
              );

            const unlocked =
              completed ||
              previousCompleted;

            return (
              <div
                key={module.path}
                className={`module-card ${
                  completed
                    ? "module-completed"
                    : !unlocked
                    ? "module-locked"
                    : "module-available"
                }`}
              >

                <div className="module-top">

                  <span className="module-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="module-icon">
                    {unlocked
                      ? module.icon
                      : "🔒"}
                  </div>

                </div>

                <div className="module-content">

                  <h3>
                    {module.title}
                  </h3>

                  <p>
                    {module.description}
                  </p>

                  <div className="module-status">

                    {completed ? (
                      <span className="status completed">
                        ✓ Completed
                      </span>
                    ) : unlocked ? (
                      <span className="status available">
                        ● Available
                      </span>
                    ) : (
                      <span className="status locked">
                        🔒 Locked
                      </span>
                    )}

                  </div>

                  {completed ? (

                    <button
                      className="module-button"
                      onClick={() =>
                        navigate(module.path)
                      }
                    >
                      Review Module
                      <span>→</span>
                    </button>

                  ) : unlocked ? (

                    <button
                      className="module-button"
                      onClick={() =>
                        navigate(module.path)
                      }
                    >
                      Start Module
                      <span>→</span>
                    </button>

                  ) : (

                    <button
                      className="module-button module-button-locked"
                      disabled
                    >
                      Complete Previous Step
                    </button>

                  )}

                </div>

              </div>
            );
          })}

        </div>

      </section>

    </div>
  );
}

export default Dashboard;

