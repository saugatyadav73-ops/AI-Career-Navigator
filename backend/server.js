const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const multer = require("multer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const AI_MODEL = "gpt-5.6-luna";

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("OpenAI API configured.");
} else {
  console.warn("WARNING: OPENAI_API_KEY is not configured in .env");
}

function checkOpenAI(res) {
  if (!openai) {
    res.status(500).json({
      success: false,
      message: "OpenAI API is not configured.",
    });

    return false;
  }

  return true;
}

function cleanAIJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    try {
      const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (secondError) {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1 && end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1));
        } catch (thirdError) {
          return null;
        }
      }

      return null;
    }
  }
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Career Navigator Backend is running.",
  });
});

app.get("/api/interest-questions", (req, res) => {
  res.json({
    success: true,
    questions: [
      {
        id: 1,
        question:
          "Which activity do you enjoy the most?",
        options: [
          "Building software",
          "Analyzing data",
          "Designing websites",
          "Finding security problems",
        ],
      },
      {
        id: 2,
        question:
          "Which type of problem do you prefer?",
        options: [
          "Logical programming problems",
          "Data and statistics problems",
          "Creative design problems",
          "Security and investigation problems",
        ],
      },
      {
        id: 3,
        question:
          "Which technology interests you most?",
        options: [
          "Artificial Intelligence",
          "Databases and Analytics",
          "Web Development",
          "Cybersecurity",
        ],
      },
      {
        id: 4,
        question:
          "What would you like to build?",
        options: [
          "AI applications",
          "Data analysis systems",
          "Web applications",
          "Security systems",
        ],
      },
      {
        id: 5,
        question:
          "Which skill would you like to improve?",
        options: [
          "Machine Learning",
          "Data Analysis",
          "Frontend and Backend Development",
          "Network Security",
        ],
      },
    ],
  });
});

app.post("/api/career-analysis", async (req, res) => {
  try {
    if (!checkOpenAI(res)) {
      return;
    }

    const data = req.body || {};

    const prompt = `
You are an expert AI career counselor.

Analyze the following student's information and provide a personalized career analysis.

STUDENT DATA:
${JSON.stringify(data, null, 2)}

Provide valid JSON only.

Return this structure:

{
  "recommendedCareer": "Career name",
  "careerMatch": 85,
  "summary": "Short personalized analysis",
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "skillsToImprove": [
    "Skill 1",
    "Skill 2",
    "Skill 3"
  ],
  "reason": "Why this career is suitable",
  "nextSteps": [
    "Step 1",
    "Step 2",
    "Step 3"
  ]
}
`;

    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const aiText = response.output_text || "";
    const result = cleanAIJson(aiText);

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "AI returned invalid career analysis.",
      });
    }

    return res.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error("Career Analysis Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate career analysis.",
      error: error.message,
    });
  }
});

app.post(
  "/api/resume/analyze",
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!checkOpenAI(res)) {
        return;
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Resume file is required.",
        });
      }

      const uploadedFile = await openai.files.create({
        file: new File(
          [req.file.buffer],
          req.file.originalname,
          {
            type: req.file.mimetype,
          }
        ),
        purpose: "user_data",
      });

      const response = await openai.responses.create({
        model: AI_MODEL,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                file_id: uploadedFile.id,
              },
              {
                type: "input_text",
                text: `
Analyze this resume for a CSE student.

Return valid JSON only:

{
  "overallScore": 0,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "missingSkills": [],
  "suggestions": []
}
`,
              },
            ],
          },
        ],
      });

      const aiText = response.output_text || "";
      const result = cleanAIJson(aiText);

      if (!result) {
        return res.status(500).json({
          success: false,
          message: "AI returned invalid resume analysis.",
        });
      }

      return res.json({
        success: true,
        analysis: result,
      });
    } catch (error) {
      console.error("Resume Analysis Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to analyze resume.",
        error: error.message,
      });
    }
  }
);

