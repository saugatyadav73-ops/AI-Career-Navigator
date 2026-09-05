import React from "react";
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
// READ LOCAL STORAGE
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
// CHECK MODULE COMPLETION
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
// GET NUMBER FROM OBJECT
// =====================================================

function getNumber(data, keys) {
  if (!data || typeof data !== "object") {
    return 0;
  }

  for (const key of keys) {
    const value = Number(data[key]);

    if (
      !Number.isNaN(value) &&
      value >= 0 &&
      value <= 100
    ) {
      return value;
    }
  }

  return 0;
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
    if (
      !object ||
      typeof object !== "object"
    ) {
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

  // ===================================================
  // GET ALL DATA
  // ===================================================

  const profile =
    getStorageData("studentProfile");

  const skillAssessment =
    getStorageData("skillAssessment");

  const interestAssessment =
    getStorageData("interestAssessment");

  const careerAnalysis =
    getStorageData("careerAnalysis");

  const skillGap =
    getStorageData("skillGap");

  const roadmap =
    getStorageData("roadmap");

  const projects =
    getStorageData("projects");

  const readiness =
    getStorageData("readiness");

  const resume =
    getStorageData("resume");

  const jobPreparation =
    getStorageData("jobPreparation");

  const mockInterview =
    getStorageData("mockInterview");

  // ===================================================
  // MODULE PROGRESS
  // ===================================================

  const completedModules =
    modules.filter((module) =>
      isModuleCompleted(
        module.storageKey
      )
    ).length;

  const progress =
    Math.round(
      (completedModules /
        modules.length) *
        100
    );

  // ===================================================
  // NEXT MODULE
  // ===================================================

  const nextModule =
    modules.find(
      (module) =>
        !isModuleCompleted(
          module.storageKey
        )
    ) || modules[modules.length - 1];

  // ===================================================
  // CAREER
  // ===================================================

  let career = findCareer(
    careerAnalysis,
    jobPreparation,
    mockInterview,
    skillGap,
    readiness,
    profile
  );

  if (!career) {
    career = "Not decided yet";
  }

  // ===================================================
  // SCORES
  // ===================================================

  const skillScore = Math.min(
    100,
    getNumber(
      skillAssessment,
      [
        "percentage",
        "scorePercentage",
        "score",
      ]
    )
  );

  const interestScore = Math.min(
    100,
    getNumber(
      interestAssessment,
      [
        "percentage",
        "scorePercentage",
        "score",
      ]
    )
  );

  const readinessScore = Math.min(
    100,
    getNumber(
      readiness,
      [
        "score",
        "readinessScore",
        "percentage",
        "readinessPercentage",
      ]
    )
  );

  const jobScore = Math.min(
    100,
    getNumber(
      jobPreparation,
      [
        "percentage",
        "scorePercentage",
        "score",
      ]
    )
  );

  // ---------------------------------------------------
  // MOCK INTERVIEW SCORE
  // ---------------------------------------------------

  const mockScore = Math.min(
    100,
    getNumber(
      mockInterview,
      [
        "percentage",
        "score",
        "scorePercentage",
        "overallScore",
      ]
    )
  );

  // ===================================================
  // MOCK INTERVIEW DETAILS
  // ===================================================

  const mockInterviewCompleted =
    Boolean(
      mockInterview.completed
    ) ||
    isModuleCompleted(
      "mockInterview"
    );

  const mockReadinessLevel =
    mockInterview?.report
      ?.readinessLevel ||
    mockInterview?.readinessLevel ||
    "";

  const mockTechnicalScore =
    Math.min(
      100,
      getNumber(
        mockInterview?.report,
        [
          "technicalKnowledge",
        ]
      )
    );

  const mockCommunicationScore =
    Math.min(
      100,
      getNumber(
        mockInterview?.report,
        [
          "communication",
        ]
      )
    );

  const mockProblemSolvingScore =
    Math.min(
      100,
      getNumber(
        mockInterview?.report,
        [
          "problemSolving",
        ]
      )
    );

  // ===================================================
  // OVERALL SCORE
  // ===================================================

  const scoreValues = [
    skillScore,
    interestScore,
    readinessScore,
    jobScore,
    mockScore,
  ].filter(
    (score) => score > 0
  );

  const overallScore =
    scoreValues.length > 0
      ? Math.round(
          scoreValues.reduce(
            (total, score) =>
              total + score,
            0
          ) /
            scoreValues.length
        )
      : 0;

  // ===================================================
  // RESUME STATUS
  // ===================================================

  const resumeCompleted =
    isModuleCompleted("resume") ||
    Object.keys(resume).length > 0;

  // ===================================================
  // SKILL GAP COUNT
  // ===================================================

  let skillGapCount = 0;

  if (Array.isArray(skillGap)) {
    skillGapCount =
      skillGap.length;
  } else if (
    Array.isArray(
      skillGap.missingSkills
    )
  ) {
    skillGapCount =
      skillGap.missingSkills.length;
  } else if (
    Array.isArray(
      skillGap.skillGaps
    )
  ) {
    skillGapCount =
      skillGap.skillGaps.length;
  } else if (
    Array.isArray(skillGap.gaps)
  ) {
    skillGapCount =
      skillGap.gaps.length;
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

      {/* =================================================
          HEADER
      ================================================= */}

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
              .map((word) =>
                word.charAt(0)
              )
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

      {/* =================================================
          CAREER HERO
      ================================================= */}

      <section className="career-hero">

        <div className="hero-content">

          <span className="hero-label">
            YOUR RECOMMENDED CAREER
          </span>

          <h2>
            {career}
          </h2>

          <p>
            Your AI Career Navigator journey
            is {progress}% complete. Continue
            the remaining modules to improve
            your career readiness.
          </p>

          <button
            className="hero-button"
            onClick={() =>
              navigate(
                nextModule.path
              )
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

      {/* =================================================
          STAT CARDS
      ================================================= */}

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
              {modules.length -
                completedModules}
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

      {/* =================================================
          FINAL CAREER SCORE
      ================================================= */}

      <section className="final-score-section">

        <div>

          <span className="section-label">
            AI CAREER INSIGHT
          </span>

          <h2>
            Overall Career Readiness
          </h2>

          <p>
            Your overall preparation is based
            on your completed assessments,
            readiness, job preparation and
            mock interview performance.
          </p>

        </div>

        <div className="overall-score">

          <strong>
            {overallScore}%
          </strong>

          <span>
            Overall Score
          </span>

        </div>

      </section>

      {/* =================================================
          PERFORMANCE SUMMARY
      ================================================= */}

      <section className="performance-section">

        <div className="section-heading">

          <div>

            <span className="section-label">
              PERFORMANCE
            </span>

            <h2>
              Your Career Preparation
            </h2>

          </div>

        </div>

        <div className="performance-grid">

          {/* SKILL */}

          <div className="performance-card">

            <span className="performance-icon">
              🧠
            </span>

            <h3>
              Skill Assessment
            </h3>

            <strong>
              {skillScore > 0
                ? `${skillScore}%`
                : "Not completed"}
            </strong>

          </div>

          {/* INTEREST */}

          <div className="performance-card">

            <span className="performance-icon">
              ❤️
            </span>

            <h3>
              Interest Assessment
            </h3>

            <strong>
              {interestScore > 0
                ? `${interestScore}%`
                : "Not completed"}
            </strong>

          </div>

          {/* READINESS */}

          <div className="performance-card">

            <span className="performance-icon">
              🚀
            </span>

            <h3>
              Career Readiness
            </h3>

            <strong>
              {readinessScore > 0
                ? `${readinessScore}%`
                : "Not completed"}
            </strong>

          </div>

          {/* JOB PREPARATION */}

          <div className="performance-card">

            <span className="performance-icon">
              💼
            </span>

            <h3>
              Job Preparation
            </h3>

            <strong>
              {jobScore > 0
                ? `${jobScore}%`
                : "Not completed"}
            </strong>

          </div>

          {/* MOCK INTERVIEW */}

          <div className="performance-card">

            <span className="performance-icon">
              🎤
            </span>

            <h3>
              Mock Interview
            </h3>

            <strong>
              {mockScore > 0
                ? `${mockScore}%`
                : "Not completed"}
            </strong>

            {mockReadinessLevel && (
              <small>
                {mockReadinessLevel}
              </small>
            )}

          </div>

          {/* SKILL GAPS */}

          <div className="performance-card">

            <span className="performance-icon">
              📉
            </span>

            <h3>
              Skill Gaps
            </h3>

            <strong>
              {skillGapCount}
            </strong>

          </div>

        </div>

      </section>

      {/* =================================================
          RESUME + MOCK INTERVIEW STATUS
      ================================================= */}

      <section className="status-section">

        {/* RESUME */}

        <div className="status-card-large">

          <div className="status-icon-large">
            📄
          </div>

          <div>

            <span className="section-label">
              RESUME
            </span>

            <h2>
              Resume Status
            </h2>

            <p>
              {resumeCompleted
                ? "Your resume data is available. Make sure it is ready for job applications."
                : "Complete your Resume module before applying for jobs."}
            </p>

            <button
              className="small-action-button"
              onClick={() =>
                navigate("/resume")
              }
            >
              {resumeCompleted
                ? "Review Resume →"
                : "Complete Resume →"}
            </button>

          </div>

        </div>

        {/* MOCK INTERVIEW */}

        <div className="status-card-large">

          <div className="status-icon-large">
            🎤
          </div>

          <div>

            <span className="section-label">
              INTERVIEW
            </span>

            <h2>
              Mock Interview
            </h2>

            <p>
              {mockInterviewCompleted
                ? `Your latest mock interview score is ${mockScore}%.`
                : "Practice technical questions for your recommended career."}
            </p>

            {/* INTERVIEW BREAKDOWN */}

            {mockInterviewCompleted &&
              mockReadinessLevel && (
                <div
                  style={{
                    marginTop: "12px",
                    marginBottom: "12px",
                  }}
                >

                  <strong>
                    AI Readiness:{" "}
                  </strong>

                  <span>
                    {mockReadinessLevel}
                  </span>

                </div>
              )}

            {mockInterviewCompleted &&
              (mockTechnicalScore > 0 ||
                mockCommunicationScore > 0 ||
                mockProblemSolvingScore > 0) && (
                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    flexWrap: "wrap",
                    marginBottom: "14px",
                    fontSize: "13px",
                  }}
                >

                  {mockTechnicalScore > 0 && (
                    <span>
                      Technical:{" "}
                      <strong>
                        {mockTechnicalScore}%
                      </strong>
                    </span>
                  )}

                  {mockCommunicationScore > 0 && (
                    <span>
                      Communication:{" "}
                      <strong>
                        {mockCommunicationScore}%
                      </strong>
                    </span>
                  )}

                  {mockProblemSolvingScore > 0 && (
                    <span>
                      Problem Solving:{" "}
                      <strong>
                        {mockProblemSolvingScore}%
                      </strong>
                    </span>
                  )}

                </div>
              )}

            <button
              className="small-action-button"
              onClick={() =>
                navigate(
                  "/mock-interview"
                )
              }
            >
              {mockInterviewCompleted
                ? "Practice Again →"
                : "Start Interview →"}
            </button>

          </div>

        </div>

      </section>

      {/* =================================================
          MODULE SECTION
      ================================================= */}

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

            {completedModules}/
            {modules.length}

            <span>
              {" "}completed
            </span>

          </div>

        </div>

        <div className="modules-grid">

          {modules.map(
            (module, index) => {

              const completed =
                isModuleCompleted(
                  module.storageKey
                );

              const previousCompleted =
                index === 0 ||
                isModuleCompleted(
                  modules[
                    index - 1
                  ].storageKey
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
                      {String(index + 1)
                        .padStart(2, "0")}
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
                          navigate(
                            module.path
                          )
                        }
                      >
                        Review Module
                        <span>→</span>
                      </button>
                    ) : unlocked ? (
                      <button
                        className="module-button"
                        onClick={() =>
                          navigate(
                            module.path
                          )
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
            }
          )}

        </div>

      </section>

    </div>
  );
}

export default Dashboard;