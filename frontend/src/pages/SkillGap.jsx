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

function SkillGap() {
  const navigate = useNavigate();

  const [selectedSkill, setSelectedSkill] =
    useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState("");

  const [showAnswer, setShowAnswer] =
    useState(false);

  const [questionScore, setQuestionScore] =
    useState(0);

  const [loadingQuestions, setLoadingQuestions] =
    useState(false);

  const [questionError, setQuestionError] =
    useState("");

  // =====================================================
  // STUDENT-WISE COURSE PROGRESS
  // =====================================================

  const [courseProgress, setCourseProgress] =
    useState(() => {
      return getStudentData(
        "skillGapCourseProgress",
        {}
      );
    });

  // =====================================================
  // STUDENT-WISE DATA
  // =====================================================

  const profile = useMemo(() => {
    return getStudentData(
      "studentProfile",
      {}
    );
  }, []);

  const assessment = useMemo(() => {
    return getStudentData(
      "skillAssessment",
      {}
    );
  }, []);

  const careerRecommendation =
    useMemo(() => {
      return getStudentData(
        "careerRecommendation",
        {}
      );
    }, []);

  const aiCareerAnalysis =
    useMemo(() => {
      return getStudentData(
        "aiCareerAnalysis",
        ""
      );
    }, []);

  // =====================================================
  // SKILLS
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
  // ASSESSMENT SCORE
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
  // CAREER
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
  // CAREER SKILLS
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
  // CHECK WHETHER STUDENT HAS SKILL
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

        if (user === required) {
          return true;
        }

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
            user.includes(
              "visualisation"
            ) ||
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
  // SKILL RESULTS
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

  const learnedSkills =
    useMemo(() => {
      return skillResults.filter(
        (item) => item.hasSkill
      );
    }, [skillResults]);

  const missingSkills =
    useMemo(() => {
      return skillResults.filter(
        (item) => !item.hasSkill
      );
    }, [skillResults]);

  const skillPercentage =
    requiredSkills.length > 0
      ? Math.round(
          (learnedSkills.length /
            requiredSkills.length) *
            100
        )
      : 0;

  const gapPercentage =
    100 - skillPercentage;

  const readiness = Math.round(
    skillPercentage * 0.7 +
      assessmentPercentage * 0.3
  );

  // =====================================================
  // COURSE DATA
  // =====================================================

  const courseData = {
    "C++": {
      title: "C++ Fundamentals",
      description:
        "Learn C++ programming from basics to object-oriented programming and problem solving.",
      url: "https://www.learncpp.com/",
    },

    "Data Structures & Algorithms": {
      title:
        "Data Structures & Algorithms",
      description:
        "Learn arrays, linked lists, stacks, queues, trees, graphs, sorting, searching and algorithms.",
      url: "https://visualgo.net/en",
    },

    "Object-Oriented Programming": {
      title:
        "Object-Oriented Programming",
      description:
        "Learn classes, objects, inheritance, polymorphism, abstraction and encapsulation.",
      url: "https://dev.java/learn/",
    },

    Database: {
      title:
        "Database Fundamentals",
      description:
        "Learn database concepts, tables, relationships, queries and database design.",
      url: "https://www.postgresql.org/docs/current/tutorial.html",
    },

    SQL: {
      title: "SQL Fundamentals",
      description:
        "Practice SELECT, INSERT, UPDATE, DELETE, JOIN, GROUP BY and advanced SQL queries.",
      url: "https://www.w3schools.com/sql/",
    },

    Git: {
      title: "Git & GitHub",
      description:
        "Learn version control, repositories, commits, branches, merging and collaboration.",
      url: "https://git-scm.com/doc",
    },

    "Problem Solving": {
      title:
        "Problem Solving & Coding Practice",
      description:
        "Improve logical thinking and programming problem-solving skills.",
      url: "https://www.hackerrank.com/domains/algorithms",
    },

    "Software Projects": {
      title:
        "Software Project Development",
      description:
        "Learn how to plan, build, test and document real-world software projects.",
      url: "https://roadmap.sh/projects",
    },
  };

  // =====================================================
  // SAVE STUDENT-WISE SKILL GAP
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

    saveStudentData(
      "skillGap",
      result
    );

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
  // COURSE PROGRESS
  // =====================================================

  const getCourseProgress = (skill) => {
    return Number(
      courseProgress?.[skill]
        ?.completedQuestions || 0
    );
  };

  const getCourseScore = (skill) => {
    return Number(
      courseProgress?.[skill]
        ?.score || 0
    );
  };

  // =====================================================
  // OPEN COURSE
  // =====================================================

  const openCourse = (skill) => {
    const course =
      courseData[skill];

    if (!course) {
      return;
    }

    window.open(
      course.url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================================================
  // START AI QUESTIONS
  // =====================================================

  const startAIQuestions = async (
    skill
  ) => {
    const completed =
      getCourseProgress(skill);

    if (completed >= 100) {
      setQuestionError(
        "This course already has 100 questions completed."
      );

      setSelectedSkill(skill);

      return;
    }

    setSelectedSkill(skill);
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setShowAnswer(false);

    setQuestionScore(
      getCourseScore(skill)
    );

    setQuestionError("");
    setLoadingQuestions(true);

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/skill-gap/questions`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              skill,

              count: Math.min(
                10,
                100 - completed
              ),

              difficulty:
                "beginner",

              completed,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to generate questions."
        );
      }

      const generatedQuestions =
        Array.isArray(
          data?.questions
        )
          ? data.questions
          : Array.isArray(data)
          ? data
          : [];

      const limitedQuestions =
        generatedQuestions
          .slice(
            0,
            Math.min(
              10,
              100 - completed
            )
          );

      if (
        limitedQuestions.length === 0
      ) {
        throw new Error(
          "AI did not return any questions."
        );
      }

      setQuestions(
        limitedQuestions
      );
    } catch (error) {
      setQuestionError(
        error.message ||
          "Failed to load AI questions."
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  // =====================================================
  // QUESTION OPTIONS
  // =====================================================

  const getQuestionOptions = (
    question
  ) => {
    if (
      Array.isArray(
        question?.options
      )
    ) {
      return question.options;
    }

    if (
      Array.isArray(
        question?.choices
      )
    ) {
      return question.choices;
    }

    return [];
  };

  // =====================================================
  // CORRECT ANSWER
  // =====================================================

  const getCorrectAnswer = (
    question
  ) => {
    return (
      question?.correctAnswer ??
      question?.answer ??
      question?.correct ??
      ""
    );
  };

  // =====================================================
  // SAVE COURSE PROGRESS
  // =====================================================

  const saveCourseProgress = (
    skill,
    completedQuestions,
    scoreValue
  ) => {
    const nextProgress = {
      ...courseProgress,

      [skill]: {
        completedQuestions:
          Math.min(
            100,
            completedQuestions
          ),

        score: scoreValue,

        completed:
          completedQuestions >=
          100,

        updatedAt:
          new Date().toISOString(),
      },
    };

    setCourseProgress(
      nextProgress
    );

    saveStudentData(
      "skillGapCourseProgress",
      nextProgress
    );
  };

  // =====================================================
  // SUBMIT ANSWER
  // =====================================================

  const submitAnswer = () => {
    if (
      !selectedAnswer ||
      showAnswer
    ) {
      return;
    }

    const question =
      questions[currentQuestion];

    const correctAnswer =
      String(
        getCorrectAnswer(
          question
        )
      )
        .trim()
        .toLowerCase();

    const userAnswer =
      String(selectedAnswer)
        .trim()
        .toLowerCase();

    const isCorrect =
      userAnswer ===
      correctAnswer;

    const newScore =
      questionScore +
      (isCorrect ? 1 : 0);

    setQuestionScore(
      newScore
    );

    setShowAnswer(true);
  };

  // =====================================================
  // NEXT QUESTION
  // =====================================================

  const nextQuestion = () => {
    const completedBefore =
      getCourseProgress(
        selectedSkill
      );

    const completedNow =
      Math.min(
        100,
        completedBefore +
          currentQuestion +
          1
      );

    saveCourseProgress(
      selectedSkill,
      completedNow,
      questionScore
    );

    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        currentQuestion + 1
      );

      setSelectedAnswer("");
      setShowAnswer(false);

      return;
    }

    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setShowAnswer(false);
  };

  // =====================================================
  // CLOSE QUESTIONS
  // =====================================================

  const closeQuestions = () => {
    setSelectedSkill(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setShowAnswer(false);
    setQuestionError("");
  };

  // =====================================================
  // ROADMAP
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

        <div style={styles.statsGrid}>

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

        <div style={styles.section}>
          <h2>
            📈 Your Skill Progress
          </h2>

          <div
            style={
              styles.progressBackground
            }
          >
            <div
              style={{
                ...styles.progressFill,
                width: `${skillPercentage}%`,
              }}
            />
          </div>

          <div
            style={
              styles.progressLabels
            }
          >
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

        <div style={styles.section}>
          <h2>
            ✅ Skills You Already Have
          </h2>

          {learnedSkills.length > 0 ? (
            learnedSkills.map(
              (item) => (
                <div
                  key={item.skill}
                  style={
                    styles.learnedSkill
                  }
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

        <div style={styles.section}>
          <h2>
            ❌ Skills You Need to Learn
          </h2>

          {missingSkills.length > 0 ? (
            missingSkills.map(
              (item, index) => {
                const course =
                  courseData[
                    item.skill
                  ];

                const completed =
                  getCourseProgress(
                    item.skill
                  );

                const courseScore =
                  getCourseScore(
                    item.skill
                  );

                return (
                  <div
                    key={item.skill}
                    style={
                      styles.skillCourseCard
                    }
                  >
                    <div
                      style={
                        styles.missingTop
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

                        <div>
                          <strong
                            style={
                              styles.skillName
                            }
                          >
                            {item.skill}
                          </strong>

                          <div
                            style={
                              styles.missingBadge
                            }
                          >
                            Missing
                          </div>
                        </div>
                      </div>
                    </div>

                    {course && (
                      <div
                        style={
                          styles.courseBox
                        }
                      >
                        <div
                          style={
                            styles.courseInfo
                          }
                        >
                          <h3
                            style={
                              styles.courseTitle
                            }
                          >
                            📚 {course.title}
                          </h3>

                          <p
                            style={
                              styles.courseDescription
                            }
                          >
                            {
                              course.description
                            }
                          </p>

                          <div
                            style={
                              styles.courseProgressText
                            }
                          >
                            AI Questions:{" "}
                            <strong>
                              {completed}/100
                            </strong>

                            {" • "}

                            Score:{" "}
                            <strong>
                              {courseScore}
                            </strong>
                          </div>

                          <div
                            style={
                              styles.courseProgressBackground
                            }
                          >
                            <div
                              style={{
                                ...styles.courseProgressFill,
                                width: `${completed}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={
                            styles.courseButtons
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openCourse(
                                item.skill
                              )
                            }
                            style={
                              styles.courseButton
                            }
                          >
                            📖 Open Course
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              startAIQuestions(
                                item.skill
                              )
                            }
                            style={
                              styles.aiButton
                            }
                          >
                            🤖 Practice AI Questions
                          </button>
                        </div>

                        {completed >=
                          100 && (
                          <div
                            style={
                              styles.courseComplete
                            }
                          >
                            🎉 Course Completed
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
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
              {missingSkills.map(
                (item) => (
                  <li
                    key={item.skill}
                  >
                    Learn{" "}
                    <strong>
                      {item.skill}
                    </strong>{" "}
                    and complete its
                    AI question practice.
                  </li>
                )
              )}
            </ol>
          ) : (
            <p>
              Your next focus should be
              advanced projects and interview
              preparation.
            </p>
          )}
        </div>

        <div style={styles.summaryCard}>
          <h2>
            🎯 Skill Gap Summary
          </h2>

          <p>
            You currently match{" "}
            <strong>
              {skillPercentage}%
            </strong>{" "}
            of the core skills required for{" "}
            <strong>
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
              </strong>.
            </p>
          )}
        </div>

        <div style={styles.completedBox}>
          ✅ Skill Gap Analysis Completed
        </div>

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

      {selectedSkill && (
        <div style={styles.modalOverlay}>

          <div style={styles.modal}>

            <div
              style={
                styles.modalHeader
              }
            >
              <div>
                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  🤖 AI Question Practice
                </h2>

                <p
                  style={
                    styles.modalSkill
                  }
                >
                  {selectedSkill}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeQuestions
                }
                style={
                  styles.closeButton
                }
              >
                ✕
              </button>
            </div>

            {loadingQuestions && (
              <div
                style={
                  styles.loadingBox
                }
              >
                🤖 AI is generating your
                questions...
              </div>
            )}

            {questionError && (
              <div
                style={
                  styles.errorBox
                }
              >
                ❌ {questionError}
              </div>
            )}

            {!loadingQuestions &&
              !questionError &&
              questions.length > 0 && (
                <div>

                  <div
                    style={
                      styles.questionProgress
                    }
                  >
                    Question{" "}
                    {currentQuestion + 1}{" "}
                    of{" "}
                    {questions.length}
                  </div>

                  <h3
                    style={
                      styles.questionText
                    }
                  >
                    {questions[
                      currentQuestion
                    ]?.question ||
                      questions[
                        currentQuestion
                      ]?.text}
                  </h3>

                  <div>
                    {getQuestionOptions(
                      questions[
                        currentQuestion
                      ]
                    ).map(
                      (
                        option,
                        index
                      ) => {
                        const optionText =
                          typeof option ===
                          "object"
                            ? option.text ||
                              option.label ||
                              option.value ||
                              ""
                            : option;

                        const isCorrect =
                          String(
                            optionText
                          )
                            .trim()
                            .toLowerCase() ===
                          String(
                            getCorrectAnswer(
                              questions[
                                currentQuestion
                              ]
                            )
                          )
                            .trim()
                            .toLowerCase();

                        return (
                          <button
                            type="button"
                            key={index}
                            onClick={() =>
                              setSelectedAnswer(
                                optionText
                              )
                            }
                            disabled={
                              showAnswer
                            }
                            style={{
                              ...styles.optionButton,
                              ...(selectedAnswer ===
                              optionText
                                ? styles.selectedOption
                                : {}),
                              ...(showAnswer &&
                              isCorrect
                                ? styles.correctOption
                                : {}),
                            }}
                          >
                            <span>
                              {String.fromCharCode(
                                65 +
                                  index
                              )}
                            </span>

                            {optionText}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {!showAnswer ? (
                    <button
                      type="button"
                      onClick={
                        submitAnswer
                      }
                      disabled={
                        !selectedAnswer
                      }
                      style={{
                        ...styles.submitButton,
                        opacity:
                          selectedAnswer
                            ? 1
                            : 0.5,
                      }}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <div>

                      <div
                        style={
                          styles.answerBox
                        }
                      >
                        {String(
                          selectedAnswer
                        )
                          .trim()
                          .toLowerCase() ===
                        String(
                          getCorrectAnswer(
                            questions[
                              currentQuestion
                            ]
                          )
                        )
                          .trim()
                          .toLowerCase()
                          ? "✅ Correct Answer!"
                          : `❌ Correct Answer: ${getCorrectAnswer(
                              questions[
                                currentQuestion
                              ]
                            )}`}
                      </div>

                      <button
                        type="button"
                        onClick={
                          nextQuestion
                        }
                        style={
                          styles.nextQuestionButton
                        }
                      >
                        {currentQuestion <
                        questions.length -
                          1
                          ? "Next Question →"
                          : "Finish Practice ✓"}
                      </button>

                    </div>
                  )}

                  <div
                    style={
                      styles.scoreBox
                    }
                  >
                    Current Score:{" "}
                    <strong>
                      {questionScore}
                    </strong>
                  </div>

                </div>
              )}

            {!loadingQuestions &&
              !questionError &&
              questions.length === 0 && (
                <div
                  style={
                    styles.finishedBox
                  }
                >
                  <div
                    style={
                      styles.finishedIcon
                    }
                  >
                    🎉
                  </div>

                  <h3>
                    Practice Session Finished
                  </h3>

                  <p>
                    Your progress has been
                    saved automatically.
                  </p>

                  <button
                    type="button"
                    onClick={
                      closeQuestions
                    }
                    style={
                      styles.nextQuestionButton
                    }
                  >
                    Close
                  </button>
                </div>
              )}

          </div>
        </div>
      )}
    </div>
  );
}

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

  skillCourseCard: {
    marginTop: "15px",
    padding: "18px",
    background: "#fef2f2",
    borderRadius: "10px",
    border:
      "1px solid #fecaca",
  },

  missingTop: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  missingLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  numberCircle: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    borderRadius: "50%",
    background: "#dc2626",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontWeight: "bold",
  },

  skillName: {
    color: "#1e293b",
    fontSize: "17px",
  },

  missingBadge: {
    color: "#dc2626",
    fontWeight: "bold",
    fontSize: "13px",
    marginTop: "4px",
  },

  courseBox: {
    marginTop: "15px",
    padding: "18px",
    background: "#ffffff",
    borderRadius: "10px",
    border:
      "1px solid #e2e8f0",
  },

  courseInfo: {
    width: "100%",
  },

  courseTitle: {
    margin:
      "0 0 8px",
    color: "#2563eb",
    fontSize: "19px",
  },

  courseDescription: {
    margin:
      "0 0 12px",
    color: "#64748b",
    lineHeight: "1.5",
  },

  courseProgressText: {
    color: "#475569",
    fontSize: "14px",
  },

  courseProgressBackground: {
    marginTop: "8px",
    width: "100%",
    height: "9px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  courseProgressFill: {
    height: "100%",
    background: "#16a34a",
    borderRadius: "10px",
    transition:
      "width 0.4s ease",
  },

  courseButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "15px",
  },

  courseButton: {
    padding:
      "11px 18px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  aiButton: {
    padding:
      "11px 18px",
    background: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  courseComplete: {
    marginTop: "12px",
    padding: "10px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "7px",
    textAlign: "center",
    fontWeight: "bold",
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

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(15,23,42,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },

  modal: {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "25px",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    borderBottom:
      "1px solid #e2e8f0",
    paddingBottom: "15px",
    marginBottom: "20px",
  },

  modalTitle: {
    margin: 0,
    color: "#1e293b",
  },

  modalSkill: {
    margin:
      "6px 0 0",
    color: "#7c3aed",
    fontWeight: "bold",
  },

  closeButton: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
    fontSize: "18px",
  },

  loadingBox: {
    padding: "35px",
    textAlign: "center",
    color: "#7c3aed",
    fontWeight: "bold",
    fontSize: "17px",
  },

  errorBox: {
    padding: "15px",
    background: "#fef2f2",
    color: "#b91c1c",
    border:
      "1px solid #fecaca",
    borderRadius: "8px",
    marginBottom: "15px",
  },

  questionProgress: {
    color: "#64748b",
    fontWeight: "bold",
    marginBottom: "15px",
  },

  questionText: {
    color: "#1e293b",
    lineHeight: "1.5",
    fontSize: "20px",
    marginBottom: "20px",
  },

  optionButton: {
    width: "100%",
    textAlign: "left",
    padding: "14px",
    marginBottom: "10px",
    border:
      "1px solid #cbd5e1",
    background: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  selectedOption: {
    border:
      "2px solid #7c3aed",
    background: "#f5f3ff",
  },

  correctOption: {
    border:
      "2px solid #16a34a",
    background: "#dcfce7",
  },

  submitButton: {
    width: "100%",
    marginTop: "10px",
    padding: "14px",
    background: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  answerBox: {
    marginTop: "15px",
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "8px",
    color: "#334155",
    fontWeight: "bold",
  },

  nextQuestionButton: {
    width: "100%",
    marginTop: "15px",
    padding: "14px",
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  scoreBox: {
    marginTop: "15px",
    textAlign: "center",
    color: "#64748b",
  },

  finishedBox: {
    textAlign: "center",
    padding: "30px 10px",
  },

  finishedIcon: {
    fontSize: "50px",
  },
};

export default SkillGap;