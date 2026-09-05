import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  completeModule,
  MODULE_KEYS,
} from "../utils/progress";

function Resume() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // =====================================================
  // REFRESH WHEN OTHER MODULES UPDATE
  // =====================================================

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refreshPage = () => {
      setRefreshKey((prev) => prev + 1);
    };

    const events = [
      "careerUpdated",
      "skillGapUpdated",
      "readinessUpdated",
      "mockInterviewUpdated",
      "resumeUpdated",
      "careerProgressUpdated",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, refreshPage);
    });

    window.addEventListener("storage", refreshPage);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          refreshPage
        );
      });

      window.removeEventListener("storage", refreshPage);
    };
  }, []);

  void refreshKey;

  // =====================================================
  // HELPERS
  // =====================================================

  const getStorageData = (key) => {
    try {
      const data = localStorage.getItem(key);

      if (!data) {
        return {};
      }

      const parsed = JSON.parse(data);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed;
      }

      return {};
    } catch (error) {
      console.error(
        `Error reading ${key}:`,
        error
      );

      return {};
    }
  };

  const toNumber = (value, fallback = 0) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  };

  const clampScore = (value) => {
    return Math.min(
      100,
      Math.max(0, toNumber(value))
    );
  };

  const getFirstValue = (...values) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return "";
  };

  const formatItem = (item) => {
    if (typeof item === "string") {
      return item;
    }

    if (item?.name) {
      return item.name;
    }

    if (item?.skill) {
      return item.skill;
    }

    if (item?.title) {
      return item.title;
    }

    try {
      return JSON.stringify(item);
    } catch {
      return String(item);
    }
  };

  // =====================================================
  // LOAD PROJECT DATA
  // =====================================================

  const profile = useMemo(
    () => getStorageData("studentProfile"),
    [refreshKey]
  );

  const skillAssessment = useMemo(
    () => getStorageData("skillAssessment"),
    [refreshKey]
  );

  const interestAssessment = useMemo(
    () => getStorageData("interestAssessment"),
    [refreshKey]
  );

  const careerRecommendation = useMemo(
    () => getStorageData("careerRecommendation"),
    [refreshKey]
  );

  const careerAnalysis = useMemo(
    () => getStorageData("careerAnalysis"),
    [refreshKey]
  );

  const skillGap = useMemo(
    () => getStorageData("skillGap"),
    [refreshKey]
  );

  const careerReadiness = useMemo(
    () => getStorageData("careerReadiness"),
    [refreshKey]
  );

  const readiness = useMemo(
    () => getStorageData("readiness"),
    [refreshKey]
  );

  const mockInterview = useMemo(
    () => getStorageData("mockInterview"),
    [refreshKey]
  );

  // =====================================================
  // TARGET CAREER
  // =====================================================

  const targetCareer = useMemo(() => {
    const career = getFirstValue(
      careerRecommendation?.career,
      careerRecommendation?.recommendedCareer,
      careerRecommendation?.targetCareer,

      careerReadiness?.career,
      careerReadiness?.targetCareer,

      readiness?.career,
      readiness?.targetCareer,

      careerAnalysis?.career,
      careerAnalysis?.recommendedCareer,
      careerAnalysis?.recommendedCareerName,
      careerAnalysis?.targetCareer
    );

    return typeof career === "string"
      ? career
      : "";
  }, [
    careerRecommendation,
    careerReadiness,
    readiness,
    careerAnalysis,
  ]);

  // =====================================================
  // CAREER MATCH
  // =====================================================

  const targetCareerMatch = useMemo(() => {
    const value = getFirstValue(
      careerRecommendation?.matchPercentage,
      careerRecommendation?.careerMatch,
      careerRecommendation?.match,

      careerAnalysis?.matchPercentage,
      careerAnalysis?.careerMatch,
      careerAnalysis?.match,

      careerReadiness?.careerMatch,
      careerReadiness?.matchPercentage,

      readiness?.careerMatch,
      readiness?.matchPercentage
    );

    return clampScore(value);
  }, [
    careerRecommendation,
    careerAnalysis,
    careerReadiness,
    readiness,
  ]);

  // =====================================================
  // CAREER READINESS
  // =====================================================

  const readinessScore = useMemo(() => {
    const value = getFirstValue(
      careerReadiness?.score,
      careerReadiness?.readinessScore,
      careerReadiness?.percentage,
      careerReadiness?.readinessPercentage,

      readiness?.score,
      readiness?.readinessScore,
      readiness?.percentage,
      readiness?.readinessPercentage
    );

    return clampScore(value);
  }, [
    careerReadiness,
    readiness,
  ]);

  // =====================================================
  // MOCK INTERVIEW
  // =====================================================

  const mockReport =
    mockInterview?.report &&
    typeof mockInterview.report === "object"
      ? mockInterview.report
      : {};

  const mockInterviewScore = useMemo(() => {
    return clampScore(
      getFirstValue(
        mockInterview?.percentage,
        mockInterview?.score,
        mockInterview?.scorePercentage,
        mockInterview?.overallScore,
        mockReport?.overallScore
      )
    );
  }, [mockInterview, mockReport]);

  const technicalKnowledge = useMemo(() => {
    return clampScore(
      getFirstValue(
        mockInterview?.technicalKnowledge,
        mockReport?.technicalKnowledge
      )
    );
  }, [mockInterview, mockReport]);

  const communication = useMemo(() => {
    return clampScore(
      getFirstValue(
        mockInterview?.communication,
        mockReport?.communication
      )
    );
  }, [mockInterview, mockReport]);

  const problemSolving = useMemo(() => {
    return clampScore(
      getFirstValue(
        mockInterview?.problemSolving,
        mockReport?.problemSolving
      )
    );
  }, [mockInterview, mockReport]);

  const mockInterviewCompleted = useMemo(() => {
    return (
      mockInterview?.completed === true ||
      Number(mockInterview?.answeredQuestions) > 0 ||
      Number(mockInterview?.totalQuestions) > 0 ||
      mockReport?.overallScore !== undefined ||
      mockInterview?.percentage !== undefined ||
      mockInterview?.score !== undefined
    );
  }, [mockInterview, mockReport]);

  // =====================================================
  // SKILL GAP
  // =====================================================

  const missingSkills = useMemo(() => {
    const skills = getFirstValue(
      skillGap?.missingSkills,
      skillGap?.skillGaps,
      skillGap?.gaps,
      skillGap?.missing
    );

    return Array.isArray(skills)
      ? skills
      : [];
  }, [skillGap]);

  const learnedSkills = useMemo(() => {
    const skills = getFirstValue(
      skillGap?.learnedSkills,
      skillGap?.matchedSkills,
      skillGap?.existingSkills,
      skillGap?.skills
    );

    return Array.isArray(skills)
      ? skills
      : [];
  }, [skillGap]);

  // =====================================================
  // RESUME STATE
  // =====================================================

  const [resumeFile, setResumeFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD SAVED ANALYSIS
  // =====================================================

  useEffect(() => {
    const savedResume = getStorageData(
      "resumeAnalysis"
    );

    if (
      savedResume &&
      Object.keys(savedResume).length > 0
    ) {
      setAnalysis(savedResume);
      setAnalyzed(true);
    }
  }, [refreshKey]);

  // =====================================================
  // FILE VALIDATION
  // =====================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      return;
    }

    // 10 MB maximum
    if (file.size > 10 * 1024 * 1024) {
      setError(
        "File size must be less than or equal to 10 MB."
      );

      event.target.value = "";
      setResumeFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const fileName = file.name.toLowerCase();

    const validExtension =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx");

    if (
      !allowedTypes.includes(file.type) &&
      !validExtension
    ) {
      setError(
        "Please upload a PDF, DOC, or DOCX file."
      );

      event.target.value = "";
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
    setAnalysis(null);
    setAnalyzed(false);
  };

  // =====================================================
  // ANALYZE RESUME
  // =====================================================

  const handleAnalyzeResume = async () => {
    if (!resumeFile) {
      setError(
        "Please select your resume first."
      );
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append(
        "resume",
        resumeFile
      );

      const response = await fetch(
        "http://localhost:5000/api/resume/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid response received from backend."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Resume analysis failed."
        );
      }

      if (
        !data ||
        !data.analysis
      ) {
        throw new Error(
          "Resume analysis result was not received from backend."
        );
      }

      // =================================================
      // SAVE COMPLETE RESULT
      // =================================================

      const resumeResult = {
        ...data.analysis,

        resumeName: resumeFile.name,

        targetCareer,

        targetCareerMatch,

        careerMatch:
          data.analysis?.careerMatch ??
          targetCareerMatch,

        careerReadiness:
          readinessScore,

        readinessScore,

        mockInterviewScore,

        mockInterviewCompleted,

        technicalKnowledge,

        communication,

        problemSolving,

        missingSkills,

        learnedSkills,

        analyzedAt:
          new Date().toISOString(),
      };

      localStorage.setItem(
        "resumeAnalysis",
        JSON.stringify(resumeResult)
      );

      // Compatibility key
      localStorage.setItem(
        "resume",
        JSON.stringify(resumeResult)
      );

      setAnalysis(resumeResult);
      setAnalyzed(true);

      // Mark Resume module complete
      completeModule(
        MODULE_KEYS.RESUME
      );

      // Notify application
      window.dispatchEvent(
        new Event("resumeUpdated")
      );

    } catch (err) {
      console.error(
        "Resume analysis error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while analyzing the resume."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // =====================================================
  // ANALYZE ANOTHER RESUME
  // =====================================================

  const handleAnalyzeAnother = () => {
    setResumeFile(null);
    setAnalysis(null);
    setAnalyzed(false);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // =====================================================
  // DISPLAY DATA
  // =====================================================

  const atsScore = clampScore(
    getFirstValue(
      analysis?.atsScore,
      analysis?.ATSScore,
      analysis?.ats_score
    )
  );

  const careerRelevance = clampScore(
    getFirstValue(
      analysis?.careerRelevance,
      analysis?.careerRelevanceScore,
      analysis?.relevanceScore
    )
  );

  const resumeSkills = Array.isArray(
    analysis?.skills
  )
    ? analysis.skills
    : [];

  const resumeStrengths = Array.isArray(
    analysis?.strengths
  )
    ? analysis.strengths
    : [];

  const resumeWeaknesses = Array.isArray(
    analysis?.weaknesses
  )
    ? analysis.weaknesses
    : [];

  const resumeMissingSkills =
    Array.isArray(
      analysis?.missingSkills
    )
      ? analysis.missingSkills
      : [];

  const improvements =
    Array.isArray(
      analysis?.improvements
    )
      ? analysis.improvements
      : [];

  const recommendedSections =
    Array.isArray(
      analysis?.recommendedSections
    )
      ? analysis.recommendedSections
      : [];

  const summary = getFirstValue(
    analysis?.summary,
    analysis?.resumeSummary,
    analysis?.feedback,
    ""
  );

  const backendCareerMatch =
    analysis?.careerMatch !== undefined &&
    analysis?.careerMatch !== null
      ? analysis.careerMatch
      : targetCareerMatch;

  // =====================================================
  // STYLES
  // =====================================================

  const pageStyle = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "32px",
    boxSizing: "border-box",
  };

  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headerStyle = {
    marginBottom: "30px",
  };

  const titleStyle = {
    fontSize: "32px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "8px",
  };

  const subtitleStyle = {
    fontSize: "16px",
    color: "#6b7280",
    lineHeight: "1.6",
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "22px",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  };

  const sectionTitleStyle = {
    fontSize: "20px",
    fontWeight: "750",
    color: "#111827",
    marginBottom: "16px",
  };

  const scoreGridStyle = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  };

  const scoreCardStyle = {
    background: "#f8fafc",
    borderRadius: "14px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  };

  const scoreNumberStyle = {
    fontSize: "32px",
    fontWeight: "800",
    color: "#4f46e5",
    marginBottom: "6px",
  };

  const scoreLabelStyle = {
    fontSize: "14px",
    color: "#6b7280",
  };

  const buttonStyle = {
    background:
      "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 22px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  };

  const secondaryButtonStyle = {
    background: "#ffffff",
    color: "#4f46e5",
    border: "1px solid #c7d2fe",
    borderRadius: "12px",
    padding: "13px 22px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  };

  const tagStyle = {
    display: "inline-block",
    background: "#eef2ff",
    color: "#4338ca",
    padding: "7px 11px",
    borderRadius: "20px",
    margin: "4px",
    fontSize: "13px",
    fontWeight: "600",
  };

  const listStyle = {
    margin: 0,
    paddingLeft: "20px",
    color: "#374151",
    lineHeight: "1.8",
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* HEADER */}

        <div style={headerStyle}>
          <h1 style={titleStyle}>
            📄 Resume Analysis
          </h1>

          <p style={subtitleStyle}>
            Upload your resume and let AI analyze it
            against your career goal, skills, readiness,
            and interview performance.
          </p>
        </div>

        {/* CAREER CONTEXT */}

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            🎯 Your Career Context
          </h2>

          <div style={scoreGridStyle}>

            <div style={scoreCardStyle}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                Target Career
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#111827",
                }}
              >
                {targetCareer ||
                  "Not available"}
              </div>
            </div>

            <div style={scoreCardStyle}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                Career Match
              </div>

              <div style={scoreNumberStyle}>
                {targetCareerMatch}%
              </div>
            </div>

            <div style={scoreCardStyle}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                Career Readiness
              </div>

              <div style={scoreNumberStyle}>
                {readinessScore}%
              </div>
            </div>

            <div style={scoreCardStyle}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                Mock Interview
              </div>

              <div style={scoreNumberStyle}>
                {mockInterviewCompleted
                  ? `${mockInterviewScore}%`
                  : "Not Done"}
              </div>
            </div>

          </div>
        </div>

        {/* UPLOAD */}

        {!analyzed && (
          <div style={cardStyle}>

            <h2 style={sectionTitleStyle}>
              📤 Upload Your Resume
            </h2>

            <p
              style={{
                color: "#6b7280",
                marginBottom: "18px",
                lineHeight: "1.6",
              }}
            >
              Supported formats: PDF, DOC, DOCX.
              Maximum file size: 10 MB.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              style={{
                width: "100%",
                padding: "14px",
                border: "2px dashed #c7d2fe",
                borderRadius: "12px",
                background: "#f8fafc",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            />

            {resumeFile && (
              <div
                style={{
                  background: "#f0fdf4",
                  border:
                    "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  color: "#166534",
                }}
              >
                <strong>
                  Selected:
                </strong>{" "}
                {resumeFile.name}
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border:
                    "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleAnalyzeResume}
              disabled={
                !resumeFile || analyzing
              }
              style={{
                ...buttonStyle,
                opacity:
                  !resumeFile || analyzing
                    ? 0.6
                    : 1,
                cursor:
                  !resumeFile || analyzing
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {analyzing
                ? "🤖 Analyzing Resume..."
                : "🚀 Analyze Resume"}
            </button>

          </div>
        )}

        {/* ERROR */}

        {error && analyzed && (
          <div
            style={{
              ...cardStyle,
              background: "#fef2f2",
              border:
                "1px solid #fecaca",
              color: "#b91c1c",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ANALYSIS RESULTS */}

        {analyzed && analysis && (
          <>

            {/* RESUME SCORE */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                📊 Resume Score
              </h2>

              <div style={scoreGridStyle}>

                <div style={scoreCardStyle}>
                  <div style={scoreNumberStyle}>
                    {atsScore}%
                  </div>

                  <div style={scoreLabelStyle}>
                    ATS Score
                  </div>
                </div>

                <div style={scoreCardStyle}>
                  <div style={scoreNumberStyle}>
                    {careerRelevance}%
                  </div>

                  <div style={scoreLabelStyle}>
                    Career Relevance
                  </div>
                </div>

                <div style={scoreCardStyle}>
                  <div style={scoreNumberStyle}>
                    {targetCareerMatch}%
                  </div>

                  <div style={scoreLabelStyle}>
                    Career Match
                  </div>
                </div>

                <div style={scoreCardStyle}>
                  <div style={scoreNumberStyle}>
                    {readinessScore}%
                  </div>

                  <div style={scoreLabelStyle}>
                    Career Readiness
                  </div>
                </div>

              </div>
            </div>

            {/* RESUME INFORMATION */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                📄 Resume Information
              </h2>

              <p
                style={{
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                <strong>
                  File:
                </strong>{" "}
                {analysis.resumeName ||
                  resumeFile?.name ||
                  "Saved Resume"}
              </p>

              {targetCareer && (
                <p
                  style={{
                    color: "#374151",
                  }}
                >
                  <strong>
                    Target Career:
                  </strong>{" "}
                  {targetCareer}
                </p>
              )}
            </div>

            {/* SKILLS */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                🛠️ Resume Skills
              </h2>

              {resumeSkills.length > 0 ? (
                <div>
                  {resumeSkills.map(
                    (skill, index) => (
                      <span
                        key={index}
                        style={tagStyle}
                      >
                        {formatItem(skill)}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  No skills were detected.
                </p>
              )}
            </div>

            {/* STRENGTHS */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                💪 Strengths
              </h2>

              {resumeStrengths.length > 0 ? (
                <ul style={listStyle}>
                  {resumeStrengths.map(
                    (strength, index) => (
                      <li key={index}>
                        {formatItem(
                          strength
                        )}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  No specific strengths were
                  returned.
                </p>
              )}
            </div>

            {/* WEAKNESSES */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                ⚠️ Weaknesses
              </h2>

              {resumeWeaknesses.length > 0 ? (
                <ul style={listStyle}>
                  {resumeWeaknesses.map(
                    (weakness, index) => (
                      <li key={index}>
                        {formatItem(
                          weakness
                        )}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  No major weaknesses were
                  returned.
                </p>
              )}
            </div>

            {/* MISSING SKILLS */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                🔍 Missing Skills
              </h2>

              {resumeMissingSkills.length >
              0 ? (
                <ul style={listStyle}>
                  {resumeMissingSkills.map(
                    (skill, index) => (
                      <li key={index}>
                        {formatItem(skill)}
                      </li>
                    )
                  )}
                </ul>
              ) : missingSkills.length > 0 ? (
                <ul style={listStyle}>
                  {missingSkills.map(
                    (skill, index) => (
                      <li key={index}>
                        {formatItem(skill)}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  No missing skills were
                  identified.
                </p>
              )}
            </div>

            {/* IMPROVEMENTS */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                🚀 Recommended Improvements
              </h2>

              {improvements.length > 0 ? (
                <ul style={listStyle}>
                  {improvements.map(
                    (item, index) => (
                      <li key={index}>
                        {formatItem(item)}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  No additional improvements
                  were returned.
                </p>
              )}
            </div>

            {/* RECOMMENDED SECTIONS */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                📝 Recommended Resume Sections
              </h2>

              {recommendedSections.length >
              0 ? (
                <ul style={listStyle}>
                  {recommendedSections.map(
                    (section, index) => (
                      <li key={index}>
                        {formatItem(
                          section
                        )}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  No additional sections were
                  recommended.
                </p>
              )}
            </div>

            {/* SUMMARY */}

            {summary && (
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>
                  💡 AI Summary
                </h2>

                <p
                  style={{
                    color: "#374151",
                    lineHeight: "1.8",
                    margin: 0,
                  }}
                >
                  {typeof summary === "string"
                    ? summary
                    : formatItem(summary)}
                </p>
              </div>
            )}

            {/* MOCK INTERVIEW */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                🎤 Mock Interview Performance
              </h2>

              {mockInterviewCompleted ? (
                <div style={scoreGridStyle}>

                  <div style={scoreCardStyle}>
                    <div
                      style={
                        scoreNumberStyle
                      }
                    >
                      {mockInterviewScore}%
                    </div>

                    <div
                      style={
                        scoreLabelStyle
                      }
                    >
                      Overall Interview
                    </div>
                  </div>

                  <div style={scoreCardStyle}>
                    <div
                      style={
                        scoreNumberStyle
                      }
                    >
                      {technicalKnowledge}%
                    </div>

                    <div
                      style={
                        scoreLabelStyle
                      }
                    >
                      Technical Knowledge
                    </div>
                  </div>

                  <div style={scoreCardStyle}>
                    <div
                      style={
                        scoreNumberStyle
                      }
                    >
                      {communication}%
                    </div>

                    <div
                      style={
                        scoreLabelStyle
                      }
                    >
                      Communication
                    </div>
                  </div>

                  <div style={scoreCardStyle}>
                    <div
                      style={
                        scoreNumberStyle
                      }
                    >
                      {problemSolving}%
                    </div>

                    <div
                      style={
                        scoreLabelStyle
                      }
                    >
                      Problem Solving
                    </div>
                  </div>

                </div>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                    lineHeight: "1.6",
                  }}
                >
                  Mock Interview has not been
                  completed yet. Complete it later
                  to strengthen your overall career
                  profile.
                </p>
              )}
            </div>

            {/* SKILL GAP */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                📚 Skill Gap Connection
              </h2>

              <p
                style={{
                  color: "#374151",
                  marginBottom: "12px",
                }}
              >
                <strong>
                  Missing Skills:
                </strong>{" "}
                {missingSkills.length}
              </p>

              <p
                style={{
                  color: "#374151",
                }}
              >
                <strong>
                  Learned / Existing Skills:
                </strong>{" "}
                {learnedSkills.length}
              </p>
            </div>

            {/* CAREER RELEVANCE */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                🎯 AI Career Relevance
              </h2>

              <p
                style={{
                  color: "#374151",
                  lineHeight: "1.7",
                }}
              >
                Your resume has been analyzed
                against your current career
                direction.
              </p>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "16px",
                  marginTop: "14px",
                }}
              >
                <strong>
                  Career:
                </strong>{" "}
                {targetCareer ||
                  "Not available"}

                <br />

                <strong>
                  Match:
                </strong>{" "}
                {clampScore(
                  backendCareerMatch
                )}
                %
              </div>
            </div>

            {/* PROFILE CONNECTION */}

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                👤 Profile Connection
              </h2>

              <p
                style={{
                  color: "#374151",
                  lineHeight: "1.7",
                }}
              >
                Your resume analysis uses your
                current career direction and
                previously completed career
                analysis data.
              </p>

              {profile?.name && (
                <p
                  style={{
                    color: "#374151",
                  }}
                >
                  <strong>
                    Student:
                  </strong>{" "}
                  {profile.name}
                </p>
              )}

              {skillAssessment &&
                Object.keys(
                  skillAssessment
                ).length > 0 && (
                  <p
                    style={{
                      color: "#374151",
                    }}
                  >
                    ✅ Skill assessment data
                    available
                  </p>
                )}

              {interestAssessment &&
                Object.keys(
                  interestAssessment
                ).length > 0 && (
                  <p
                    style={{
                      color: "#374151",
                    }}
                  >
                    ✅ Interest assessment data
                    available
                  </p>
                )}
            </div>

            {/* ACTIONS */}

            <div
              style={{
                ...cardStyle,
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={
                  handleAnalyzeAnother
                }
                style={
                  secondaryButtonStyle
                }
              >
                🔄 Analyze Another Resume
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/job-preparation"
                  )
                }
                style={buttonStyle}
              >
                🎯 Continue to Job Preparation →
              </button>
            </div>

          </>
        )}

      </div>
    </div>
  );
}

export default Resume;