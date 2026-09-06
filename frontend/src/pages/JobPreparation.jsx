
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  completeModule,
  MODULE_KEYS,
} from "../utils/progress";

import {
  getStudentData,
  saveStudentData,
  removeStudentData,
} from "../utils/studentStorage";

const getData = (key, fallback = {}) => {
  try {
    const data = getStudentData(key, fallback);

    if (data && typeof data === "object") {
      return data;
    }

    return fallback;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
};

const normalizeScore = (value) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (text.includes("%")) {
      const number = parseFloat(text.replace("%", ""));

      return Number.isFinite(number)
        ? Math.min(100, Math.max(0, number))
        : 0;
    }

    if (text.includes("/")) {
      const parts = text.split("/");

      const obtained = Number(parts[0]);
      const total = Number(parts[1]);

      if (
        Number.isFinite(obtained) &&
        Number.isFinite(total) &&
        total > 0
      ) {
        return Math.min(
          100,
          Math.max(0, Math.round((obtained / total) * 100))
        );
      }
    }

    const number = Number(text);

    return Number.isFinite(number)
      ? Math.min(100, Math.max(0, number))
      : 0;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.min(100, Math.max(0, number))
    : 0;
};

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return 0;
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        return (
          item?.skill ||
          item?.name ||
          item?.title ||
          item?.skillName ||
          item?.topic ||
          ""
        )
          .toString()
          .trim();
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const careerData = {
  "AI / ML Engineer": {
    skills: [
      "Python",
      "Machine Learning",
      "Statistics",
      "Pandas",
      "NumPy",
      "Deep Learning",
      "TensorFlow",
      "SQL",
    ],
    topics: [
      "Python",
      "Machine Learning",
      "Statistics",
      "Data Preprocessing",
      "Neural Networks",
      "Deep Learning",
      "SQL",
    ],
    projects: "2–3",
    questions: [
      {
        question: "Which language is most commonly used in AI/ML?",
        options: ["HTML", "Python", "CSS", "PHP"],
        answer: "Python",
      },
      {
        question: "What does ML stand for?",
        options: [
          "Machine Learning",
          "Manual Logic",
          "Machine Language",
          "Model Logic",
        ],
        answer: "Machine Learning",
      },
      {
        question: "Which library is commonly used for data manipulation?",
        options: ["Pandas", "React", "Express", "Bootstrap"],
        answer: "Pandas",
      },
      {
        question: "Which library is mainly used for numerical computing?",
        options: ["NumPy", "React", "Node.js", "Django"],
        answer: "NumPy",
      },
      {
        question: "What is supervised learning?",
        options: [
          "Learning with labeled data",
          "Learning without data",
          "Only manual learning",
          "Learning without algorithms",
        ],
        answer: "Learning with labeled data",
      },
      {
        question: "What is overfitting?",
        options: [
          "Model performs well only on training data",
          "Model has no data",
          "Model never trains",
          "Model uses no features",
        ],
        answer: "Model performs well only on training data",
      },
      {
        question: "Which is a deep learning framework?",
        options: ["TensorFlow", "HTML", "CSS", "Git"],
        answer: "TensorFlow",
      },
      {
        question: "What is a feature in machine learning?",
        options: [
          "An input variable",
          "A programming language",
          "A database",
          "A server",
        ],
        answer: "An input variable",
      },
      {
        question: "What does SQL help with?",
        options: [
          "Database management",
          "Image editing",
          "Video editing",
          "UI design",
        ],
        answer: "Database management",
      },
      {
        question: "Why is data preprocessing important?",
        options: [
          "To prepare data for modeling",
          "To remove the model",
          "To stop training",
          "To create websites",
        ],
        answer: "To prepare data for modeling",
      },
    ],
  },

  "Software Developer": {
    skills: [
      "Java",
      "C++",
      "Data Structures",
      "Algorithms",
      "OOP",
      "SQL",
      "Git",
      "Problem Solving",
    ],
    topics: [
      "Java / C++",
      "Data Structures",
      "Algorithms",
      "OOP",
      "SQL",
      "Git",
      "Problem Solving",
    ],
    projects: "2–3",
    questions: [
      {
        question: "Which concept allows a class to inherit another class?",
        options: [
          "Inheritance",
          "Encapsulation",
          "Compilation",
          "Abstraction",
        ],
        answer: "Inheritance",
      },
      {
        question: "Which data structure follows FIFO?",
        options: ["Stack", "Queue", "Tree", "Graph"],
        answer: "Queue",
      },
      {
        question: "Which data structure follows LIFO?",
        options: ["Queue", "Stack", "Array", "Graph"],
        answer: "Stack",
      },
      {
        question: "What does OOP stand for?",
        options: [
          "Object Oriented Programming",
          "Object Operating Process",
          "Open Object Program",
          "Online Object Programming",
        ],
        answer: "Object Oriented Programming",
      },
      {
        question: "Which keyword creates an object in Java?",
        options: ["new", "create", "object", "make"],
        answer: "new",
      },
      {
        question: "Which is used for version control?",
        options: ["Git", "HTML", "CSS", "SQL"],
        answer: "Git",
      },
      {
        question: "Which is a linear data structure?",
        options: ["Array", "Graph", "Tree", "Heap"],
        answer: "Array",
      },
      {
        question: "What does SQL mainly manage?",
        options: [
          "Databases",
          "Images",
          "Operating systems",
          "Networks",
        ],
        answer: "Databases",
      },
      {
        question: "Which algorithm searches a sorted array efficiently?",
        options: [
          "Binary Search",
          "Bubble Sort",
          "Linear Search",
          "DFS",
        ],
        answer: "Binary Search",
      },
      {
        question: "What is debugging?",
        options: [
          "Finding and fixing errors",
          "Writing documentation",
          "Designing images",
          "Creating databases",
        ],
        answer: "Finding and fixing errors",
      },
    ],
  },

  "Web Developer": {
    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "SQL",
      "Git",
      "REST API",
    ],
    topics: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "REST API",
      "SQL",
    ],
    projects: "2–3",
    questions: [
      {
        question: "What does HTML stand for?",
        options: [
          "HyperText Markup Language",
          "HighText Machine Language",
          "Hyper Tool Multi Language",
          "Home Tool Markup Language",
        ],
        answer: "HyperText Markup Language",
      },
      {
        question: "Which language is used for webpage styling?",
        options: ["HTML", "CSS", "JavaScript", "SQL"],
        answer: "CSS",
      },
      {
        question: "Which language adds interactivity to webpages?",
        options: ["CSS", "HTML", "JavaScript", "SQL"],
        answer: "JavaScript",
      },
      {
        question: "React is mainly used for what?",
        options: [
          "Building user interfaces",
          "Database management",
          "Operating systems",
          "Cybersecurity",
        ],
        answer: "Building user interfaces",
      },
      {
        question: "Node.js allows JavaScript to run where?",
        options: [
          "On the server",
          "Only in CSS",
          "Only in HTML",
          "Inside SQL",
        ],
        answer: "On the server",
      },
      {
        question: "What does API stand for?",
        options: [
          "Application Programming Interface",
          "Advanced Program Internet",
          "Application Process Input",
          "Automated Programming Internet",
        ],
        answer: "Application Programming Interface",
      },
      {
        question: "Which is commonly used for version control?",
        options: ["Git", "React", "CSS", "HTML"],
        answer: "Git",
      },
      {
        question: "Which is a database query language?",
        options: ["SQL", "CSS", "HTML", "JSX"],
        answer: "SQL",
      },
      {
        question: "Which HTTP method is commonly used to retrieve data?",
        options: ["GET", "POST", "DELETE", "PATCH"],
        answer: "GET",
      },
      {
        question: "What is responsive design?",
        options: [
          "Design that adapts to screen sizes",
          "Design without CSS",
          "Only mobile coding",
          "Only desktop coding",
        ],
        answer: "Design that adapts to screen sizes",
      },
    ],
  },

  "Data Scientist": {
    skills: [
      "Python",
      "Statistics",
      "Pandas",
      "NumPy",
      "Machine Learning",
      "Data Visualization",
      "SQL",
      "Matplotlib",
    ],
    topics: [
      "Python",
      "Statistics",
      "Data Analysis",
      "Pandas",
      "NumPy",
      "Machine Learning",
      "Data Visualization",
      "SQL",
    ],
    projects: "2–3",
    questions: [
      {
        question: "Which Python library is commonly used for data analysis?",
        options: ["Pandas", "React", "Express", "Bootstrap"],
        answer: "Pandas",
      },
      {
        question: "Which library is commonly used for numerical operations?",
        options: ["NumPy", "React", "HTML", "Node"],
        answer: "NumPy",
      },
      {
        question: "What is mean?",
        options: [
          "Average",
          "Middle value",
          "Most frequent value",
          "Range",
        ],
        answer: "Average",
      },
      {
        question: "What is median?",
        options: [
          "Middle value",
          "Average",
          "Most frequent value",
          "Largest value",
        ],
        answer: "Middle value",
      },
      {
        question: "Which library is useful for plotting graphs?",
        options: ["Matplotlib", "React", "Express", "Django"],
        answer: "Matplotlib",
      },
      {
        question: "What does SQL help a data scientist with?",
        options: [
          "Querying databases",
          "Creating CSS",
          "Video editing",
          "Image compression",
        ],
        answer: "Querying databases",
      },
      {
        question: "What is data cleaning?",
        options: [
          "Removing or correcting bad data",
          "Deleting the database",
          "Creating a website",
          "Installing Python",
        ],
        answer: "Removing or correcting bad data",
      },
      {
        question: "What is machine learning?",
        options: [
          "Learning patterns from data",
          "Only writing HTML",
          "Only database storage",
          "Manual calculations",
        ],
        answer: "Learning patterns from data",
      },
      {
        question: "What is data visualization?",
        options: [
          "Representing data graphically",
          "Deleting data",
          "Encrypting data",
          "Sorting files",
        ],
        answer: "Representing data graphically",
      },
      {
        question: "What is an outlier?",
        options: [
          "An unusually different data point",
          "The average",
          "The median",
          "A database",
        ],
        answer: "An unusually different data point",
      },
    ],
  },

  "Cybersecurity Analyst": {
    skills: [
      "Network Security",
      "Linux",
      "Cybersecurity",
      "Cryptography",
      "Networking",
      "Python",
      "Security Tools",
      "Risk Analysis",
    ],
    topics: [
      "Network Security",
      "Cybersecurity Fundamentals",
      "Linux",
      "Cryptography",
      "Networking",
      "Threat Detection",
      "Risk Management",
    ],
    projects: "2–3",
    questions: [
      {
        question: "What does cybersecurity protect?",
        options: [
          "Digital systems and data",
          "Only buildings",
          "Only hardware",
          "Only websites",
        ],
        answer: "Digital systems and data",
      },
      {
        question: "What is phishing?",
        options: [
          "A social engineering attack",
          "A programming language",
          "A database",
          "A firewall",
        ],
        answer: "A social engineering attack",
      },
      {
        question: "What is encryption?",
        options: [
          "Converting data into a protected form",
          "Deleting data",
          "Copying files",
          "Creating websites",
        ],
        answer: "Converting data into a protected form",
      },
      {
        question: "Which OS is commonly used in cybersecurity?",
        options: ["Linux", "DOS only", "Android only", "iOS only"],
        answer: "Linux",
      },
      {
        question: "What does a firewall do?",
        options: [
          "Controls network traffic",
          "Creates images",
          "Stores passwords only",
          "Compiles code",
        ],
        answer: "Controls network traffic",
      },
      {
        question: "What is malware?",
        options: [
          "Malicious software",
          "Network hardware",
          "Database software",
          "Programming language",
        ],
        answer: "Malicious software",
      },
      {
        question: "What is authentication?",
        options: [
          "Verifying identity",
          "Encrypting files",
          "Deleting accounts",
          "Creating networks",
        ],
        answer: "Verifying identity",
      },
      {
        question: "What is a vulnerability?",
        options: [
          "A weakness that can be exploited",
          "A secure password",
          "A firewall",
          "A backup",
        ],
        answer: "A weakness that can be exploited",
      },
      {
        question: "What does VPN commonly provide?",
        options: [
          "Encrypted network connection",
          "Faster CPU",
          "More RAM",
          "Database storage",
        ],
        answer: "Encrypted network connection",
      },
      {
        question: "What is risk analysis?",
        options: [
          "Identifying and evaluating security risks",
          "Creating websites",
          "Writing CSS",
          "Installing games",
        ],
        answer: "Identifying and evaluating security risks",
      },
    ],
  },
};

