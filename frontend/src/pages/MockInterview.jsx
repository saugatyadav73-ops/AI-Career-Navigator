import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeModule, MODULE_KEYS } from "../utils/progress";

const API_URL = "http://localhost:5000";

const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return {};
  }
};

const clampScore = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
};

const calculateAndSaveReadiness = (latestMockInterview) => {
  try {
    const careerRecommendation = getStorageData("careerRecommendation");
    const careerAnalysis = getStorageData("careerAnalysis");
    const skillGap = getStorageData("skillGap");
    const assessment = getStorageData("skillAssessment");
    const projectRecommendations = getStorageData(
      "projectRecommendations"
    );
    const projectsData = getStorageData("projects");

    const projects =
      Object.keys(projectRecommendations).length > 0
        ? projectRecommendations
        : projectsData;

    const report = latestMockInterview?.report || {};

    const career =
      careerRecommendation.career ||
      careerRecommendation.recommendedCareer ||
      careerRecommendation.targetCareer ||
      careerAnalysis.recommendedCareer ||
      careerAnalysis.career ||
      skillGap.career ||
      projects.career ||
      latestMockInterview.career ||
      "Software Developer";

    const careerMatch = clampScore(
      careerRecommendation.matchPercentage ??
        careerRecommendation.careerMatch ??
        careerRecommendation.matchScore ??
        careerAnalysis.matchPercentage ??
        careerAnalysis.careerMatch ??
        skillGap.matchPercentage ??
        projects.matchPercentage ??
        0
    );

    const assessmentScore = Number(
      assessment.score ??
        assessment.correctAnswers ??
        0
    );

    const assessmentTotal = Math.max(
      1,
      Number(
        assessment.total ??
          assessment.totalQuestions ??
          10
      )
    );

    const assessmentPercentage = clampScore(
      (assessmentScore / assessmentTotal) * 100
    );

    const missingSkills = Array.isArray(skillGap.missingSkills)
      ? skillGap.missingSkills
      : Array.isArray(skillGap.skillGaps)
      ? skillGap.skillGaps
      : Array.isArray(skillGap.gaps)
      ? skillGap.gaps
      : [];

    const learnedSkills = Array.isArray(skillGap.learnedSkills)
      ? skillGap.learnedSkills
      : Array.isArray(skillGap.skillsYouHave)
      ? skillGap.skillsYouHave
      : Array.isArray(skillGap.existingSkills)
      ? skillGap.existingSkills
      : [];

    const totalSkills =
      missingSkills.length + learnedSkills.length;

    const skillScore =
      totalSkills > 0
        ? clampScore(
            (learnedSkills.length / totalSkills) * 100
          )
        : 0;

    const completedProjects = Array.isArray(
      projects.completedProjects
    )
      ? projects.completedProjects.length
      : Number(projects.completedProjects || 0);

    const recommendedProjects = Array.isArray(
      projects.recommendedProjects
    )
      ? projects.recommendedProjects.length
      : Array.isArray(projects.projects)
      ? projects.projects.length
      : Number(projects.recommendedProjects || 0);

    let projectScore = clampScore(
      projects.projectPercentage ??
        projects.projectScore ??
        projects.percentage ??
        0
    );

    if (projectScore === 0 && recommendedProjects > 0) {
      projectScore = clampScore(
        (completedProjects / recommendedProjects) * 100
      );
    }

    const mockInterviewScore = clampScore(
      report.overallScore ??
        latestMockInterview.percentage ??
        latestMockInterview.score ??
        latestMockInterview.overallScore ??
        0
    );

    const technicalKnowledge = clampScore(
      report.technicalKnowledge ??
        latestMockInterview.technicalKnowledge ??
        0
    );

    const communicationScore = clampScore(
      report.communication ??
        latestMockInterview.communicationScore ??
        0
    );

    const problemSolvingScore = clampScore(
      report.problemSolving ??
        latestMockInterview.problemSolvingScore ??
        0
    );

    const mockReadinessLevel =
      report.readinessLevel || "Needs Improvement";

    const readinessScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          assessmentPercentage * 0.25 +
            skillScore * 0.25 +
            projectScore * 0.2 +
            careerMatch * 0.1 +
            mockInterviewScore * 0.2
        )
      )
    );

    let readinessLevel = "Needs Improvement";

    if (readinessScore >= 80) {
      readinessLevel = "Job Ready";
    } else if (readinessScore >= 60) {
      readinessLevel = "Almost Ready";
    } else if (readinessScore >= 40) {
      readinessLevel = "Developing";
    }

    const strengths = [];

    if (assessmentPercentage >= 70) {
      strengths.push(
        "Strong performance in skill assessment"
      );
    }

    if (skillScore >= 70) {
      strengths.push("Good overall skill coverage");
    }

    if (projectScore >= 70) {
      strengths.push("Good project preparation");
    }

    if (careerMatch >= 70) {
      strengths.push("Strong career alignment");
    }

    if (mockInterviewScore >= 70) {
      strengths.push("Strong mock interview performance");
    }

    if (Array.isArray(report.strengths)) {
      strengths.push(...report.strengths);
    }

    const uniqueStrengths = [...new Set(strengths)];

    const weaknesses = [];

    if (assessmentPercentage < 50) {
      weaknesses.push(
        "Improve technical assessment performance"
      );
    }

    if (skillScore < 50) {
      weaknesses.push("Develop missing technical skills");
    }

    if (projectScore < 50) {
      weaknesses.push("Complete more practical projects");
    }

    if (careerMatch < 50) {
      weaknesses.push(
        "Improve alignment with target career"
      );
    }

    if (
      latestMockInterview.completed &&
      mockInterviewScore < 50
    ) {
      weaknesses.push(
        "Improve mock interview performance"
      );
    }

    if (Array.isArray(report.weaknesses)) {
      weaknesses.push(...report.weaknesses);
    }

    const uniqueWeaknesses = [...new Set(weaknesses)];

    const readinessResult = {
      career,
      careerMatch,
      readinessScore,
      score: readinessScore,
      percentage: readinessScore,
      readinessLevel,
      assessmentScore,
      assessmentTotal,
      assessmentPercentage,
      skillScore,
      learnedSkills,
      missingSkills,
      projectScore,
      completedProjects,
      recommendedProjects,
      mockInterviewCompleted:
        latestMockInterview.completed === true,
      mockInterviewScore,
      technicalKnowledge,
      communicationScore,
      problemSolvingScore,
      mockReadinessLevel,
      mockStrengths: Array.isArray(report.strengths)
        ? report.strengths
        : [],
      mockWeaknesses: Array.isArray(report.weaknesses)
        ? report.weaknesses
        : [],
      mockRecommendations: Array.isArray(
        report.recommendations
      )
        ? report.recommendations
        : [],
      strengths: uniqueStrengths,
      weaknesses: uniqueWeaknesses,
      weights: {
        assessment: 25,
        skills: 25,
        projects: 20,
        careerMatch: 10,
        mockInterview: 20,
      },
      lastMockInterviewCompletedAt:
        latestMockInterview.completedAt || null,
      updatedAt: new Date().toISOString(),
      source: "mockInterview",
    };

    localStorage.setItem(
      "careerReadiness",
      JSON.stringify(readinessResult)
    );

    localStorage.setItem(
      "readiness",
      JSON.stringify(readinessResult)
    );

    completeModule(MODULE_KEYS.READINESS);

    window.dispatchEvent(
      new Event("mockInterviewUpdated")
    );

    window.dispatchEvent(
      new Event("readinessUpdated")
    );

    console.log(
      "Career readiness updated:",
      readinessResult
    );

    return readinessResult;
  } catch (error) {
    console.error(
      "Readiness calculation error:",
      error
    );

    return null;
  }
};

