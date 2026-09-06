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
  removeStudentData,
  saveStudentData,
} from "../utils/studentStorage";

function Interests() {
  const navigate = useNavigate();

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const API_URL =
    `${API_BASE_URL}/api/interest-questions`;

  // =====================================================
  // STATES
  // =====================================================

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] =
    useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  // =====================================================
  // LOAD QUESTIONS + CURRENT STUDENT DATA
  // =====================================================

  useEffect(() => {
    const savedAssessment = getStudentData(
      "interestAssessment",
      null
    );

    if (savedAssessment) {
      setAnswers(savedAssessment.answers || {});
      setCompleted(
        savedAssessment.completed === true
      );
    }

    loadQuestions();
  }, []);

  // =====================================================
  // LOAD QUESTIONS
  // =====================================================

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "Fetching Interest Questions from:",
        API_URL
      );

      const response = await fetch(API_URL);

      console.log(
        "Interest API Status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Interest API Data:",
        data
      );

      if (
        data.success !== true ||
        !Array.isArray(data.questions) ||
        data.questions.length === 0
      ) {
        throw new Error(
          "Invalid question data received."
        );
      }

      setQuestions(data.questions);
    } catch (err) {
      console.error(
        "Interest API Error:",
        err
      );

      setError(
        "Questions load हुन सकेन। Backend server check गर्नुहोस्।"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SELECT ANSWER
  // =====================================================

  const handleAnswer = (optionIndex) => {
    const question =
      questions[currentQuestion];

    if (!question) return;

    setAnswers((previous) => ({
      ...previous,
      [question.id]: optionIndex,
    }));
  };

  // =====================================================
  // NEXT QUESTION
  // =====================================================

  const handleNext = () => {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) => previous + 1
      );
    } else {
      finishAssessment();
    }
  };

  // =====================================================
  // PREVIOUS QUESTION
  // =====================================================

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        (previous) => previous - 1
      );
    }
  };

  // =====================================================
  // FINISH ASSESSMENT
  // =====================================================

  const finishAssessment = () => {
    const answeredCount =
      Object.keys(answers).length;

    if (
      answeredCount !==
      questions.length
    ) {
      alert(
        "Please answer all questions before submitting."
      );

      return;
    }

    const assessmentResult = {
      answers,
      totalQuestions:
        questions.length,
      answeredQuestions:
        answeredCount,
      completed: true,
      completedAt:
        new Date().toISOString(),
    };

    // Save only for current student
    saveStudentData(
      "interestAssessment",
      assessmentResult
    );

    // Mark module completed
    try {
      if (
        MODULE_KEYS &&
        MODULE_KEYS.INTEREST
      ) {
        completeModule(
          MODULE_KEYS.INTEREST
        );
      }
    } catch (err) {
      console.log(
        "Progress update skipped:",
        err
      );
    }

    setCompleted(true);
  };

  // =====================================================
  // GO TO CAREER PAGE
  // =====================================================

  const goToCareer = () => {
    navigate("/careers");
  };

  // =====================================================
  // RESET
  // =====================================================

  const restartAssessment = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setCompleted(false);

    // Remove only current student's data
    removeStudentData(
      "interestAssessment"
    );
  };

  // =====================================================
  // PROGRESS
  // =====================================================

  const progress = useMemo(() => {
    if (questions.length === 0) {
      return 0;
    }

    return Math.round(
      (Object.keys(answers).length /
        questions.length) *
        100
    );
  }, [answers, questions]);

  // =====================================================
  // CURRENT QUESTION
  // =====================================================

  const question =
    questions[currentQuestion];

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.loader}>
            ⏳
          </div>

          <h2 style={styles.title}>
            Loading Interest Assessment
          </h2>

          <p style={styles.subtitle}>
            Please wait while we prepare
            your questions...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR SCREEN
  // =====================================================

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>
            ⚠️
          </div>

          <h2 style={styles.title}>
            Unable to Load Questions
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>

          <div style={styles.endpointBox}>
            <strong>
              Backend API:
            </strong>

            <br />

            {API_URL}
          </div>

          <button
            onClick={loadQuestions}
            style={styles.primaryButton}
          >
            🔄 Try Again
          </button>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            style={
              styles.secondaryButton
            }
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // COMPLETED SCREEN
  // =====================================================

  if (completed) {
    return (
      <div style={styles.page}>
        <div style={styles.resultCard}>
          <div style={styles.successIcon}>
            🎉
          </div>

          <h1 style={styles.resultTitle}>
            Interest Assessment Completed!
          </h1>

          <p style={styles.resultText}>
            Great job! Your interests have
            been successfully saved.
          </p>

          <div style={styles.scoreBox}>
            <div style={styles.scoreNumber}>
              {questions.length}/
              {questions.length}
            </div>

            <div style={styles.scoreLabel}>
              Questions Answered
            </div>
          </div>

          <div style={styles.infoBox}>
            Your interest assessment will
            be used to personalize your
            career recommendations.
          </div>

          <div style={styles.buttonRow}>
            <button
              onClick={restartAssessment}
              style={
                styles.secondaryButton
              }
            >
              🔄 Retake Assessment
            </button>

            <button
              onClick={goToCareer}
              style={styles.primaryButton}
            >
              Continue to Career →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NO QUESTION
  // =====================================================

  if (!question) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>
            No Questions Available
          </h2>

          <button
            onClick={loadQuestions}
            style={styles.primaryButton}
          >
            🔄 Reload Questions
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN ASSESSMENT UI
  // =====================================================

  const selectedAnswer =
    answers[question.id];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <div style={styles.badge}>
              🧠 INTEREST ASSESSMENT
            </div>

            <h1 style={styles.heading}>
              Discover Your Career Interests
            </h1>

            <p style={styles.description}>
              Answer these questions honestly
              to help us understand which
              technology career matches your
              interests.
            </p>
          </div>

          <div
            style={styles.questionCounter}
          >
            <strong>
              {currentQuestion + 1}
            </strong>

            <span>
              {" "}
              / {questions.length}
            </span>
          </div>
        </div>

        {/* PROGRESS */}

        <div
          style={styles.progressContainer}
        >
          <div style={styles.progressInfo}>
            <span>
              Assessment Progress
            </span>

            <strong>
              {progress}%
            </strong>
          </div>

          <div
            style={
              styles.progressBackground
            }
          >
            <div
              style={{
                ...styles.progressBar,
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* QUESTION CARD */}

        <div style={styles.questionCard}>
          <div
            style={styles.questionNumber}
          >
            Question{" "}
            {currentQuestion + 1}
          </div>

          <h2 style={styles.question}>
            {question.question}
          </h2>

          <p style={styles.instruction}>
            Select the option that best
            describes you.
          </p>

          {/* OPTIONS */}

          <div style={styles.options}>
            {question.options.map(
              (option, index) => {
                const isSelected =
                  selectedAnswer === index;

                return (
                  <button
                    key={index}
                    onClick={() =>
                      handleAnswer(
                        index
                      )
                    }
                    style={{
                      ...styles.option,
                      ...(isSelected
                        ? styles.selectedOption
                        : {}),
                    }}
                  >
                    <div
                      style={{
                        ...styles.optionCircle,
                        ...(isSelected
                          ? styles.selectedCircle
                          : {}),
                      }}
                    >
                      {String.fromCharCode(
                        65 + index
                      )}
                    </div>

                    <span
                      style={{
                        ...styles.optionText,
                        ...(isSelected
                          ? styles.selectedOptionText
                          : {}),
                      }}
                    >
                      {option}
                    </span>

                    {isSelected && (
                      <span
                        style={
                          styles.check
                        }
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          {/* NAVIGATION */}

          <div style={styles.navigation}>
            <button
              onClick={handlePrevious}
              disabled={
                currentQuestion === 0
              }
              style={{
                ...styles.previousButton,
                ...(currentQuestion ===
                0
                  ? styles.disabledButton
                  : {}),
              }}
            >
              ← Previous
            </button>

            <button
              onClick={handleNext}
              disabled={
                selectedAnswer ===
                undefined
              }
              style={{
                ...styles.nextButton,
                ...(selectedAnswer ===
                undefined
                  ? styles.disabledButton
                  : {}),
              }}
            >
              {currentQuestion ===
              questions.length - 1
                ? "Finish Assessment ✓"
                : "Next Question →"}
            </button>
          </div>
        </div>

        {/* FOOTER INFO */}

        <div style={styles.footerInfo}>
          <span>🔒</span>

          <span>
            Your answers are stored locally
            and used only for career
            recommendations.
          </span>
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
      "linear-gradient(135deg, #f5f7ff 0%, #eef2ff 100%)",
    padding: "40px 20px",
    boxSizing: "border-box",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  card: {
    maxWidth: "600px",
    margin: "100px auto",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "45px",
    textAlign: "center",
    boxShadow:
      "0 15px 45px rgba(0, 0, 0, 0.10)",
  },

  resultCard: {
    maxWidth: "700px",
    margin: "80px auto",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "50px",
    textAlign: "center",
    boxShadow:
      "0 15px 50px rgba(0, 0, 0, 0.12)",
  },

  loader: {
    fontSize: "55px",
    marginBottom: "20px",
  },

  errorIcon: {
    fontSize: "55px",
    marginBottom: "20px",
  },

  successIcon: {
    fontSize: "70px",
    marginBottom: "20px",
  },

  badge: {
    display: "inline-block",
    background: "#e0e7ff",
    color: "#4338ca",
    padding: "8px 15px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    marginBottom: "15px",
  },

  heading: {
    margin: "0 0 12px",
    color: "#111827",
    fontSize: "36px",
    lineHeight: "1.2",
  },

  title: {
    color: "#111827",
    marginBottom: "12px",
  },

  resultTitle: {
    color: "#111827",
    fontSize: "32px",
    marginBottom: "15px",
  },

  description: {
    color: "#6b7280",
    fontSize: "16px",
    lineHeight: "1.6",
    maxWidth: "700px",
    margin: "0",
  },

  subtitle: {
    color: "#6b7280",
    lineHeight: "1.6",
  },

  resultText: {
    color: "#6b7280",
    fontSize: "17px",
    lineHeight: "1.6",
  },

  errorText: {
    color: "#dc2626",
    marginBottom: "20px",
  },

  endpointBox: {
    background: "#f3f4f6",
    padding: "15px",
    borderRadius: "10px",
    fontSize: "13px",
    color: "#4b5563",
    wordBreak: "break-all",
    marginBottom: "25px",
  },

  questionCounter: {
    background: "#ffffff",
    borderRadius: "15px",
    padding: "15px 22px",
    boxShadow:
      "0 8px 25px rgba(0, 0, 0, 0.08)",
    color: "#4338ca",
    fontSize: "18px",
    whiteSpace: "nowrap",
  },

  progressContainer: {
    marginTop: "30px",
    marginBottom: "25px",
  },

  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "9px",
    color: "#4b5563",
    fontSize: "14px",
  },

  progressBackground: {
    height: "9px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background:
      "linear-gradient(90deg, #4f46e5, #7c3aed)",
    borderRadius: "10px",
    transition:
      "width 0.3s ease",
  },

  questionCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "40px",
    boxShadow:
      "0 15px 45px rgba(0, 0, 0, 0.09)",
  },

  questionNumber: {
    color: "#6366f1",
    fontWeight: "700",
    fontSize: "14px",
    marginBottom: "12px",
  },

  question: {
    color: "#111827",
    fontSize: "26px",
    lineHeight: "1.4",
    margin: "0 0 10px",
  },

  instruction: {
    color: "#6b7280",
    marginBottom: "28px",
  },

  options: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  option: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    padding: "18px",
    borderRadius: "14px",
    border: "2px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    transition:
      "all 0.2s ease",
    fontSize: "16px",
  },

  selectedOption: {
    border:
      "2px solid #4f46e5",
    background: "#eef2ff",
  },

  optionCircle: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "50%",
    background: "#f3f4f6",
    color: "#4b5563",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    marginRight: "15px",
  },

  selectedCircle: {
    background: "#4f46e5",
    color: "#ffffff",
  },

  optionText: {
    color: "#374151",
    flex: 1,
    lineHeight: "1.5",
  },

  selectedOptionText: {
    color: "#3730a3",
    fontWeight: "600",
  },

  check: {
    color: "#4f46e5",
    fontSize: "22px",
    fontWeight: "bold",
  },

  navigation: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    marginTop: "35px",
  },

  previousButton: {
    padding: "13px 22px",
    borderRadius: "10px",
    border:
      "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "600",
  },

  nextButton: {
    padding: "13px 25px",
    borderRadius: "10px",
    border: "none",
    background:
      "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  primaryButton: {
    padding: "13px 24px",
    borderRadius: "10px",
    border: "none",
    background:
      "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
    margin: "6px",
  },

  secondaryButton: {
    padding: "13px 24px",
    borderRadius: "10px",
    border:
      "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "600",
    margin: "6px",
  },

  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  scoreBox: {
    margin: "30px auto",
    padding: "25px",
    background: "#eef2ff",
    borderRadius: "18px",
    maxWidth: "250px",
  },

  scoreNumber: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#4338ca",
  },

  scoreLabel: {
    color: "#6b7280",
    marginTop: "5px",
  },

  infoBox: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "18px",
    color: "#4b5563",
    lineHeight: "1.6",
    marginBottom: "25px",
  },

  buttonRow: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "5px",
  },

  footerInfo: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "20px",
    color: "#6b7280",
    fontSize: "13px",
    textAlign: "center",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },
};

export default Interests;