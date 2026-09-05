import React, { useEffect, useState } from "react";

import {
  MODULE_KEYS,
} from "../utils/progress";

import ModuleCompleteButton from "../components/ModuleCompleteButton";

const questions = [
  {
    question:
      "Which language is commonly used for AI and Machine Learning?",
    options: ["HTML", "Python", "CSS", "XML"],
    answer: "Python",
  },

  {
    question:
      "Which data structure follows FIFO?",
    options: [
      "Stack",
      "Queue",
      "Tree",
      "Graph",
    ],
    answer: "Queue",
  },

  {
    question:
      "Which language is used for web page structure?",
    options: [
      "HTML",
      "Python",
      "Java",
      "C",
    ],
    answer: "HTML",
  },

  {
    question:
      "Which keyword is used to create a class in Java?",
    options: [
      "function",
      "class",
      "define",
      "new",
    ],
    answer: "class",
  },

  {
    question:
      "Which data structure follows LIFO?",
    options: [
      "Queue",
      "Stack",
      "Array",
      "Graph",
    ],
    answer: "Stack",
  },

  {
    question:
      "What does CPU stand for?",
    options: [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Program Utility",
      "Control Processing Unit",
    ],
    answer: "Central Processing Unit",
  },

  {
    question:
      "Which one is an operating system?",
    options: [
      "Windows",
      "Python",
      "HTML",
      "Java",
    ],
    answer: "Windows",
  },

  {
    question:
      "Which symbol is used for a single-line comment in Java?",
    options: [
      "//",
      "/*",
      "#",
      "<!--",
    ],
    answer: "//",
  },

  {
    question:
      "Which technology is used to style web pages?",
    options: [
      "HTML",
      "CSS",
      "Python",
      "SQL",
    ],
    answer: "CSS",
  },

  {
    question:
      "What does SQL stand for?",
    options: [
      "Structured Query Language",
      "Simple Question Language",
      "System Query Logic",
      "Sequential Query Language",
    ],
    answer: "Structured Query Language",
  },
];

