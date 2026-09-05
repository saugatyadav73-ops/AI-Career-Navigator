
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const multer = require("multer");
require("dotenv").config();

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// RESUME UPLOAD
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =====================================================
// OPENAI CONFIGURATION
// =====================================================

const AI_MODEL = "gpt-5.6-luna";

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("OpenAI API configured.");
} else {
  console.warn(
    "WARNING: OPENAI_API_KEY is not configured in .env"
  );
}

// =====================================================
// HELPER — CHECK OPENAI
// =====================================================

function checkOpenAI(res) {
  if (!openai) {
    res.status(500).json({
      success: false,
      message:
        "OpenAI API is not configured. Please check your .env file.",
    });

    return false;
  }

  return true;
}

// =====================================================
// HELPER — CLEAN AI JSON
// =====================================================

function cleanAIJson(text) {
  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  let cleaned = text.trim();

  // Remove markdown code fences if AI returns them
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  return JSON.parse(cleaned.trim());
}

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Career Navigator Backend is running!",
  });
});

// =====================================================
// INTEREST ASSESSMENT QUESTIONS
// =====================================================

app.get("/api/interest-questions", (req, res) => {
  try {
    const questions = [
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
          "What kind of project would you prefer?",
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

    res.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error(
      "Interest Questions Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load interest assessment questions.",
    });
  }
});

// =====================================================
// AI CAREER ANALYSIS
// =====================================================

app.post("/api/career-analysis", async (req, res) => {
  try {
    if (!checkOpenAI(res)) {
      return;
    }

    const {
      profile,
      skillAssessment,
      interestAssessment,
      skillGap,
      roadmap,
      projects,
      readiness,
      resume,
    } = req.body;

    const prompt = `
You are an AI Career Navigator.

Analyze the following student information and provide
a personalized career recommendation.

STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}

SKILL ASSESSMENT:
${JSON.stringify(skillAssessment, null, 2)}

INTEREST ASSESSMENT:
${JSON.stringify(interestAssessment, null, 2)}

SKILL GAP:
${JSON.stringify(skillGap, null, 2)}

ROADMAP:
${JSON.stringify(roadmap, null, 2)}

PROJECTS:
${JSON.stringify(projects, null, 2)}

CAREER READINESS:
${JSON.stringify(readiness, null, 2)}

RESUME:
${JSON.stringify(resume, null, 2)}

Return the result in the following format:

Recommended Career:
Career Match Percentage:
Skill Level:
Why this career is suitable:
Current Strengths:
Missing Skills:
Recommended Learning:
Recommended Projects:
Career Advice:

Keep the answer practical and student-friendly.
`;

    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    res.json({
      success: true,
      result: response.output_text,
    });
  } catch (error) {
    console.error(
      "AI Career Analysis Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "AI Career Analysis failed.",
      error: error.message,
    });
  }
});

// =====================================================
// AI RESUME ANALYSIS
// =====================================================

