import React, {
  useEffect,
  useMemo,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  completeModule,
  MODULE_KEYS,
} from "../utils/progress";

function SkillGap() {
  const navigate = useNavigate();

  // =====================================================
  // LOCAL STORAGE HELPER
  // =====================================================

  const getData = (key) => {
    try {
      const savedData =
        localStorage.getItem(key);

      if (!savedData) {
        return {};
      }

      return JSON.parse(savedData);
    } catch (error) {
      console.error(
        `Error reading ${key}:`,
        error
      );

      return {};
    }
  };

  // =====================================================
  // READ STUDENT PROFILE
  // =====================================================

  const profile = useMemo(() => {
    return getData("studentProfile");
  }, []);

  // =====================================================
  // READ SKILL ASSESSMENT
  // =====================================================

  const assessment = useMemo(() => {
    return getData("skillAssessment");
  }, []);

  // =====================================================
  // READ CAREER RECOMMENDATION
  // =====================================================

  const careerRecommendation =
    useMemo(() => {
      return getData(
        "careerRecommendation"
      );
    }, []);

  // =====================================================
  // READ AI CAREER ANALYSIS
  // =====================================================

  const aiCareerAnalysis =
    useMemo(() => {
      try {
        return (
          localStorage.getItem(
            "aiCareerAnalysis"
          ) || ""
        );
      } catch (error) {
        return "";
      }
    }, []);

  // =====================================================
  // PROFILE SKILLS
  // =====================================================

  const skills = useMemo(() => {
    const profileSkills =
      profile?.skills ||
      profile?.technicalSkills ||
      profile?.skill ||
      [];

    if (Array.isArray(profileSkills)) {
      return profileSkills
        .map((skill) =>
          String(skill)
            .trim()
            .toLowerCase()
        )
        .filter(Boolean);
    }

    if (
      typeof profileSkills ===
      "string"
    ) {
      return profileSkills
        .split(",")
        .map((skill) =>
          skill.trim().toLowerCase()
        )
        .filter(Boolean);
    }

    return [];
  }, [profile]);

  // =====================================================
  // SKILL ASSESSMENT
  // =====================================================

  const score = Number(
    assessment?.score || 0
  );

  const total = Number(
    assessment?.total || 10
  );

  const assessmentPercentage =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (score / total) * 100
          )
        )
      : 0;

  // =====================================================
  // GET RECOMMENDED CAREER
  //
  // Careers.jsx saves:
  // {
  //   career: "...",
  //   matchPercentage: ...
  // }
  //
  // We also support the old format.
  // =====================================================

  const recommendedCareer =
    careerRecommendation?.career ||
    careerRecommendation?.recommendedCareer ||
    "Software Developer";

  const careerMatch = Number(
    careerRecommendation
      ?.matchPercentage ||
      careerRecommendation
        ?.careerMatch ||
      0
  );

  // =====================================================
  // REQUIRED SKILLS BY CAREER
  // =====================================================

  const careerSkills = {
    "AI / ML Engineer": [
      "Python",
      "Data Structures & Algorithms",
      "Statistics",
      "NumPy",
      "Pandas",
      "Machine Learning",
      "Deep Learning",
      "TensorFlow",
      "SQL",
      "AI Projects",
    ],

    "Software Developer": [
      "Java",
      "C++",
      "Data Structures & Algorithms",
      "Object-Oriented Programming",
      "Database",
      "SQL",
      "Git",
      "Problem Solving",
      "Software Projects",
    ],

    "Web Developer": [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "REST API",
      "Database",
      "Git",
      "Web Projects",
    ],

    "Data Scientist": [
      "Python",
      "Statistics",
      "SQL",
      "NumPy",
      "Pandas",
      "Data Visualization",
      "Machine Learning",
      "Data Analysis",
      "Data Projects",
    ],

    "Cybersecurity Analyst": [
      "Networking",
      "Linux",
      "Cybersecurity",
      "Ethical Hacking",
      "Cryptography",
      "Python",
      "Security Tools",
      "Network Security",
      "Security Projects",
    ],
  };

  // =====================================================
  // GET REQUIRED SKILLS
  // =====================================================

  const requiredSkills =
    useMemo(() => {
      return (
        careerSkills[
          recommendedCareer
        ] ||
        careerSkills[
          "Software Developer"
        ]
      );
    }, [recommendedCareer]);

  // =====================================================
  // NORMALIZE SKILL
  // =====================================================

  const normalizeSkill = (value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/[.\-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // =====================================================
  // CHECK WHETHER STUDENT HAS A SKILL
  // =====================================================

  const hasSkill = (requiredSkill) => {
    const required =
      normalizeSkill(
        requiredSkill
      );

    return skills.some(
      (userSkill) => {
        const user =
          normalizeSkill(
            userSkill
          );

        // Exact match
        if (user === required) {
          return true;
        }

        // Required skill aliases
        if (
          required ===
          "data structures & algorithms"
        ) {
          return (
            user.includes(
              "data structures"
            ) ||
            user.includes(
              "algorithms"
            ) ||
            user === "dsa"
          );
        }

        if (
          required ===
          "object oriented programming"
        ) {
          return (
            user.includes(
              "object oriented"
            ) ||
            user.includes("oop") ||
            user.includes("oops")
          );
        }

        if (required === "node js") {
          return (
            user.includes("node") ||
            user.includes("node js")
          );
        }

        if (required === "rest api") {
          return (
            user.includes("rest") ||
            user.includes("api")
          );
        }

        if (
          required ===
          "machine learning"
        ) {
          return (
            user.includes(
              "machine learning"
            ) ||
            user === "ml"
          );
        }

        if (required === "ai projects") {
          return (
            user.includes(
              "ai project"
            ) ||
            user.includes(
              "artificial intelligence"
            )
          );
        }

        if (
          required ===
          "software projects"
        ) {
          return (
            user.includes(
              "software project"
            ) ||
            user === "project" ||
            user.includes("projects")
          );
        }

        if (
          required ===
          "web projects"
        ) {
          return (
            user.includes(
              "web project"
            ) ||
            user === "project" ||
            user.includes("projects")
          );
        }

        if (
          required ===
          "data projects"
        ) {
          return (
            user.includes(
              "data project"
            ) ||
            user === "project" ||
            user.includes("projects")
          );
        }

        if (
          required ===
          "security projects"
        ) {
          return (
            user.includes(
              "security project"
            ) ||
            user === "project" ||
            user.includes("projects")
          );
        }

        if (
          required ===
          "data visualization"
        ) {
          return (
            user.includes(
              "visualization"
            ) ||
            user.includes("visualisation") ||
            user.includes("power bi") ||
            user.includes("tableau")
          );
        }

        if (
          required ===
          "network security"
        ) {
          return (
            user.includes("network") &&
            user.includes("security")
          );
        }

        if (
          required ===
          "security tools"
        ) {
          return (
            user.includes("security") ||
            user.includes("wireshark") ||
            user.includes("nmap") ||
            user.includes("burp")
          );
        }

        if (
          required ===
          "problem solving"
        ) {
          return (
            user.includes(
              "problem solving"
            ) ||
            user.includes(
              "problem-solving"
            ) ||
            user.includes(
              "algorithms"
            ) ||
            user.includes("dsa")
          );
        }

        if (
          required ===
          "database"
        ) {
          return (
            user.includes(
              "database"
            ) ||
            user.includes("mysql") ||
            user.includes("mongodb") ||
            user.includes("sql")
          );
        }

        return (
          user.includes(required) ||
          required.includes(user)
        );
      }
    );
  };

  // =====================================================
  // CALCULATE SKILL RESULTS
  // =====================================================

  const skillResults =
    useMemo(() => {
      return requiredSkills.map(
        (skill) => ({
          skill,
          hasSkill:
            hasSkill(skill),
        })
      );
    }, [
      requiredSkills,
      skills,
    ]);

  // =====================================================
  // LEARNED SKILLS
  // =====================================================

  const learnedSkills =
    useMemo(() => {
      return skillResults.filter(
        (item) => item.hasSkill
      );
    }, [skillResults]);

  // =====================================================
  // MISSING SKILLS
  // =====================================================

  const missingSkills =
    useMemo(() => {
      return skillResults.filter(
        (item) => !item.hasSkill
      );
    }, [skillResults]);

  // =====================================================
  // SKILL PERCENTAGE
  // =====================================================

  const skillPercentage =
    requiredSkills.length > 0
      ? Math.round(
          (learnedSkills.length /
            requiredSkills.length) *
            100
        )
      : 0;

  // =====================================================
  // SKILL GAP PERCENTAGE
  // =====================================================

  const gapPercentage =
    100 - skillPercentage;

  // =====================================================
  // CAREER READINESS
  // =====================================================

  const readiness = Math.round(
    skillPercentage * 0.7 +
      assessmentPercentage * 0.3
  );

  // =====================================================
  // SAVE SKILL GAP RESULT
  // =====================================================

  useEffect(() => {
    const result = {
      career:
        recommendedCareer,

      careerMatch,

      requiredSkills,

      learnedSkills:
        learnedSkills.map(
          (item) => item.skill
        ),

      missingSkills:
        missingSkills.map(
          (item) => item.skill
        ),

      skillPercentage,

      gapPercentage,

      assessmentPercentage,

      readiness,

      generatedFromAI:
        Boolean(aiCareerAnalysis),

      completedAt:
        new Date().toISOString(),
    };

    localStorage.setItem(
      "skillGap",
      JSON.stringify(result)
    );

    // Skill Gap is considered completed
    // after the analysis has been generated.
    if (MODULE_KEYS?.SKILL_GAP) {
      completeModule(
        MODULE_KEYS.SKILL_GAP
      );
    }
  }, [
    recommendedCareer,
    careerMatch,
    requiredSkills,
    learnedSkills,
    missingSkills,
    skillPercentage,
    gapPercentage,
    assessmentPercentage,
    readiness,
    aiCareerAnalysis,
  ]);

  // =====================================================
  // NEXT PAGE
  // =====================================================

  const goToRoadmap = () => {
    navigate("/roadmap");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ============================================
            HEADER
        ============================================ */}

        <div style={styles.header}>
          <div style={styles.headerIcon}>
            📊
          </div>

          <h1 style={styles.title}>
            Skill Gap Analysis
          </h1>

          <p style={styles.subtitle}>
            Find out which skills you already
            have and which skills you need to
            develop for your recommended career.
          </p>
        </div>

        {/* ============================================
            TARGET CAREER
        ============================================ */}

        <div style={styles.careerCard}>
          <p style={styles.smallTitle}>
            🎯 Recommended Career
          </p>

          <h1 style={styles.careerName}>
            {recommendedCareer}
          </h1>

          {careerMatch > 0 && (
            <p style={styles.matchText}>
              Career Match:{" "}
              <strong>
                {careerMatch}%
              </strong>
            </p>
          )}
        </div>

        {/* ============================================
            STAT CARDS
        ============================================ */}

        <div style={styles.statsGrid}>

          {/* Skill Assessment */}

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              🧠
            </div>

            <h3>
              Skill Assessment
            </h3>

            <h2>
              {assessmentPercentage}%
            </h2>

            <p>
              {score} / {total}
            </p>
          </div>

          {/* Skills Covered */}

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              💻
            </div>

            <h3>
              Skills Covered
            </h3>

            <h2>
              {learnedSkills.length}/
              {requiredSkills.length}
            </h2>

            <p>
              {skillPercentage}%
            </p>
          </div>

          {/* Missing Skills */}

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              📚
            </div>

            <h3>
              Skills Missing
            </h3>

            <h2>
              {missingSkills.length}
            </h2>

            <p>
              Skills to learn
            </p>
          </div>

          {/* Career Readiness */}

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              🚀
            </div>

            <h3>
              Career Readiness
            </h3>

            <h2>
              {readiness}%
            </h2>

            <p>
              Current readiness
            </p>
          </div>

        </div>

        {/* ============================================
            SKILL PROGRESS
        ============================================ */}

        <div style={styles.section}>
          <h2>
            📈 Your Skill Progress
          </h2>

          <div style={styles.progressBackground}>
            <div
              style={{
                ...styles.progressFill,
                width: `${skillPercentage}%`,
              }}
            />
          </div>

          <div style={styles.progressLabels}>
            <span>
              Skills You Have:{" "}
              <strong>
                {skillPercentage}%
              </strong>
            </span>

            <span>
              Skill Gap:{" "}
              <strong>
                {gapPercentage}%
              </strong>
            </span>
          </div>
        </div>

        {/* ============================================
            SKILLS YOU HAVE
        ============================================ */}

        <div style={styles.section}>
          <h2>
            ✅ Skills You Already Have
          </h2>

          {learnedSkills.length > 0 ? (
            learnedSkills.map(
              (item) => (
                <div
                  key={item.skill}
                  style={styles.learnedSkill}
                >
                  <span
                    style={
                      styles.skillIcon
                    }
                  >
                    ✓
                  </span>

                  <strong>
                    {item.skill}
                  </strong>

                  <span
                    style={
                      styles.haveBadge
                    }
                  >
                    Already Have
                  </span>
                </div>
              )
            )
          ) : (
            <p style={styles.emptyText}>
              No matching career skills were
              found in your profile yet.
            </p>
          )}
        </div>

        {/* ============================================
            MISSING SKILLS
        ============================================ */}

        <div style={styles.section}>
          <h2>
            ❌ Skills You Need to Learn
          </h2>

          {missingSkills.length > 0 ? (
            missingSkills.map(
              (item, index) => (
                <div
                  key={item.skill}
                  style={
                    styles.missingSkill
                  }
                >
                  <div
                    style={
                      styles.missingLeft
                    }
                  >
                    <span
                      style={
                        styles.numberCircle
                      }
                    >
                      {index + 1}
                    </span>

                    <strong>
                      {item.skill}
                    </strong>
                  </div>

                  <span
                    style={
                      styles.missingBadge
                    }
                  >
                    Missing
                  </span>
                </div>
              )
            )
          ) : (
            <div
              style={styles.successBox}
            >
              🎉 Excellent! You already
              have all the required skills.
            </div>
          )}
        </div>

        {/* ============================================
            LEARNING PRIORITIES
        ============================================ */}

        <div style={styles.section}>
          <h2>
            📚 Recommended Learning Priorities
          </h2>

          {missingSkills.length > 0 ? (
            <ol
              style={
                styles.learningList
              }
            >
              {missingSkills
                .slice(0, 6)
                .map((item) => (
                  <li key={item.skill}>
                    Learn{" "}
                    <strong>
                      {item.skill}
                    </strong>
                  </li>
                ))}
            </ol>
          ) : (
            <p>
              Your next focus should be
              advanced projects and interview
              preparation.
            </p>
          )}
        </div>

        {/* ============================================
            ANALYSIS SUMMARY
        ============================================ */}

        <div style={styles.summaryCard}>
          <h2>
            🎯 Skill Gap Summary
          </h2>

          <p>
            You currently match{" "}
            <strong>
              {skillPercentage}%
            </strong>{" "}
            of the core skills required for
            <strong>
              {" "}
              {recommendedCareer}
            </strong>.
          </p>

          <p>
            Your current skill gap is{" "}
            <strong>
              {gapPercentage}%
            </strong>.
          </p>

          <p>
            Your estimated career readiness
            based on skills and assessment is{" "}
            <strong>
              {readiness}%
            </strong>.
          </p>

          {missingSkills.length > 0 && (
            <p>
              Your first priority should be
              learning{" "}
              <strong>
                {missingSkills[0].skill}
              </strong>
              .
            </p>
          )}
        </div>

        {/* ============================================
            COMPLETION
        ============================================ */}

        <div style={styles.completedBox}>
          ✅ Skill Gap Analysis Completed
        </div>

        {/* ============================================
            NEXT STEP
        ============================================ */}

        <div style={styles.nextSection}>
          <button
            type="button"
            onClick={goToRoadmap}
            style={styles.nextButton}
          >
            🗺️ Create Learning Roadmap →
          </button>
        </div>

      </div>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding:
      "40px 20px 60px",
    fontFamily:
      "Arial, sans-serif",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  header: {
    background: "#ffffff",
    padding:
      "35px 25px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  headerIcon: {
    fontSize: "42px",
    marginBottom: "10px",
  },

  title: {
    margin:
      "0 0 10px",
    color: "#1e293b",
    fontSize: "32px",
  },

  subtitle: {
    margin:
      "0 auto",
    maxWidth: "700px",
    color: "#64748b",
    fontSize: "17px",
    lineHeight: "1.6",
  },

  careerCard: {
    marginTop: "30px",
    padding: "30px",
    background: "#eff6ff",
    borderRadius: "15px",
    border:
      "2px solid #2563eb",
    textAlign: "center",
  },

  smallTitle: {
    margin:
      "0 0 10px",
    color: "#475569",
    fontSize: "16px",
  },

  careerName: {
    margin: "5px 0",
    color: "#2563eb",
    fontSize: "30px",
  },

  matchText: {
    marginTop: "10px",
    color: "#475569",
    fontSize: "17px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },

  statCard: {
    background: "#ffffff",
    padding:
      "25px 15px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  statIcon: {
    fontSize: "30px",
  },

  section: {
    marginTop: "30px",
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  progressBackground: {
    width: "100%",
    height: "16px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "20px",
  },

  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
    transition:
      "width 0.5s ease",
  },

  progressLabels: {
    display: "flex",
    justifyContent:
      "space-between",
    marginTop: "12px",
    color: "#64748b",
    fontSize: "14px",
  },

  learnedSkill: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    marginTop: "10px",
    background: "#f0fdf4",
    borderRadius: "8px",
    border:
      "1px solid #bbf7d0",
  },

  skillIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontWeight: "bold",
  },

  haveBadge: {
    marginLeft: "auto",
    color: "#166534",
    fontSize: "13px",
    fontWeight: "bold",
  },

  missingSkill: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "15px",
    marginTop: "10px",
    background: "#fef2f2",
    borderRadius: "8px",
    border:
      "1px solid #fecaca",
  },

  missingLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  numberCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#dc2626",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontWeight: "bold",
  },

  missingBadge: {
    color: "#dc2626",
    fontWeight: "bold",
    fontSize: "13px",
  },

  learningList: {
    fontSize: "17px",
    lineHeight: "2.2",
    color: "#475569",
  },

  summaryCard: {
    marginTop: "30px",
    padding: "25px",
    background:
      "linear-gradient(135deg, #f8fafc, #eef2ff)",
    borderRadius: "12px",
    border:
      "1px solid #dbeafe",
  },

  successBox: {
    marginTop: "15px",
    padding: "18px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    fontWeight: "bold",
    textAlign: "center",
  },

  emptyText: {
    color: "#64748b",
  },

  completedBox: {
    marginTop: "30px",
    padding: "18px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "bold",
  },

  nextSection: {
    textAlign: "center",
    marginTop: "35px",
  },

  nextButton: {
    padding:
      "14px 30px",
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default SkillGap;