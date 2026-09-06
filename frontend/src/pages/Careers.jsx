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

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function Careers() {
  const navigate = useNavigate();

  // =====================================================
  // STUDENT-WISE STORAGE HELPER
  // =====================================================

  const getData = (key, defaultValue = {}) => {
    try {
      return getStudentData(
        key,
        defaultValue
      );
    } catch (error) {
      console.error(
        `Error reading ${key}:`,
        error
      );

      return defaultValue;
    }
  };

  // =====================================================
  // STATE
  // =====================================================

  const [profile, setProfile] = useState({});
  const [skillAssessment, setSkillAssessment] =
    useState({});

  const [interestAssessment, setInterestAssessment] =
    useState({});

  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // =====================================================
  // LOAD STUDENT DATA
  // =====================================================

  useEffect(() => {
    const savedProfile =
      getData("studentProfile", {});

    const savedSkillAssessment =
      getData("skillAssessment", {});

    const savedInterestAssessment =
      getData(
        "interestAssessment",
        {}
      );

    const savedAIAnalysis =
      getData(
        "aiCareerAnalysis",
        ""
      );

    setProfile(savedProfile);

    setSkillAssessment(
      savedSkillAssessment
    );

    setInterestAssessment(
      savedInterestAssessment
    );

    if (savedAIAnalysis) {
      setAiResult(savedAIAnalysis);
    }
  }, []);

  // =====================================================
  // PROFILE SKILLS
  // =====================================================

  const skills = useMemo(() => {
    const possibleSkills =
      profile?.skills ||
      profile?.technicalSkills ||
      profile?.skill ||
      [];

    if (Array.isArray(possibleSkills)) {
      return possibleSkills;
    }

    if (typeof possibleSkills === "string") {
      return possibleSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    return [];
  }, [profile]);

  // =====================================================
  // PROFILE INTERESTS
  // =====================================================

  const profileInterests = useMemo(() => {
    const possibleInterests =
      profile?.interests ||
      profile?.interest ||
      profile?.careerInterests ||
      [];

    if (Array.isArray(possibleInterests)) {
      return possibleInterests;
    }

    if (typeof possibleInterests === "string") {
      return possibleInterests
        .split(",")
        .map((interest) =>
          interest.trim()
        )
        .filter(Boolean);
    }

    return [];
  }, [profile]);

  // =====================================================
  // CAREER INTEREST FROM PROFILE
  // =====================================================

  const careerInterest =
    String(
      profile?.careerInterest ||
        profile?.preferredCareer ||
        profile?.career ||
        ""
    ).toLowerCase();

  // =====================================================
  // SKILL ASSESSMENT SCORE
  // =====================================================

  const skillPercentage = useMemo(() => {
    const score = Number(
      skillAssessment?.score
    );

    const total = Number(
      skillAssessment?.total
    );

    if (
      Number.isFinite(score) &&
      Number.isFinite(total) &&
      total > 0
    ) {
      return Math.round(
        (score / total) * 100
      );
    }

    return 0;
  }, [skillAssessment]);

  // =====================================================
  // INTEREST ASSESSMENT QUESTIONS
  // =====================================================

  const interestQuestions = [
    {
      id: 1,
      question:
        "Which type of activity do you enjoy the most?",
      options: [
        "Building software applications",
        "Designing websites and user interfaces",
        "Protecting systems and networks",
        "Working with AI and machine learning",
      ],
    },
    {
      id: 2,
      question:
        "What would you most like to work on?",
      options: [
        "Programming and application development",
        "Websites and interactive interfaces",
        "Cybersecurity and system protection",
        "Artificial intelligence and data",
      ],
    },
    {
      id: 3,
      question:
        "Which problem sounds most interesting to you?",
      options: [
        "Creating a useful software solution",
        "Creating a modern and responsive website",
        "Finding and preventing security threats",
        "Teaching a computer to make intelligent decisions",
      ],
    },
    {
      id: 4,
      question:
        "Which technical area interests you most?",
      options: [
        "Programming and algorithms",
        "HTML, CSS, JavaScript and web development",
        "Networks, Linux and cybersecurity",
        "Python, machine learning and AI",
      ],
    },
    {
      id: 5,
      question:
        "Which type of project would you prefer?",
      options: [
        "A Java or Python software application",
        "A full-stack web application",
        "A security monitoring system",
        "An AI-powered application",
      ],
    },
    {
      id: 6,
      question:
        "Which activity would you enjoy learning?",
      options: [
        "Data structures and algorithms",
        "Frontend and backend development",
        "Ethical hacking and network security",
        "Machine learning and data analysis",
      ],
    },
    {
      id: 7,
      question:
        "What type of technology excites you most?",
      options: [
        "Software engineering",
        "Web technologies",
        "Cybersecurity technologies",
        "Artificial intelligence",
      ],
    },
    {
      id: 8,
      question:
        "Which career environment sounds best to you?",
      options: [
        "Developing software products",
        "Building websites and web platforms",
        "Protecting organizations from cyber attacks",
        "Developing intelligent AI systems",
      ],
    },
    {
      id: 9,
      question:
        "What would you like to become better at?",
      options: [
        "Programming and problem solving",
        "Web design and development",
        "Security analysis and networking",
        "AI and machine learning",
      ],
    },
    {
      id: 10,
      question:
        "Which long-term career goal interests you most?",
      options: [
        "Software Developer",
        "Web Developer",
        "Cybersecurity Analyst",
        "AI / ML Engineer",
      ],
    },
  ];

  // =====================================================
  // CALCULATE INTEREST SCORES
  // =====================================================

  const interestScores = useMemo(() => {
    const scores = {
      software: 0,
      web: 0,
      cybersecurity: 0,
      ai: 0,
    };

    const answers =
      interestAssessment?.answers || {};

    Object.entries(answers).forEach(
      ([questionId, answerValue]) => {
        const question =
          interestQuestions.find(
            (item) =>
              String(item.id) ===
              String(questionId)
          );

        if (!question) {
          return;
        }

        const answerIndex =
          Number(answerValue);

        if (
          !Number.isInteger(answerIndex) ||
          answerIndex < 0 ||
          answerIndex >=
            question.options.length
        ) {
          return;
        }

        const answerText =
          question.options[
            answerIndex
          ].toLowerCase();

        if (
          answerText.includes("software") ||
          answerText.includes("programming") ||
          answerText.includes("application") ||
          answerText.includes("algorithms") ||
          answerText.includes("java") ||
          answerText.includes("problem solving")
        ) {
          scores.software += 1;
        }

        if (
          answerText.includes("website") ||
          answerText.includes("web") ||
          answerText.includes("frontend") ||
          answerText.includes("backend") ||
          answerText.includes("html") ||
          answerText.includes("css") ||
          answerText.includes("javascript") ||
          answerText.includes("interface")
        ) {
          scores.web += 1;
        }

        if (
          answerText.includes("security") ||
          answerText.includes("cyber") ||
          answerText.includes("network") ||
          answerText.includes("linux") ||
          answerText.includes("ethical hacking") ||
          answerText.includes("attacks")
        ) {
          scores.cybersecurity += 1;
        }

        if (
          answerText.includes("ai") ||
          answerText.includes("artificial") ||
          answerText.includes("machine learning") ||
          answerText.includes("data analysis") ||
          answerText.includes("intelligent") ||
          answerText.includes("python")
        ) {
          scores.ai += 1;
        }
      }
    );

    return scores;
  }, [interestAssessment]);

  // =====================================================
  // STRONGEST INTEREST
  // =====================================================

  const strongestInterest = useMemo(() => {
    const entries = Object.entries(
      interestScores
    );

    if (entries.length === 0) {
      return "";
    }

    const sorted = entries.sort(
      (a, b) => b[1] - a[1]
    );

    if (sorted[0][1] === 0) {
      return "";
    }

    return sorted[0][0];
  }, [interestScores]);

  // =====================================================
  // CAREER DATA
  // =====================================================

  const careers = [
    {
      id: "ai",
      title: "AI / ML Engineer",
      description:
        "Build intelligent systems using artificial intelligence, machine learning and data.",
      skills: [
        "Python",
        "Machine Learning",
        "Data Structures",
        "Statistics",
        "Deep Learning",
      ],
      interestKey: "ai",
      keywords: [
        "ai",
        "machine learning",
        "python",
        "artificial intelligence",
        "data",
      ],
    },
    {
      id: "software",
      title: "Software Developer",
      description:
        "Design and develop software applications using programming and problem-solving skills.",
      skills: [
        "Java",
        "Python",
        "Data Structures",
        "Algorithms",
        "Git",
      ],
      interestKey: "software",
      keywords: [
        "software",
        "programming",
        "java",
        "python",
        "application",
        "developer",
      ],
    },
    {
      id: "web",
      title: "Web Developer",
      description:
        "Create modern websites and web applications using frontend and backend technologies.",
      skills: [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Node.js",
      ],
      interestKey: "web",
      keywords: [
        "web",
        "website",
        "frontend",
        "backend",
        "javascript",
        "react",
      ],
    },
    {
      id: "cybersecurity",
      title: "Cybersecurity Analyst",
      description:
        "Protect systems, networks and applications from cybersecurity threats.",
      skills: [
        "Networking",
        "Linux",
        "Cybersecurity",
        "Ethical Hacking",
        "Security Tools",
      ],
      interestKey: "cybersecurity",
      keywords: [
        "security",
        "cybersecurity",
        "network",
        "linux",
        "ethical hacking",
      ],
    },
  ];

  // =====================================================
  // CALCULATE CAREER MATCH
  // =====================================================

  const careerResults = useMemo(() => {
    const profileText = [
      ...skills,
      ...profileInterests,
      careerInterest,
    ]
      .join(" ")
      .toLowerCase();

    return careers
      .map((career) => {
        let match = 20;

        const matchedSkills =
          career.skills.filter(
            (careerSkill) =>
              profileText.includes(
                careerSkill.toLowerCase()
              )
          );

        if (career.skills.length > 0) {
          match += Math.round(
            (matchedSkills.length /
              career.skills.length) *
              30
          );
        }

        const keywordMatches =
          career.keywords.filter(
            (keyword) =>
              profileText.includes(
                keyword.toLowerCase()
              )
          );

        if (
          career.keywords.length > 0
        ) {
          match += Math.round(
            (keywordMatches.length /
              career.keywords.length) *
              15
          );
        }

        match += Math.round(
          skillPercentage * 0.15
        );

        const interestScore =
          interestScores[
            career.interestKey
          ] || 0;

        match += interestScore * 4;

        if (
          strongestInterest ===
          career.interestKey
        ) {
          match += 10;
        }

        if (
          careerInterest &&
          (
            careerInterest.includes(
              career.title.toLowerCase()
            ) ||
            career.keywords.some(
              (keyword) =>
                careerInterest.includes(
                  keyword.toLowerCase()
                )
            )
          )
        ) {
          match += 10;
        }

        match = Math.max(
          0,
          Math.min(99, match)
        );

        return {
          ...career,
          match,
          matchedSkills,
          interestScore,
        };
      })
      .sort(
        (a, b) => b.match - a.match
      );
  }, [
    skills,
    profileInterests,
    careerInterest,
    skillPercentage,
    interestScores,
    strongestInterest,
  ]);

  // =====================================================
  // BEST CAREER
  // =====================================================

  const bestCareer =
    careerResults[0] || careers[0];

  // =====================================================
  // SAVE STUDENT-WISE CAREER RECOMMENDATION
  // =====================================================

  useEffect(() => {
    if (!bestCareer) {
      return;
    }

    const recommendation = {
      career: bestCareer.title,
      matchPercentage:
        bestCareer.match,
      skills: bestCareer.skills,
      matchedSkills:
        bestCareer.matchedSkills,
      interestScore:
        bestCareer.interestScore,
      strongestInterest,
      generatedAt:
        new Date().toISOString(),
    };

    saveStudentData(
      "careerRecommendation",
      recommendation
    );
  }, [
    bestCareer,
    strongestInterest,
  ]);

  // =====================================================
  // GENERATE AI CAREER ANALYSIS
  // =====================================================

  const generateAIAnalysis = async () => {
    setAiLoading(true);
    setAiError("");

    try {
      const dataToSend = {
        profile: getData(
          "studentProfile",
          {}
        ),

        skillAssessment: getData(
          "skillAssessment",
          {}
        ),

        interestAssessment:
          getData(
            "interestAssessment",
            {}
          ),

        skillGap: getData(
          "skillGap",
          {}
        ),

        roadmap: getData(
          "roadmap",
          {}
        ),

        projects: getData(
          "projects",
          {}
        ),

        readiness: getData(
          "careerReadiness",
          {}
        ),

        resume: getData(
          "resume",
          {}
        ),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/career-analysis`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            dataToSend
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Career analysis failed."
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "AI Career Analysis failed."
        );
      }

      const result =
        data?.result || "";

      if (!result) {
        throw new Error(
          "AI returned an empty result."
        );
      }

      setAiResult(result);

      // Student-wise save
      saveStudentData(
        "aiCareerAnalysis",
        result
      );

      if (MODULE_KEYS?.CAREER) {
        completeModule(
          MODULE_KEYS.CAREER
        );
      }
    } catch (error) {
      console.error(
        "Career Analysis Error:",
        error
      );

      setAiError(
        error.message ||
          "Unable to generate AI career analysis."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // =====================================================
  // AI RESULT FORMATTER
  // =====================================================

  const formatAIResult = (text) => {
    if (!text) {
      return null;
    }

    return text
      .split("\n")
      .map(
        (line, index) => (
          <p
            key={index}
            style={{
              margin: "8px 0",
              lineHeight: 1.6,
            }}
          >
            {line || "\u00A0"}
          </p>
        )
      );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
          }}
        >
          🎯 Career Recommendation
        </h1>

        <p
          style={{
            color: "#666",
            margin: 0,
          }}
        >
          Analyze your skills, interests
          and assessment results to find
          the career path that suits you.
        </p>
      </div>

      {/* =====================================================
          STUDENT ANALYSIS
      ===================================================== */}

      <div
        style={{
          background: "#f8f9fa",
          padding: "22px",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          📊 Student Analysis
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          <div>
            <strong>
              Skill Assessment
            </strong>

            <p>
              {skillPercentage}%
            </p>
          </div>

          <div>
            <strong>
              Strongest Interest
            </strong>

            <p
              style={{
                textTransform:
                  "capitalize",
              }}
            >
              {strongestInterest ||
                "Not available"}
            </p>
          </div>

          <div>
            <strong>
              Technical Skills
            </strong>

            <p>
              {skills.length > 0
                ? skills.join(", ")
                : "Not provided"}
            </p>
          </div>

          <div>
            <strong>
              Profile Interests
            </strong>

            <p>
              {profileInterests.length >
              0
                ? profileInterests.join(
                    ", "
                  )
                : "Not provided"}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          BEST CAREER
      ===================================================== */}

      <div
        style={{
          background:
            "linear-gradient(135deg, #eef2ff, #f8fafc)",
          padding: "25px",
          borderRadius: "14px",
          marginBottom: "25px",
          border: "1px solid #dbeafe",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              ⭐ Best Career Match
            </p>

            <h2
              style={{
                margin: "8px 0",
              }}
            >
              {bestCareer.title}
            </h2>

            <p
              style={{
                color: "#555",
                maxWidth: "700px",
              }}
            >
              {bestCareer.description}
            </p>
          </div>

          <div
            style={{
              minWidth: "130px",
              textAlign: "center",
              padding: "18px",
              borderRadius: "12px",
              background: "#fff",
              border: "1px solid #ddd",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
              }}
            >
              {bestCareer.match}%
            </div>

            <div
              style={{
                color: "#666",
              }}
            >
              Match
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          <strong>
            Recommended Skills:
          </strong>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "10px",
            }}
          >
            {bestCareer.skills.map(
              (skill) => (
                <span
                  key={skill}
                  style={{
                    padding: "7px 12px",
                    background: "#fff",
                    borderRadius: "20px",
                    border: "1px solid #ddd",
                  }}
                >
                  {skill}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          CAREER MATCH RESULTS
      ===================================================== */}

      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h2>
          💼 Career Match Results
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
            marginTop: "15px",
          }}
        >
          {careerResults.map(
            (career) => (
              <div
                key={career.id}
                style={{
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  background: "#fff",
                }}
              >
                <h3>
                  {career.title}
                </h3>

                <p
                  style={{
                    color: "#666",
                    minHeight: "60px",
                  }}
                >
                  {career.description}
                </p>

                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: "700",
                    margin: "12px 0",
                  }}
                >
                  {career.match}%
                </div>

                <div
                  style={{
                    height: "8px",
                    background: "#eee",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${career.match}%`,
                      height: "100%",
                      background: "#4f46e5",
                      borderRadius: "10px",
                    }}
                  />
                </div>

                {career.matchedSkills
                  .length > 0 && (
                  <p
                    style={{
                      marginTop: "12px",
                      fontSize: "14px",
                      color: "#555",
                    }}
                  >
                    Matched skills:{" "}
                    {career.matchedSkills.join(
                      ", "
                    )}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* =====================================================
          AI CAREER ANALYSIS
      ===================================================== */}

      <div
        style={{
          padding: "25px",
          borderRadius: "14px",
          background: "#fff",
          border: "1px solid #ddd",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              🤖 AI Career Analysis
            </h2>

            <p
              style={{
                color: "#666",
              }}
            >
              Get a personalized AI analysis
              using your profile, skills,
              interests and other career data.
            </p>
          </div>

          <button
            onClick={
              generateAIAnalysis
            }
            disabled={aiLoading}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              background:
                aiLoading
                  ? "#aaa"
                  : "#4f46e5",
              color: "#fff",
              cursor:
                aiLoading
                  ? "not-allowed"
                  : "pointer",
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            {aiLoading
              ? "🤖 Analyzing..."
              : "✨ Generate AI Analysis"}
          </button>
        </div>

        {aiError && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
            }}
          >
            <strong>
              AI Analysis Error:
            </strong>

            <div
              style={{
                marginTop: "5px",
              }}
            >
              {aiError}
            </div>
          </div>
        )}

        {aiResult && !aiError && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3>
              🧠 AI Recommendation
            </h3>

            <div>
              {formatAIResult(
                aiResult
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() =>
            navigate("/interests")
          }
          style={{
            padding: "12px 20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          ← Review Interests
        </button>

        <button
          onClick={() =>
            navigate("/skill-gap")
          }
          style={{
            padding: "12px 22px",
            border: "none",
            borderRadius: "8px",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Continue to Skill Gap →
        </button>
      </div>
    </div>
  );
}

export default Careers;