app.post(
  "/api/resume/analyze",
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!checkOpenAI(res)) {
        return;
      }

      // -----------------------------------------------
      // CHECK FILE
      // -----------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a resume.",
        });
      }

      // -----------------------------------------------
      // CHECK FILE TYPE
      // -----------------------------------------------

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Only PDF, DOC and DOCX files are supported.",
        });
      }

      console.log(
        "Resume received:",
        req.file.originalname
      );

      // -----------------------------------------------
      // UPLOAD FILE TO OPENAI
      // -----------------------------------------------

      const uploadedFile = await openai.files.create({
        file: await OpenAI.toFile(
          req.file.buffer,
          req.file.originalname,
          {
            type: req.file.mimetype,
          }
        ),
        purpose: "user_data",
      });

      console.log(
        "OpenAI file uploaded:",
        uploadedFile.id
      );

      // -----------------------------------------------
      // AI PROMPT
      // -----------------------------------------------

      const prompt = `
You are an expert AI Resume Analyst and Career Advisor.

Analyze the uploaded student's resume carefully.

Evaluate:

1. Overall Resume Score from 0 to 100
2. Resume Quality
3. ATS friendliness
4. Technical skills
5. Soft skills
6. Education
7. Projects
8. Experience
9. Certifications
10. Resume structure
11. Career relevance
12. Missing important information
13. Strengths
14. Weaknesses
15. Improvement suggestions

The student is likely preparing for an entry-level
technology/software career.

Return ONLY valid JSON.

Use exactly this structure:

{
  "resumeScore": 0,
  "atsScore": 0,
  "summary": "",
  "careerMatch": "",
  "strengths": [],
  "weaknesses": [],
  "technicalSkills": [],
  "softSkills": [],
  "missingSkills": [],
  "improvements": [],
  "recommendedSections": []
}

Important:
- resumeScore must be a number from 0 to 100.
- atsScore must be a number from 0 to 100.
- All arrays must contain strings.
- Do not use markdown.
- Do not add explanations outside JSON.
`;

      // -----------------------------------------------
      // OPENAI ANALYSIS
      // -----------------------------------------------

      const response = await openai.responses.create({
        model: AI_MODEL,

        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
              {
                type: "input_file",
                file_id: uploadedFile.id,
              },
            ],
          },
        ],
      });

      const aiText = response.output_text;

      console.log(
        "AI Resume Analysis:",
        aiText
      );

      // -----------------------------------------------
      // PARSE JSON
      // -----------------------------------------------

      let analysis;

      try {
        analysis = cleanAIJson(aiText);
      } catch (parseError) {
        console.error(
          "Resume JSON parsing failed:",
          parseError
        );

        return res.status(500).json({
          success: false,
          message:
            "AI returned an invalid analysis format.",
          rawResult: aiText,
        });
      }

      // -----------------------------------------------
      // RESPONSE
      // -----------------------------------------------

      res.json({
        success: true,
        resumeName: req.file.originalname,
        analysis,
      });
    } catch (error) {
      console.error(
        "AI Resume Analysis Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "AI Resume Analysis failed.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// AI MOCK INTERVIEW — GENERATE QUESTION
// =====================================================

app.post(
  "/api/mock-interview/question",
  async (req, res) => {
    try {
      if (!checkOpenAI(res)) {
        return;
      }

      const {
        career,
        interviewType = "technical",
        difficulty = "medium",
        previousQuestions = [],
        skills = {},
        readiness = {},
      } = req.body;

      if (!career) {
        return res.status(400).json({
          success: false,
          message: "Career is required.",
        });
      }

      const prompt = `
You are a professional AI interviewer for an
entry-level technology job.

Generate ONE interview question.

CAREER:
${career}

INTERVIEW TYPE:
${interviewType}

DIFFICULTY:
${difficulty}

STUDENT SKILLS:
${JSON.stringify(skills, null, 2)}

CAREER READINESS:
${JSON.stringify(readiness, null, 2)}

PREVIOUS QUESTIONS:
${JSON.stringify(previousQuestions, null, 2)}

IMPORTANT:
- Generate exactly ONE question.
- Do NOT repeat a previous question.
- For technical interviews, ask a realistic technical
  or problem-solving question.
- For HR interviews, ask a realistic behavioral,
  communication, motivation, or teamwork question.
- The question should be appropriate for the selected
  difficulty.
- Do not provide the answer.
- Do not provide multiple-choice options.
- Make it feel like a real interview.

Return ONLY valid JSON:

{
  "question": "",
  "topic": "",
  "expectedPoints": []
}
`;

      const response = await openai.responses.create({
        model: AI_MODEL,
        input: prompt,
      });

      let questionData;

      try {
        questionData = cleanAIJson(
          response.output_text
        );
      } catch (error) {
        console.error(
          "Question JSON parsing failed:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "AI returned an invalid question format.",
          rawResult: response.output_text,
        });
      }

      res.json({
        success: true,
        question: questionData,
      });
    } catch (error) {
      console.error(
        "AI Mock Interview Question Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to generate AI interview question.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// AI MOCK INTERVIEW — EVALUATE ANSWER
// =====================================================

app.post(
  "/api/mock-interview/evaluate",
  async (req, res) => {
    try {
      if (!checkOpenAI(res)) {
        return;
      }

      const {
        career,
        interviewType = "technical",
        difficulty = "medium",
        question,
        answer,
        expectedPoints = [],
      } = req.body;

      if (!career || !question || !answer) {
        return res.status(400).json({
          success: false,
          message:
            "Career, question and answer are required.",
        });
      }

      const prompt = `
You are an expert AI technical interviewer.

Evaluate a student's interview answer.

CAREER:
${career}

INTERVIEW TYPE:
${interviewType}

DIFFICULTY:
${difficulty}

QUESTION:
${question}

EXPECTED POINTS:
${JSON.stringify(expectedPoints, null, 2)}

STUDENT ANSWER:
${answer}

Evaluate the answer based on:

1. Technical correctness
2. Understanding of the concept
3. Completeness
4. Clarity
5. Problem-solving ability
6. Communication quality

Do not judge grammar too harshly because the student
may not be a native English speaker.

Give a fair score suitable for an entry-level student.

Return ONLY valid JSON:

{
  "score": 0,
  "correctness": 0,
  "clarity": 0,
  "completeness": 0,
  "strengths": [],
  "weaknesses": [],
  "feedback": "",
  "idealAnswer": ""
}

Rules:
- All scores must be numbers from 0 to 100.
- strengths must be an array of strings.
- weaknesses must be an array of strings.
- feedback must be concise and practical.
- idealAnswer should explain what a strong answer
  would contain.
- Do not use markdown.
- Do not add anything outside JSON.
`;

      const response = await openai.responses.create({
        model: AI_MODEL,
        input: prompt,
      });

      let evaluation;

      try {
        evaluation = cleanAIJson(
          response.output_text
        );
      } catch (error) {
        console.error(
          "Evaluation JSON parsing failed:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "AI returned an invalid evaluation format.",
          rawResult: response.output_text,
        });
      }

      res.json({
        success: true,
        evaluation,
      });
    } catch (error) {
      console.error(
        "AI Mock Interview Evaluation Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to evaluate interview answer.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// AI MOCK INTERVIEW — FINAL REPORT
// =====================================================

app.post(
  "/api/mock-interview/report",
  async (req, res) => {
    try {
      if (!checkOpenAI(res)) {
        return;
      }

      const {
        career,
        interviewType = "technical",
        difficulty = "medium",
        evaluations = [],
      } = req.body;

      if (!career) {
        return res.status(400).json({
          success: false,
          message: "Career is required.",
        });
      }

      const prompt = `
You are an expert career coach.

Create a final AI mock interview report for a student.

CAREER:
${career}

INTERVIEW TYPE:
${interviewType}

DIFFICULTY:
${difficulty}

QUESTION EVALUATIONS:
${JSON.stringify(evaluations, null, 2)}

Analyze the complete interview performance.

Return ONLY valid JSON:

{
  "overallScore": 0,
  "technicalKnowledge": 0,
  "communication": 0,
  "problemSolving": 0,
  "strengths": [],
  "weaknesses": [],
  "recommendations": [],
  "finalFeedback": "",
  "readinessLevel": ""
}

Rules:
- Scores must be numbers from 0 to 100.
- strengths must be an array.
- weaknesses must be an array.
- recommendations must be an array.
- readinessLevel should be one of:
  "Needs Improvement",
  "Beginner",
  "Developing",
  "Job Ready",
  "Strong Candidate".
- finalFeedback must be practical and student-friendly.
- Do not use markdown.
- Do not add anything outside JSON.
`;

      const response = await openai.responses.create({
        model: AI_MODEL,
        input: prompt,
      });

      let report;

      try {
        report = cleanAIJson(
          response.output_text
        );
      } catch (error) {
        console.error(
          "Report JSON parsing failed:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "AI returned an invalid report format.",
          rawResult: response.output_text,
        });
      }

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error(
        "AI Mock Interview Report Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to generate final interview report.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error("Global Server Error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
    error: error.message,
  });
});

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});

