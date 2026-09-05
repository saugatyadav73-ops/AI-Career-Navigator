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

function Readiness() {
  const navigate = useNavigate();

  // =====================================================
  // SAFE LOCAL STORAGE READER
  // =====================================================

  const getStorageData = (key) => {
    try {
      const data = localStorage.getItem(key);

      if (!data) {
        return {};
      }

      const parsed = JSON.parse(data);

      return parsed && typeof parsed === "object"
        ? parsed
        : {};
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return {};
    }
  };

  // =====================================================
  // REFRESH VERSION
  // =====================================================

  const [dataVersion, setDataVersion] = useState(0);

  // =====================================================
  // LISTEN FOR UPDATES
  // =====================================================

  useEffect(() => {
    const refreshReadiness = () => {
      setDataVersion((version) => version + 1);
    };

    window.addEventListener(
      "mockInterviewUpdated",
      refreshReadiness
    );

    window.addEventListener(
      "readinessUpdated",
      refreshReadiness
    );

    window.addEventListener(
      "storage",
      refreshReadiness
    );

    return () => {
      window.removeEventListener(
        "mockInterviewUpdated",
        refreshReadiness
      );

      window.removeEventListener(
        "readinessUpdated",
        refreshReadiness
      );

      window.removeEventListener(
        "storage",
        refreshReadiness
      );
    };
  }, []);

  // =====================================================
  // GET STORED DATA
  // =====================================================

  const profile = useMemo(
    () => getStorageData("studentProfile"),
    [dataVersion]
  );

  const careerRecommendation = useMemo(
    () =>
      getStorageData("careerRecommendation"),
    [dataVersion]
  );

  const careerAnalysis = useMemo(
    () => getStorageData("careerAnalysis"),
    [dataVersion]
  );

  const skillGap = useMemo(
    () => getStorageData("skillGap"),
    [dataVersion]
  );

  const assessment = useMemo(
    () => getStorageData("skillAssessment"),
    [dataVersion]
  );

  const projects = useMemo(() => {
    const projectRecommendations =
      getStorageData(
        "projectRecommendations"
      );

    if (
      projectRecommendations &&
      typeof projectRecommendations === "object" &&
      Object.keys(projectRecommendations).length > 0
    ) {
      return projectRecommendations;
    }

    return getStorageData("projects");
  }, [dataVersion]);

  const roadmap = useMemo(() => {
    const savedRoadmap =
      getStorageData("careerRoadmap");

    if (
      savedRoadmap &&
      typeof savedRoadmap === "object" &&
      Object.keys(savedRoadmap).length > 0
    ) {
      return savedRoadmap;
    }

    return getStorageData("roadmap");
  }, [dataVersion]);

  const mockInterview = useMemo(
    () => getStorageData("mockInterview"),
    [dataVersion]
  );

  const savedCareerReadiness = useMemo(
    () => {
      const careerReadiness =
        getStorageData("careerReadiness");

      if (
        careerReadiness &&
        typeof careerReadiness === "object" &&
        Object.keys(careerReadiness).length > 0
      ) {
        return careerReadiness;
      }

      return getStorageData("readiness");
    },
    [dataVersion]
  );

  // =====================================================
  // CAREER
  // =====================================================

  const career =
    careerRecommendation.career ||
    careerRecommendation.recommendedCareer ||
    careerRecommendation.recommendedCareerName ||
    careerAnalysis.career ||
    careerAnalysis.recommendedCareer ||
    careerAnalysis.recommendedCareerName ||
    skillGap.career ||
    projects.career ||
    roadmap.career ||
    "Software Developer";

  // =====================================================
  // CAREER MATCH
  // =====================================================

  const careerMatch = Math.min(
    100,
    Math.max(
      0,
      Number(
        careerRecommendation.matchPercentage ??
          careerRecommendation.careerMatch ??
          careerAnalysis.matchPercentage ??
          careerAnalysis.careerMatch ??
          skillGap.careerMatch ??
          projects.careerMatch ??
          roadmap.careerMatch ??
          0
      )
    )
  );

  // =====================================================
  // ASSESSMENT
  // =====================================================

  const assessmentScore = Math.max(
    0,
    Number(
      assessment.score ??
        assessment.correctAnswers ??
        0
    )
  );

  const assessmentTotal = Math.max(
    1,
    Number(
      assessment.total ??
        assessment.totalQuestions ??
        10
    )
  );

  const assessmentPercentage = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        assessmentScore /
          assessmentTotal *
          100
      )
    )
  );

  // =====================================================
  // SKILLS
  // =====================================================

  const missingSkills = useMemo(() => {
    if (
      Array.isArray(
        skillGap.missingSkills
      )
    ) {
      return skillGap.missingSkills;
    }

    if (
      Array.isArray(
        skillGap.skillGaps
      )
    ) {
      return skillGap.skillGaps;
    }

    if (Array.isArray(skillGap.gaps)) {
      return skillGap.gaps;
    }

    return [];
  }, [skillGap]);

  const learnedSkills = useMemo(() => {
    if (
      Array.isArray(
        skillGap.learnedSkills
      )
    ) {
      return skillGap.learnedSkills;
    }

    return [];
  }, [skillGap]);

  const totalSkills =
    missingSkills.length +
    learnedSkills.length;

  const skillScore =
    totalSkills > 0
      ? Math.min(
          100,
          Math.round(
            learnedSkills.length /
              totalSkills *
              100
          )
        )
      : 0;

  // =====================================================
  // PROJECTS
  // =====================================================

  const completedProjects =
    Array.isArray(
      projects.completedProjects
    )
      ? projects.completedProjects
      : [];

  const recommendedProjects =
    Array.isArray(projects.projects)
      ? projects.projects
      : Array.isArray(
          projects.recommendedProjects
        )
      ? projects.recommendedProjects
      : [];

  const projectScore = useMemo(() => {
    if (
      projects.projectPercentage !==
        undefined &&
      projects.projectPercentage !== null
    ) {
      return Math.min(
        100,
        Math.max(
          0,
          Number(
            projects.projectPercentage
          )
        )
      );
    }

    if (
      recommendedProjects.length > 0
    ) {
      return Math.min(
        100,
        Math.round(
          completedProjects.length /
            recommendedProjects.length *
            100
        )
      );
    }

    return 0;
  }, [
    projects,
    completedProjects.length,
    recommendedProjects.length,
  ]);

  // =====================================================
  // MOCK INTERVIEW REPORT
  // =====================================================

  const mockReport =
    mockInterview &&
    typeof mockInterview.report === "object"
      ? mockInterview.report
      : {};

  // =====================================================
  // MOCK INTERVIEW SCORE
  // =====================================================

  const mockInterviewCompleted =
    mockInterview.completed === true ||
    Boolean(mockInterview.report);

  const mockInterviewScore = Math.min(
    100,
    Math.max(
      0,
      Number(
        mockInterview.percentage ??
          mockInterview.score ??
          mockInterview.overallScore ??
          mockReport.overallScore ??
          0
      )
    )
  );

  // =====================================================
  // TECHNICAL KNOWLEDGE
  // =====================================================

  const technicalKnowledge = Math.min(
    100,
    Math.max(
      0,
      Number(
        mockReport.technicalKnowledge ??
          mockInterview.technicalKnowledge ??
          0
      )
    )
  );

  // =====================================================
  // COMMUNICATION
  // =====================================================

  const communicationScore = Math.min(
    100,
    Math.max(
      0,
      Number(
        mockReport.communication ??
          mockInterview.communication ??
          0
      )
    )
  );

  // =====================================================
  // PROBLEM SOLVING
  // =====================================================

  const problemSolvingScore = Math.min(
    100,
    Math.max(
      0,
      Number(
        mockReport.problemSolving ??
          mockInterview.problemSolving ??
          0
      )
    )
  );

  // =====================================================
  // MOCK READINESS LEVEL
  // =====================================================

  const mockReadinessLevel =
    mockReport.readinessLevel ||
    mockInterview.readinessLevel ||
    "";

  // =====================================================
  // MOCK STRENGTHS
  // =====================================================

  const mockStrengths =
    Array.isArray(
      mockReport.strengths
    )
      ? mockReport.strengths
      : [];

  // =====================================================
  // MOCK WEAKNESSES
  // =====================================================

  const mockWeaknesses =
    Array.isArray(
      mockReport.weaknesses
    )
      ? mockReport.weaknesses
      : [];

  // =====================================================
  // MOCK RECOMMENDATIONS
  // =====================================================

  const mockRecommendations =
    Array.isArray(
      mockReport.recommendations
    )
      ? mockReport.recommendations
      : [];

  // =====================================================
  // READINESS SCORE
  // =====================================================

  /*
    FINAL WEIGHT:

    Assessment       = 25%
    Skills           = 25%
    Projects         = 20%
    Career Match     = 10%
    Mock Interview   = 20%

    Total             = 100%
  */

  const calculatedReadinessScore =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(
          assessmentPercentage * 0.25 +
          skillScore * 0.25 +
          projectScore * 0.20 +
          careerMatch * 0.10 +
          mockInterviewScore * 0.20
        )
      )
    );

  /*
    IMPORTANT:

    We calculate the score from current data
    instead of using an old saved score.

    This prevents stale readiness results.
  */

  const readinessScore =
    calculatedReadinessScore;

  // =====================================================
  // READINESS LEVEL
  // =====================================================

  const readinessLevel = useMemo(() => {
    if (readinessScore >= 80) {
      return {
        label: "Job Ready",
        emoji: "🚀",
        description:
          "Excellent! You are well prepared for your target career.",
      };
    }

    if (readinessScore >= 60) {
      return {
        label: "Almost Ready",
        emoji: "🔥",
        description:
          "You are making strong progress. Improve your remaining skill gaps and interview performance.",
      };
    }

    if (readinessScore >= 40) {
      return {
        label: "Developing",
        emoji: "📈",
        description:
          "You have started your journey, but you need more skills, projects and interview practice.",
      };
    }

    return {
      label: "Needs Improvement",
      emoji: "💪",
      description:
        "Keep learning and practicing. Follow your roadmap and improve your interview performance.",
    };
  }, [readinessScore]);

  // =====================================================
  // STRENGTHS
  // =====================================================

  const strengths = useMemo(() => {
    const result = [];

    if (assessmentPercentage >= 70) {
      result.push(
        "Strong Skill Assessment performance"
      );
    }

    if (skillScore >= 70) {
      result.push(
        "Good coverage of required skills"
      );
    }

    if (projectScore >= 50) {
      result.push(
        "Good practical project experience"
      );
    }

    if (careerMatch >= 70) {
      result.push(
        "Strong career compatibility"
      );
    }

    if (mockInterviewCompleted) {
      if (mockInterviewScore >= 70) {
        result.push(
          "Strong mock interview performance"
        );
      }

      if (technicalKnowledge >= 70) {
        result.push(
          "Good technical interview knowledge"
        );
      }

      if (communicationScore >= 70) {
        result.push(
          "Good interview communication"
        );
      }

      if (problemSolvingScore >= 70) {
        result.push(
          "Good problem-solving ability"
        );
      }
    }

    mockStrengths
      .slice(0, 3)
      .forEach((strength) => {
        if (
          typeof strength === "string" &&
          !result.includes(strength)
        ) {
          result.push(strength);
        }
      });

    if (learnedSkills.length > 0) {
      result.push(
        `You already have ${learnedSkills.length} relevant skills`
      );
    }

    if (result.length === 0) {
      result.push(
        "You have started building your career profile"
      );
    }

    return [...new Set(result)];
  }, [
    assessmentPercentage,
    skillScore,
    projectScore,
    careerMatch,
    mockInterviewCompleted,
    mockInterviewScore,
    technicalKnowledge,
    communicationScore,
    problemSolvingScore,
    mockStrengths,
    learnedSkills.length,
  ]);

  // =====================================================
  // WEAKNESSES
  // =====================================================

  const weaknesses = useMemo(() => {
    const result = [];

    if (assessmentPercentage < 70) {
      result.push(
        "Improve your Skill Assessment performance"
      );
    }

    if (skillScore < 70) {
      result.push(
        "Develop more skills required for your target career"
      );
    }

    if (projectScore < 50) {
      result.push(
        "Build and complete more practical projects"
      );
    }

    if (careerMatch < 70) {
      result.push(
        "Improve your career-skill alignment"
      );
    }

    if (
      mockInterviewCompleted &&
      mockInterviewScore < 70
    ) {
      result.push(
        "Improve your mock interview performance"
      );
    }

    if (
      mockInterviewCompleted &&
      technicalKnowledge > 0 &&
      technicalKnowledge < 70
    ) {
      result.push(
        "Improve your technical interview knowledge"
      );
    }

    if (
      mockInterviewCompleted &&
      communicationScore > 0 &&
      communicationScore < 70
    ) {
      result.push(
        "Improve your interview communication"
      );
    }

    if (
      mockInterviewCompleted &&
      problemSolvingScore > 0 &&
      problemSolvingScore < 70
    ) {
      result.push(
        "Practice more interview problem-solving questions"
      );
    }

    if (missingSkills.length > 0) {
      result.push(
        `${missingSkills.length} skill gap(s) still need attention`
      );
    }

    mockWeaknesses
      .slice(0, 3)
      .forEach((weakness) => {
        if (
          typeof weakness === "string" &&
          !result.includes(weakness)
        ) {
          result.push(weakness);
        }
      });

    return [...new Set(result)];
  }, [
    assessmentPercentage,
    skillScore,
    projectScore,
    careerMatch,
    mockInterviewCompleted,
    mockInterviewScore,
    technicalKnowledge,
    communicationScore,
    problemSolvingScore,
    missingSkills.length,
    mockWeaknesses,
  ]);

  // =====================================================
  // SAVE READINESS
  // =====================================================

  useEffect(() => {
    const readinessResult = {
      career,
      careerMatch,

      readinessScore,
      score: readinessScore,
      percentage: readinessScore,

      readinessLevel:
        readinessLevel.label,

      // Profile
      profile,

      // Assessment
      assessmentScore,
      assessmentTotal,
      assessmentPercentage,

      // Skills
      skillScore,
      learnedSkills,
      missingSkills,

      // Roadmap
      roadmapWeeks:
        roadmap.totalWeeks ??
        roadmap.estimatedWeeks ??
        0,

      // Projects
      projectScore,
      completedProjects,
      recommendedProjects:
        recommendedProjects.length,

      // Mock Interview
      mockInterviewCompleted,
      mockInterviewScore,
      technicalKnowledge,
      communicationScore,
      problemSolvingScore,
      mockReadinessLevel,
      mockStrengths,
      mockWeaknesses,
      mockRecommendations,

      // Final analysis
      strengths,
      weaknesses,

      // Weights
      weights: {
        assessment: 25,
        skills: 25,
        projects: 20,
        careerMatch: 10,
        mockInterview: 20,
      },

      updatedAt:
        new Date().toISOString(),

      source: "readiness",
    };

    localStorage.setItem(
      "careerReadiness",
      JSON.stringify(readinessResult)
    );

    localStorage.setItem(
      "readiness",
      JSON.stringify(readinessResult)
    );

    /*
      Readiness should be considered complete
      once this analysis has been generated.
    */

    try {
      completeModule(
        MODULE_KEYS.READINESS
      );
    } catch (error) {
      console.error(
        "Progress update error:",
        error
      );
    }

    window.dispatchEvent(
      new Event("readinessUpdated")
    );
  }, [
    career,
    careerMatch,
    readinessScore,
    readinessLevel.label,
    profile,
    assessmentScore,
    assessmentTotal,
    assessmentPercentage,
    skillScore,
    learnedSkills,
    missingSkills,
    roadmap,
    projectScore,
    completedProjects,
    recommendedProjects.length,
    mockInterviewCompleted,
    mockInterviewScore,
    technicalKnowledge,
    communicationScore,
    problemSolvingScore,
    mockReadinessLevel,
    mockStrengths,
    mockWeaknesses,
    mockRecommendations,
    strengths,
    weaknesses,
  ]);

  // =====================================================
  // SCORE STYLE
  // =====================================================

  const getScoreStyle = (score) => {
    if (score >= 80) {
      return styles.scoreExcellent;
    }

    if (score >= 60) {
      return styles.scoreGood;
    }

    if (score >= 40) {
      return styles.scoreAverage;
    }

    return styles.scoreLow;
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div style={styles.icon}>
            🎯
          </div>

          <h1 style={styles.title}>
            Career Readiness Assessment
          </h1>

          <p style={styles.subtitle}>
            Check how prepared you are for your
            target career based on your skills,
            assessment performance, projects,
            career compatibility and mock
            interview performance.
          </p>
        </div>

        {/* TARGET CAREER */}

        <div style={styles.careerCard}>
          <div style={styles.targetIcon}>
            🚀
          </div>

          <p style={styles.smallTitle}>
            Your Target Career
          </p>

          <h1 style={styles.careerName}>
            {career}
          </h1>

          <p style={styles.matchText}>
            Career Match:{" "}
            <strong>
              {careerMatch}%
            </strong>
          </p>
        </div>

        {/* MAIN READINESS */}

        <div style={styles.readinessCard}>
          <div style={styles.readinessIcon}>
            {readinessLevel.emoji}
          </div>

          <p style={styles.readinessSmall}>
            Overall Career Readiness
          </p>

          <div
            style={{
              ...styles.mainScore,
              ...getScoreStyle(readinessScore),
            }}
          >
            {readinessScore}%
          </div>

          <h2 style={styles.readinessLabel}>
            {readinessLevel.label}
          </h2>

          <p style={styles.readinessDescription}>
            {readinessLevel.description}
          </p>

          <div
            style={
              styles.readinessProgressBackground
            }
          >
            <div
              style={{
                ...styles.readinessProgressFill,
                width: `${readinessScore}%`,
              }}
            />
          </div>

          <div style={styles.progressText}>
            <span>0%</span>
            <strong>
              {readinessScore}%
            </strong>
            <span>100%</span>
          </div>
        </div>

        {/* SCORE CARDS */}

        <div style={styles.scoreGrid}>

          {/* SKILLS */}

          <div style={styles.scoreCard}>
            <div style={styles.scoreIcon}>
              🧠
            </div>

            <h3>Skill Score</h3>

            <div
              style={{
                ...styles.cardScore,
                ...getScoreStyle(skillScore),
              }}
            >
              {skillScore}%
            </div>

            <p style={styles.cardDescription}>
              Based on your current skills
              compared with required skills.
            </p>

            <div
              style={
                styles.miniProgressBackground
              }
            >
              <div
                style={{
                  ...styles.miniProgressFill,
                  width: `${skillScore}%`,
                }}
              />
            </div>
          </div>

          {/* ASSESSMENT */}

          <div style={styles.scoreCard}>
            <div style={styles.scoreIcon}>
              📝
            </div>

            <h3>Assessment Score</h3>

            <div
              style={{
                ...styles.cardScore,
                ...getScoreStyle(
                  assessmentPercentage
                ),
              }}
            >
              {assessmentPercentage}%
            </div>

            <p style={styles.cardDescription}>
              Your performance in the skill
              assessment.
            </p>

            <div
              style={
                styles.miniProgressBackground
              }
            >
              <div
                style={{
                  ...styles.miniProgressFill,
                  width: `${assessmentPercentage}%`,
                }}
              />
            </div>

            <small>
              {assessmentScore} /{" "}
              {assessmentTotal} correct
            </small>
          </div>

          {/* PROJECT */}

          <div style={styles.scoreCard}>
            <div style={styles.scoreIcon}>
              💻
            </div>

            <h3>Project Score</h3>

            <div
              style={{
                ...styles.cardScore,
                ...getScoreStyle(projectScore),
              }}
            >
              {projectScore}%
            </div>

            <p style={styles.cardDescription}>
              Based on your completed practical
              projects.
            </p>

            <div
              style={
                styles.miniProgressBackground
              }
            >
              <div
                style={{
                  ...styles.miniProgressFill,
                  width: `${projectScore}%`,
                }}
              />
            </div>

            <small>
              {completedProjects.length} /{" "}
              {recommendedProjects.length}{" "}
              completed
            </small>
          </div>

          {/* CAREER MATCH */}

          <div style={styles.scoreCard}>
            <div style={styles.scoreIcon}>
              🎯
            </div>

            <h3>Career Match</h3>

            <div
              style={{
                ...styles.cardScore,
                ...getScoreStyle(careerMatch),
              }}
            >
              {careerMatch}%
            </div>

            <p style={styles.cardDescription}>
              Compatibility with your
              recommended career.
            </p>

            <div
              style={
                styles.miniProgressBackground
              }
            >
              <div
                style={{
                  ...styles.miniProgressFill,
                  width: `${careerMatch}%`,
                }}
              />
            </div>
          </div>

          {/* MOCK INTERVIEW */}

          <div style={styles.scoreCard}>
            <div style={styles.scoreIcon}>
              🎤
            </div>

            <h3>Mock Interview</h3>

            <div
              style={{
                ...styles.cardScore,
                ...getScoreStyle(
                  mockInterviewScore
                ),
              }}
            >
              {mockInterviewCompleted
                ? `${mockInterviewScore}%`
                : "Not completed"}
            </div>

            <p style={styles.cardDescription}>
              Based on your AI mock interview
              performance.
            </p>

            <div
              style={
                styles.miniProgressBackground
              }
            >
              <div
                style={{
                  ...styles.miniProgressFill,
                  width: `${mockInterviewScore}%`,
                }}
              />
            </div>

            {mockReadinessLevel && (
              <small>
                AI Status:{" "}
                <strong>
                  {mockReadinessLevel}
                </strong>
              </small>
            )}
          </div>
        </div>

        {/* MOCK INTERVIEW BREAKDOWN */}

        {mockInterviewCompleted && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionIcon}>
                🎤
              </div>

              <div>
                <h2 style={styles.sectionTitle}>
                  Mock Interview Performance
                </h2>

                <p
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Your AI interview performance
                  contributes 20% to your overall
                  career readiness score.
                </p>
              </div>
            </div>

            <div style={styles.interviewGrid}>

              <div
                style={styles.interviewMetric}
              >
                <span
                  style={
                    styles.interviewMetricSpan
                  }
                >
                  🧠
                </span>

                <strong
                  style={
                    styles.interviewMetricStrong
                  }
                >
                  {technicalKnowledge}%
                </strong>

                <p
                  style={
                    styles.interviewMetricP
                  }
                >
                  Technical Knowledge
                </p>
              </div>

              <div
                style={styles.interviewMetric}
              >
                <span
                  style={
                    styles.interviewMetricSpan
                  }
                >
                  💬
                </span>

                <strong
                  style={
                    styles.interviewMetricStrong
                  }
                >
                  {communicationScore}%
                </strong>

                <p
                  style={
                    styles.interviewMetricP
                  }
                >
                  Communication
                </p>
              </div>

              <div
                style={styles.interviewMetric}
              >
                <span
                  style={
                    styles.interviewMetricSpan
                  }
                >
                  🧩
                </span>

                <strong
                  style={
                    styles.interviewMetricStrong
                  }
                >
                  {problemSolvingScore}%
                </strong>

                <p
                  style={
                    styles.interviewMetricP
                  }
                >
                  Problem Solving
                </p>
              </div>

              <div
                style={styles.interviewMetric}
              >
                <span
                  style={
                    styles.interviewMetricSpan
                  }
                >
                  🚀
                </span>

                <strong
                  style={
                    styles.interviewMetricStrong
                  }
                >
                  {mockInterviewScore}%
                </strong>

                <p
                  style={
                    styles.interviewMetricP
                  }
                >
                  Interview Score
                </p>
              </div>

            </div>

            {mockReadinessLevel && (
              <div
                style={styles.interviewStatus}
              >
                <strong>
                  AI Interview Readiness:
                </strong>{" "}
                {mockReadinessLevel}
              </div>
            )}

            {mockRecommendations.length > 0 && (
              <div
                style={
                  styles.interviewRecommendations
                }
              >
                <h3>
                  🚀 AI Interview Recommendations
                </h3>

                <ul>
                  {mockRecommendations
                    .slice(0, 5)
                    .map(
                      (
                        recommendation,
                        index
                      ) => (
                        <li key={index}>
                          {recommendation}
                        </li>
                      )
                    )}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                navigate("/mock-interview")
              }
              style={styles.interviewButton}
            >
              🎤 Practice Mock Interview Again →
            </button>
          </div>
        )}

        {/* STRENGTHS */}

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>
              💪
            </div>

            <div>
              <h2 style={styles.sectionTitle}>
                Your Strengths
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Areas where you are performing
                well.
              </p>
            </div>
          </div>

          <div style={styles.strengthList}>
            {strengths.map(
              (strength, index) => (
                <div
                  key={index}
                  style={
                    styles.strengthItem
                  }
                >
                  <span
                    style={
                      styles.checkCircle
                    }
                  >
                    ✓
                  </span>

                  <span>{strength}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* WEAKNESSES */}

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>
              ⚠️
            </div>

            <div>
              <h2 style={styles.sectionTitle}>
                Areas to Improve
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Focus on these areas to become
                more career ready.
              </p>
            </div>
          </div>

          {weaknesses.length > 0 ? (
            <div style={styles.weaknessList}>
              {weaknesses.map(
                (weakness, index) => (
                  <div
                    key={index}
                    style={
                      styles.weaknessItem
                    }
                  >
                    <span
                      style={
                        styles.warningCircle
                      }
                    >
                      !
                    </span>

                    <span>{weakness}</span>
                  </div>
                )
              )}
            </div>
          ) : (
            <div style={styles.noWeakness}>
              🎉 Excellent! No major
              weaknesses identified.
            </div>
          )}
        </div>

        {/* SKILL SUMMARY */}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📚 Skill Development Summary
          </h2>

          <div
            style={
              styles.skillSummaryGrid
            }
          >
            <div style={styles.summaryGreen}>
              <div style={styles.summaryIcon}>
                ✅
              </div>

              <h2>
                {learnedSkills.length}
              </h2>

              <p>Skills You Have</p>
            </div>

            <div style={styles.summaryRed}>
              <div style={styles.summaryIcon}>
                📚
              </div>

              <h2>
                {missingSkills.length}
              </h2>

              <p>Skills to Develop</p>
            </div>

            <div style={styles.summaryBlue}>
              <div style={styles.summaryIcon}>
                💻
              </div>

              <h2>
                {completedProjects.length}
              </h2>

              <p>Projects Completed</p>
            </div>
          </div>
        </div>

        {/* SCORE BREAKDOWN */}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📊 Readiness Score Breakdown
          </h2>

          <p style={styles.sectionSubtitle}>
            Your overall score is calculated
            from five important areas.
          </p>

          <div style={styles.breakdownList}>

            <div style={styles.breakdownItem}>
              <div>
                <strong>
                  📝 Assessment
                </strong>

                <span>
                  25% weight
                </span>
              </div>

              <strong>
                {assessmentPercentage}%
              </strong>
            </div>

            <div style={styles.breakdownItem}>
              <div>
                <strong>
                  🧠 Skills
                </strong>

                <span>
                  25% weight
                </span>
              </div>

              <strong>
                {skillScore}%
              </strong>
            </div>

            <div style={styles.breakdownItem}>
              <div>
                <strong>
                  💻 Projects
                </strong>

                <span>
                  20% weight
                </span>
              </div>

              <strong>
                {projectScore}%
              </strong>
            </div>

            <div style={styles.breakdownItem}>
              <div>
                <strong>
                  🎯 Career Match
                </strong>

                <span>
                  10% weight
                </span>
              </div>

              <strong>
                {careerMatch}%
              </strong>
            </div>

            <div style={styles.breakdownItem}>
              <div>
                <strong>
                  🎤 Mock Interview
                </strong>

                <span>
                  20% weight
                </span>
              </div>

              <strong>
                {mockInterviewCompleted
                  ? `${mockInterviewScore}%`
                  : "Not completed"}
              </strong>
            </div>

          </div>
        </div>

        {/* TIP */}

        <div style={styles.tipBox}>
          <div style={styles.tipIcon}>
            💡
          </div>

          <div>
            <h2 style={styles.tipTitle}>
              How to Improve Your Readiness
            </h2>

            <p style={styles.tipText}>
              Follow your personalized roadmap,
              learn the missing skills, complete
              practical projects and continuously
              practice mock interviews. Your
              readiness score will increase as you
              improve your performance.
            </p>
          </div>
        </div>

        {/* COMPLETED */}

        <div style={styles.completedBox}>
          <div style={styles.completedIcon}>
            🎯
          </div>

          <div>
            <strong>
              Career Readiness Analysis Completed
            </strong>

            <p>
              Your current readiness score is{" "}
              <strong>
                {readinessScore}%
              </strong>
            </p>
          </div>
        </div>

        {/* NEXT */}

        <div style={styles.nextSection}>
          <button
            type="button"
            onClick={() =>
              navigate("/resume")
            }
            style={styles.nextButton}
          >
            📄 Resume Analysis →
          </button>

          <p style={styles.nextText}>
            Continue to the next module and
            analyze your resume.
          </p>
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
    fontFamily:
      "Arial, Helvetica, sans-serif",
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
    fontSize: "48px",
    marginBottom: "10px",
  },

  title: {
    margin: "0 0 10px",
    color: "#1e293b",
    fontSize: "32px",
  },

  subtitle: {
    maxWidth: "800px",
    margin: "0 auto",
    color: "#64748b",
    fontSize: "17px",
    lineHeight: "1.7",
  },

  careerCard: {
    marginTop: "30px",
    padding: "30px",
    background:
      "linear-gradient(135deg, #eff6ff, #eef2ff)",
    borderRadius: "15px",
    border: "2px solid #2563eb",
    textAlign: "center",
    boxShadow:
      "0 5px 18px rgba(37,99,235,0.12)",
  },

  targetIcon: {
    fontSize: "34px",
  },

  smallTitle: {
    margin: "8px 0",
    color: "#475569",
    fontSize: "15px",
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

  readinessCard: {
    marginTop: "30px",
    padding: "40px 30px",
    background:
      "linear-gradient(135deg, #eef2ff, #ecfeff)",
    borderRadius: "18px",
    textAlign: "center",
    border: "2px solid #6366f1",
    boxShadow:
      "0 6px 20px rgba(0,0,0,0.08)",
  },

  readinessIcon: {
    fontSize: "45px",
  },

  readinessSmall: {
    color: "#475569",
    fontSize: "17px",
    marginBottom: "5px",
  },

  mainScore: {
    fontSize: "64px",
    fontWeight: "bold",
    margin: "10px 0",
  },

  scoreExcellent: {
    color: "#16a34a",
  },

  scoreGood: {
    color: "#2563eb",
  },

  scoreAverage: {
    color: "#d97706",
  },

  scoreLow: {
    color: "#dc2626",
  },

  readinessLabel: {
    color: "#1e293b",
    margin: "5px 0 10px",
  },

  readinessDescription: {
    maxWidth: "700px",
    margin: "0 auto",
    color: "#64748b",
    lineHeight: "1.6",
  },

  readinessProgressBackground: {
    maxWidth: "700px",
    height: "18px",
    margin: "25px auto 0",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
  },

  readinessProgressFill: {
    height: "100%",
    background:
      "linear-gradient(90deg, #2563eb, #16a34a)",
    borderRadius: "20px",
    transition:
      "width 0.5s ease",
  },

  progressText: {
    maxWidth: "700px",
    margin: "10px auto 0",
    display: "flex",
    justifyContent:
      "space-between",
    color: "#64748b",
    fontSize: "13px",
  },

  scoreGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },

  scoreCard: {
    background: "#ffffff",
    padding: "25px 20px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
    border:
      "1px solid #e5e7eb",
  },

  scoreIcon: {
    fontSize: "34px",
  },

  cardScore: {
    fontSize: "34px",
    fontWeight: "bold",
    margin: "12px 0",
  },

  cardDescription: {
    color: "#64748b",
    lineHeight: "1.5",
    minHeight: "45px",
  },

  miniProgressBackground: {
    height: "8px",
    width: "100%",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    margin: "15px 0 10px",
  },

  miniProgressFill: {
    height: "100%",
    background:
      "linear-gradient(90deg, #2563eb, #16a34a)",
    borderRadius: "20px",
  },

  section: {
    marginTop: "30px",
    background: "#ffffff",
    padding: "28px",
    borderRadius: "14px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  sectionIcon: {
    fontSize: "32px",
  },

  sectionTitle: {
    margin: "0",
    color: "#1e293b",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    lineHeight: "1.5",
  },

  interviewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginTop: "25px",
  },

  interviewMetric: {
    padding: "20px",
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: "12px",
    textAlign: "center",
  },

  interviewMetricSpan: {
    fontSize: "28px",
  },

  interviewMetricStrong: {
    fontSize: "28px",
    display: "block",
    marginTop: "8px",
  },

  interviewMetricP: {
    color: "#64748b",
    marginBottom: 0,
  },

  interviewStatus: {
    marginTop: "20px",
    padding: "15px",
    background: "#eff6ff",
    border:
      "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: "10px",
    textAlign: "center",
  },

  interviewRecommendations: {
    marginTop: "20px",
    padding: "18px",
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: "10px",
    color: "#334155",
  },

  interviewButton: {
    marginTop: "20px",
    padding: "12px 20px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  strengthList: {
    marginTop: "20px",
    display: "grid",
    gap: "12px",
  },

  strengthItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: "10px",
    fontWeight: "600",
    border:
      "1px solid #bbf7d0",
  },

  checkCircle: {
    width: "25px",
    height: "25px",
    minWidth: "25px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  weaknessList: {
    marginTop: "20px",
    display: "grid",
    gap: "12px",
  },

  weaknessItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    background: "#fff7ed",
    color: "#9a3412",
    borderRadius: "10px",
    fontWeight: "600",
    border:
      "1px solid #fed7aa",
  },

  warningCircle: {
    width: "25px",
    height: "25px",
    minWidth: "25px",
    borderRadius: "50%",
    background: "#f97316",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  noWeakness: {
    marginTop: "20px",
    padding: "15px",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: "10px",
    fontWeight: "bold",
    textAlign: "center",
  },

  skillSummaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "18px",
    marginTop: "20px",
  },

  summaryGreen: {
    padding: "22px",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: "12px",
    textAlign: "center",
    border:
      "1px solid #bbf7d0",
  },

  summaryRed: {
    padding: "22px",
    background: "#fef2f2",
    color: "#991b1b",
    borderRadius: "12px",
    textAlign: "center",
    border:
      "1px solid #fecaca",
  },

  summaryBlue: {
    padding: "22px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "12px",
    textAlign: "center",
    border:
      "1px solid #bfdbfe",
  },

  summaryIcon: {
    fontSize: "30px",
  },

  breakdownList: {
    display: "grid",
    gap: "12px",
    marginTop: "20px",
  },

  breakdownItem: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding: "16px",
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: "10px",
    color: "#1e293b",
  },

  tipBox: {
    marginTop: "30px",
    padding: "25px",
    background: "#fffbeb",
    border:
      "1px solid #fde68a",
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
    padding: "22px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
    border:
      "1px solid #86efac",
  },

  completedIcon: {
    fontSize: "30px",
  },

  nextSection: {
    textAlign: "center",
    marginTop: "35px",
  },

  nextButton: {
    padding: "15px 32px",
    background:
      "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow:
      "0 4px 10px rgba(22,163,74,0.25)",
  },

  nextText: {
    marginTop: "12px",
    color: "#64748b",
    fontSize: "14px",
  },
};

export default Readiness;