function SkillAssessment() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  // ------------------------------------
  // Load Previous Assessment
  // ------------------------------------

  useEffect(() => {
    const savedAssessment =
      localStorage.getItem("skillAssessment");

    if (savedAssessment) {
      try {
        const data =
          JSON.parse(savedAssessment);

        setAnswers(data.answers || {});
        setScore(Number(data.score || 0));

        if (data.submitted) {
          setSubmitted(true);
        }
      } catch (error) {
        console.error(
          "Error loading assessment:",
          error
        );
      }
    }
  }, []);

  // ------------------------------------
  // Handle Answer
  // ------------------------------------

  const handleAnswer = (
    questionIndex,
    answer
  ) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionIndex]: answer,
    }));

    setError("");
  };

  // ------------------------------------
  // Submit Assessment
  // ------------------------------------

  const handleSubmit = () => {
    const unansweredQuestions =
      questions.filter(
        (_, index) =>
          !answers[index]
      );

    if (unansweredQuestions.length > 0) {
      setError(
        `Please answer all ${questions.length} questions before submitting.`
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    let finalScore = 0;

    questions.forEach(
      (question, index) => {
        if (
          answers[index] ===
          question.answer
        ) {
          finalScore++;
        }
      }
    );

    setScore(finalScore);
    setSubmitted(true);

    // Save assessment result
    localStorage.setItem(
      "skillAssessment",
      JSON.stringify({
        score: finalScore,
        total: questions.length,
        answers: answers,
        submitted: true,
      })
    );
  };

  // ------------------------------------
  // Restart Assessment
  // ------------------------------------

  const handleRestart = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setError("");

    localStorage.removeItem(
      "skillAssessment"
    );
  };

  // ------------------------------------
  // Skill Level
  // ------------------------------------

  const getSkillLevel = () => {
    const percentage =
      (score / questions.length) * 100;

    if (percentage >= 80) {
      return "Advanced";
    }

    if (percentage >= 50) {
      return "Intermediate";
    }

    return "Beginner";
  };

  const percentage = Math.round(
    (score / questions.length) * 100
  );

  // ------------------------------------
  // Styles
  // ------------------------------------

  const styles = {
    container: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "Arial, sans-serif",
    },

    title: {
      textAlign: "center",
      color: "#1e293b",
      marginBottom: "10px",
    },

    subtitle: {
      textAlign: "center",
      color: "#64748b",
      marginBottom: "30px",
      fontSize: "17px",
    },

    questionBox: {
      background: "#ffffff",
      padding: "25px",
      marginBottom: "20px",
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      boxShadow:
        "0 4px 12px rgba(0,0,0,0.05)",
    },

    option: {
      display: "block",
      padding: "12px",
      marginTop: "8px",
      cursor: "pointer",
      borderRadius: "8px",
    },

    submitButton: {
      display: "block",
      margin: "30px auto",
      padding: "14px 35px",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
    },

    result: {
      marginTop: "30px",
      padding: "30px",
      background: "#ffffff",
      borderRadius: "15px",
      boxShadow:
        "0 4px 15px rgba(0,0,0,0.07)",
    },

    score: {
      fontSize: "50px",
      fontWeight: "bold",
      textAlign: "center",
      margin: "20px",
      color: "#2563eb",
    },

    correctAnswer: {
      background: "#dcfce7",
      padding: "18px",
      marginTop: "15px",
      borderRadius: "8px",
      border:
        "1px solid #86efac",
    },

    wrongAnswer: {
      background: "#fee2e2",
      padding: "18px",
      marginTop: "15px",
      borderRadius: "8px",
      border:
        "1px solid #fca5a5",
    },
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>
        🧠 Skill Assessment
      </h1>

      <p style={styles.subtitle}>
        Test your programming and
        technical knowledge
      </p>

      {/* Error */}

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* QUESTIONS */}

      {!submitted && (
        <>
          {questions.map(
            (question, index) => (
              <div
                key={index}
                style={styles.questionBox}
              >
                <h3>
                  {index + 1}.{" "}
                  {question.question}
                </h3>

                {question.options.map(
                  (option) => (
                    <label
                      key={option}
                      style={
                        styles.option
                      }
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={
                          answers[index] ===
                          option
                        }
                        onChange={() =>
                          handleAnswer(
                            index,
                            option
                          )
                        }
                      />{" "}
                      {option}
                    </label>
                  )
                )}
              </div>
            )
          )}

          <button
            type="button"
            onClick={handleSubmit}
            style={
              styles.submitButton
            }
          >
            Submit Assessment
          </button>
        </>
      )}

      {/* RESULT */}

      {submitted && (
        <div style={styles.result}>

          <h2
            style={{
              textAlign: "center",
            }}
          >
            🎉 Assessment Result
          </h2>

          <div style={styles.score}>
            {score} / {questions.length}
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "20px",
            }}
          >
            Score: <strong>{percentage}%</strong>
          </p>

          <h2
            style={{
              textAlign: "center",
              marginTop: "15px",
            }}
          >
            Skill Level:{" "}
            <span style={{ color: "#2563eb" }}>
              {getSkillLevel()}
            </span>
          </h2>

          <hr
            style={{
              margin: "30px 0",
            }}
          />

          <h2>
            📝 Answer Review
          </h2>

          {questions.map(
            (question, index) => {
              const userAnswer =
                answers[index];

              const isCorrect =
                userAnswer ===
                question.answer;

              return (
                <div
                  key={index}
                  style={
                    isCorrect
                      ? styles.correctAnswer
                      : styles.wrongAnswer
                  }
                >
                  <h3>
                    {index + 1}.{" "}
                    {question.question}
                  </h3>

                  <p>
                    <strong>
                      Your Answer:
                    </strong>{" "}
                    {userAnswer ||
                      "Not answered"}
                  </p>

                  <p>
                    <strong>
                      Correct Answer:
                    </strong>{" "}
                    {question.answer}
                  </p>

                  <strong>
                    {isCorrect
                      ? "✅ Correct"
                      : "❌ Wrong"}
                  </strong>
                </div>
              );
            }
          )}

          {/* Buttons */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginTop: "30px",
            }}
          >
            {/* Retake Assessment */}

            <button
              type="button"
              onClick={handleRestart}
              style={{
                padding: "13px 25px",
                background: "#64748b",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🔄 Retake Assessment
            </button>

            {/* Career Recommendation */}

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/careers";
              }}
              style={{
                padding: "13px 25px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🎯 View Career Recommendation →
            </button>

            {/* Complete Assessment & Continue */}

            <ModuleCompleteButton
              moduleKey={
                MODULE_KEYS.ASSESSMENT
              }
              nextPath="/interests"
            >
              Complete Assessment & Continue
            </ModuleCompleteButton>

          </div>

        </div>
      )}
    </div>
  );
}

export default SkillAssessment;