function getData(key) {
  try {
    const data = localStorage.getItem(key);

    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error(`Error reading ${key}:`, error);

    return {};
  }
}

function normalizeCareer(value) {
  if (!value) {
    return "Software Developer";
  }

  const text = String(value).toLowerCase();

  if (
    text.includes("machine learning") ||
    text.includes("ai engineer") ||
    text.includes("artificial intelligence") ||
    text.includes("ml engineer")
  ) {
    return "AI / ML Engineer";
  }

  if (
    text.includes("data scientist") ||
    text.includes("data science")
  ) {
    return "Data Scientist";
  }

  if (
    text.includes("cyber") ||
    text.includes("security")
  ) {
    return "Cybersecurity Analyst";
  }

  if (
    text.includes("web") ||
    text.includes("frontend") ||
    text.includes("front-end") ||
    text.includes("backend") ||
    text.includes("full stack") ||
    text.includes("full-stack")
  ) {
    return "Web Developer";
  }

  if (
    text.includes("software") ||
    text.includes("developer") ||
    text.includes("programmer")
  ) {
    return "Software Developer";
  }

  return "Software Developer";
}

function MockInterview() {
  const navigate = useNavigate();

  const profile = getData("studentProfile");
  const skillAssessment = getData("skillAssessment");
  const careerRecommendation = getData(
    "careerRecommendation"
  );
  const careerAnalysis = getData("careerAnalysis");
  const skillGap = getData("skillGap");
  const readiness = getData("readiness");
  const resume = getData("resume");
  const jobPreparation = getData("jobPreparation");

  const detectedCareer = useMemo(() => {
    const possibleCareers = [
      careerRecommendation?.career,
      careerRecommendation?.recommendedCareer,
      careerRecommendation?.targetCareer,
      careerAnalysis?.recommendedCareer,
      careerAnalysis?.career,
      careerAnalysis?.targetCareer,
      profile?.targetCareer,
      profile?.career,
      jobPreparation?.career,
      skillGap?.career,
    ];

    for (const value of possibleCareers) {
      if (value) {
        return normalizeCareer(value);
      }
    }

    return "Software Developer";
  }, [
    careerRecommendation,
    careerAnalysis,
    profile,
    jobPreparation,
    skillGap,
  ]);

  const [career, setCareer] = useState(
    detectedCareer
  );

  const [
    interviewType,
    setInterviewType,
  ] = useState("technical");

  const [
    difficulty,
    setDifficulty,
  ] = useState("medium");

  const [
    interviewStarted,
    setInterviewStarted,
  ] = useState(false);

  const [
    loadingQuestion,
    setLoadingQuestion,
  ] = useState(false);

  const [
    evaluating,
    setEvaluating,
  ] = useState(false);

  const [
    generatingReport,
    setGeneratingReport,
  ] = useState(false);

  const [
    question,
    setQuestion,
  ] = useState(null);

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    questionNumber,
    setQuestionNumber,
  ] = useState(1);

  const totalQuestions = 5;

  const [
    evaluations,
    setEvaluations,
  ] = useState([]);

  const [
    lastEvaluation,
    setLastEvaluation,
  ] = useState(null);

  const [
    report,
    setReport,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const careerOptions = [
    "Software Developer",
    "Web Developer",
    "AI / ML Engineer",
    "Data Scientist",
    "Cybersecurity Analyst",
  ];

  useEffect(() => {
    setCareer(detectedCareer);
  }, [detectedCareer]);

  useEffect(() => {
    const savedInterview = getData("mockInterview");

    if (
      savedInterview &&
      savedInterview.completed === true &&
      savedInterview.report
    ) {
      setReport(savedInterview.report);
    }
  }, []);

  async function generateQuestion(
    previousQuestionsOverride = null
  ) {
    setLoadingQuestion(true);
    setError("");
    setLastEvaluation(null);
    setAnswer("");

    try {
      const previousQuestions =
        previousQuestionsOverride ??
        evaluations.map(
          (item) => item.question
        );

      const response = await fetch(
        `${API_URL}/api/mock-interview/question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            career,
            interviewType,
            difficulty,
            previousQuestions,
            skills: skillAssessment,
            readiness,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to generate question."
        );
      }

      if (
        !data.question ||
        !data.question.question
      ) {
        throw new Error(
          "AI returned an invalid interview question."
        );
      }

      setQuestion(data.question);
    } catch (error) {
      console.error(
        "Question generation error:",
        error
      );

      setError(
        error.message ||
          "Unable to generate interview question."
      );
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function startInterview() {
    setInterviewStarted(true);
    setEvaluations([]);
    setReport(null);
    setLastEvaluation(null);
    setQuestion(null);
    setAnswer("");
    setError("");
    setQuestionNumber(1);

    await generateQuestion([]);
  }

  async function evaluateAnswer() {
    if (!answer.trim()) {
      setError(
        "Please write your answer before submitting."
      );

      return;
    }

    if (!question?.question) {
      setError(
        "Interview question is not available."
      );

      return;
    }

    setEvaluating(true);
    setError("");

    try {
      const currentAnswer = answer.trim();

      const response = await fetch(
        `${API_URL}/api/mock-interview/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            career,
            interviewType,
            difficulty,
            question: question.question,
            answer: currentAnswer,
            expectedPoints:
              question.expectedPoints || [],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to evaluate answer."
        );
      }

      if (!data.evaluation) {
        throw new Error(
          "AI returned an invalid evaluation."
        );
      }

      const evaluation = data.evaluation;

      const newEvaluation = {
        questionNumber,
        question: question.question,
        topic: question.topic || "",
        answer: currentAnswer,
        ...evaluation,
      };

      const updatedEvaluations = [
        ...evaluations,
        newEvaluation,
      ];

      setEvaluations(updatedEvaluations);
      setLastEvaluation(evaluation);

      if (
        updatedEvaluations.length >=
        totalQuestions
      ) {
        await generateFinalReport(
          updatedEvaluations
        );

        return;
      }

      const nextQuestionNumber =
        questionNumber + 1;

      setQuestionNumber(
        nextQuestionNumber
      );

      await generateQuestion(
        updatedEvaluations.map(
          (item) => item.question
        )
      );
    } catch (error) {
      console.error(
        "Answer evaluation error:",
        error
      );

      setError(
        error.message ||
          "Unable to evaluate answer."
      );
    } finally {
      setEvaluating(false);
    }
  }

  async function generateFinalReport(
    finalEvaluations
  ) {
    setGeneratingReport(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/mock-interview/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            career,
            interviewType,
            difficulty,
            evaluations: finalEvaluations,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to generate final report."
        );
      }

      if (!data.report) {
        throw new Error(
          "AI returned an invalid final report."
        );
      }

      const finalReport = data.report;

      setReport(finalReport);

      const overallScore = Number(
        finalReport.overallScore ?? 0
      );

      const completedAt =
        new Date().toISOString();

      const savedInterview = {
        career,
        interviewType,
        difficulty,
        score: overallScore,
        percentage: overallScore,
        totalQuestions:
          finalEvaluations.length,
        answeredQuestions:
          finalEvaluations.length,
        evaluations: finalEvaluations,
        report: finalReport,
        completed: true,
        completedAt,
      };

      localStorage.setItem(
        "mockInterview",
        JSON.stringify(savedInterview)
      );

      calculateAndSaveReadiness(
        savedInterview
      );

      window.dispatchEvent(
        new Event("mockInterviewUpdated")
      );

      window.dispatchEvent(
        new Event("readinessUpdated")
      );

      console.log(
        "Mock Interview completed successfully."
      );

      console.log(
        "Latest Mock Interview:",
        savedInterview
      );
    } catch (error) {
      console.error(
        "Final report error:",
        error
      );

      setError(
        error.message ||
          "Unable to generate final report."
      );
    } finally {
      setGeneratingReport(false);
    }
  }

  function retakeInterview() {
    localStorage.removeItem("mockInterview");

    setInterviewStarted(true);
    setQuestion(null);
    setAnswer("");
    setEvaluations([]);
    setLastEvaluation(null);
    setReport(null);
    setError("");
    setQuestionNumber(1);

    generateQuestion([]);
  }

  if (
    interviewStarted &&
    loadingQuestion &&
    !question
  ) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner}>
              🤖
            </div>

            <h2>
              AI Interviewer is preparing
              your question...
            </h2>

            <p>
              Career:{" "}
              <strong>{career}</strong>
            </p>

            <p>
              Type:{" "}
              <strong>
                {interviewType}
              </strong>
            </p>

            <p>
              Difficulty:{" "}
              <strong>
                {difficulty}
              </strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (report) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                🎤 AI Mock Interview Report
              </h1>

              <p style={styles.subtitle}>
                Your interview was evaluated
                by AI.
              </p>
            </div>

            <div style={styles.careerBadge}>
              {career}
            </div>
          </div>

          <div style={styles.scoreCard}>
            <div>
              <p style={styles.scoreLabel}>
                Overall Score
              </p>

              <div style={styles.bigScore}>
                {Number(
                  report.overallScore || 0
                )}
                %
              </div>

              <p>
                {report.readinessLevel ||
                  "Developing"}
              </p>
            </div>
          </div>

          <div style={styles.grid}>
            <ScoreCard
              title="Technical Knowledge"
              value={
                report.technicalKnowledge
              }
            />

            <ScoreCard
              title="Communication"
              value={
                report.communication
              }
            />

            <ScoreCard
              title="Problem Solving"
              value={
                report.problemSolving
              }
            />
          </div>

          <div style={styles.card}>
            <h2>💪 Strengths</h2>

            {Array.isArray(
              report.strengths
            ) &&
            report.strengths.length > 0 ? (
              <ul>
                {report.strengths.map(
                  (item, index) => (
                    <li
                      key={index}
                      style={
                        styles.listItem
                      }
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                No strengths available.
              </p>
            )}
          </div>

          <div style={styles.card}>
            <h2>
              📚 Areas to Improve
            </h2>

            {Array.isArray(
              report.weaknesses
            ) &&
            report.weaknesses.length > 0 ? (
              <ul>
                {report.weaknesses.map(
                  (item, index) => (
                    <li
                      key={index}
                      style={
                        styles.listItem
                      }
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                No major weaknesses
                identified.
              </p>
            )}
          </div>

          <div style={styles.card}>
            <h2>
              🚀 Recommendations
            </h2>

            {Array.isArray(
              report.recommendations
            ) &&
            report.recommendations.length >
              0 ? (
              <ul>
                {report.recommendations.map(
                  (item, index) => (
                    <li
                      key={index}
                      style={
                        styles.listItem
                      }
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                Continue practicing
                interview questions.
              </p>
            )}
          </div>

          <div style={styles.feedbackCard}>
            <h2>
              🤖 AI Final Feedback
            </h2>

            <p>
              {report.finalFeedback ||
                "Keep practicing and improving your technical and communication skills."}
            </p>
          </div>

          <div style={styles.buttonRow}>
            <button
              style={styles.primaryButton}
              onClick={retakeInterview}
            >
              🔄 Retake Interview
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() =>
                navigate("/dashboard")
              }
            >
              🏠 Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (interviewStarted) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                🎤 AI Mock Interview
              </h1>

              <p style={styles.subtitle}>
                Question {questionNumber} of{" "}
                {totalQuestions}
              </p>
            </div>

            <div style={styles.careerBadge}>
              {career}
            </div>
          </div>

          <div style={styles.progressContainer}>
            <div
              style={{
                ...styles.progressBar,
                width: `${
                  (questionNumber /
                    totalQuestions) *
                  100
                }%`,
              }}
            />
          </div>

          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}

          {question && (
            <div style={styles.card}>
              <div style={styles.questionMeta}>
                <span>
                  {interviewType ===
                  "technical"
                    ? "💻 Technical"
                    : "👥 HR"}
                </span>

                <span>
                  {difficulty
                    .charAt(0)
                    .toUpperCase() +
                    difficulty.slice(1)}
                </span>

                {question.topic && (
                  <span>
                    📌 {question.topic}
                  </span>
                )}
              </div>

              <h2 style={styles.questionText}>
                {question.question}
              </h2>

              <textarea
                value={answer}
                onChange={(e) =>
                  setAnswer(e.target.value)
                }
                placeholder="Write your answer here..."
                style={styles.textarea}
                rows={9}
                disabled={
                  evaluating ||
                  generatingReport
                }
              />

              <div style={styles.answerInfo}>
                {answer.trim().length}{" "}
                characters
              </div>

              {lastEvaluation && (
                <div
                  style={
                    styles.evaluationCard
                  }
                >
                  <h3>
                    🤖 AI Evaluation
                  </h3>

                  <div
                    style={
                      styles.evaluationScore
                    }
                  >
                    {lastEvaluation.score ||
                      0}
                    %
                  </div>

                  <p>
                    {lastEvaluation.feedback}
                  </p>

                  {lastEvaluation
                    .strengths?.length >
                    0 && (
                    <div>
                      <strong>
                        Strengths:
                      </strong>

                      <ul>
                        {lastEvaluation.strengths.map(
                          (item, index) => (
                            <li
                              key={index}
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {lastEvaluation
                    .weaknesses?.length >
                    0 && (
                    <div>
                      <strong>
                        Improve:
                      </strong>

                      <ul>
                        {lastEvaluation.weaknesses.map(
                          (item, index) => (
                            <li
                              key={index}
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                style={styles.primaryButton}
                onClick={evaluateAnswer}
                disabled={
                  evaluating ||
                  generatingReport
                }
              >
                {evaluating
                  ? "🤖 AI is evaluating..."
                  : questionNumber >=
                    totalQuestions
                  ? "🏁 Submit & Generate Report"
                  : "➡️ Submit Answer & Next"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              🎤 AI Mock Interview
            </h1>

            <p style={styles.subtitle}>
              Practice with an AI interviewer
              based on your career goal.
            </p>
          </div>

          <div style={styles.careerBadge}>
            {detectedCareer}
          </div>
        </div>

        <div style={styles.card}>
          <h2>
            📊 Your Career Preparation
          </h2>

          <div style={styles.grid}>
            <InfoCard
              title="Career"
              value={detectedCareer}
            />

            <InfoCard
              title="Readiness"
              value={
                readiness?.score !==
                  undefined &&
                readiness?.score !== null
                  ? `${readiness.score}%`
                  : "Available"
              }
            />

            <InfoCard
              title="Resume"
              value={
                resume &&
                Object.keys(resume).length >
                  0
                  ? "Available"
                  : "Not Available"
              }
            />

            <InfoCard
              title="Job Preparation"
              value={
                jobPreparation?.completed
                  ? "Completed"
                  : "Not Completed"
              }
            />
          </div>
        </div>

        <div style={styles.card}>
          <h2>
            ⚙️ Interview Settings
          </h2>

          <label style={styles.label}>
            Career
          </label>

          <select
            value={career}
            onChange={(e) =>
              setCareer(e.target.value)
            }
            style={styles.select}
          >
            {careerOptions.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label style={styles.label}>
            Interview Type
          </label>

          <div style={styles.optionRow}>
            <button
              type="button"
              onClick={() =>
                setInterviewType(
                  "technical"
                )
              }
              style={
                interviewType ===
                "technical"
                  ? styles.selectedOption
                  : styles.optionButton
              }
            >
              💻 Technical
            </button>

            <button
              type="button"
              onClick={() =>
                setInterviewType("hr")
              }
              style={
                interviewType === "hr"
                  ? styles.selectedOption
                  : styles.optionButton
              }
            >
              👥 HR
            </button>
          </div>

          <label style={styles.label}>
            Difficulty
          </label>

          <div style={styles.optionRow}>
            {[
              "easy",
              "medium",
              "hard",
            ].map((level) => (
              <button
                type="button"
                key={level}
                onClick={() =>
                  setDifficulty(level)
                }
                style={
                  difficulty === level
                    ? styles.selectedOption
                    : styles.optionButton
                }
              >
                {level === "easy"
                  ? "🟢 Easy"
                  : level === "medium"
                  ? "🟡 Medium"
                  : "🔴 Hard"}
              </button>
            ))}
          </div>

          <button
            style={styles.primaryButton}
            onClick={startInterview}
            disabled={loadingQuestion}
          >
            🚀 Start AI Interview
          </button>
        </div>

        <div style={styles.infoCard}>
          <h3>
            🤖 How AI Mock Interview Works
          </h3>

          <p>
            1. AI generates a personalized
            interview question.
          </p>

          <p>
            2. You write your answer.
          </p>

          <p>
            3. AI evaluates your answer.
          </p>

          <p>
            4. You receive score and
            feedback.
          </p>

          <p>
            5. After 5 questions, AI creates
            your final interview report.
          </p>
        </div>

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  value,
}) {
  return (
    <div style={styles.smallScoreCard}>
      <p style={styles.scoreLabel}>
        {title}
      </p>

      <div style={styles.mediumScore}>
        {value || 0}%
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
}) {
  return (
    <div style={styles.infoSmallCard}>
      <p style={styles.infoTitle}>
        {title}
      </p>

      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px 20px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
  },

  subtitle: {
    marginTop: "8px",
    color: "#666",
    fontSize: "16px",
  },

  careerBadge: {
    background: "#111827",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "20px",
    fontWeight: "600",
  },

  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "20px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  loadingCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "60px 30px",
    textAlign: "center",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  spinner: {
    fontSize: "50px",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  },

  infoSmallCard: {
    background: "#f8fafc",
    padding: "18px",
    borderRadius: "12px",
  },

  infoTitle: {
    margin: "0 0 8px",
    color: "#6b7280",
    fontSize: "14px",
  },

  label: {
    display: "block",
    marginTop: "20px",
    marginBottom: "8px",
    fontWeight: "600",
  },

  select: {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border:
      "1px solid #d1d5db",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  optionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  optionButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border:
      "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  selectedOption: {
    padding: "12px 18px",
    borderRadius: "10px",
    border:
      "2px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  primaryButton: {
    marginTop: "25px",
    padding: "14px 22px",
    border: "none",
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  secondaryButton: {
    marginTop: "25px",
    padding: "14px 22px",
    border:
      "1px solid #111827",
    borderRadius: "10px",
    background: "#fff",
    color: "#111827",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  questionMeta: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  questionText: {
    fontSize: "22px",
    lineHeight: "1.5",
    marginBottom: "20px",
  },

  textarea: {
    width: "100%",
    padding: "15px",
    borderRadius: "10px",
    border:
      "1px solid #d1d5db",
    resize: "vertical",
    fontSize: "16px",
    lineHeight: "1.5",
    boxSizing: "border-box",
    outline: "none",
  },

  answerInfo: {
    textAlign: "right",
    marginTop: "5px",
    color: "#6b7280",
    fontSize: "13px",
  },

  progressContainer: {
    height: "8px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "20px",
  },

  progressBar: {
    height: "100%",
    background: "#111827",
    borderRadius: "10px",
    transition:
      "width 0.3s ease",
  },

  evaluationCard: {
    marginTop: "20px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px",
    border:
      "1px solid #e5e7eb",
  },

  evaluationScore: {
    fontSize: "32px",
    fontWeight: "700",
    margin: "10px 0",
  },

  scoreCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "35px",
    marginBottom: "20px",
    textAlign: "center",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  scoreLabel: {
    color: "#6b7280",
    margin: "0 0 8px",
  },

  bigScore: {
    fontSize: "64px",
    fontWeight: "800",
    margin: "10px 0",
  },

  smallScoreCard: {
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.06)",
  },

  mediumScore: {
    fontSize: "32px",
    fontWeight: "700",
  },

  feedbackCard: {
    background: "#111827",
    color: "#fff",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "20px",
    lineHeight: "1.7",
  },

  infoCard: {
    background: "#eef2ff",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "20px",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  listItem: {
    marginBottom: "8px",
    lineHeight: "1.5",
  },

  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
};

export default MockInterview;