function JobPreparation() {
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setRefreshKey((previous) => previous + 1);
    };

    const events = [
      "mockInterviewUpdated",
      "readinessUpdated",
      "resumeUpdated",
      "careerUpdated",
      "skillGapUpdated",
      "jobPreparationUpdated",
      "projectUpdated",
      "projectsUpdated",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, refresh);
    });

    window.addEventListener("storage", refresh);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, refresh);
      });

      window.removeEventListener("storage", refresh);
    };
  }, []);

  const projectData = useMemo(() => {
    return {
      profile: getData("studentProfile", {}),
      skillAssessment: getData("skillAssessment", {}),
      careerAnalysis: getData("careerAnalysis", {}),
      careerRecommendation: getData("careerRecommendation", {}),
      skillGap: getData("skillGap", {}),
      readiness: getData("readiness", {}),
      careerReadiness: getData("careerReadiness", {}),
      resume: getData("resume", {}),
      resumeAnalysis: getData("resumeAnalysis", {}),
      mockInterview: getData("mockInterview", {}),
      jobPreparation: getData("jobPreparation", {}),
      projectStatus: getData("projectStatus", {}),
      projects: getData("projects", {}),
      projectRecommendations: getData(
        "projectRecommendations",
        {}
      ),
      skillGapCourseProgress: getData(
        "skillGapCourseProgress",
        {}
      ),
    };
  }, [refreshKey]);

  const {
    profile,
    skillAssessment,
    careerAnalysis,
    careerRecommendation,
    skillGap,
    readiness,
    careerReadiness,
    resume,
    resumeAnalysis,
    mockInterview,
    jobPreparation,
    projectStatus,
    projects,
    projectRecommendations,
    skillGapCourseProgress,
  } = projectData;

  const career = useMemo(() => {
    const recommendationCandidates = [
      careerRecommendation?.career,
      careerRecommendation?.recommendedCareer,
      careerRecommendation?.recommendedCareerName,
      careerRecommendation?.title,
      careerRecommendation?.name,
      careerAnalysis?.career,
      careerAnalysis?.recommendedCareer,
      careerAnalysis?.recommendedCareerName,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase().trim());

    for (const value of recommendationCandidates) {
      if (
        value.includes("artificial intelligence") ||
        value.includes("machine learning") ||
        value.includes("machine-learning") ||
        value.includes("ai/ml") ||
        value.includes("ai / ml")
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
        value.includes("cybersecurity") ||
        value.includes("cyber security") ||
        value.includes("security analyst")
      ) {
        return "Cybersecurity Analyst";
      }

      if (
        value.includes("web developer") ||
        value.includes("web development") ||
        value.includes("frontend") ||
        value.includes("front-end") ||
        value.includes("backend") ||
        value.includes("back-end") ||
        value.includes("full stack") ||
        value.includes("full-stack")
      ) {
        return "Web Developer";
      }

      if (
        value.includes("software developer") ||
        value.includes("software development")
      ) {
        return "Software Developer";
      }
    }

    const allCareerText = [
      ...recommendationCandidates,
      profile?.career,
      profile?.interestedCareer,
      profile?.targetCareer,
      profile?.goal,
      profile?.interest,
      profile?.interests,
      profile?.skills,
    ]
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      allCareerText.includes("artificial intelligence") ||
      allCareerText.includes("machine learning") ||
      allCareerText.includes("machine-learning") ||
      allCareerText.includes("deep learning") ||
      /\bai\b/.test(allCareerText)
    ) {
      return "AI / ML Engineer";
    }

    if (
      allCareerText.includes("data scientist") ||
      allCareerText.includes("data science")
    ) {
      return "Data Scientist";
    }

    if (
      allCareerText.includes("cybersecurity") ||
      allCareerText.includes("cyber security") ||
      allCareerText.includes("security analyst")
    ) {
      return "Cybersecurity Analyst";
    }

    if (
      allCareerText.includes("web developer") ||
      allCareerText.includes("web development") ||
      allCareerText.includes("frontend") ||
      allCareerText.includes("front-end") ||
      allCareerText.includes("backend") ||
      allCareerText.includes("back-end") ||
      allCareerText.includes("full stack") ||
      allCareerText.includes("full-stack")
    ) {
      return "Web Developer";
    }

    return "Software Developer";
  }, [
    profile,
    careerAnalysis,
    careerRecommendation,
  ]);

  const currentCareerData =
    careerData[career] || careerData["Software Developer"];

  const resumeData = useMemo(() => {
    return {
      ...resumeAnalysis,
      ...resume,
      analysis: {
        ...(resumeAnalysis?.analysis || {}),
        ...(resume?.analysis || {}),
      },
    };
  }, [resume, resumeAnalysis]);

  const readinessData = useMemo(() => {
    return {
      ...readiness,
      ...careerReadiness,
    };
  }, [readiness, careerReadiness]);

  const skillScore = normalizeScore(
    firstValue(
      skillAssessment?.percentage,
      skillAssessment?.scorePercentage,
      skillAssessment?.percent,
      skillAssessment?.result?.percentage,
      skillAssessment?.result?.score,
      skillAssessment?.score && skillAssessment?.total
        ? (skillAssessment.score / skillAssessment.total) * 100
        : 0
    )
  );

  const readinessScore = normalizeScore(
    firstValue(
      readinessData?.score,
      readinessData?.readinessScore,
      readinessData?.percentage,
      readinessData?.readinessPercentage,
      readinessData?.overallScore
    )
  );

  const resumeScore = normalizeScore(
    firstValue(
      resumeData?.analysis?.resumeScore,
      resumeData?.analysis?.score,
      resumeData?.resumeScore,
      resumeData?.score
    )
  );

  const atsScore = normalizeScore(
    firstValue(
      resumeData?.analysis?.atsScore,
      resumeData?.analysis?.atsScorePercentage,
      resumeData?.atsScore,
      resumeData?.atsScorePercentage
    )
  );

  const resumeExists =
    Boolean(
      resumeData?.analysis &&
        Object.keys(resumeData.analysis).length > 0
    ) ||
    resumeData?.resumeScore !== undefined ||
    resumeData?.atsScore !== undefined ||
    resumeData?.analyzedAt ||
    resumeData?.resumeName;

  const mockReport = mockInterview?.report || {};

  const mockCompleted =
    mockInterview?.completed === true ||
    mockInterview?.report?.overallScore !== undefined ||
    mockInterview?.percentage !== undefined ||
    mockInterview?.score !== undefined ||
    Number(mockInterview?.answeredQuestions || 0) > 0;

  const mockOverall = normalizeScore(
    firstValue(
      mockInterview?.percentage,
      mockInterview?.score,
      mockReport?.overallScore
    )
  );

  const mockTechnical = normalizeScore(
    firstValue(
      mockReport?.technicalKnowledge,
      mockReport?.technicalScore,
      mockReport?.technical
    )
  );

  const mockCommunication = normalizeScore(
    firstValue(
      mockReport?.communication,
      mockReport?.communicationScore
    )
  );

  const mockProblemSolving = normalizeScore(
    firstValue(
      mockReport?.problemSolving,
      mockReport?.problemSolvingScore
    )
  );

  const mockReadinessLevel = mockReport?.readinessLevel || "";

  const gaps = useMemo(() => {
    const rawGaps =
      skillGap?.missingSkills ??
      skillGap?.skillGaps ??
      skillGap?.gaps ??
      skillGap?.missing ??
      [];

    return normalizeList(rawGaps);
  }, [skillGap]);

  const learnedSkills = useMemo(() => {
    const rawLearned =
      skillGap?.learnedSkills ??
      skillGap?.matchedSkills ??
      skillGap?.existingSkills ??
      [];

    return normalizeList(rawLearned);
  }, [skillGap]);

  const weakAreas = useMemo(() => {
    const areas = [];

    if (skillScore > 0 && skillScore < 60) {
      areas.push({
        title: "Technical Fundamentals",
        level: "High",
        reason:
          "Your skill assessment score is below 60%. Strengthen your core technical concepts.",
      });
    } else if (skillScore >= 60 && skillScore < 75) {
      areas.push({
        title: "Technical Fundamentals",
        level: "Medium",
        reason:
          "Your technical foundation is developing. Continue practicing core concepts.",
      });
    }

    if (gaps.length > 0) {
      areas.push({
        title: "Missing Skills",
        level: gaps.length >= 4 ? "High" : "Medium",
        reason: `You have ${gaps.length} skill gap${
          gaps.length > 1 ? "s" : ""
        } that should be addressed.`,
      });
    }

    if (resumeExists && resumeScore > 0 && resumeScore < 70) {
      areas.push({
        title: "Resume Quality",
        level: "High",
        reason:
          "Your resume score indicates that your resume can be improved.",
      });
    }

    if (resumeExists && atsScore > 0 && atsScore < 70) {
      areas.push({
        title: "ATS Optimization",
        level: "High",
        reason:
          "Your resume can be optimized better for Applicant Tracking Systems.",
      });
    }

    if (mockTechnical > 0 && mockTechnical < 70) {
      areas.push({
        title: "Technical Interview",
        level: "High",
        reason:
          "Practice technical interview questions related to your target career.",
      });
    }

    if (mockCommunication > 0 && mockCommunication < 70) {
      areas.push({
        title: "Communication",
        level: "High",
        reason:
          "Practice explaining your answers clearly and confidently.",
      });
    }

    if (mockProblemSolving > 0 && mockProblemSolving < 70) {
      areas.push({
        title: "Problem Solving",
        level: "High",
        reason:
          "Practice coding problems and structured problem-solving questions.",
      });
    }

    if (readinessScore > 0 && readinessScore < 70) {
      areas.push({
        title: "Career Readiness",
        level: readinessScore < 50 ? "High" : "Medium",
        reason:
          "Your overall career readiness score shows that additional preparation is required.",
      });
    }

    return areas;
  }, [
    skillScore,
    gaps,
    resumeExists,
    resumeScore,
    atsScore,
    mockTechnical,
    mockCommunication,
    mockProblemSolving,
    readinessScore,
  ]);

  const highPriorityCount = weakAreas.filter(
    (item) => item.level === "High"
  ).length;

  let preparationPriority = {
    level: "Low",
    title: "You are on a good track",
    description:
      "Continue practicing technical questions, projects and mock interviews.",
  };

  if (highPriorityCount >= 2) {
    preparationPriority = {
      level: "High",
      title: "High Preparation Priority",
      description:
        "Focus on your weakest areas before applying for jobs or internships.",
    };
  } else if (weakAreas.length > 0) {
    preparationPriority = {
      level: "Medium",
      title: "Moderate Preparation Priority",
      description:
        "You have a few areas to improve before becoming fully interview ready.",
    };
  }

  useEffect(() => {
    const savedPrimary = getData("jobPreparation", null);
    const savedSecondary = getData(
      "jobPreparationResult",
      null
    );

    const saved =
      savedPrimary &&
      typeof savedPrimary === "object" &&
      Object.keys(savedPrimary).length > 0
        ? savedPrimary
        : savedSecondary || {};

    if (
      saved?.career === career &&
      saved?.completed === true
    ) {
      setAnswers(saved.answers || {});
      setSubmitted(true);

      const savedPercentage = normalizeScore(
        saved.scorePercentage ??
          saved.percentage ??
          saved.score
      );

      setScore(
        Math.round(
          (savedPercentage / 100) *
            currentCareerData.questions.length
        )
      );
    } else {
      setAnswers({});
      setSubmitted(false);
      setScore(0);
    }
  }, [
    career,
    refreshKey,
    currentCareerData.questions.length,
  ]);

  const selectAnswer = (questionIndex, answer) => {
    if (submitted) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: answer,
    }));
  };

  const submitQuiz = () => {
    const questions = currentCareerData.questions;

    const unanswered = questions.filter(
      (_, index) =>
        answers[index] === undefined ||
        answers[index] === null ||
        answers[index] === ""
    );

    if (unanswered.length > 0) {
      alert(
        `Please answer all questions before submitting.\n\nRemaining questions: ${unanswered.length}`
      );
      return;
    }

    let correctAnswers = 0;

    questions.forEach((question, index) => {
      if (answers[index] === question.answer) {
        correctAnswers++;
      }
    });

    const quizPercentage = Math.round(
      (correctAnswers / questions.length) * 100
    );

    setScore(correctAnswers);
    setSubmitted(true);

    const result = {
      career,
      score: correctAnswers,
      total: questions.length,
      percentage: quizPercentage,
      scorePercentage: quizPercentage,
      answers: {
        ...answers,
      },
      completed: true,
      completedAt: new Date().toISOString(),
      skillAssessmentScore: skillScore,
      careerReadinessScore: readinessScore,
      readinessLevel:
        mockReadinessLevel ||
        readinessData?.readinessLevel ||
        "",
      resumeExists,
      resumeScore,
      atsScore,
      skillGapCount: gaps.length,
      skillGaps: [...gaps],
      mockInterviewCompleted: mockCompleted,
      mockInterviewScore: mockOverall,
      mockTechnicalScore: mockTechnical,
      mockCommunicationScore: mockCommunication,
      mockProblemSolvingScore: mockProblemSolving,
      mockReadinessLevel,
      weakAreas: weakAreas.map((area) => ({
        ...area,
      })),
      preparationPriority: preparationPriority.level,
    };

    saveStudentData(
      "jobPreparation",
      result
    );

    saveStudentData(
      "jobPreparationResult",
      result
    );

    try {
      completeModule(MODULE_KEYS.JOB_PREPARATION);
    } catch (error) {
      console.error(
        "Could not update Job Preparation progress:",
        error
      );
    }

    window.dispatchEvent(
      new Event("jobPreparationUpdated")
    );
  };

  const restartQuiz = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);

    removeStudentData("jobPreparation");
    removeStudentData("jobPreparationResult");

    window.dispatchEvent(
      new Event("jobPreparationUpdated")
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const percentage =
    currentCareerData.questions.length > 0
      ? Math.round(
          (score /
            currentCareerData.questions.length) *
            100
        )
      : 0;

  const getResultMessage = () => {
    if (percentage >= 80) {
      return "Excellent! You are showing strong preparation for your target career.";
    }

    if (percentage >= 60) {
      return "Good job! Keep practicing to improve your interview readiness.";
    }

    return "Keep practicing. Focus on the concepts you got wrong and strengthen your fundamentals.";
  };

  const displayScore = (value, fallback = "N/A") => {
    if (
      value === undefined ||
      value === null ||
      value <= 0
    ) {
      return fallback;
    }

    return `${Math.round(value)}%`;
  };

  const skillGapCourseCompleted = useMemo(() => {
    if (gaps.length === 0) {
      return true;
    }

    if (
      !skillGapCourseProgress ||
      typeof skillGapCourseProgress !== "object"
    ) {
      return false;
    }

    return gaps.every((gap) => {
      const progressItem =
        skillGapCourseProgress[gap];

      if (typeof progressItem === "number") {
        return progressItem >= 100;
      }

      if (
        progressItem &&
        typeof progressItem === "object"
      ) {
        return (
          Number(
            progressItem.completed ??
              progressItem.progress ??
              progressItem.completedQuestions ??
              0
          ) >= 100
        );
      }

      const normalizedGap = gap.toLowerCase();

      const matchingKey = Object.keys(
        skillGapCourseProgress
      ).find(
        (key) =>
          key.toLowerCase() === normalizedGap
      );

      if (!matchingKey) {
        return false;
      }

      const matchingValue =
        skillGapCourseProgress[matchingKey];

      if (typeof matchingValue === "number") {
        return matchingValue >= 100;
      }

      if (
        matchingValue &&
        typeof matchingValue === "object"
      ) {
        return (
          Number(
            matchingValue.completed ??
              matchingValue.progress ??
              matchingValue.completedQuestions ??
              0
          ) >= 100
        );
      }

      return false;
    });
  }, [gaps, skillGapCourseProgress]);

  const projectsCompleted = useMemo(() => {
    const possibleSources = [
      projectStatus,
      projects,
      projectRecommendations,
    ];

    for (const source of possibleSources) {
      if (!source || typeof source !== "object") {
        continue;
      }

      const values = Object.values(source);

      const completedValues = values.filter(
        (value) =>
          value === true ||
          value === "completed" ||
          value === "Completed" ||
          value?.completed === true ||
          value?.status === "completed" ||
          value?.status === "Completed"
      );

      if (
        completedValues.length >= 2
      ) {
        return true;
      }

      if (
        source.completed === true ||
        source.allCompleted === true ||
        source.completedAll === true
      ) {
        return true;
      }

      if (
        Number(source.completedCount || 0) >= 2
      ) {
        return true;
      }
    }

    return false;
  }, [
    projectStatus,
    projects,
    projectRecommendations,
  ]);

  const resumeCompleted = Boolean(resumeExists);

  const technicalQuestionsCompleted =
    jobPreparation?.completed === true ||
    submitted === true;

  const communicationProblemSolvingCompleted =
    mockCompleted &&
    mockCommunication >= 70 &&
    mockProblemSolving >= 70;

  const checklist = [
    {
      number: 1,
      text: "Complete your technical skill assessment",
      done: skillScore > 0,
      path: "/skills",
    },
    {
      number: 2,
      text: "Learn the missing skills from your skill-gap analysis",
      done: skillGapCourseCompleted,
      path: "/skill-gap",
    },
    {
      number: 3,
      text: `Build ${currentCareerData.projects} career-related projects`,
      done: projectsCompleted,
      path: "/projects",
    },
    {
      number: 4,
      text: "Prepare and optimize your resume",
      done: resumeCompleted,
      path: "/resume",
    },
    {
      number: 5,
      text: "Practice technical interview questions",
      done: technicalQuestionsCompleted,
      path: null,
    },
    {
      number: 6,
      text: "Complete at least one mock interview",
      done: mockCompleted,
      path: "/mock-interview",
    },
    {
      number: 7,
      text: "Practice communication and problem solving",
      done: communicationProblemSolvingCompleted,
      path: "/mock-interview",
    },
  ];

  const firstIncompleteIndex = checklist.findIndex(
    (item) => !item.done
  );

  const allChecklistCompleted =
    firstIncompleteIndex === -1;

  const isStepUnlocked = (index) => {
    if (index === 0) {
      return true;
    }

    return checklist[index - 1].done;
  };

  const openChecklistStep = (item, index) => {
    if (item.done) {
      if (item.path) {
        navigate(item.path);
      } else if (index === 4) {
        document
          .getElementById("job-preparation-assessment")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }

      return;
    }

    if (!isStepUnlocked(index)) {
      return;
    }

    if (item.path) {
      navigate(item.path);
      return;
    }

    if (index === 4) {
      document
        .getElementById("job-preparation-assessment")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }
  };

  const completedChecklistCount = checklist.filter(
    (item) => item.done
  ).length;

  const checklistPercentage = Math.round(
    (completedChecklistCount / checklist.length) * 100
  );

  const currentStep =
    firstIncompleteIndex === -1
      ? checklist.length
      : firstIncompleteIndex + 1;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.icon}>💼</div>

          <div>
            <h1 style={styles.title}>
              Job Preparation
            </h1>

            <p style={styles.subtitle}>
              Prepare yourself for internships,
              jobs and technical interviews.
            </p>
          </div>
        </header>

        <section style={styles.careerCard}>
          <div style={styles.careerLabel}>
            🎯 TARGET CAREER
          </div>

          <div style={styles.career}>
            {career}
          </div>

          <p style={styles.careerText}>
            Your job preparation is connected with
            your Skill Assessment, Skill Gap,
            Career Readiness, Resume and Mock
            Interview results.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📊 Preparation Progress
          </h2>

          <div style={styles.progressTop}>
            <div>
              <strong>
                Step {currentStep} of {checklist.length}
              </strong>

              <p style={styles.progressText}>
                Complete each step to unlock the next
                step.
              </p>
            </div>

            <strong style={styles.progressPercent}>
              {checklistPercentage}%
            </strong>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${checklistPercentage}%`,
              }}
            />
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📋 Personalized Job Preparation Checklist
          </h2>

          <p style={styles.description}>
            Complete the current step to automatically
            unlock the next step.
          </p>

          <div style={styles.checklist}>
            {checklist.map((item, index) => {
              const unlocked =
                isStepUnlocked(index);

              const locked =
                !item.done && !unlocked;

              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() =>
                    openChecklistStep(
                      item,
                      index
                    )
                  }
                  disabled={locked}
                  style={{
                    ...styles.checkItem,
                    background: item.done
                      ? "#f0fdf4"
                      : unlocked
                      ? "#eff6ff"
                      : "#f8fafc",
                    border: item.done
                      ? "1px solid #bbf7d0"
                      : unlocked
                      ? "1px solid #93c5fd"
                      : "1px solid #e5e7eb",
                    cursor: locked
                      ? "not-allowed"
                      : "pointer",
                    opacity: locked ? 0.65 : 1,
                  }}
                >
                  <span
                    style={{
                      ...styles.checkNumber,
                      background: item.done
                        ? "#16a34a"
                        : unlocked
                        ? "#2563eb"
                        : "#9ca3af",
                    }}
                  >
                    {item.done
                      ? "✓"
                      : locked
                      ? "🔒"
                      : item.number}
                  </span>

                  <span
                    style={{
                      ...styles.checkContent,
                      color: item.done
                        ? "#166534"
                        : locked
                        ? "#6b7280"
                        : "#1d4ed8",
                    }}
                  >
                    <strong>
                      {item.text}
                    </strong>

                    <small>
                      {item.done
                        ? "Completed"
                        : locked
                        ? `Locked — complete step ${
                            index
                          } first`
                        : "Unlocked — click to continue"}
                    </small>
                  </span>

                  <span
                    style={
                      item.done
                        ? styles.done
                        : locked
                        ? styles.locked
                        : styles.pending
                    }
                  >
                    {item.done
                      ? "Completed"
                      : locked
                      ? "Locked"
                      : "Open →"}
                  </span>
                </button>
              );
            })}
          </div>

          {allChecklistCompleted && (
            <div style={styles.successBox}>
              <strong>
                🎉 Job Preparation Checklist Completed!
              </strong>

              <p>
                You have completed all seven job
                preparation steps.
              </p>
            </div>
          )}
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📊 Career Preparation Summary
          </h2>

          <div style={styles.grid}>
            <SummaryCard
              icon="🧠"
              value={displayScore(skillScore)}
              label="Skill Assessment"
              style={styles.cardBlue}
            />

            <SummaryCard
              icon="🚀"
              value={displayScore(readinessScore)}
              label="Career Readiness"
              style={styles.cardGreen}
            />

            <SummaryCard
              icon="⚠️"
              value={gaps.length}
              label="Skill Gaps"
              style={styles.cardOrange}
            />

            <SummaryCard
              icon="📄"
              value={
                resumeExists
                  ? displayScore(resumeScore)
                  : "No"
              }
              label="Resume"
              style={styles.cardPurple}
            />

            <SummaryCard
              icon="🤖"
              value={
                resumeExists
                  ? displayScore(atsScore)
                  : "N/A"
              }
              label="ATS Score"
              style={styles.cardBlue}
            />

            <SummaryCard
              icon="🎤"
              value={
                mockCompleted
                  ? displayScore(mockOverall)
                  : "N/A"
              }
              label="Mock Interview"
              style={styles.cardGreen}
            />
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🔗 Connected Career Modules
          </h2>

          <div style={styles.moduleGrid}>
            <ModuleStatus
              icon="🧠"
              title="Skill Assessment"
              value={displayScore(skillScore)}
              completed={skillScore > 0}
              onClick={() => navigate("/skills")}
            />

            <ModuleStatus
              icon="🔍"
              title="Skill Gap"
              value={`${gaps.length} gap${
                gaps.length !== 1 ? "s" : ""
              }`}
              completed={skillGapCourseCompleted}
              onClick={() =>
                navigate("/skill-gap")
              }
            />

            <ModuleStatus
              icon="📄"
              title="Resume"
              value={
                resumeExists
                  ? `${Math.round(resumeScore)}%`
                  : "Not analyzed"
              }
              completed={resumeExists}
              onClick={() => navigate("/resume")}
            />

            <ModuleStatus
              icon="🚀"
              title="Career Readiness"
              value={
                readinessScore > 0
                  ? `${Math.round(readinessScore)}%`
                  : "Not calculated"
              }
              completed={readinessScore > 0}
              onClick={() =>
                navigate("/readiness")
              }
            />

            <ModuleStatus
              icon="🎤"
              title="Mock Interview"
              value={
                mockCompleted
                  ? `${Math.round(mockOverall)}%`
                  : "Not completed"
              }
              completed={mockCompleted}
              onClick={() =>
                navigate("/mock-interview")
              }
            />
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.priorityBox}>
            <div style={styles.priorityIcon}>
              {preparationPriority.level === "High"
                ? "🔴"
                : preparationPriority.level ===
                  "Medium"
                ? "🟠"
                : "🟢"}
            </div>

            <div>
              <div style={styles.priorityLabel}>
                PREPARATION PRIORITY
              </div>

              <h3 style={styles.priorityTitle}>
                {preparationPriority.title}
              </h3>

              <p style={styles.priorityText}>
                {preparationPriority.description}
              </p>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            ⚠️ Weak Areas
          </h2>

          {weakAreas.length === 0 ? (
            <div style={styles.successBox}>
              <strong>
                🎉 No major weak areas detected.
              </strong>

              <p>
                Keep practicing and continue improving
                your technical, communication and
                interview skills.
              </p>
            </div>
          ) : (
            <div style={styles.weakGrid}>
              {weakAreas.map((item, index) => (
                <div
                  key={index}
                  style={styles.weakCard}
                >
                  <div style={styles.weakHeader}>
                    <strong>
                      {item.title}
                    </strong>

                    <span
                      style={{
                        ...styles.priorityBadge,
                        background:
                          item.level === "High"
                            ? "#fee2e2"
                            : "#fef3c7",
                        color:
                          item.level === "High"
                            ? "#b91c1c"
                            : "#b45309",
                      }}
                    >
                      {item.level}
                    </span>
                  </div>

                  <p style={styles.weakReason}>
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🛠️ Required Skills
          </h2>

          <p style={styles.description}>
            These are the most important skills you
            should develop for{" "}
            <strong>{career}</strong>.
          </p>

          <div style={styles.skillBox}>
            {currentCareerData.skills.map(
              (skill, index) => {
                const learned =
                  learnedSkills.some(
                    (item) =>
                      item.toLowerCase() ===
                      skill.toLowerCase()
                  );

                return (
                  <div
                    key={index}
                    style={styles.skill}
                  >
                    {learned ? "✅" : "📌"} {skill}
                  </div>
                );
              }
            )}
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🔍 Skill Gaps
          </h2>

          {gaps.length === 0 ? (
            <div style={styles.successBox}>
              <strong>
                {Object.keys(skillGap || {}).length > 0
                  ? "✅ No skill gaps found."
                  : "ℹ️ Skill gap data not available yet."}
              </strong>

              <p>
                {Object.keys(skillGap || {}).length > 0
                  ? "Your current skill information does not show any major missing skills."
                  : "Complete the Skill Gap module to receive personalized missing-skill recommendations."}
              </p>

              <button
                style={styles.mockButton}
                onClick={() =>
                  navigate("/skill-gap")
                }
              >
                Open Skill Gap
              </button>
            </div>
          ) : (
            <>
              <div style={styles.skillBox}>
                {gaps.map((gap, index) => (
                  <div
                    key={index}
                    style={styles.gap}
                  >
                    ⚠️ {gap}
                  </div>
                ))}
              </div>

              <button
                style={{
                  ...styles.secondaryButton,
                  marginTop: "15px",
                }}
                onClick={() =>
                  navigate("/skill-gap")
                }
              >
                View Full Skill Gap →
              </button>
            </>
          )}
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🎤 Mock Interview Performance
          </h2>

          {!mockCompleted ? (
            <div style={styles.warningBox}>
              <div>
                <strong>
                  You have not completed a mock
                  interview yet.
                </strong>

                <p>
                  Take a mock interview to measure
                  your technical knowledge,
                  communication and problem-solving
                  skills.
                </p>
              </div>

              <button
                style={styles.mockButton}
                onClick={() =>
                  navigate("/mock-interview")
                }
              >
                Start Mock Interview
              </button>
            </div>
          ) : (
            <>
              <div style={styles.mockGrid}>
                <MockCard
                  icon="⭐"
                  title="Overall"
                  value={mockOverall}
                />

                <MockCard
                  icon="💻"
                  title="Technical"
                  value={mockTechnical}
                />

                <MockCard
                  icon="🗣️"
                  title="Communication"
                  value={mockCommunication}
                />

                <MockCard
                  icon="🧩"
                  title="Problem Solving"
                  value={mockProblemSolving}
                />
              </div>

              {mockReadinessLevel && (
                <div style={styles.infoBox}>
                  <strong>
                    Interview Readiness:
                  </strong>{" "}
                  {mockReadinessLevel}
                </div>
              )}
            </>
          )}

          {mockCompleted && (
            <button
              style={styles.secondaryButton}
              onClick={() =>
                navigate("/mock-interview")
              }
            >
              Retake Mock Interview
            </button>
          )}
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📚 Interview Topics
          </h2>

          <p style={styles.description}>
            Focus on these topics before attending
            technical interviews.
          </p>

          <div style={styles.topicGrid}>
            {currentCareerData.topics.map(
              (topic, index) => (
                <div
                  key={index}
                  style={styles.topic}
                >
                  <span style={styles.topicCheck}>
                    ✓
                  </span>

                  {topic}
                </div>
              )
            )}
          </div>
        </section>

        <section
          id="job-preparation-assessment"
          style={styles.quizSection}
        >
          <div style={styles.quizHeader}>
            <div style={styles.quizIcon}>📝</div>

            <div>
              <h2 style={styles.quizTitle}>
                Job Preparation Assessment
              </h2>

              <p>
                Test your knowledge for the{" "}
                <strong>{career}</strong> career path.
              </p>
            </div>
          </div>

          {currentCareerData.questions.map(
            (question, questionIndex) => (
              <div
                key={questionIndex}
                style={styles.question}
              >
                <h3 style={styles.questionTitle}>
                  {questionIndex + 1}.{" "}
                  {question.question}
                </h3>

                {question.options.map(
                  (option, optionIndex) => {
                    const selected =
                      answers[questionIndex] ===
                      option;

                    const correct =
                      submitted &&
                      option ===
                        question.answer;

                    const wrong =
                      submitted &&
                      selected &&
                      option !==
                        question.answer;

                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        disabled={submitted}
                        onClick={() =>
                          selectAnswer(
                            questionIndex,
                            option
                          )
                        }
                        style={{
                          ...styles.option,
                          border: correct
                            ? "2px solid #16a34a"
                            : wrong
                            ? "2px solid #dc2626"
                            : selected
                            ? "2px solid #2563eb"
                            : "1px solid #d1d5db",
                          background:
                            correct
                              ? "#dcfce7"
                              : wrong
                              ? "#fee2e2"
                              : selected
                              ? "#dbeafe"
                              : "#ffffff",
                        }}
                      >
                        <span>
                          {String.fromCharCode(
                            65 + optionIndex
                          )}
                          .
                        </span>

                        <span>
                          {option}
                        </span>

                        {correct && (
                          <span> ✅</span>
                        )}

                        {wrong && (
                          <span> ❌</span>
                        )}
                      </button>
                    );
                  }
                )}

                {submitted && (
                  <div style={styles.correctAnswer}>
                    Correct Answer:{" "}
                    <strong>
                      {question.answer}
                    </strong>
                  </div>
                )}
              </div>
            )
          )}

          {!submitted ? (
            <button
              type="button"
              style={styles.submitButton}
              onClick={submitQuiz}
            >
              Submit Assessment
            </button>
          ) : (
            <div style={styles.resultBox}>
              <div style={styles.resultIcon}>
                🏆
              </div>

              <div style={styles.bigScore}>
                {score}/
                {currentCareerData.questions.length}
              </div>

              <div style={styles.percentage}>
                {percentage}%
              </div>

              <p style={styles.resultMessage}>
                {getResultMessage()}
              </p>

              <button
                type="button"
                style={styles.restartButton}
                onClick={restartQuiz}
              >
                Retake Assessment
              </button>
            </div>
          )}
        </section>

        <section style={styles.nextBox}>
          <div>
            <h3>
              {allChecklistCompleted
                ? "🎉 You are fully prepared!"
                : `🚀 Step ${currentStep} is your next step`}
            </h3>

            <p>
              {allChecklistCompleted
                ? "You have completed your personalized job preparation journey."
                : "Complete the current step to unlock the next step in your job preparation journey."}
            </p>
          </div>

          {!allChecklistCompleted &&
            checklist[currentStep - 1] && (
              <button
                style={styles.nextButton}
                onClick={() =>
                  openChecklistStep(
                    checklist[currentStep - 1],
                    currentStep - 1
                  )
                }
              >
                Continue Step {currentStep} →
              </button>
            )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  style,
}) {
  return (
    <div style={style}>
      <div style={styles.cardIcon}>
        {icon}
      </div>

      <div style={styles.number}>
        {value}
      </div>

      <div style={styles.label}>
        {label}
      </div>
    </div>
  );
}

function ModuleStatus({
  icon,
  title,
  value,
  completed,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.moduleCard,
        cursor: "pointer",
      }}
    >
      <div style={styles.moduleIcon}>
        {icon}
      </div>

      <div style={styles.moduleContent}>
        <strong>{title}</strong>
        <span>{value}</span>
      </div>

      <div
        style={{
          ...styles.moduleStatus,
          color: completed
            ? "#16a34a"
            : "#f59e0b",
        }}
      >
        {completed ? "✓" : "!"}
      </div>
    </button>
  );
}

function MockCard({
  icon,
  title,
  value,
}) {
  return (
    <div style={styles.mockCard}>
      <div style={styles.mockIcon}>
        {icon}
      </div>

      <strong>{title}</strong>

      <div style={styles.number}>
        {value > 0
          ? `${Math.round(value)}%`
          : "N/A"}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px 20px",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
    color: "#1f2937",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "25px",
  },

  icon: {
    width: "58px",
    height: "58px",
    borderRadius: "16px",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    boxShadow:
      "0 8px 20px rgba(37, 99, 235, 0.20)",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "15px",
  },

  careerCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "25px",
    marginBottom: "30px",
    boxShadow:
      "0 5px 20px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e5e7eb",
  },

  careerLabel: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#2563eb",
    letterSpacing: "1px",
    marginBottom: "8px",
  },

  career: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#111827",
  },

  careerText: {
    margin: "10px 0 0",
    color: "#6b7280",
    lineHeight: 1.6,
  },

  section: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow:
      "0 5px 20px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e5e7eb",
  },

  sectionTitle: {
    margin: "0 0 18px",
    fontSize: "21px",
    fontWeight: 800,
    color: "#111827",
  },

  description: {
    color: "#6b7280",
    marginTop: "-5px",
    marginBottom: "18px",
    lineHeight: 1.6,
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "12px",
  },

  progressText: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  progressPercent: {
    fontSize: "25px",
    color: "#2563eb",
  },

  progressTrack: {
    width: "100%",
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
  },

  cardBlue: {
    padding: "20px",
    borderRadius: "15px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    textAlign: "center",
  },

  cardGreen: {
    padding: "20px",
    borderRadius: "15px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    textAlign: "center",
  },

  cardOrange: {
    padding: "20px",
    borderRadius: "15px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    textAlign: "center",
  },

  cardPurple: {
    padding: "20px",
    borderRadius: "15px",
    background: "#faf5ff",
    border: "1px solid #e9d5ff",
    textAlign: "center",
  },

  cardIcon: {
    fontSize: "25px",
    marginBottom: "8px",
  },

  number: {
    fontSize: "25px",
    fontWeight: 800,
    marginBottom: "5px",
    color: "#111827",
  },

  label: {
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 600,
  },

  moduleGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },

  moduleCard: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    textAlign: "left",
  },

  moduleIcon: {
    fontSize: "25px",
  },

  moduleContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },

  moduleStatus: {
    fontSize: "24px",
    fontWeight: 900,
  },

  priorityBox: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "20px",
    borderRadius: "15px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  priorityIcon: {
    fontSize: "34px",
  },

  priorityLabel: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#6b7280",
    letterSpacing: "1px",
  },

  priorityTitle: {
    margin: "4px 0",
    fontSize: "20px",
  },

  priorityText: {
    margin: 0,
    color: "#6b7280",
  },

  weakGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
  },

  weakCard: {
    padding: "18px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  },

  weakHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  priorityBadge: {
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
  },

  weakReason: {
    margin: "10px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  skillBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  skill: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    fontSize: "14px",
    fontWeight: 600,
  },

  gap: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
    fontSize: "14px",
    fontWeight: 600,
  },

  successBox: {
    padding: "18px",
    borderRadius: "14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    marginTop: "15px",
  },

  warningBox: {
    padding: "18px",
    borderRadius: "14px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  infoBox: {
    padding: "13px 16px",
    marginTop: "15px",
    borderRadius: "10px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
  },

  topicGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },

  topic: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "13px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontWeight: 600,
  },

  topicCheck: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dcfce7",
    color: "#15803d",
    fontWeight: 800,
  },

  mockGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "18px",
  },

  mockCard: {
    textAlign: "center",
    padding: "20px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  mockIcon: {
    fontSize: "25px",
    marginBottom: "8px",
  },

  mockButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "11px 18px",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  secondaryButton: {
    border: "1px solid #2563eb",
    background: "#ffffff",
    color: "#2563eb",
    padding: "11px 18px",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  checklist: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  checkItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px",
    borderRadius: "12px",
    textAlign: "left",
    transition: "0.2s",
  },

  checkNumber: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    flexShrink: 0,
  },

  checkContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },

  done: {
    color: "#16a34a",
    fontSize: "12px",
    fontWeight: 700,
    marginLeft: "auto",
  },

  pending: {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 700,
    marginLeft: "auto",
  },

  locked: {
    color: "#9ca3af",
    fontSize: "12px",
    fontWeight: 700,
    marginLeft: "auto",
  },

  quizSection: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow:
      "0 5px 20px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e5e7eb",
  },

  quizHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
  },

  quizIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },

  quizTitle: {
    margin: 0,
    fontSize: "22px",
  },

  question: {
    marginBottom: "25px",
    paddingBottom: "20px",
    borderBottom: "1px solid #e5e7eb",
  },

  questionTitle: {
    fontSize: "16px",
    lineHeight: 1.5,
    marginBottom: "12px",
  },

  option: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "13px 15px",
    borderRadius: "10px",
    marginBottom: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    transition: "0.2s",
  },

  correctAnswer: {
    marginTop: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "13px",
  },

  submitButton: {
    width: "100%",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "14px",
    borderRadius: "11px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },

  resultBox: {
    textAlign: "center",
    padding: "30px",
    borderRadius: "15px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  resultIcon: {
    fontSize: "40px",
  },

  bigScore: {
    fontSize: "42px",
    fontWeight: 900,
    marginTop: "5px",
  },

  percentage: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#2563eb",
  },

  resultMessage: {
    maxWidth: "600px",
    margin: "12px auto 20px",
    color: "#6b7280",
    lineHeight: 1.6,
  },

  restartButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  nextBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    background: "#1e3a8a",
    color: "#ffffff",
    borderRadius: "18px",
    padding: "25px",
    marginBottom: "30px",
  },

  nextButton: {
    border: "none",
    background: "#ffffff",
    color: "#1e3a8a",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

export default JobPreparation;