app.post("/api/skill-gap/questions", async (req, res) => {
  try {
    if (!checkOpenAI(res)) {
      return;
    }

    const {
      skill,
      count = 10,
      difficulty = "beginner",
      completed = 0,
    } = req.body || {};

    if (!skill || typeof skill !== "string" || !skill.trim()) {
      return res.status(400).json({
        success: false,
        message: "Skill is required.",
      });
    }

    const alreadyCompleted = Math.max(
      0,
      Math.min(
        Number.parseInt(completed, 10) || 0,
        100
      )
    );

    const requestedCount = Math.max(
      1,
      Math.min(
        Number.parseInt(count, 10) || 10,
        10
      )
    );

    const remainingQuestions = 100 - alreadyCompleted;

    if (remainingQuestions <= 0) {
      return res.json({
        success: true,
        skill: skill.trim(),
        difficulty,
        questions: [],
        count: 0,
        completed: alreadyCompleted,
        maximumQuestions: 100,
        message:
          "You have completed the maximum 100 questions for this course.",
      });
    }

    const finalCount = Math.min(
      requestedCount,
      remainingQuestions
    );

    const prompt = `
You are an expert technology instructor and AI question generator for a student learning platform.

Generate exactly ${finalCount} multiple-choice questions for the following skill:

SKILL:
${skill.trim()}

DIFFICULTY:
${String(difficulty).trim()}

STUDENT COURSE PROGRESS:
${alreadyCompleted} questions already completed.

RULES:

1. Generate exactly ${finalCount} questions.
2. Each question must have exactly 4 unique options.
3. Only one option must be correct.
4. The correctAnswer value must exactly match one option.
5. Questions must be technically accurate and suitable for a CSE student.
6. Match the selected difficulty.
7. Do not generate duplicate questions.
8. Provide a short explanation for every answer.
9. Return only valid JSON.
10. Do not use markdown or code fences.
11. Do not add anything outside the JSON object.

Return exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "Exactly one option from the options array",
      "explanation": "Short explanation."
    }
  ]
}
`;

    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const aiText = response.output_text || "";
    const questionData = cleanAIJson(aiText);

    if (
      !questionData ||
      !Array.isArray(questionData.questions)
    ) {
      return res.status(500).json({
        success: false,
        message:
          "AI did not return a valid questions array.",
      });
    }

    const validQuestions = questionData.questions
      .filter((item) => {
        if (!item || typeof item !== "object") {
          return false;
        }

        if (
          typeof item.question !== "string" ||
          !item.question.trim()
        ) {
          return false;
        }

        if (
          !Array.isArray(item.options) ||
          item.options.length !== 4
        ) {
          return false;
        }

        const options = item.options.map((option) =>
          String(option).trim()
        );

        if (
          options.some((option) => !option) ||
          new Set(options).size !== 4
        ) {
          return false;
        }

        if (
          typeof item.correctAnswer !== "string" ||
          !item.correctAnswer.trim()
        ) {
          return false;
        }

        return options.includes(
          item.correctAnswer.trim()
        );
      })
      .slice(0, finalCount)
      .map((item, index) => ({
        id: index + 1,
        question: item.question.trim(),
        options: item.options.map((option) =>
          String(option).trim()
        ),
        correctAnswer:
          item.correctAnswer.trim(),
        explanation:
          typeof item.explanation === "string"
            ? item.explanation.trim()
            : "",
      }));

    if (validQuestions.length !== finalCount) {
      return res.status(500).json({
        success: false,
        message:
          "AI failed to generate the requested number of valid questions.",
      });
    }

    return res.json({
      success: true,
      skill: skill.trim(),
      difficulty,
      questions: validQuestions,
      count: validQuestions.length,
      completed: alreadyCompleted,
      maximumQuestions: 100,
    });
  } catch (error) {
    console.error(
      "AI Skill Gap Questions Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate AI skill-gap questions.",
      error: error.message,
    });
  }
});

app.post(
  "/api/mock-interview/question",
  async (req, res) => {
    try {
      if (!checkOpenAI(res)) {
        return;
      }

      const {
        career = "Software Developer",
        difficulty = "beginner",
        previousQuestions = [],
      } = req.body || {};

      const prompt = `
You are an AI technical interviewer.

Generate one interview question for:

CAREER:
${career}

DIFFICULTY:
${difficulty}

Avoid repeating these previous questions:
${JSON.stringify(previousQuestions)}

Return valid JSON only:

{
  "question": "Interview question",
  "category": "Technical",
  "difficulty": "${difficulty}"
}
`;

      const response = await openai.responses.create({
        model: AI_MODEL,
        input: prompt,
      });

      const aiText = response.output_text || "";
      const result = cleanAIJson(aiText);

      if (!result) {
        return res.status(500).json({
          success: false,
          message:
            "AI returned invalid interview question.",
        });
      }

      return res.json({
        success: true,
        question: result,
      });
    } catch (error) {
      console.error(
        "Mock Interview Question Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to generate mock interview question.",
        error: error.message,
      });
    }
  }
);

app.post(
  "/api/mock-interview/evaluate",
  async (req, res) => {
    try {
      if (!checkOpenAI(res)) {
        return;
      }

      const {
        question,
        answer,
        career,
      } = req.body || {};

      if (!question || !answer) {
        return res.status(400).json({
          success: false,
          message:
            "Question and answer are required.",
        });
      }

      const prompt = `
You are an expert technical interviewer.

CAREER:
${career || "Software Developer"}

QUESTION:
${question}

STUDENT ANSWER:
${answer}

Evaluate the answer.

Return valid JSON only:

{
  "score": 0,
  "rating": "Good",
  "feedback": "Detailed but concise feedback",
  "strengths": [],
  "improvements": [],
  "idealAnswer": "Example of a better answer"
}
`;

      const response = await openai.responses.create({
        model: AI_MODEL,
        input: prompt,
      });

      const aiText = response.output_text || "";
      const result = cleanAIJson(aiText);

      if (!result) {
        return res.status(500).json({
          success: false,
          message:
            "AI returned invalid evaluation.",
        });
      }

      return res.json({
        success: true,
        evaluation: result,
      });
    } catch (error) {
      console.error(
        "Mock Interview Evaluation Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to evaluate mock interview answer.",
        error: error.message,
      });
    }
  }
);

app.post(
  "/api/mock-interview/report",
  async (req, res) => {
    try {
      if (!checkOpenAI(res)) {
        return;
      }

      const data = req.body || {};

      const prompt = `
You are an expert career interview coach.

Create a final mock interview performance report.

DATA:
${JSON.stringify(data, null, 2)}

Return valid JSON only:

{
  "overallScore": 0,
  "summary": "",
  "technicalScore": 0,
  "communicationScore": 0,
  "problemSolvingScore": 0,
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
}
`;

      const response = await openai.responses.create({
        model: AI_MODEL,
        input: prompt,
      });

      const aiText = response.output_text || "";
      const result = cleanAIJson(aiText);

      if (!result) {
        return res.status(500).json({
          success: false,
          message:
            "AI returned invalid interview report.",
        });
      }

      return res.json({
        success: true,
        report: result,
      });
    } catch (error) {
      console.error(
        "Mock Interview Report Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to generate mock interview report.",
        error: error.message,
      });
    }
  }
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Global Server Error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
    error: error.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});