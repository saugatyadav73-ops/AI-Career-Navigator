import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  completeModule,
  MODULE_KEYS,
} from "../utils/progress";

function Projects() {
  const navigate = useNavigate();

  // =====================================================
  // GET DATA FROM LOCAL STORAGE
  // =====================================================

  const getData = (key) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return {};
    }
  };

  // =====================================================
  // CAREER RECOMMENDATION
  // =====================================================

  const careerRecommendation = useMemo(
    () => getData("careerRecommendation"),
    []
  );

  // =====================================================
  // SKILL GAP
  // =====================================================

  const skillGap = useMemo(
    () => getData("skillGap"),
    []
  );

  // =====================================================
  // ROADMAP
  // =====================================================

  const careerRoadmap = useMemo(
    () =>
      getData("careerRoadmap") ||
      getData("roadmap"),
    []
  );

  // =====================================================
  // TARGET CAREER
  // =====================================================

  const career =
    careerRecommendation.career ||
    careerRecommendation.recommendedCareer ||
    skillGap.career ||
    skillGap.recommendedCareer ||
    careerRoadmap.career ||
    "Software Developer";

  // =====================================================
  // CAREER MATCH
  // =====================================================

  const careerMatch = Number(
    careerRecommendation.matchPercentage ||
      careerRecommendation.careerMatch ||
      skillGap.careerMatch ||
      careerRoadmap.careerMatch ||
      0
  );

  // =====================================================
  // MISSING SKILLS
  // =====================================================

  const missingSkills = Array.isArray(
    skillGap.missingSkills
  )
    ? skillGap.missingSkills
    : [];

  // =====================================================
  // LEARNED SKILLS
  // =====================================================

  const learnedSkills = Array.isArray(
    skillGap.learnedSkills
  )
    ? skillGap.learnedSkills
    : [];

  // =====================================================
  // PROJECT DATABASE
  // =====================================================

  const projectData = {
    "AI / ML Engineer": [
      {
        id: "ai-project-1",
        title: "AI Student Performance Predictor",
        difficulty: "Beginner",
        technologies: [
          "Python",
          "Pandas",
          "NumPy",
          "Scikit-learn",
        ],
        description:
          "Build a machine learning application that predicts student performance using study hours, attendance, previous scores and other academic features.",
        skills: [
          "Python",
          "Pandas",
          "NumPy",
          "Machine Learning",
        ],
        duration: "2-3 Weeks",
        portfolioValue: "High",
      },
      {
        id: "ai-project-2",
        title: "AI Career Recommendation System",
        difficulty: "Intermediate",
        technologies: [
          "Python",
          "Machine Learning",
          "Pandas",
          "Scikit-learn",
          "React",
        ],
        description:
          "Create an AI-powered system that analyzes student skills, interests and education and recommends suitable career paths.",
        skills: [
          "Python",
          "Machine Learning",
          "Data Analysis",
          "AI Projects",
        ],
        duration: "3-4 Weeks",
        portfolioValue: "Very High",
      },
      {
        id: "ai-project-3",
        title: "Resume Screening AI",
        difficulty: "Intermediate",
        technologies: [
          "Python",
          "NLP",
          "Scikit-learn",
          "React",
          "Node.js",
        ],
        description:
          "Build an AI system that analyzes resumes and compares candidate skills with job requirements.",
        skills: [
          "Python",
          "NLP",
          "Machine Learning",
          "AI Projects",
        ],
        duration: "4 Weeks",
        portfolioValue: "Very High",
      },
      {
        id: "ai-project-4",
        title: "Image Classification System",
        difficulty: "Advanced",
        technologies: [
          "Python",
          "TensorFlow",
          "Keras",
          "CNN",
          "NumPy",
        ],
        description:
          "Develop a deep learning model that classifies images into different categories using convolutional neural networks.",
        skills: [
          "Python",
          "Deep Learning",
          "TensorFlow",
          "AI Projects",
        ],
        duration: "4-5 Weeks",
        portfolioValue: "Very High",
      },
      {
        id: "ai-project-5",
        title: "AI Chatbot Assistant",
        difficulty: "Advanced",
        technologies: [
          "Python",
          "NLP",
          "FastAPI",
          "React",
          "AI API",
        ],
        description:
          "Build an intelligent chatbot that understands user questions and provides useful responses through an AI-powered backend.",
        skills: [
          "Python",
          "NLP",
          "AI",
          "React",
        ],
        duration: "4-6 Weeks",
        portfolioValue: "Very High",
      },
    ],

    "Software Developer": [
      {
        id: "software-project-1",
        title: "Student Management System",
        difficulty: "Beginner",
        technologies: [
          "Java",
          "OOP",
          "SQL",
        ],
        description:
          "Create a desktop or console-based student management system for adding, updating, searching and deleting student records.",
        skills: [
          "Java",
          "Object-Oriented Programming",
          "SQL",
        ],
        duration: "2 Weeks",
        portfolioValue: "Medium",
      },
      {
        id: "software-project-2",
        title: "Library Management System",
        difficulty: "Beginner",
        technologies: [
          "Java",
          "OOP",
          "MySQL",
        ],
        description:
          "Build a library system that manages books, students, borrowing, returning and availability records.",
        skills: [
          "Java",
          "Object-Oriented Programming",
          "Database",
          "SQL",
        ],
        duration: "2-3 Weeks",
        portfolioValue: "Medium",
      },
      {
        id: "software-project-3",
        title: "Online Examination System",
        difficulty: "Intermediate",
        technologies: [
          "Java",
          "Spring Boot",
          "MySQL",
          "React",
        ],
        description:
          "Develop an online examination platform where students can attend tests, submit answers and receive scores.",
        skills: [
          "Java",
          "SQL",
          "React",
          "Software Projects",
        ],
        duration: "3-4 Weeks",
        portfolioValue: "High",
      },
      {
        id: "software-project-4",
        title: "Expense Tracker Application",
        difficulty: "Intermediate",
        technologies: [
          "Java",
          "Spring Boot",
          "MySQL",
          "React",
        ],
        description:
          "Build an application that allows users to record expenses, categorize spending and track monthly financial activity.",
        skills: [
          "Java",
          "SQL",
          "React",
          "Database",
        ],
        duration: "3 Weeks",
        portfolioValue: "High",
      },
      {
        id: "software-project-5",
        title: "E-Commerce Management System",
        difficulty: "Advanced",
        technologies: [
          "Java",
          "Spring Boot",
          "React",
          "MySQL",
          "REST API",
        ],
        description:
          "Create a full-stack e-commerce application with authentication, products, cart, orders and admin management.",
        skills: [
          "Java",
          "Database",
          "SQL",
          "REST API",
          "Software Projects",
        ],
        duration: "5-6 Weeks",
        portfolioValue: "Very High",
      },
    ],

    "Web Developer": [
      {
        id: "web-project-1",
        title: "Personal Portfolio Website",
        difficulty: "Beginner",
        technologies: [
          "HTML",
          "CSS",
          "JavaScript",
        ],
        description:
          "Create a responsive personal portfolio website containing your profile, skills, projects, education and contact information.",
        skills: [
          "HTML",
          "CSS",
          "JavaScript",
        ],
        duration: "1 Week",
        portfolioValue: "High",
      },
      {
        id: "web-project-2",
        title: "Responsive Weather Application",
        difficulty: "Beginner",
        technologies: [
          "HTML",
          "CSS",
          "JavaScript",
          "REST API",
        ],
        description:
          "Build a weather application that retrieves weather information from an API and displays current conditions.",
        skills: [
          "JavaScript",
          "REST API",
          "Web Projects",
        ],
        duration: "1-2 Weeks",
        portfolioValue: "Medium",
      },
      {
        id: "web-project-3",
        title: "Task Management Application",
        difficulty: "Intermediate",
        technologies: [
          "React",
          "JavaScript",
          "CSS",
          "LocalStorage",
        ],
        description:
          "Develop a task management application where users can create, edit, complete and delete tasks.",
        skills: [
          "React",
          "JavaScript",
          "Web Projects",
        ],
        duration: "2-3 Weeks",
        portfolioValue: "High",
      },
      {
        id: "web-project-4",
        title: "Full-Stack Blog Platform",
        difficulty: "Intermediate",
        technologies: [
          "React",
          "Node.js",
          "Express",
          "MongoDB",
        ],
        description:
          "Create a full-stack blog platform with user authentication, posts, comments and content management.",
        skills: [
          "React",
          "Node.js",
          "REST API",
          "Database",
        ],
        duration: "3-4 Weeks",
        portfolioValue: "High",
      },
      {
        id: "web-project-5",
        title: "E-Commerce Web Application",
        difficulty: "Advanced",
        technologies: [
          "React",
          "Node.js",
          "Express",
          "MongoDB",
          "REST API",
        ],
        description:
          "Build a complete online shopping platform with products, search, cart, authentication and order management.",
        skills: [
          "React",
          "Node.js",
          "REST API",
          "Database",
          "Web Projects",
        ],
        duration: "5-6 Weeks",
        portfolioValue: "Very High",
      },
    ],

    "Data Scientist": [
      {
        id: "data-project-1",
        title: "Student Performance Analysis",
        difficulty: "Beginner",
        technologies: [
          "Python",
          "Pandas",
          "NumPy",
          "Matplotlib",
        ],
        description:
          "Analyze student performance data and identify patterns related to attendance, study hours and academic results.",
        skills: [
          "Python",
          "Pandas",
          "Data Analysis",
          "Data Visualization",
        ],
        duration: "1-2 Weeks",
        portfolioValue: "Medium",
      },
      {
        id: "data-project-2",
        title: "Sales Data Analysis Dashboard",
        difficulty: "Beginner",
        technologies: [
          "Python",
          "Pandas",
          "SQL",
          "Matplotlib",
        ],
        description:
          "Analyze sales data and create visual reports showing revenue, products, regions and sales trends.",
        skills: [
          "Python",
          "SQL",
          "Data Analysis",
          "Data Visualization",
        ],
        duration: "2 Weeks",
        portfolioValue: "High",
      },
      {
        id: "data-project-3",
        title: "Customer Churn Prediction",
        difficulty: "Intermediate",
        technologies: [
          "Python",
          "Pandas",
          "Scikit-learn",
          "SQL",
        ],
        description:
          "Develop a machine learning model that predicts whether customers are likely to stop using a service.",
        skills: [
          "Python",
          "Machine Learning",
          "SQL",
          "Data Analysis",
        ],
        duration: "3-4 Weeks",
        portfolioValue: "Very High",
      },
      {
        id: "data-project-4",
        title: "House Price Prediction",
        difficulty: "Intermediate",
        technologies: [
          "Python",
          "Pandas",
          "NumPy",
          "Scikit-learn",
        ],
        description:
          "Create a regression model that predicts house prices using features such as location, size and number of rooms.",
        skills: [
          "Python",
          "Statistics",
          "Machine Learning",
          "Data Analysis",
        ],
        duration: "2-3 Weeks",
        portfolioValue: "High",
      },
      {
        id: "data-project-5",
        title: "Real-Time Data Analytics Dashboard",
        difficulty: "Advanced",
        technologies: [
          "Python",
          "SQL",
          "React",
          "APIs",
          "Data Visualization",
        ],
        description:
          "Build a dashboard that collects, processes and visualizes continuously updated data for meaningful business insights.",
        skills: [
          "Python",
          "SQL",
          "Data Visualization",
          "Data Analysis",
        ],
        duration: "4-6 Weeks",
        portfolioValue: "Very High",
      },
    ],

    "Cybersecurity Analyst": [
      {
        id: "cyber-project-1",
        title: "Password Strength Analyzer",
        difficulty: "Beginner",
        technologies: [
          "Python",
          "Regex",
        ],
        description:
          "Build a tool that evaluates password strength based on length, character diversity and common security weaknesses.",
        skills: [
          "Python",
          "Cybersecurity",
        ],
        duration: "1 Week",
        portfolioValue: "Medium",
      },
      {
        id: "cyber-project-2",
        title: "Network Monitoring Dashboard",
        difficulty: "Intermediate",
        technologies: [
          "Python",
          "Linux",
          "Networking",
        ],
        description:
          "Create a network monitoring tool that records authorized network information and presents useful monitoring statistics.",
        skills: [
          "Python",
          "Networking",
          "Network Security",
        ],
        duration: "2-3 Weeks",
        portfolioValue: "High",
      },
      {
        id: "cyber-project-3",
        title: "Secure Login System",
        difficulty: "Intermediate",
        technologies: [
          "Python",
          "Flask",
          "SQL",
          "Cryptography",
        ],
        description:
          "Develop a secure authentication system with password hashing, sessions and basic account security controls.",
        skills: [
          "Python",
          "Cryptography",
          "Cybersecurity",
          "SQL",
        ],
        duration: "2-3 Weeks",
        portfolioValue: "High",
      },
      {
        id: "cyber-project-4",
        title: "Security Log Analyzer",
        difficulty: "Intermediate",
        technologies: [
          "Python",
          "Linux",
          "Regex",
        ],
        description:
          "Build a defensive tool that analyzes system logs and identifies suspicious patterns such as repeated failed login attempts.",
        skills: [
          "Python",
          "Linux",
          "Cybersecurity",
        ],
        duration: "2-3 Weeks",
        portfolioValue: "High",
      },
      {
        id: "cyber-project-5",
        title: "Vulnerability Assessment Lab",
        difficulty: "Advanced",
        technologies: [
          "Linux",
          "Networking",
          "Security Tools",
          "Python",
        ],
        description:
          "Create an authorized cybersecurity practice lab to learn vulnerability assessment, security monitoring and remediation.",
        skills: [
          "Linux",
          "Networking",
          "Ethical Hacking",
          "Network Security",
        ],
        duration: "4-6 Weeks",
        portfolioValue: "Very High",
      },
    ],
  };

  // =====================================================
  // GET CAREER PROJECTS
  // =====================================================

  const allProjects =
    projectData[career] ||
    projectData["Software Developer"];

  // =====================================================
  // PROJECT STATUS
  // =====================================================

  const [projectStatus, setProjectStatus] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem("projectStatus");

        return saved
          ? JSON.parse(saved)
          : {};
      } catch (error) {
        console.error(
          "Project status error:",
          error
        );
        return {};
      }
    });

  // =====================================================
  // SAVE PROJECT STATUS
  // =====================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "projectStatus",
        JSON.stringify(projectStatus)
      );
    } catch (error) {
      console.error(
        "Unable to save project status:",
        error
      );
    }
  }, [projectStatus]);

  // =====================================================
  // CHANGE PROJECT STATUS
  // =====================================================

  const changeProjectStatus = (projectId) => {
    setProjectStatus((previous) => ({
      ...previous,
      [projectId]:
        previous[projectId] === "Completed"
          ? "Not Started"
          : "Completed",
    }));
  };

  // =====================================================
  // COMPLETED PROJECTS
  // =====================================================

  const completedProjects = allProjects.filter(
    (project) =>
      projectStatus[project.id] === "Completed"
  );

  const completedCount =
    completedProjects.length;

  const projectPercentage =
    allProjects.length > 0
      ? Math.round(
          (completedCount /
            allProjects.length) *
            100
        )
      : 0;

  // =====================================================
  // PERSONALIZED PROJECT MATCHING
  // =====================================================

  const normalizeSkill = (skill) =>
    String(skill || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const skillMatches = (projectSkill, userSkill) => {
    const project = normalizeSkill(projectSkill);
    const user = normalizeSkill(userSkill);

    if (!project || !user) return false;

    if (
      project === user ||
      project.includes(user) ||
      user.includes(project)
    ) {
      return true;
    }

    const aliases = {
      dsa: [
        "datastructuresandalgorithms",
        "datastructurealgorithms",
      ],
      datastructuresandalgorithms: ["dsa"],
      oop: [
        "objectorientedprogramming",
        "objectorientedprogramming",
      ],
      objectorientedprogramming: ["oop"],
      ml: ["machinelearning"],
      machinelearning: ["ml"],
      ai: ["artificialintelligence"],
      artificialintelligence: ["ai"],
      node: ["nodejs"],
      nodejs: ["node"],
      api: ["restapi", "rest"],
      restapi: ["api", "rest"],
      database: ["sql", "mysql", "mongodb"],
      sql: ["database", "mysql"],
      mysql: ["sql", "database"],
      projects: [
        "aiprojects",
        "softwareprojects",
        "webprojects",
        "dataprojects",
        "securityprojects",
      ],
    };

    return (
      aliases[project]?.includes(user) ||
      aliases[user]?.includes(project)
    );
  };

  const getProjectMissingSkillCount = (project) => {
    return project.skills.filter((projectSkill) =>
      missingSkills.some((missingSkill) =>
        skillMatches(projectSkill, missingSkill)
      )
    ).length;
  };

  const personalizedProjects = [...allProjects].sort(
    (a, b) =>
      getProjectMissingSkillCount(b) -
      getProjectMissingSkillCount(a)
  );

  // =====================================================
  // SAVE PROJECT RECOMMENDATIONS
  // =====================================================

  useEffect(() => {
    const projectResult = {
      career,
      careerMatch,
      projects: personalizedProjects,
      allProjects,
      missingSkills,
      learnedSkills,
      completedProjects:
        completedProjects.map(
          (project) => project.id
        ),
      completedCount,
      projectPercentage,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        "projectRecommendations",
        JSON.stringify(projectResult)
      );

      localStorage.setItem(
        "projects",
        JSON.stringify(projectResult)
      );

      // Project recommendations are generated,
      // so mark the module as completed.
      completeModule(MODULE_KEYS.PROJECTS);
    } catch (error) {
      console.error(
        "Project recommendation save error:",
        error
      );
    }
  }, [
    career,
    careerMatch,
    personalizedProjects,
    allProjects,
    missingSkills,
    learnedSkills,
    completedProjects,
    completedCount,
    projectPercentage,
  ]);

  // =====================================================
  // DIFFICULTY STYLE
  // =====================================================

  const getDifficultyStyle = (difficulty) => {
    if (difficulty === "Beginner") {
      return styles.beginner;
    }

    if (difficulty === "Intermediate") {
      return styles.intermediate;
    }

    return styles.advanced;
  };

  // =====================================================
  // PORTFOLIO STYLE
  // =====================================================

  const getPortfolioStyle = (value) => {
    if (value === "Very High") {
      return styles.portfolioVeryHigh;
    }

    if (value === "High") {
      return styles.portfolioHigh;
    }

    return styles.portfolioMedium;
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div style={styles.icon}>💻</div>

          <h1 style={styles.title}>
            Project Recommendations
          </h1>

          <p style={styles.subtitle}>
            Build real-world projects to
            develop practical skills and
            strengthen your portfolio for{" "}
            <strong>{career}</strong>.
          </p>
        </div>

        {/* TARGET CAREER */}

        <div style={styles.careerCard}>
          <div style={styles.targetIcon}>
            🎯
          </div>

          <p style={styles.smallTitle}>
            Recommended Career
          </p>

          <h1 style={styles.careerName}>
            {career}
          </h1>

          {careerMatch > 0 && (
            <p style={styles.matchText}>
              Career Match:{" "}
              <strong>{careerMatch}%</strong>
            </p>
          )}
        </div>

        {/* SUMMARY */}

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              💻
            </div>

            <h2>{allProjects.length}</h2>

            <p>Recommended Projects</p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              📚
            </div>

            <h2>{missingSkills.length}</h2>

            <p>Skills to Develop</p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              🏆
            </div>

            <h2>{completedCount}</h2>

            <p>Projects Completed</p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              📊
            </div>

            <h2>{projectPercentage}%</h2>

            <p>Project Progress</p>
          </div>
        </div>

        {/* PROJECT PROGRESS */}

        <div style={styles.section}>
          <h2>📈 Project Progress</h2>

          <div style={styles.progressBackground}>
            <div
              style={{
                ...styles.progressFill,
                width: `${projectPercentage}%`,
              }}
            />
          </div>

          <div style={styles.progressLabels}>
            <span>
              Completed:{" "}
              <strong>{completedCount}</strong>
            </span>

            <span>
              Total:{" "}
              <strong>{allProjects.length}</strong>
            </span>
          </div>
        </div>

        {/* PERSONALIZATION */}

        <div style={styles.personalizedBox}>
          <div style={styles.personalizedIcon}>
            🤖
          </div>

          <div>
            <h2 style={styles.personalizedTitle}>
              Personalized Project Selection
            </h2>

            <p style={styles.personalizedText}>
              Projects are prioritized according
              to the skills you still need to
              develop for your recommended
              career.
            </p>
          </div>
        </div>

        {/* SKILL GAPS */}

        {missingSkills.length > 0 && (
          <div style={styles.section}>
            <h2>
              📚 Skills These Projects Will
              Help You Develop
            </h2>

            <div style={styles.skillList}>
              {missingSkills.map((skill) => (
                <span
                  key={skill}
                  style={styles.skillTag}
                >
                  📚 {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* LEARNED SKILLS */}

        {learnedSkills.length > 0 && (
          <div style={styles.section}>
            <h2>
              ✅ Skills You Already Have
            </h2>

            <div style={styles.skillList}>
              {learnedSkills.map((skill) => (
                <span
                  key={skill}
                  style={styles.learnedSkillTag}
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PROJECT LIST */}

        <div style={styles.section}>
          <h2>🚀 Recommended Projects</h2>

          <p style={styles.sectionText}>
            Projects are ordered so that
            projects matching your skill gaps
            appear first. Start with beginner
            projects and gradually move toward
            advanced projects.
          </p>

          <div style={styles.projectGrid}>
            {personalizedProjects.map(
              (project, index) => {
                const isCompleted =
                  projectStatus[project.id] ===
                  "Completed";

                const matchingSkills =
                  project.skills.filter(
                    (projectSkill) =>
                      missingSkills.some(
                        (missingSkill) =>
                          skillMatches(
                            projectSkill,
                            missingSkill
                          )
                      )
                  );

                return (
                  <div
                    key={project.id}
                    style={{
                      ...styles.projectCard,
                      ...(isCompleted
                        ? styles.completedProject
                        : {}),
                    }}
                  >
                    {/* PROJECT TOP */}

                    <div style={styles.projectTop}>
                      <div
                        style={styles.projectNumber}
                      >
                        {index + 1}
                      </div>

                      <span
                        style={getDifficultyStyle(
                          project.difficulty
                        )}
                      >
                        {project.difficulty}
                      </span>
                    </div>

                    {/* TITLE */}

                    <h2
                      style={styles.projectTitle}
                    >
                      {project.title}
                    </h2>

                    {/* DESCRIPTION */}

                    <p
                      style={
                        styles.projectDescription
                      }
                    >
                      {project.description}
                    </p>

                    {/* DURATION */}

                    <div style={styles.duration}>
                      ⏱️ Duration:{" "}
                      <strong>
                        {project.duration}
                      </strong>
                    </div>

                    {/* PORTFOLIO VALUE */}

                    <div
                      style={
                        styles.portfolioValue
                      }
                    >
                      <span>
                        💼 Portfolio Value
                      </span>

                      <span
                        style={getPortfolioStyle(
                          project.portfolioValue
                        )}
                      >
                        {project.portfolioValue}
                      </span>
                    </div>

                    {/* PERSONALIZED MATCH */}

                    {matchingSkills.length > 0 && (
                      <div
                        style={
                          styles.matchBox
                        }
                      >
                        🎯 Helps improve:{" "}
                        <strong>
                          {matchingSkills.join(
                            ", "
                          )}
                        </strong>
                      </div>
                    )}

                    {/* TECHNOLOGIES */}

                    <h4
                      style={styles.subHeading}
                    >
                      🛠️ Technologies
                    </h4>

                    <div style={styles.techList}>
                      {project.technologies.map(
                        (technology) => (
                          <span
                            key={technology}
                            style={
                              styles.techTag
                            }
                          >
                            {technology}
                          </span>
                        )
                      )}
                    </div>

                    {/* SKILLS */}

                    <h4
                      style={styles.subHeading}
                    >
                      🎯 Skills Practiced
                    </h4>

                    <div style={styles.techList}>
                      {project.skills.map(
                        (skill) => (
                          <span
                            key={skill}
                            style={
                              styles.skillPracticeTag
                            }
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>

                    {/* STATUS */}

                    <div
                      style={
                        isCompleted
                          ? styles.statusCompleted
                          : styles.statusNotStarted
                      }
                    >
                      {isCompleted
                        ? "✅ Completed"
                        : "🔒 Not Started"}
                    </div>

                    {/* BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        changeProjectStatus(
                          project.id
                        )
                      }
                      style={
                        isCompleted
                          ? styles.undoButton
                          : styles.completeButton
                      }
                    >
                      {isCompleted
                        ? "↩ Mark as Not Started"
                        : "✓ Mark Project Completed"}
                    </button>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* PORTFOLIO TIP */}

        <div style={styles.tipBox}>
          <div style={styles.tipIcon}>💡</div>

          <div>
            <h2 style={styles.tipTitle}>
              Portfolio Tip
            </h2>

            <p style={styles.tipText}>
              Do not just copy projects from
              tutorials. Understand the concepts,
              add your own features, upload the
              project to GitHub and explain it
              clearly in your resume and
              interviews.
            </p>
          </div>
        </div>

        {/* COMPLETION */}

        <div style={styles.completedBox}>
          <strong>
            💻 Project Recommendations Generated
          </strong>

          <p>
            {completedCount} of{" "}
            {allProjects.length} projects
            completed
          </p>
        </div>

        {/* NEXT */}

        <div style={styles.nextSection}>
          <button
            type="button"
            onClick={() =>
              navigate("/readiness")
            }
            style={styles.nextButton}
          >
            🎯 Check Career Readiness →
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
    padding: "40px 20px 60px",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    background: "#ffffff",
    padding: "35px 25px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  icon: {
    fontSize: "45px",
    marginBottom: "10px",
  },

  title: {
    margin: "0 0 10px",
    color: "#1e293b",
    fontSize: "32px",
  },

  subtitle: {
    margin: "0 auto",
    maxWidth: "750px",
    color: "#64748b",
    fontSize: "17px",
    lineHeight: "1.6",
  },

  careerCard: {
    marginTop: "30px",
    padding: "30px",
    background: "#eff6ff",
    borderRadius: "15px",
    border: "2px solid #2563eb",
    textAlign: "center",
  },

  targetIcon: {
    fontSize: "32px",
  },

  smallTitle: {
    margin: "8px 0",
    color: "#475569",
    fontSize: "16px",
  },

  careerName: {
    margin: "5px 0",
    color: "#2563eb",
    fontSize: "30px",
  },

  matchText: {
    color: "#475569",
    fontSize: "17px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },

  statCard: {
    background: "#ffffff",
    padding: "25px 15px",
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
    padding: "28px",
    borderRadius: "14px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  sectionText: {
    color: "#64748b",
    lineHeight: "1.6",
  },

  personalizedBox: {
    marginTop: "30px",
    padding: "24px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "14px",
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
  },

  personalizedIcon: {
    fontSize: "32px",
  },

  personalizedTitle: {
    margin: "0 0 8px",
    color: "#3730a3",
  },

  personalizedText: {
    margin: 0,
    color: "#4338ca",
    lineHeight: "1.6",
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
    transition: "width 0.5s ease",
  },

  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
    color: "#64748b",
    fontSize: "14px",
  },

  skillList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "15px",
  },

  skillTag: {
    padding: "10px 15px",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "20px",
    fontWeight: "600",
  },

  learnedSkillTag: {
    padding: "10px 15px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "20px",
    fontWeight: "600",
  },

  projectGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(310px, 1fr))",
    gap: "22px",
    marginTop: "25px",
  },

  projectCard: {
    background: "#f8fafc",
    padding: "22px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    boxShadow:
      "0 3px 10px rgba(0,0,0,0.05)",
  },

  completedProject: {
    border: "2px solid #16a34a",
    background: "#f0fdf4",
  },

  projectTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  projectNumber: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "17px",
  },

  beginner: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  intermediate: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  advanced: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  projectTitle: {
    marginTop: "18px",
    color: "#1e293b",
    fontSize: "21px",
  },

  projectDescription: {
    color: "#475569",
    lineHeight: "1.6",
    minHeight: "80px",
  },

  duration: {
    marginTop: "15px",
    padding: "10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "8px",
    fontSize: "14px",
  },

  portfolioValue: {
    marginTop: "10px",
    padding: "10px",
    background: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "600",
  },

  portfolioVeryHigh: {
    background: "#dcfce7",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  portfolioHigh: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  portfolioMedium: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  matchBox: {
    marginTop: "12px",
    padding: "10px",
    background: "#ede9fe",
    color: "#5b21b6",
    borderRadius: "8px",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  subHeading: {
    marginTop: "20px",
    marginBottom: "10px",
    color: "#334155",
  },

  techList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  techTag: {
    padding: "7px 10px",
    background: "#e0e7ff",
    color: "#3730a3",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "600",
  },

  skillPracticeTag: {
    padding: "7px 10px",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: "7px",
    fontSize: "12px",
  },

  statusNotStarted: {
    marginTop: "20px",
    padding: "10px",
    background: "#f1f5f9",
    color: "#64748b",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "14px",
  },

  statusCompleted: {
    marginTop: "20px",
    padding: "10px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "14px",
  },

  completeButton: {
    width: "100%",
    marginTop: "12px",
    padding: "11px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  undoButton: {
    width: "100%",
    marginTop: "12px",
    padding: "11px",
    background: "#64748b",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  tipBox: {
    marginTop: "30px",
    padding: "25px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "14px",
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
  },

  tipIcon: {
    fontSize: "32px",
  },

  tipTitle: {
    margin: "0 0 8px",
    color: "#92400e",
  },

  tipText: {
    margin: 0,
    color: "#78350f",
    lineHeight: "1.6",
  },

  completedBox: {
    marginTop: "30px",
    padding: "20px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
  },

  nextSection: {
    textAlign: "center",
    marginTop: "35px",
  },

  nextButton: {
    padding: "15px 32px",
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default Projects;