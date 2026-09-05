import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  completeModule,
  MODULE_KEYS,
} from "../utils/progress";

function Roadmap() {
  const navigate = useNavigate();

  // =====================================================
  // SAFE LOCAL STORAGE READER
  // =====================================================

  const getData = (key) => {
    try {
      const savedData = localStorage.getItem(key);

      if (!savedData) {
        return {};
      }

      return JSON.parse(savedData);
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return {};
    }
  };

  // =====================================================
  // GET CAREER RECOMMENDATION
  // =====================================================

  const careerRecommendation = useMemo(
    () => getData("careerRecommendation"),
    []
  );

  // =====================================================
  // GET SKILL GAP
  // =====================================================

  const skillGap = useMemo(
    () => getData("skillGap"),
    []
  );

  // =====================================================
  // GET STUDENT PROFILE
  // =====================================================

  const profile = useMemo(
    () => getData("studentProfile"),
    []
  );

  // =====================================================
  // GET SKILL ASSESSMENT
  // =====================================================

  const assessment = useMemo(
    () => getData("skillAssessment"),
    []
  );

  // =====================================================
  // GET INTEREST ASSESSMENT
  // =====================================================

  const interestAssessment = useMemo(
    () => getData("interestAssessment"),
    []
  );

  // =====================================================
  // ASSESSMENT SCORE
  // =====================================================

  const score = Number(assessment.score || 0);

  const total = Number(assessment.total || 10);

  const percentage =
    total > 0
      ? Math.round((score / total) * 100)
      : 0;

  // =====================================================
  // TARGET CAREER
  // IMPORTANT:
  // Careers.jsx saves "career"
  // =====================================================

  const career =
    careerRecommendation.career ||
    careerRecommendation.recommendedCareer ||
    skillGap.career ||
    skillGap.recommendedCareer ||
    "Software Developer";

  // =====================================================
  // CAREER MATCH
  // =====================================================

  const careerMatch = Number(
    careerRecommendation.matchPercentage ||
      careerRecommendation.careerMatch ||
      skillGap.careerMatch ||
      0
  );

  // =====================================================
  // LEARNED SKILLS
  // =====================================================

  const learnedSkills = Array.isArray(
    skillGap.learnedSkills
  )
    ? skillGap.learnedSkills
    : [];

  // =====================================================
  // MISSING SKILLS
  // =====================================================

  const missingSkills = Array.isArray(
    skillGap.missingSkills
  )
    ? skillGap.missingSkills
    : [];

  // =====================================================
  // CAREER ROADMAP DATA
  // =====================================================

  const roadmapData = {
    "AI / ML Engineer": [
      {
        title: "Python Fundamentals",
        duration: "2 Weeks",
        description:
          "Learn Python syntax, variables, data types, conditions, loops, functions, OOP and problem solving.",
        skill: "Python",
      },
      {
        title: "Data Structures & Algorithms",
        duration: "3 Weeks",
        description:
          "Learn arrays, strings, linked lists, stacks, queues, trees, graphs and algorithms.",
        skill: "Data Structures & Algorithms",
      },
      {
        title: "Statistics",
        duration: "2 Weeks",
        description:
          "Learn probability, mean, median, variance, standard deviation, correlation and regression.",
        skill: "Statistics",
      },
      {
        title: "NumPy & Pandas",
        duration: "2 Weeks",
        description:
          "Learn numerical computing, arrays, data manipulation and data analysis using NumPy and Pandas.",
        skill: "NumPy",
      },
      {
        title: "Machine Learning",
        duration: "4 Weeks",
        description:
          "Learn supervised learning, unsupervised learning, regression, classification and model evaluation.",
        skill: "Machine Learning",
      },
      {
        title: "Deep Learning",
        duration: "4 Weeks",
        description:
          "Learn neural networks, CNNs, RNNs and deep learning fundamentals.",
        skill: "Deep Learning",
      },
      {
        title: "TensorFlow",
        duration: "2 Weeks",
        description:
          "Learn how to build and train machine learning and deep learning models using TensorFlow.",
        skill: "TensorFlow",
      },
      {
        title: "SQL",
        duration: "2 Weeks",
        description:
          "Learn databases, SELECT queries, filtering, joins, grouping and data management.",
        skill: "SQL",
      },
      {
        title: "AI Project",
        duration: "3 Weeks",
        description:
          "Build a practical AI project and add it to your portfolio.",
        skill: "AI Projects",
      },
    ],

    "Software Developer": [
      {
        title: "Java / C++ Fundamentals",
        duration: "2 Weeks",
        description:
          "Strengthen programming fundamentals, syntax, functions, arrays and object-oriented programming.",
        skill: "Java",
      },
      {
        title: "Data Structures & Algorithms",
        duration: "4 Weeks",
        description:
          "Practice arrays, linked lists, stacks, queues, trees, graphs and algorithms.",
        skill: "Data Structures & Algorithms",
      },
      {
        title: "Object-Oriented Programming",
        duration: "2 Weeks",
        description:
          "Master classes, objects, inheritance, polymorphism, abstraction and encapsulation.",
        skill: "Object-Oriented Programming",
      },
      {
        title: "Database & SQL",
        duration: "2 Weeks",
        description:
          "Learn relational databases, SQL queries, joins and database design.",
        skill: "SQL",
      },
      {
        title: "Git & GitHub",
        duration: "1 Week",
        description:
          "Learn repositories, commits, branches, merging and GitHub workflow.",
        skill: "Git",
      },
      {
        title: "Problem Solving",
        duration: "3 Weeks",
        description:
          "Solve coding problems and improve logical thinking and algorithmic skills.",
        skill: "Problem Solving",
      },
      {
        title: "Software Project",
        duration: "3 Weeks",
        description:
          "Build a complete software project for your portfolio.",
        skill: "Software Projects",
      },
    ],

    "Web Developer": [
      {
        title: "HTML",
        duration: "1 Week",
        description:
          "Learn semantic HTML, forms, tables, links and webpage structure.",
        skill: "HTML",
      },
      {
        title: "CSS",
        duration: "2 Weeks",
        description:
          "Learn layouts, Flexbox, Grid, responsive design and modern styling.",
        skill: "CSS",
      },
      {
        title: "JavaScript",
        duration: "3 Weeks",
        description:
          "Learn variables, functions, arrays, objects, DOM and asynchronous JavaScript.",
        skill: "JavaScript",
      },
      {
        title: "React",
        duration: "3 Weeks",
        description:
          "Learn components, props, state, hooks and React Router.",
        skill: "React",
      },
      {
        title: "Node.js & REST API",
        duration: "3 Weeks",
        description:
          "Learn backend development, Express and REST API development.",
        skill: "Node.js",
      },
      {
        title: "Database",
        duration: "2 Weeks",
        description:
          "Learn database concepts and connect web applications with databases.",
        skill: "Database",
      },
      {
        title: "Git & GitHub",
        duration: "1 Week",
        description:
          "Learn version control, commits, branches and collaborative development.",
        skill: "Git",
      },
      {
        title: "Web Project",
        duration: "3 Weeks",
        description:
          "Build and deploy a complete responsive web application.",
        skill: "Web Projects",
      },
    ],

    "Data Scientist": [
      {
        title: "Python",
        duration: "2 Weeks",
        description:
          "Learn Python programming and data-oriented programming.",
        skill: "Python",
      },
      {
        title: "Statistics",
        duration: "3 Weeks",
        description:
          "Learn probability, statistics, distributions and hypothesis testing.",
        skill: "Statistics",
      },
      {
        title: "SQL",
        duration: "2 Weeks",
        description:
          "Learn SQL queries, joins, aggregation and databases.",
        skill: "SQL",
      },
      {
        title: "NumPy & Pandas",
        duration: "2 Weeks",
        description:
          "Learn numerical computing and data manipulation.",
        skill: "NumPy",
      },
      {
        title: "Data Visualization",
        duration: "2 Weeks",
        description:
          "Learn charts, graphs and how to communicate data insights.",
        skill: "Data Visualization",
      },
      {
        title: "Machine Learning",
        duration: "4 Weeks",
        description:
          "Learn regression, classification, clustering and model evaluation.",
        skill: "Machine Learning",
      },
      {
        title: "Data Analysis",
        duration: "2 Weeks",
        description:
          "Analyze real-world datasets and discover useful insights.",
        skill: "Data Analysis",
      },
      {
        title: "Data Project",
        duration: "3 Weeks",
        description:
          "Build a complete data science project for your portfolio.",
        skill: "Data Projects",
      },
    ],

    "Cybersecurity Analyst": [
      {
        title: "Networking",
        duration: "3 Weeks",
        description:
          "Learn TCP/IP, DNS, HTTP, ports, protocols and networking fundamentals.",
        skill: "Networking",
      },
      {
        title: "Linux",
        duration: "2 Weeks",
        description:
          "Learn Linux commands, permissions, processes and system administration.",
        skill: "Linux",
      },
      {
        title: "Cybersecurity Fundamentals",
        duration: "3 Weeks",
        description:
          "Learn threats, vulnerabilities, authentication and security principles.",
        skill: "Cybersecurity",
      },
      {
        title: "Ethical Hacking",
        duration: "3 Weeks",
        description:
          "Learn authorized security testing and vulnerability assessment.",
        skill: "Ethical Hacking",
      },
      {
        title: "Cryptography",
        duration: "2 Weeks",
        description:
          "Learn encryption, hashing, keys and secure communication.",
        skill: "Cryptography",
      },
      {
        title: "Python for Security",
        duration: "2 Weeks",
        description:
          "Use Python for automation and security-related scripting.",
        skill: "Python",
      },
      {
        title: "Network Security",
        duration: "3 Weeks",
        description:
          "Learn firewalls, secure networks, monitoring and security practices.",
        skill: "Network Security",
      },
      {
        title: "Security Project",
        duration: "3 Weeks",
        description:
          "Build a cybersecurity project demonstrating practical skills.",
        skill: "Security Projects",
      },
    ],
  };

  // =====================================================
  // GET FULL ROADMAP
  // =====================================================

  const fullRoadmap =
    roadmapData[career] ||
    roadmapData["Software Developer"];

  // =====================================================
  // NORMALIZE SKILL TEXT
  // =====================================================

  const normalizeSkill = (value) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[&/]/g, " ")
      .replace(/\s+/g, " ");
  };

  // =====================================================
  // SKILL ALIASES
  // =====================================================

  const skillAliases = {
    python: ["python"],
    java: ["java"],
    "data structures & algorithms": [
      "data structures",
      "data structures and algorithms",
      "dsa",
      "algorithms",
    ],
    "object-oriented programming": [
      "object oriented programming",
      "object-oriented programming",
      "oop",
      "oops",
    ],
    sql: ["sql", "database"],
    git: ["git", "github"],
    "problem solving": [
      "problem solving",
      "problem-solving",
      "logical thinking",
    ],
    html: ["html"],
    css: ["css"],
    javascript: ["javascript", "js"],
    react: ["react", "react.js"],
    "node.js": ["node.js", "node", "express", "express.js"],
    database: ["database", "databases", "mysql", "mongodb"],
    numpy: ["numpy"],
    pandas: ["pandas"],
    statistics: ["statistics", "statistic"],
    "machine learning": [
      "machine learning",
      "ml",
    ],
    "deep learning": [
      "deep learning",
      "dl",
    ],
    tensorflow: ["tensorflow"],
    "data visualization": [
      "data visualization",
      "visualization",
    ],
    "data analysis": [
      "data analysis",
      "data analytics",
    ],
    networking: [
      "networking",
      "network",
      "computer networks",
    ],
    linux: ["linux"],
    cybersecurity: [
      "cybersecurity",
      "cyber security",
      "security",
    ],
    "ethical hacking": [
      "ethical hacking",
      "ethical hacker",
    ],
    cryptography: ["cryptography"],
    "network security": [
      "network security",
    ],
    "security tools": [
      "security tools",
      "security tool",
    ],
    "ai projects": [
      "ai projects",
      "ai project",
      "artificial intelligence project",
    ],
    "software projects": [
      "software projects",
      "software project",
    ],
    "web projects": [
      "web projects",
      "web project",
    ],
    "data projects": [
      "data projects",
      "data project",
    ],
    "security projects": [
      "security projects",
      "security project",
    ],
  };

  // =====================================================
  // CHECK WHETHER ROADMAP STEP IS A MISSING SKILL
  // =====================================================

  const matchesMissingSkill = (step) => {
    if (missingSkills.length === 0) {
      return false;
    }

    const stepSkill = normalizeSkill(step.skill);
    const stepTitle = normalizeSkill(step.title);

    return missingSkills.some((skill) => {
      const skillText = normalizeSkill(skill);

      if (!skillText) {
        return false;
      }

      // Direct matching
      if (
        stepSkill.includes(skillText) ||
        skillText.includes(stepSkill) ||
        stepTitle.includes(skillText) ||
        skillText.includes(stepTitle)
      ) {
        return true;
      }

      // Alias matching
      const aliases =
        skillAliases[stepSkill] || [];

      return aliases.some((alias) =>
        skillText.includes(
          normalizeSkill(alias)
        ) ||
        normalizeSkill(alias).includes(
          skillText
        )
      );
    });
  };

  // =====================================================
  // PERSONALIZED ROADMAP
  // =====================================================

  const personalizedRoadmap =
    fullRoadmap.filter(matchesMissingSkill);

  // =====================================================
  // FINAL ROADMAP
  // =====================================================

  const roadmap =
    personalizedRoadmap.length > 0
      ? personalizedRoadmap
      : fullRoadmap;

  // =====================================================
  // TOTAL DURATION
  // =====================================================

  const totalWeeks = roadmap.reduce(
    (total, step) => {
      const match =
        String(step.duration || "").match(
          /\d+/
        );

      return (
        total +
        (match ? Number(match[0]) : 0)
      );
    },
    0
  );

  // =====================================================
  // ROADMAP PROGRESS
  // =====================================================

  const roadmapProgress = 0;

  // =====================================================
  // SAVE ROADMAP
  // =====================================================

  useEffect(() => {
    const roadmapResult = {
      career,
      careerMatch,
      profile,
      missingSkills,
      learnedSkills,
      roadmap,
      fullRoadmap,
      assessmentPercentage: percentage,
      interestAssessment,
      totalWeeks,
      progress: roadmapProgress,
      completedSteps: 0,
      totalSteps: roadmap.length,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "careerRoadmap",
      JSON.stringify(roadmapResult)
    );

    localStorage.setItem(
      "roadmap",
      JSON.stringify(roadmapResult)
    );

    completeModule(MODULE_KEYS.ROADMAP);
  }, [
    career,
    careerMatch,
    profile,
    missingSkills,
    learnedSkills,
    roadmap,
    fullRoadmap,
    percentage,
    interestAssessment,
    totalWeeks,
  ]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div style={styles.icon}>
            🗺️
          </div>

          <h1 style={styles.title}>
            Personalized Learning Roadmap
          </h1>

          <p style={styles.subtitle}>
            Your step-by-step learning plan
            for becoming{" "}
            <strong>{career}</strong>.
          </p>
        </div>

        {/* TARGET CAREER */}

        <div style={styles.careerCard}>
          <div style={styles.targetIcon}>
            🎯
          </div>

          <p style={styles.targetLabel}>
            TARGET CAREER
          </p>

          <h1 style={styles.careerName}>
            {career}
          </h1>

          {careerMatch > 0 && (
            <div style={styles.matchBadge}>
              ⭐ Career Match:{" "}
              <strong>
                {careerMatch}%
              </strong>
            </div>
          )}

          <p style={styles.scoreText}>
            Your Skill Assessment Score:{" "}
            <strong>
              {percentage}%
            </strong>
          </p>
        </div>

        {/* SUMMARY */}

        <div style={styles.statsGrid}>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              📚
            </div>

            <h2 style={styles.statNumber}>
              {roadmap.length}
            </h2>

            <p style={styles.statLabel}>
              Learning Steps
            </p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              ❌
            </div>

            <h2 style={styles.statNumber}>
              {missingSkills.length}
            </h2>

            <p style={styles.statLabel}>
              Skills to Learn
            </p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              ✅
            </div>

            <h2 style={styles.statNumber}>
              {learnedSkills.length}
            </h2>

            <p style={styles.statLabel}>
              Skills Already Have
            </p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              ⏳
            </div>

            <h2 style={styles.statNumber}>
              {totalWeeks}
            </h2>

            <p style={styles.statLabel}>
              Approx. Weeks
            </p>
          </div>

        </div>

        {/* PROGRESS */}

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              📈 Learning Progress
            </h2>

            <span style={styles.progressText}>
              {roadmapProgress}% Started
            </span>
          </div>

          <div style={styles.progressBackground}>
            <div
              style={{
                ...styles.progressFill,
                width: `${roadmapProgress}%`,
              }}
            />
          </div>

          <p style={styles.progressHint}>
            Complete each roadmap step to
            improve your career readiness.
          </p>
        </div>

        {/* SKILL GAPS */}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📌 Your Skill Gaps
          </h2>

          {missingSkills.length > 0 ? (
            <div style={styles.skillList}>
              {missingSkills.map(
                (skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    style={styles.skillTag}
                  >
                    📚 {skill}
                  </span>
                )
              )}
            </div>
          ) : (
            <div style={styles.successBox}>
              🎉 You already have all
              the required skills!
            </div>
          )}
        </div>

        {/* LEARNED SKILLS */}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            ✅ Skills You Already Have
          </h2>

          {learnedSkills.length > 0 ? (
            <div style={styles.skillList}>
              {learnedSkills.map(
                (skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    style={styles.learnedTag}
                  >
                    ✓ {skill}
                  </span>
                )
              )}
            </div>
          ) : (
            <p style={styles.emptyText}>
              No required skills matched
              yet.
            </p>
          )}
        </div>

        {/* LEARNING JOURNEY */}

        <div style={styles.section}>
          <div style={styles.journeyHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                🚀 Your Learning Journey
              </h2>

              <p style={styles.journeySubtitle}>
                This roadmap is personalized
                using your recommended career
                and current skill gaps.
              </p>
            </div>

            <div style={styles.roadmapBadge}>
              {roadmap.length} Steps
            </div>
          </div>

          <div style={styles.timeline}>

            {roadmap.map(
              (step, index) => (
                <div
                  key={`${step.title}-${index}`}
                  style={styles.step}
                >

                  {/* NUMBER */}

                  <div style={styles.numberColumn}>

                    <div
                      style={styles.number}
                    >
                      {index + 1}
                    </div>

                    {index <
                      roadmap.length - 1 && (
                      <div
                        style={
                          styles.connector
                        }
                      />
                    )}

                  </div>

                  {/* CONTENT */}

                  <div
                    style={
                      styles.stepContent
                    }
                  >

                    <div
                      style={
                        styles.stepHeader
                      }
                    >
                      <div>
                        <p
                          style={
                            styles.stepLabel
                          }
                        >
                          STEP {index + 1}
                        </p>

                        <h3
                          style={
                            styles.stepTitle
                          }
                        >
                          {step.title}
                        </h3>
                      </div>

                      <span
                        style={
                          styles.duration
                        }
                      >
                        ⏱️ {step.duration}
                      </span>
                    </div>

                    <p
                      style={
                        styles.description
                      }
                    >
                      {step.description}
                    </p>

                    <div
                      style={
                        styles.stepBottom
                      }
                    >
                      <div
                        style={
                          styles.stepSkill
                        }
                      >
                        🎯 Focus Skill:{" "}
                        <strong>
                          {step.skill}
                        </strong>
                      </div>

                      <div
                        style={
                          styles.stepStatus
                        }
                      >
                        🔒 Not Started
                      </div>
                    </div>

                  </div>
                </div>
              )
            )}

          </div>
        </div>

        {/* MOTIVATION */}

        <div style={styles.motivation}>
          <div style={styles.motivationIcon}>
            💡
          </div>

          <h2>
            Keep Going!
          </h2>

          <p>
            Follow this roadmap step by
            step. Build projects while
            learning and continuously
            improve your skills.
          </p>
        </div>

        {/* COMPLETED */}

        <div style={styles.completed}>
          <span style={styles.completedIcon}>
            ✓
          </span>

          <div>
            <strong>
              Personalized Learning
              Roadmap Created
            </strong>

            <p>
              Your roadmap has been saved
              successfully.
            </p>
          </div>
        </div>

        {/* NEXT STEP */}

        <div style={styles.nextSection}>
          <button
            type="button"
            onClick={() =>
              navigate("/projects")
            }
            style={styles.nextButton}
          >
            💻 Get Project
            Recommendations

            <span style={styles.arrow}>
              →
            </span>
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
    background:
      "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #ecfdf5 100%)",
    padding: "40px 20px 70px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  header: {
    background: "#ffffff",
    padding: "40px 30px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 8px 25px rgba(15, 23, 42, 0.08)",
    border:
      "1px solid #e2e8f0",
  },

  icon: {
    fontSize: "50px",
    marginBottom: "10px",
  },

  title: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "32px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "0 auto",
    maxWidth: "720px",
    color: "#64748b",
    fontSize: "17px",
    lineHeight: "1.7",
  },

  careerCard: {
    marginTop: "28px",
    padding: "35px 25px",
    background:
      "linear-gradient(135deg, #dbeafe, #eff6ff)",
    borderRadius: "18px",
    textAlign: "center",
    border:
      "2px solid #3b82f6",
    boxShadow:
      "0 8px 20px rgba(37, 99, 235, 0.12)",
  },

  targetIcon: {
    fontSize: "35px",
  },

  targetLabel: {
    margin: "8px 0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "1.5px",
  },

  careerName: {
    margin: "5px 0 12px",
    color: "#1d4ed8",
    fontSize: "30px",
    fontWeight: "800",
  },

  matchBadge: {
    display: "inline-block",
    padding: "8px 16px",
    background: "#ffffff",
    color: "#166534",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow:
      "0 3px 10px rgba(0,0,0,0.06)",
  },

  scoreText: {
    marginTop: "15px",
    color: "#475569",
    fontSize: "16px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "20px",
    marginTop: "28px",
  },

  statCard: {
    background: "#ffffff",
    padding: "25px 15px",
    borderRadius: "15px",
    textAlign: "center",
    boxShadow:
      "0 6px 20px rgba(15, 23, 42, 0.07)",
    border:
      "1px solid #e2e8f0",
  },

  statIcon: {
    fontSize: "32px",
    marginBottom: "5px",
  },

  statNumber: {
    margin: "8px 0 4px",
    color: "#2563eb",
    fontSize: "28px",
  },

  statLabel: {
    margin: "0",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
  },

  section: {
    marginTop: "30px",
    background: "#ffffff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow:
      "0 6px 20px rgba(15, 23, 42, 0.07)",
    border:
      "1px solid #e2e8f0",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  sectionTitle: {
    margin: "0",
    color: "#1e293b",
    fontSize: "21px",
  },

  progressText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "14px",
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
    background:
      "linear-gradient(90deg, #2563eb, #7c3aed)",
    borderRadius: "20px",
    transition:
      "width 0.5s ease",
  },

  progressHint: {
    margin: "12px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  skillList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "18px",
  },

  skillTag: {
    padding: "10px 15px",
    background: "#fef2f2",
    color: "#b91c1c",
    border:
      "1px solid #fecaca",
    borderRadius: "20px",
    fontWeight: "600",
    fontSize: "14px",
  },

  learnedTag: {
    padding: "10px 15px",
    background: "#f0fdf4",
    color: "#15803d",
    border:
      "1px solid #bbf7d0",
    borderRadius: "20px",
    fontWeight: "600",
    fontSize: "14px",
  },

  successBox: {
    marginTop: "18px",
    padding: "16px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "10px",
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    color: "#64748b",
    marginTop: "15px",
  },

  journeyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  journeySubtitle: {
    color: "#64748b",
    lineHeight: "1.6",
    margin: "10px 0 0",
  },

  roadmapBadge: {
    padding: "9px 15px",
    background: "#ede9fe",
    color: "#6d28d9",
    borderRadius: "20px",
    fontWeight: "700",
    fontSize: "13px",
  },

  timeline: {
    marginTop: "28px",
  },

  step: {
    display: "flex",
    gap: "16px",
    marginBottom: "0",
  },

  numberColumn: {
    width: "44px",
    minWidth: "44px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  number: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "17px",
    boxShadow:
      "0 4px 10px rgba(37, 99, 235, 0.25)",
  },

  connector: {
    width: "3px",
    flex: 1,
    minHeight: "25px",
    background: "#bfdbfe",
    margin: "5px 0",
  },

  stepContent: {
    flex: 1,
    background: "#f8fafc",
    padding: "22px",
    borderRadius: "14px",
    border:
      "1px solid #e2e8f0",
    marginBottom: "20px",
  },

  stepHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  stepLabel: {
    margin: "0 0 4px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  stepTitle: {
    margin: "0",
    color: "#1e293b",
    fontSize: "19px",
  },

  duration: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },

  description: {
    color: "#475569",
    lineHeight: "1.7",
    margin: "15px 0",
  },

  stepBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  stepSkill: {
    padding: "9px 12px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "8px",
    fontSize: "13px",
  },

  stepStatus: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
  },

  motivation: {
    marginTop: "30px",
    padding: "30px",
    background:
      "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
    borderRadius: "16px",
    textAlign: "center",
    border:
      "1px solid #bbf7d0",
  },

  motivationIcon: {
    fontSize: "35px",
  },

  completed: {
    marginTop: "25px",
    padding: "18px 20px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    textAlign: "center",
    fontWeight: "700",
  },

  completedIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  nextSection: {
    textAlign: "center",
    marginTop: "35px",
  },

  nextButton: {
    padding: "15px 28px",
    background:
      "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow:
      "0 6px 15px rgba(22, 163, 74, 0.25)",
  },

  arrow: {
    marginLeft: "10px",
    fontSize: "20px",
  },
};

export default Roadmap;