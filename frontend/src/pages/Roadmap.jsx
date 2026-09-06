import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  completeModule,
  MODULE_KEYS,
} from "../utils/progress";

import {
  getStudentData,
  saveStudentData,
} from "../utils/studentStorage";

function Roadmap() {
  const navigate = useNavigate();

  // =====================================================
  // STUDENT-WISE STORAGE
  // =====================================================

  const getData = (key, defaultValue = null) => {
    try {
      return getStudentData(key, defaultValue);
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return defaultValue;
    }
  };

  // =====================================================
  // LOAD STUDENT DATA
  // =====================================================

  const [careerRecommendation, setCareerRecommendation] =
    useState(
      getData("careerRecommendation")
    );

  const [skillGap, setSkillGap] = useState(
    getData("skillGap")
  );

  const [profile, setProfile] = useState(
    getData("studentProfile")
  );

  const [skillAssessment, setSkillAssessment] =
    useState(
      getData("skillAssessment")
    );

  const [interestAssessment, setInterestAssessment] =
    useState(
      getData("interestAssessment")
    );

  const [completed, setCompleted] =
    useState(false);

  // =====================================================
  // RELOAD STUDENT DATA
  // =====================================================

  useEffect(() => {
    const recommendation =
      getData("careerRecommendation");

    const gap = getData("skillGap");

    const studentProfile =
      getData("studentProfile");

    const assessment =
      getData("skillAssessment");

    const interests =
      getData("interestAssessment");

    setCareerRecommendation(recommendation);
    setSkillGap(gap);
    setProfile(studentProfile);
    setSkillAssessment(assessment);
    setInterestAssessment(interests);
  }, []);

  // =====================================================
  // NORMALIZE TEXT
  // =====================================================

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s/-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // =====================================================
  // DETECT CAREER
  // =====================================================

  const getCareerName = () => {
    const sources = [
      careerRecommendation?.career,
      careerRecommendation?.recommendedCareer,
      careerRecommendation?.title,
      careerRecommendation?.name,
      careerRecommendation?.careerPath,
      profile?.career,
      profile?.careerGoal,
      profile?.targetCareer,
    ];

    const text = sources.find(
      (item) => item
    );

    if (!text) {
      return "Software Developer";
    }

    const value = normalize(text);

    if (
      value.includes("ai") ||
      value.includes("machine learning") ||
      value.includes("ml")
    ) {
      return "AI / ML Engineer";
    }

    if (
      value.includes("data scientist") ||
      value.includes("data science")
    ) {
      return "Data Scientist";
    }

    if (
      value.includes("cyber") ||
      value.includes("security")
    ) {
      return "Cybersecurity Analyst";
    }

    if (
      value.includes("web") ||
      value.includes("frontend") ||
      value.includes("backend")
    ) {
      return "Web Developer";
    }

    return "Software Developer";
  };

  const career = getCareerName();

  // =====================================================
  // ROADMAP DATA
  // =====================================================

  const roadmapData = {
    "AI / ML Engineer": [
      {
        title: "Python Programming",
        duration: "3-4 weeks",
        description:
          "Learn Python fundamentals, functions, data structures, modules and object-oriented programming.",
        skill: "Python",
        courseTitle:
          "Python Official Tutorial",
        courseUrl:
          "https://docs.python.org/3/tutorial/",
      },
      {
        title: "NumPy and Pandas",
        duration: "2-3 weeks",
        description:
          "Learn numerical computing, arrays, data manipulation and practical data analysis.",
        skill: "NumPy / Pandas",
        courseTitle:
          "Pandas Documentation",
        courseUrl:
          "https://pandas.pydata.org/docs/getting_started/intro_tutorials/",
      },
      {
        title:
          "Mathematics for Machine Learning",
        duration: "3-4 weeks",
        description:
          "Study linear algebra, probability, statistics and the mathematics required for machine learning.",
        skill: "Mathematics",
        courseTitle:
          "Khan Academy Mathematics",
        courseUrl:
          "https://www.khanacademy.org/math",
      },
      {
        title:
          "Machine Learning Fundamentals",
        duration: "4-6 weeks",
        description:
          "Learn supervised learning, unsupervised learning, model evaluation and feature engineering.",
        skill: "Machine Learning",
        courseTitle:
          "Scikit-learn User Guide",
        courseUrl:
          "https://scikit-learn.org/stable/user_guide.html",
      },
      {
        title: "Deep Learning",
        duration: "4-6 weeks",
        description:
          "Learn neural networks, CNNs, optimization, training and deep learning workflows.",
        skill: "Deep Learning",
        courseTitle:
          "PyTorch Tutorials",
        courseUrl:
          "https://docs.pytorch.org/tutorials/",
      },
      {
        title:
          "Generative AI and LLMs",
        duration: "3-4 weeks",
        description:
          "Learn LLM concepts, prompting, embeddings, APIs and AI application development.",
        skill: "Generative AI",
        courseTitle:
          "Hugging Face Learn",
        courseUrl:
          "https://huggingface.co/learn",
      },
      {
        title: "AI Projects",
        duration: "4-6 weeks",
        description:
          "Build real-world AI projects and create a portfolio suitable for internships and jobs.",
        skill: "Projects",
        courseTitle: "Google Colab",
        courseUrl:
          "https://colab.research.google.com/",
      },
    ],

    "Software Developer": [
      {
        title: "Java Programming",
        duration: "4-6 weeks",
        description:
          "Learn Java syntax, variables, control flow, methods, arrays, classes and object-oriented programming.",
        skill: "Java",
        courseTitle:
          "Learn Java - Dev.java",
        courseUrl:
          "https://dev.java/learn/",
      },
      {
        title:
          "Object-Oriented Programming",
        duration: "2-3 weeks",
        description:
          "Master classes, objects, inheritance, polymorphism, abstraction and encapsulation.",
        skill: "OOP",
        courseTitle:
          "Java OOP Tutorial",
        courseUrl:
          "https://docs.oracle.com/javase/tutorial/java/javaOO/",
      },
      {
        title:
          "Data Structures and Algorithms",
        duration: "5-7 weeks",
        description:
          "Learn arrays, linked lists, stacks, queues, trees, graphs, sorting and searching.",
        skill: "DSA",
        courseTitle:
          "GeeksforGeeks DSA",
        courseUrl:
          "https://www.geeksforgeeks.org/data-structures/",
      },
      {
        title: "Database and SQL",
        duration: "3-4 weeks",
        description:
          "Learn relational databases, SQL queries, joins, indexes and database design.",
        skill: "SQL",
        courseTitle: "SQLBolt",
        courseUrl:
          "https://sqlbolt.com/",
      },
      {
        title: "Git and GitHub",
        duration: "1-2 weeks",
        description:
          "Learn version control, repositories, branches, commits, pull requests and collaboration.",
        skill: "Git",
        courseTitle:
          "Git Documentation",
        courseUrl:
          "https://git-scm.com/doc",
      },
      {
        title: "Backend Development",
        duration: "4-6 weeks",
        description:
          "Learn REST APIs, authentication, server-side development and database integration.",
        skill: "Backend",
        courseTitle:
          "Node.js Learn",
        courseUrl:
          "https://nodejs.org/en/learn",
      },
      {
        title:
          "Software Development Projects",
        duration: "4-6 weeks",
        description:
          "Build complete applications and create a professional software development portfolio.",
        skill: "Projects",
        courseTitle: "GitHub",
        courseUrl:
          "https://github.com/",
      },
    ],

    "Web Developer": [
      {
        title: "HTML and CSS",
        duration: "2-3 weeks",
        description:
          "Learn semantic HTML, CSS layouts, responsive design, Flexbox and Grid.",
        skill: "HTML / CSS",
        courseTitle:
          "MDN Web Development",
        courseUrl:
          "https://developer.mozilla.org/en-US/docs/Learn_web_development",
      },
      {
        title: "JavaScript",
        duration: "3-5 weeks",
        description:
          "Learn modern JavaScript, functions, arrays, objects, DOM, events, promises and async programming.",
        skill: "JavaScript",
        courseTitle:
          "MDN JavaScript Guide",
        courseUrl:
          "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
      },
      {
        title: "React",
        duration: "3-5 weeks",
        description:
          "Learn components, props, state, hooks, events, forms and modern React development.",
        skill: "React",
        courseTitle:
          "React Learn",
        courseUrl:
          "https://react.dev/learn",
      },
      {
        title: "Node.js and APIs",
        duration: "3-4 weeks",
        description:
          "Learn backend development, REST APIs, routing, middleware and server-side JavaScript.",
        skill: "Node.js",
        courseTitle:
          "Node.js Learn",
        courseUrl:
          "https://nodejs.org/en/learn",
      },
      {
        title: "Database",
        duration: "2-3 weeks",
        description:
          "Learn SQL, database design, CRUD operations and application database integration.",
        skill: "Database",
        courseTitle: "SQLBolt",
        courseUrl:
          "https://sqlbolt.com/",
      },
      {
        title: "Git and GitHub",
        duration: "1-2 weeks",
        description:
          "Learn version control and how to manage and publish web projects.",
        skill: "Git",
        courseTitle:
          "Git Documentation",
        courseUrl:
          "https://git-scm.com/doc",
      },
      {
        title: "Full Stack Project",
        duration: "4-6 weeks",
        description:
          "Build and deploy a complete responsive full-stack web application.",
        skill: "Full Stack",
        courseTitle: "Vercel",
        courseUrl:
          "https://vercel.com/docs",
      },
    ],

    "Data Scientist": [
      {
        title: "Python Programming",
        duration: "3-4 weeks",
        description:
          "Learn Python programming fundamentals required for data science.",
        skill: "Python",
        courseTitle:
          "Python Official Tutorial",
        courseUrl:
          "https://docs.python.org/3/tutorial/",
      },
      {
        title:
          "Statistics and Probability",
        duration: "3-4 weeks",
        description:
          "Learn descriptive statistics, probability, distributions, hypothesis testing and correlation.",
        skill: "Statistics",
        courseTitle:
          "Khan Academy Statistics",
        courseUrl:
          "https://www.khanacademy.org/math/statistics-probability",
      },
      {
        title: "NumPy and Pandas",
        duration: "2-3 weeks",
        description:
          "Learn data manipulation, cleaning, transformation and numerical analysis.",
        skill: "Pandas",
        courseTitle:
          "Pandas Getting Started",
        courseUrl:
          "https://pandas.pydata.org/docs/getting_started/intro_tutorials/",
      },
      {
        title: "Data Visualization",
        duration: "2-3 weeks",
        description:
          "Learn how to communicate insights using charts, plots and dashboards.",
        skill: "Data Visualization",
        courseTitle:
          "Matplotlib Tutorials",
        courseUrl:
          "https://matplotlib.org/stable/tutorials/",
      },
      {
        title: "Machine Learning",
        duration: "4-6 weeks",
        description:
          "Learn regression, classification, clustering, preprocessing and model evaluation.",
        skill: "Machine Learning",
        courseTitle:
          "Scikit-learn User Guide",
        courseUrl:
          "https://scikit-learn.org/stable/user_guide.html",
      },
      {
        title: "SQL",
        duration: "2-3 weeks",
        description:
          "Learn SQL queries, joins, aggregation, subqueries and database analysis.",
        skill: "SQL",
        courseTitle: "SQLBolt",
        courseUrl:
          "https://sqlbolt.com/",
      },
      {
        title:
          "Data Science Projects",
        duration: "4-6 weeks",
        description:
          "Build end-to-end data science projects and create a strong portfolio.",
        skill: "Projects",
        courseTitle:
          "Kaggle Learn",
        courseUrl:
          "https://www.kaggle.com/learn",
      },
    ],

    "Cybersecurity Analyst": [
      {
        title:
          "Networking Fundamentals",
        duration: "3-4 weeks",
        description:
          "Learn TCP/IP, DNS, HTTP, ports, protocols, routing and network security fundamentals.",
        skill: "Networking",
        courseTitle:
          "Cisco Networking Academy",
        courseUrl:
          "https://www.netacad.com/",
      },
      {
        title: "Linux Fundamentals",
        duration: "2-3 weeks",
        description:
          "Learn Linux commands, file systems, permissions, processes and shell basics.",
        skill: "Linux",
        courseTitle:
          "Linux Documentation",
        courseUrl:
          "https://docs.kernel.org/",
      },
      {
        title:
          "Cybersecurity Fundamentals",
        duration: "3-4 weeks",
        description:
          "Learn common threats, vulnerabilities, security controls and defensive techniques.",
        skill: "Cybersecurity",
        courseTitle:
          "Cisco Cybersecurity",
        courseUrl:
          "https://www.netacad.com/courses/cybersecurity",
      },
      {
        title: "Ethical Hacking",
        duration: "4-6 weeks",
        description:
          "Learn penetration testing concepts, reconnaissance, vulnerabilities and security testing.",
        skill: "Ethical Hacking",
        courseTitle:
          "OWASP Web Security Testing",
        courseUrl:
          "https://owasp.org/www-project-web-security-testing-guide/",
      },
      {
        title:
          "Web Application Security",
        duration: "3-4 weeks",
        description:
          "Learn authentication, authorization, injection, XSS and common web vulnerabilities.",
        skill: "Web Security",
        courseTitle:
          "OWASP Top 10",
        courseUrl:
          "https://owasp.org/www-project-top-ten/",
      },
      {
        title: "Security Tools",
        duration: "3-4 weeks",
        description:
          "Practice with security tools and understand how security analysts investigate threats.",
        skill: "Security Tools",
        courseTitle:
          "Kali Linux Documentation",
        courseUrl:
          "https://www.kali.org/docs/",
      },
      {
        title:
          "Cybersecurity Projects",
        duration: "4-6 weeks",
        description:
          "Build practical security projects and document your work in a professional portfolio.",
        skill: "Projects",
        courseTitle:
          "OWASP Projects",
        courseUrl:
          "https://owasp.org/projects/",
      },
    ],
  };

  // =====================================================
  // SKILL ALIASES
  // =====================================================

  const aliases = {
    python: ["python"],

    java: ["java"],

    javascript: [
      "javascript",
      "js",
    ],

    react: [
      "react",
      "reactjs",
    ],

    "html / css": [
      "html",
      "css",
      "html/css",
    ],

    "machine learning": [
      "machine learning",
      "ml",
    ],

    "deep learning": [
      "deep learning",
      "neural network",
    ],

    "generative ai": [
      "generative ai",
      "genai",
      "llm",
      "large language model",
    ],

    "data visualization": [
      "data visualization",
      "visualization",
      "matplotlib",
    ],

    statistics: [
      "statistics",
      "probability",
      "statistic",
    ],

    sql: [
      "sql",
      "database",
    ],

    networking: [
      "networking",
      "computer network",
      "tcp",
      "ip",
    ],

    linux: [
      "linux",
      "unix",
    ],

    cybersecurity: [
      "cybersecurity",
      "cyber security",
      "security",
    ],

    "ethical hacking": [
      "ethical hacking",
      "penetration testing",
      "pentesting",
    ],

    "web security": [
      "web security",
      "owasp",
    ],

    git: [
      "git",
      "github",
    ],

    dsa: [
      "dsa",
      "data structures",
      "data structure",
      "algorithms",
      "algorithm",
    ],
  };

  // =====================================================
  // LEARNED SKILLS
  // =====================================================

  const learnedSkills = useMemo(() => {
    const values = [];

    const collect = (value) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }

      if (typeof value === "object") {
        Object.values(value).forEach(collect);
        return;
      }

      values.push(normalize(value));
    };

    collect(skillAssessment);
    collect(profile?.skills);
    collect(profile?.technicalSkills);
    collect(profile?.programmingLanguages);
    collect(profile?.knownSkills);

    return values.filter(Boolean);
  }, [
    skillAssessment,
    profile,
  ]);

  // =====================================================
  // MISSING SKILLS
  // =====================================================

  const missingSkills = useMemo(() => {
    const values = [];

    const collect = (value) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }

      if (typeof value === "object") {
        Object.values(value).forEach(collect);
        return;
      }

      values.push(normalize(value));
    };

    collect(skillGap?.missingSkills);
    collect(skillGap?.skillsToLearn);
    collect(skillGap?.skillGaps);
    collect(skillGap?.gaps);
    collect(skillGap?.recommendations);

    return values.filter(Boolean);
  }, [skillGap]);

  // =====================================================
  // SELECT ROADMAP
  // =====================================================

  const roadmap =
    roadmapData[career] ||
    roadmapData["Software Developer"];

  // =====================================================
  // CHECK KNOWN SKILL
  // =====================================================

  const isSkillKnown = (skill) => {
    const target = normalize(skill);

    const related =
      aliases[target] || [target];

    return learnedSkills.some(
      (learned) =>
        related.some(
          (item) =>
            learned === item ||
            learned.includes(item) ||
            item.includes(learned)
        )
    );
  };

  // =====================================================
  // CHECK MISSING SKILL
  // =====================================================

  const isSkillMissing = (skill) => {
    const target = normalize(skill);

    const related =
      aliases[target] || [target];

    return missingSkills.some(
      (missing) =>
        related.some(
          (item) =>
            missing === item ||
            missing.includes(item) ||
            item.includes(missing)
        )
    );
  };

  // =====================================================
  // PERSONALIZED ROADMAP
  // =====================================================

  const personalizedRoadmap = useMemo(() => {
    const filtered = roadmap.filter(
      (step) => {
        if (isSkillMissing(step.skill)) {
          return true;
        }

        if (isSkillKnown(step.skill)) {
          return false;
        }

        return true;
      }
    );

    return filtered.length > 0
      ? filtered
      : roadmap;
  }, [
    roadmap,
    learnedSkills,
    missingSkills,
  ]);

  // =====================================================
  // COMPLETED ROADMAP STEPS
  // =====================================================

  const completedCount =
    personalizedRoadmap.filter(
      (step) => {
        const stepKey =
          `roadmap_completed_${normalize(
            step.title
          ).replace(/\s+/g, "_")}`;

        return Boolean(
          getData(stepKey, false)
        );
      }
    ).length;

  // =====================================================
  // ROADMAP PERCENTAGE
  // =====================================================

  const percentage =
    personalizedRoadmap.length > 0
      ? Math.round(
          (completedCount /
            personalizedRoadmap.length) *
            100
        )
      : 0;

  // =====================================================
  // SAVE ROADMAP
  // =====================================================

  useEffect(() => {
    const roadmapPayload = {
      career,
      roadmap: personalizedRoadmap,
      generatedAt:
        new Date().toISOString(),
    };

    // Student-wise storage
    saveStudentData(
      "careerRoadmap",
      roadmapPayload
    );

    saveStudentData(
      "roadmap",
      roadmapPayload
    );

    // Preserve module completion
    if (
      personalizedRoadmap.length > 0
    ) {
      completeModule(
        MODULE_KEYS.ROADMAP
      );

      setCompleted(true);
    }
  }, [
    career,
    personalizedRoadmap,
  ]);

  // =====================================================
  // OPEN COURSE
  // =====================================================

  const openCourse = (step) => {
    if (step.courseUrl) {
      window.open(
        step.courseUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // =====================================================
  // MARK ROADMAP STEP COMPLETE
  // =====================================================

  const markComplete = (title) => {
    const key =
      `roadmap_completed_${normalize(
        title
      ).replace(/\s+/g, "_")}`;

    // Student-wise storage
    saveStudentData(
      key,
      true
    );

    // Force UI refresh
    setCompleted(
      (value) => !value
    );

    window.dispatchEvent(
      new Event("roadmapUpdated")
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow:
              "0 10px 30px rgba(15, 23, 42, 0.08)",
          }}
        >
          <button
            onClick={() =>
              navigate("/dashboard")
            }
            style={{
              border: "none",
              background: "#eef2ff",
              color: "#4338ca",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              marginBottom: "20px",
              fontWeight: "600",
            }}
          >
            ← Dashboard
          </button>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#6366f1",
                  marginBottom: "8px",
                  textTransform:
                    "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Personalized Learning
                Roadmap
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "34px",
                  color: "#0f172a",
                }}
              >
                {career}
              </h1>

              <p
                style={{
                  color: "#64748b",
                  marginTop: "10px",
                  maxWidth: "700px",
                  lineHeight: "1.7",
                }}
              >
                Your learning path is
                personalized using your
                career recommendation,
                skills, profile and
                skill-gap information.
              </p>
            </div>

            <div
              style={{
                minWidth: "170px",
                background: "#f8fafc",
                borderRadius: "18px",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#4f46e5",
                }}
              >
                {percentage}%
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Roadmap Progress
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            PROGRESS BAR
        ===================================================== */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow:
              "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginBottom: "12px",
              color: "#475569",
              fontWeight: "600",
            }}
          >
            <span>
              Learning Progress
            </span>

            <span>
              {completedCount}/
              {personalizedRoadmap.length}{" "}
              completed
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#e2e8f0",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${percentage}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, #4f46e5, #7c3aed)",
                borderRadius: "20px",
                transition:
                  "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* =====================================================
            ROADMAP STEPS
        ===================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {personalizedRoadmap.map(
            (step, index) => {
              const stepKey =
                `roadmap_completed_${normalize(
                  step.title
                ).replace(
                  /\s+/g,
                  "_"
                )}`;

              const stepCompleted =
                Boolean(
                  getData(
                    stepKey,
                    false
                  )
                );

              return (
                <div
                  key={`${step.title}-${index}`}
                  style={{
                    background:
                      "#ffffff",
                    borderRadius:
                      "20px",
                    padding: "24px",
                    boxShadow:
                      "0 8px 24px rgba(15, 23, 42, 0.06)",
                    border:
                      stepCompleted
                        ? "2px solid #22c55e"
                        : "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems:
                        "flex-start",
                    }}
                  >
                    {/* STEP NUMBER */}

                    <div
                      style={{
                        minWidth: "46px",
                        height: "46px",
                        borderRadius:
                          "50%",
                        background:
                          stepCompleted
                            ? "#dcfce7"
                            : "#eef2ff",
                        color:
                          stepCompleted
                            ? "#15803d"
                            : "#4f46e5",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontWeight: "800",
                        fontSize: "18px",
                      }}
                    >
                      {stepCompleted
                        ? "✓"
                        : index + 1}
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      {/* TITLE + DURATION */}

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: "12px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <h2
                          style={{
                            margin: 0,
                            color:
                              "#0f172a",
                            fontSize:
                              "21px",
                          }}
                        >
                          {step.title}
                        </h2>

                        <span
                          style={{
                            background:
                              "#f1f5f9",
                            color:
                              "#475569",
                            padding:
                              "6px 12px",
                            borderRadius:
                              "999px",
                            fontSize:
                              "13px",
                            fontWeight:
                              "600",
                          }}
                        >
                          {step.duration}
                        </span>
                      </div>

                      {/* DESCRIPTION */}

                      <p
                        style={{
                          color:
                            "#64748b",
                          lineHeight:
                            "1.7",
                          margin:
                            "12px 0",
                        }}
                      >
                        {
                          step.description
                        }
                      </p>

                      {/* FOCUS SKILL */}

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "8px",
                          marginBottom:
                            "18px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "#64748b",
                          }}
                        >
                          Focus Skill:
                        </span>

                        <span
                          style={{
                            background:
                              "#ede9fe",
                            color:
                              "#6d28d9",
                            padding:
                              "5px 10px",
                            borderRadius:
                              "8px",
                            fontSize:
                              "13px",
                            fontWeight:
                              "700",
                          }}
                        >
                          {step.skill}
                        </span>
                      </div>

                      {/* BUTTONS */}

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "10px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          onClick={() =>
                            openCourse(
                              step
                            )
                          }
                          style={{
                            border:
                              "none",
                            background:
                              "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            color:
                              "#ffffff",
                            padding:
                              "11px 18px",
                            borderRadius:
                              "10px",
                            cursor:
                              "pointer",
                            fontWeight:
                              "700",
                          }}
                        >
                          📚 Start
                          Course
                        </button>

                        <button
                          onClick={() =>
                            markComplete(
                              step.title
                            )
                          }
                          style={{
                            border:
                              "1px solid #cbd5e1",
                            background:
                              stepCompleted
                                ? "#dcfce7"
                                : "#ffffff",
                            color:
                              stepCompleted
                                ? "#15803d"
                                : "#475569",
                            padding:
                              "11px 18px",
                            borderRadius:
                              "10px",
                            cursor:
                              "pointer",
                            fontWeight:
                              "700",
                          }}
                        >
                          {stepCompleted
                            ? "✓ Completed"
                            : "Mark Complete"}
                        </button>
                      </div>

                      {/* RESOURCE */}

                      <div
                        style={{
                          marginTop:
                            "12px",
                          fontSize:
                            "13px",
                          color:
                            "#64748b",
                        }}
                      >
                        Recommended
                        resource:{" "}
                        {
                          step.courseTitle
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* =====================================================
            EMPTY ROADMAP
        ===================================================== */}

        {personalizedRoadmap.length ===
          0 && (
          <div
            style={{
              background:
                "#ffffff",
              borderRadius:
                "20px",
              padding: "40px",
              textAlign:
                "center",
              color:
                "#64748b",
            }}
          >
            No roadmap steps
            are available yet.
          </div>
        )}

        {/* =====================================================
            FOOTER MESSAGE
        ===================================================== */}

        <div
          style={{
            marginTop: "28px",
            background: "#eef2ff",
            borderRadius: "18px",
            padding: "20px",
            color: "#3730a3",
            lineHeight: "1.7",
          }}
        >
          Complete the recommended
          courses and mark each step as
          completed to track your learning
          progress.
        </div>
      </div>
    </div>
  );
}

export default Roadmap;