const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const db = require("./database");
const aiOrchestrator = require("./ai/orchestrator");
const fallback = require("./ai/fallback");

const app = express();

// =====================================================
// CONFIGURATION
// =====================================================

const PORT = process.env.PORT || 5000;

const AI_MODEL =
  process.env.OPENAI_MODEL ||
  process.env.AI_MODEL ||
  "gpt-4o-mini";

   if (
     !process.env.JWT_SECRET ||
     !String(process.env.JWT_SECRET).trim()
   ) {
     process.env.JWT_SECRET = require("crypto")
       .randomBytes(48)
       .toString("hex");
     console.warn("WARNING: JWT_SECRET not set. Using a temporary random secret.");
   }

   const JWT_SECRET = process.env.JWT_SECRET;

const MAX_RESUME_SIZE =
  10 * 1024 * 1024;

// Email verification code lifetime
const VERIFICATION_CODE_EXPIRY_MINUTES = 10;

// Minimum time between resend requests
const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

// =====================================================
// CORS
// =====================================================

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ai-career-navigator-mocha.vercel.app",
];

const configuredAllowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins]),
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".render.com") ||
        origin.endsWith(".railway.app") ||
        origin.endsWith(".fly.dev")
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          "CORS policy: Origin not allowed."
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =====================================================
// BODY PARSING
// =====================================================

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

// =====================================================
// FILE UPLOAD
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_RESUME_SIZE,
  },

  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (
      allowedMimeTypes.includes(
        file.mimetype
      )
    ) {
      callback(null, true);
    } else {
      callback(
        new Error(
          "Only PDF, DOC, DOCX and TXT resume files are allowed."
        )
      );
    }
  },
});

// =====================================================
// OPENAI
// =====================================================

let openai = null;

const hasRealOpenAIKey =
  Boolean(process.env.OPENAI_API_KEY) &&
  !/YOUR_|_HERE|CHANGE_ME/i.test(
    process.env.OPENAI_API_KEY
  );

if (hasRealOpenAIKey) {
  openai = new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });

  console.log(
    `OpenAI API configured. Model: ${AI_MODEL}`
  );
} else {
  console.warn(
    "WARNING: OPENAI_API_KEY is not configured in .env"
  );
}

// =====================================================
// EMAIL / NODEMAILER
// =====================================================

let emailTransporter = null;

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {
  emailTransporter =
    nodemailer.createTransport({
      host: process.env.SMTP_HOST,

      port:
        Number(
          process.env.SMTP_PORT
        ) || 587,

      secure:
        String(
          process.env.SMTP_SECURE
        ).toLowerCase() ===
        "true",

      auth: {
        user:
          process.env.SMTP_USER,

        pass:
          process.env.SMTP_PASS,
      },
    });

  console.log(
    "SMTP email service configured."
  );
} else {
  console.warn(
    "WARNING: SMTP email settings are not fully configured."
  );
}

// =====================================================
// ENVIRONMENT VALIDATION
// =====================================================

if (!process.env.JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is not configured in .env"
  );
}

// =====================================================
// COMMON HELPERS
// =====================================================

function checkAI(res) {
  if (!aiOrchestrator.availableProviders().length) {
    res.status(503).json({
      success: false,
      message:
        "No AI provider is configured. Set OPENAI_API_KEY, GEMINI_API_KEY or HUGGINGFACE_API_KEY in backend/.env.",
    });

    return false;
  }

  return true;
}


// Calls the AI orchestrator; if no provider is available, returns the
// rule-based fallback result (as JSON text) so the feature keeps working.
async function generateOrFallback(options, fallbackObject) {
  try {
    const result = await aiOrchestrator.generate(options);
    return result.text;
  } catch (error) {
    if (error instanceof aiOrchestrator.AiUnavailableError) {
      return JSON.stringify(fallbackObject);
    }
    throw error;
  }
}

// Soft authentication: attaches req.studentId when a valid Bearer token is sent.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      req.studentId = payload.id;
    } catch (e) {
      // invalid token: continue as anonymous
    }
  }
  next();
}

// Strict authentication for protected endpoints.
function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }
    next();
  });
}

function checkJWTSecret(res) {
  if (
    !process.env.JWT_SECRET ||
    !String(process.env.JWT_SECRET).trim()
  ) {
    res.status(500).json({
      success: false,
      message:
        "JWT authentication is not configured.",
    });

    return false;
  }

  return true;
}

function cleanAIJson(text) {
  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    return null;
  }

  const original = text.trim();

  try {
    return JSON.parse(original);
  } catch (error) {
    // Continue.
  }

  try {
    const cleaned = original
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    // Continue.
  }

  const objectStart =
    original.indexOf("{");

  const objectEnd =
    original.lastIndexOf("}");

  if (
    objectStart !== -1 &&
    objectEnd !== -1 &&
    objectEnd > objectStart
  ) {
    try {
      return JSON.parse(
        original.slice(
          objectStart,
          objectEnd + 1
        )
      );
    } catch (error) {
      // Continue.
    }
  }

  const arrayStart =
    original.indexOf("[");

  const arrayEnd =
    original.lastIndexOf("]");

  if (
    arrayStart !== -1 &&
    arrayEnd !== -1 &&
    arrayEnd > arrayStart
  ) {
    try {
      return JSON.parse(
        original.slice(
          arrayStart,
          arrayEnd + 1
        )
      );
    } catch (error) {
      // Continue.
    }
  }

  return null;
}

function clampScore(
  value,
  minimum = 0,
  maximum = 100
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return minimum;
  }

  return Math.max(
    minimum,
    Math.min(maximum, number)
  );
}

function normalizeString(
  value,
  fallback = ""
) {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  return value.trim() || fallback;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      typeof item === "string"
        ? item.trim()
        : String(item).trim()
    )
    .filter(Boolean);
}

function getErrorMessage(error) {
  if (
    error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown server error.";
}

// =====================================================
// EMAIL VERIFICATION HELPERS
// =====================================================

function generateVerificationCode() {
  return String(
    crypto.randomInt(
      100000,
      1000000
    )
  );
}

async function hashVerificationCode(
  code
) {
  return bcrypt.hash(
    code,
    10
  );
}

function getVerificationExpiry() {
  const expiry =
    new Date();

  expiry.setMinutes(
    expiry.getMinutes() +
      VERIFICATION_CODE_EXPIRY_MINUTES
  );

  return expiry.toISOString();
}

function isVerificationCodeExpired(
  expiry
) {
  if (!expiry) {
    return true;
  }

  const expiryTime =
    new Date(expiry).getTime();

  return (
    !Number.isFinite(
      expiryTime
    ) ||
    Date.now() >
      expiryTime
  );
}

function canResendVerification(
  sentAt
) {
  if (!sentAt) {
    return true;
  }

  const sentTime =
    new Date(sentAt).getTime();

  if (
    !Number.isFinite(
      sentTime
    )
  ) {
    return true;
  }

  const elapsedSeconds =
    (Date.now() -
      sentTime) /
    1000;

  return (
    elapsedSeconds >=
    VERIFICATION_RESEND_COOLDOWN_SECONDS
  );
}

async function sendVerificationEmail(
  email,
  name,
  code
) {
  if (!emailTransporter) {
    throw new Error(
      "Email service is not configured. Please configure SMTP settings in .env."
    );
  }

  const fromAddress =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER;

  await emailTransporter.sendMail({
    from: fromAddress,

    to: email,

    subject:
      "AI Career Navigator - Email Verification Code",

    text: `Hello ${name},

Welcome to AI Career Navigator.

Your email verification code is:

${code}

This code will expire in ${VERIFICATION_CODE_EXPIRY_MINUTES} minutes.

If you did not create this account, you can safely ignore this email.

AI Career Navigator`,
    
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">
        <h2 style="color: #2563eb;">
          🚀 AI Career Navigator
        </h2>

        <p>Hello ${name},</p>

        <p>
          Welcome to AI Career Navigator.
          Please use the verification code below to verify your email address.
        </p>

        <div style="
          background: #f3f4f6;
          padding: 20px;
          text-align: center;
          border-radius: 10px;
          margin: 25px 0;
        ">
          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #111827;
          ">
            ${code}
          </div>
        </div>

        <p>
          This code will expire in
          <strong>${VERIFICATION_CODE_EXPIRY_MINUTES} minutes</strong>.
        </p>

        <p>
          If you did not create this account,
          you can safely ignore this email.
        </p>

        <p>
          Regards,<br>
          <strong>AI Career Navigator</strong>
        </p>
      </div>
    `,
  });
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,

    message:
      "AI Career Navigator Backend is running.",

    model: AI_MODEL,

    openAIConfigured:
      Boolean(openai),

    aiProviders:
      aiOrchestrator.availableProviders(),

    emailConfigured:
      Boolean(emailTransporter),

    databaseConnected: true,
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,

    status: "healthy",

    service:
      "AI Career Navigator Backend",

    model: AI_MODEL,

    openAIConfigured:
      Boolean(openai),

    aiProviders:
      aiOrchestrator.availableProviders(),

    emailConfigured:
      Boolean(emailTransporter),

    timestamp:
      new Date().toISOString(),
  });
});

// =====================================================
// AUTH — REGISTER
// =====================================================

app.post(
  "/api/auth/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body || {};

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required.",
        });
      }

      const normalizedName =
        String(name).trim();

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const normalizedPassword =
        String(password);

      if (
        !normalizedName ||
        !normalizedEmail
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name and email are required.",
        });
      }

      if (
        normalizedName.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name is too long.",
        });
      }

      if (
        normalizedEmail.length > 255
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email is too long.",
        });
      }

      if (
        normalizedPassword.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      if (
        normalizedPassword.length > 128
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password is too long.",
        });
      }

      if (!checkJWTSecret(res)) {
        return;
      }

      // -------------------------------------------------
      // CHECK EXISTING STUDENT
      // -------------------------------------------------

      const existingStudent =
        db
          .prepare(
            `
            SELECT
              id,
              name,
              email,
              email_verified,
              verification_sent_at
            FROM students
            WHERE email = ?
            `
          )
          .get(
            normalizedEmail
          );

      if (existingStudent) {
        if (
          Number(
            existingStudent.email_verified
          ) === 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              "An account with this email already exists but is not verified. Please use the resend verification option.",
            requiresVerification: true,
            email:
              normalizedEmail,
          });
        }

        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        });
      }

      // -------------------------------------------------
      // HASH PASSWORD
      // -------------------------------------------------

      const hashedPassword =
        await bcrypt.hash(
          normalizedPassword,
          10
        );

      // -------------------------------------------------
      // DEVELOPMENT MODE: SMTP not configured
      // -------------------------------------------------
      // Without SMTP no verification email can be delivered, so the account
      // is created as already verified and a token is returned directly.
      // Configure SMTP_* in .env to enforce email verification.
      if (!emailTransporter) {
        const devResult = db
          .prepare(
            `INSERT INTO students (name, email, password, email_verified)
             VALUES (?, ?, ?, 1)`
          )
          .run(
            normalizedName,
            normalizedEmail,
            hashedPassword
          );

        const devId = Number(devResult.lastInsertRowid);

        const devToken = jwt.sign(
          { id: devId, email: normalizedEmail },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.status(201).json({
          success: true,
          message:
            "Registration successful. (Email verification skipped: SMTP is not configured.)",
          requiresVerification: false,
          token: devToken,
          student: {
            id: devId,
            name: normalizedName,
            email: normalizedEmail,
            emailVerified: true,
          },
        });
      }

      // -------------------------------------------------
      // GENERATE VERIFICATION CODE
      // -------------------------------------------------

      const verificationCode =
        generateVerificationCode();

      const verificationCodeHash =
        await hashVerificationCode(
          verificationCode
        );

      const verificationExpiresAt =
        getVerificationExpiry();

      const verificationSentAt =
        new Date().toISOString();

      // -------------------------------------------------
      // CREATE STUDENT
      // -------------------------------------------------

      const result =
        db
          .prepare(
            `
            INSERT INTO students
            (
              name,
              email,
              password,
              email_verified,
              verification_code_hash,
              verification_expires_at,
              verification_sent_at
            )
            VALUES (?, ?, ?, 0, ?, ?, ?)
            `
          )
          .run(
            normalizedName,
            normalizedEmail,
            hashedPassword,
            verificationCodeHash,
            verificationExpiresAt,
            verificationSentAt
          );

      const studentId =
        Number(
          result.lastInsertRowid
        );

      // -------------------------------------------------
      // SEND EMAIL
      // -------------------------------------------------

      try {
        await sendVerificationEmail(
          normalizedEmail,
          normalizedName,
          verificationCode
        );
      } catch (emailError) {
        console.error(
          "Verification Email Error:",
          emailError
        );

        // Remove account if email could not be sent.
        db.prepare(
          "DELETE FROM students WHERE id = ?"
        ).run(studentId);

        return res.status(500).json({
          success: false,
          message:
            "Account could not be created because the verification email could not be sent. Please check the SMTP configuration.",
        });
      }

      return res.status(201).json({
        success: true,

        message:
          "Registration successful. A verification code has been sent to your email.",

        requiresVerification:
          true,

        email:
          normalizedEmail,

        student: {
          id: studentId,
          name: normalizedName,
          email:
            normalizedEmail,
          emailVerified: false,
        },
      });
    } catch (error) {
      console.error(
        "Register Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Registration failed.",
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// AUTH — VERIFY EMAIL
// =====================================================

app.post(
  "/api/auth/verify-email",
  async (req, res) => {
    try {
      const {
        email,
        code,
      } = req.body || {};

      if (
        !email ||
        !code
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and verification code are required.",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const normalizedCode =
        String(code).trim();

      if (
        !/^\d{6}$/.test(
          normalizedCode
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Verification code must be exactly 6 digits.",
        });
      }

      const student =
        db
          .prepare(
            `
            SELECT
              id,
              name,
              email,
              email_verified,
              verification_code_hash,
              verification_expires_at
            FROM students
            WHERE email = ?
            `
          )
          .get(
            normalizedEmail
          );

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "No account found with this email.",
        });
      }

      if (
        Number(
          student.email_verified
        ) === 1
      ) {
        return res.json({
          success: true,
          message:
            "Email is already verified.",
          emailVerified: true,
        });
      }

      if (
        !student.verification_code_hash
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No active verification code found. Please request a new code.",
        });
      }

      if (
        isVerificationCodeExpired(
          student.verification_expires_at
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Verification code has expired. Please request a new code.",
          expired: true,
        });
      }

      const codeMatch =
        await bcrypt.compare(
          normalizedCode,
          student.verification_code_hash
        );

      if (!codeMatch) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification code.",
        });
      }

      // -------------------------------------------------
      // MARK EMAIL VERIFIED
      // -------------------------------------------------

      db.prepare(
        `
        UPDATE students
        SET
          email_verified = 1,
          verification_code_hash = NULL,
          verification_expires_at = NULL,
          verification_sent_at = NULL
        WHERE id = ?
        `
      ).run(student.id);

      return res.json({
        success: true,

        message:
          "Email verified successfully. You can now log in.",

        emailVerified: true,

        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
      });
    } catch (error) {
      console.error(
        "Verify Email Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Email verification failed.",
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// AUTH — RESEND VERIFICATION
// =====================================================

app.post(
  "/api/auth/resend-verification",
  async (req, res) => {
    try {
      const {
        email,
      } = req.body || {};

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required.",
        });
      }

      if (!emailTransporter) {
        return res.status(500).json({
          success: false,
          message:
            "Email verification is not configured on the server.",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const student =
        db
          .prepare(
            `
            SELECT
              id,
              name,
              email,
              email_verified,
              verification_sent_at
            FROM students
            WHERE email = ?
            `
          )
          .get(
            normalizedEmail
          );

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "No account found with this email.",
        });
      }

      if (
        Number(
          student.email_verified
        ) === 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This email is already verified. You can log in.",
        });
      }

      if (
        !canResendVerification(
          student.verification_sent_at
        )
      ) {
        return res.status(429).json({
          success: false,
          message:
            "Please wait at least 60 seconds before requesting another verification code.",
        });
      }

      const verificationCode =
        generateVerificationCode();

      const verificationCodeHash =
        await hashVerificationCode(
          verificationCode
        );

      const verificationExpiresAt =
        getVerificationExpiry();

      const verificationSentAt =
        new Date().toISOString();

      db.prepare(
        `
        UPDATE students
        SET
          verification_code_hash = ?,
          verification_expires_at = ?,
          verification_sent_at = ?
        WHERE id = ?
        `
      ).run(
        verificationCodeHash,
        verificationExpiresAt,
        verificationSentAt,
        student.id
      );

      try {
        await sendVerificationEmail(
          student.email,
          student.name,
          verificationCode
        );
      } catch (emailError) {
        console.error(
          "Resend Verification Email Error:",
          emailError
        );

        return res.status(500).json({
          success: false,
          message:
            "Verification email could not be sent. Please check the SMTP configuration.",
        });
      }

      return res.json({
        success: true,

        message:
          "A new verification code has been sent to your email.",

        email:
          normalizedEmail,

        expiresInMinutes:
          VERIFICATION_CODE_EXPIRY_MINUTES,
      });
    } catch (error) {
      console.error(
        "Resend Verification Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to resend verification code.",
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// AUTH — LOGIN
// =====================================================

app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body || {};

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required.",
        });
      }

      if (!checkJWTSecret(res)) {
        return;
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const student =
        db
          .prepare(
            `
            SELECT
              id,
              name,
              email,
              password,
              email_verified
            FROM students
            WHERE email = ?
            `
          )
          .get(
            normalizedEmail
          );

      if (!student) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          String(password),
          student.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      // -------------------------------------------------
      // EMAIL VERIFICATION CHECK
      // -------------------------------------------------

      if (
        Number(
          student.email_verified
        ) !== 1
      ) {
        return res.status(403).json({
          success: false,

          message:
            "Please verify your email before logging in.",

          requiresVerification:
            true,

          email:
            student.email,
        });
      }

      const token =
        jwt.sign(
          {
            id: student.id,
            email: student.email,
          },
          JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

      return res.json({
        success: true,

        message:
          "Login successful.",

        token,

        student: {
          id: student.id,
          name: student.name,
          email:
            student.email,
          emailVerified: true,
        },
      });
    } catch (error) {
      console.error(
        "Login Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Login failed.",
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// INTEREST QUESTIONS
// =====================================================

app.get(
  "/api/interest-questions",
  (req, res) => {
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
  }
);

// =====================================================
// CAREER ANALYSIS
// =====================================================

app.post(
  "/api/career-analysis",
  optionalAuth,
  async (req, res) => {
    try {
      

      const data =
        req.body || {};

      const prompt = `
You are an expert AI career counselor.

Analyze the following student's information and provide a personalized career analysis.

STUDENT DATA:
${JSON.stringify(
  data,
  null,
  2
)}

RULES:

1. Return valid JSON only.
2. Do not use markdown.
3. careerMatch must be a number from 0 to 100.
4. strengths must contain useful personalized items.
5. skillsToImprove must contain useful personalized items.
6. nextSteps must be practical.
7. Recommend the career that best matches the student's actual data.

Return exactly this structure:

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

      const aiText = await generateOrFallback(
        { task: "career_analysis", prompt, userId: req.studentId || null },
        fallback.ruleBasedCareerAnalysis(data)
      );

      const result =
        cleanAIJson(aiText);

      if (
        !result ||
        typeof result !== "object"
      ) {
        return res.status(500).json({
          success: false,
          message:
            "AI returned invalid career analysis.",
        });
      }

      result.recommendedCareer =
        normalizeString(
          result.recommendedCareer,
          "Software Developer"
        );

      result.careerMatch =
        clampScore(
          result.careerMatch
        );

      result.summary =
        normalizeString(
          result.summary
        );

      result.strengths =
        normalizeArray(
          result.strengths
        );

      result.skillsToImprove =
        normalizeArray(
          result.skillsToImprove
        );

      result.reason =
        normalizeString(
          result.reason
        );

      result.nextSteps =
        normalizeArray(
          result.nextSteps
        );

      return res.json({
        success: true,
        analysis: result,
      });
    } catch (error) {
      console.error(
        "Career Analysis Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to generate career analysis.",
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// RESUME ANALYSIS
// =====================================================

app.post(
  "/api/resume/analyze",
  optionalAuth,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          message:
            "Resume analysis needs a configured OPENAI_API_KEY (PDF/DOC upload analysis uses OpenAI file input).",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Resume file is required.",
        });
      }

      const uploadedFile =
        await openai.files.create({
          file: new File(
            [
              req.file.buffer,
            ],
            req.file.originalname,
            {
              type:
                req.file.mimetype,
            }
          ),
          purpose: "user_data",
        });

      const response =
        await openai.responses.create({
          model: AI_MODEL,

          input: [
            {
              role: "user",

              content: [
                {
                  type: "input_file",
                  file_id:
                    uploadedFile.id,
                },

                {
                  type: "input_text",

                  text: `
Analyze this resume for a CSE student.

Return valid JSON only.

Rules:

1. overallScore must be between 0 and 100.
2. strengths must be an array.
3. weaknesses must be an array.
4. missingSkills must be an array.
5. suggestions must be an array.
6. Do not use markdown.
7. Do not add anything outside the JSON.

Return exactly:

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

      const aiText =
        response.output_text || "";

      const result =
        cleanAIJson(aiText);

      if (
        !result ||
        typeof result !== "object"
      ) {
        return res.status(500).json({
          success: false,
          message:
            "AI returned invalid resume analysis.",
        });
      }

      result.overallScore =
        clampScore(
          result.overallScore
        );

      result.summary =
        normalizeString(
          result.summary
        );

      result.strengths =
        normalizeArray(
          result.strengths
        );

      result.weaknesses =
        normalizeArray(
          result.weaknesses
        );

      result.missingSkills =
        normalizeArray(
          result.missingSkills
        );

      result.suggestions =
        normalizeArray(
          result.suggestions
        );

      return res.json({
        success: true,
        analysis: result,
      });
    } catch (error) {
      console.error(
        "Resume Analysis Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to analyze resume.",
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// SKILL GAP QUESTIONS
// =====================================================

app.post(
  "/api/skill-gap/questions",
  optionalAuth,
  async (req, res) => {
    try {
      if (!checkAI(res)) {
        return;
      }

      const {
        skill,
        count = 10,
        difficulty = "beginner",
        completed = 0,
      } = req.body || {};

      if (
        !skill ||
        typeof skill !== "string" ||
        !skill.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Skill is required.",
        });
      }

      const normalizedDifficulty =
        String(
          difficulty
        )
          .trim()
          .toLowerCase();

      const allowedDifficulties = [
        "beginner",
        "medium",
        "advanced",
        "intermediate",
      ];

      const finalDifficulty =
        allowedDifficulties.includes(
          normalizedDifficulty
        )
          ? normalizedDifficulty
          : "beginner";

      const alreadyCompleted =
        Math.max(
          0,
          Math.min(
            Number.parseInt(
              completed,
              10
            ) || 0,
            100
          )
        );

      const requestedCount =
        Math.max(
          1,
          Math.min(
            Number.parseInt(
              count,
              10
            ) || 10,
            10
          )
        );

      const remainingQuestions =
        100 -
        alreadyCompleted;

      if (
        remainingQuestions <= 0
      ) {
        return res.json({
          success: true,
          skill:
            skill.trim(),
          difficulty:
            finalDifficulty,
          questions: [],
          count: 0,
          completed:
            alreadyCompleted,
          maximumQuestions: 100,
          message:
            "You have completed the maximum 100 questions for this course.",
        });
      }

      const finalCount =
        Math.min(
          requestedCount,
          remainingQuestions
        );

      const prompt = `
You are an expert technology instructor and AI question generator for a student learning platform.

Generate exactly ${finalCount} multiple-choice questions for the following skill.

SKILL:
${skill.trim()}

DIFFICULTY:
${finalDifficulty}

STUDENT COURSE PROGRESS:
${alreadyCompleted} questions already completed.

RULES:

1. Generate exactly ${finalCount} questions.
2. Each question must have exactly 4 unique options.
3. Only one option must be correct.
4. correctAnswer must exactly match one option.
5. Questions must be technically accurate.
6. Questions must be suitable for a CSE student.
7. Match the requested difficulty.
8. Do not repeat questions.
9. Give a short explanation.
10. Return only valid JSON.
11. Do not use markdown.
12. Do not add anything outside JSON.

Return exactly:

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
      "correctAnswer": "Option A",
      "explanation": "Short explanation."
    }
  ]
}
`;

      const aiResult = await aiOrchestrator.generate({ task: "skill_gap_questions", prompt, userId: req.studentId || null });
      const aiText = aiResult.text;

      const questionData =
        cleanAIJson(aiText);

      if (
        !questionData ||
        !Array.isArray(
          questionData.questions
        )
      ) {
        return res.status(500).json({
          success: false,
          message:
            "AI did not return a valid questions array.",
        });
      }

      const validQuestions =
        questionData.questions
          .filter((item) => {
            if (
              !item ||
              typeof item !==
                "object"
            ) {
              return false;
            }

            if (
              typeof item.question !==
                "string" ||
              !item.question.trim()
            ) {
              return false;
            }

            if (
              !Array.isArray(
                item.options
              ) ||
              item.options.length !== 4
            ) {
              return false;
            }

            const options =
              item.options.map(
                (option) =>
                  String(
                    option
                  ).trim()
              );

            if (
              options.some(
                (option) =>
                  !option
              )
            ) {
              return false;
            }

            if (
              new Set(
                options
              ).size !== 4
            ) {
              return false;
            }

            if (
              typeof item.correctAnswer !==
                "string" ||
              !item.correctAnswer.trim()
            ) {
              return false;
            }

            return options.includes(
              item.correctAnswer.trim()
            );
          })
          .slice(
            0,
            finalCount
          )
          .map(
            (
              item,
              index
            ) => ({
              id:
                index + 1,

              question:
                item.question.trim(),

              options:
                item.options.map(
                  (option) =>
                    String(
                      option
                    ).trim()
                ),

              correctAnswer:
                item.correctAnswer.trim(),

              explanation:
                typeof item.explanation ===
                "string"
                  ? item.explanation.trim()
                  : "",
            })
          );

      if (
        validQuestions.length !==
        finalCount
      ) {
        return res.status(500).json({
          success: false,
          message:
            "AI failed to generate the requested number of valid questions.",
        });
      }

      return res.json({
        success: true,
        skill:
          skill.trim(),
        difficulty:
          finalDifficulty,
        questions:
          validQuestions,
        count:
          validQuestions.length,
        completed:
          alreadyCompleted,
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
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// MOCK INTERVIEW — QUESTION
// =====================================================

app.post(
  "/api/mock-interview/question",
  optionalAuth,
  async (req, res) => {
    try {
      

      const {
        career = "Software Developer",
        difficulty = "beginner",
        previousQuestions = [],
      } = req.body || {};

      const safeCareer =
        normalizeString(
          career,
          "Software Developer"
        );

      const safeDifficulty =
        normalizeString(
          difficulty,
          "beginner"
        );

      const safePreviousQuestions =
        Array.isArray(
          previousQuestions
        )
          ? previousQuestions
              .map((question) =>
                String(
                  question
                ).trim()
              )
              .filter(Boolean)
              .slice(-20)
          : [];

      const prompt = `
You are an AI technical interviewer.

Generate exactly ONE interview question.

CAREER:
${safeCareer}

DIFFICULTY:
${safeDifficulty}

Previous questions:
${JSON.stringify(
  safePreviousQuestions,
  null,
  2
)}

Do not repeat any previous question.

Return valid JSON only.

{
  "question": "Interview question",
  "category": "Technical",
  "difficulty": "${safeDifficulty}"
}
`;

      const aiText = await generateOrFallback(
        { task: "mock_interview_question", prompt, userId: req.studentId || null },
        fallback.ruleBasedInterviewQuestion({
          career: safeCareer,
          difficulty: safeDifficulty,
          previousQuestions,
        })
      );

      const result =
        cleanAIJson(aiText);

      if (
        !result ||
        typeof result !==
          "object" ||
        !result.question
      ) {
        return res.status(500).json({
          success: false,
          message:
            "AI returned invalid interview question.",
        });
      }

      return res.json({
        success: true,

        question: {
          question:
            normalizeString(
              result.question
            ),

          category:
            normalizeString(
              result.category,
              "Technical"
            ),

          difficulty:
            normalizeString(
              result.difficulty,
              safeDifficulty
            ),
        },
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
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// MOCK INTERVIEW — EVALUATE ANSWER
// =====================================================

app.post(
  "/api/mock-interview/evaluate",
  optionalAuth,
  async (req, res) => {
    try {
      

      const {
        question,
        answer,
        career,
      } = req.body || {};

      if (
        !question ||
        !answer
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Question and answer are required.",
        });
      }

      const safeCareer =
        normalizeString(
          career,
          "Software Developer"
        );

      const safeQuestion =
        String(question).trim();

      const safeAnswer =
        String(answer).trim();

      if (
        safeQuestion.length > 10000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Question is too long.",
        });
      }

      if (
        safeAnswer.length > 20000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Answer is too long.",
        });
      }

      const prompt = `
You are an expert technical interviewer.

CAREER:
${safeCareer}

QUESTION:
${safeQuestion}

STUDENT ANSWER:
${safeAnswer}

Evaluate the student's answer fairly.

Consider:
- Technical correctness
- Understanding
- Relevance
- Communication
- Completeness

Return valid JSON only.

Rules:
1. score must be from 0 to 100.
2. rating must be concise.
3. feedback must be useful.
4. strengths must be an array.
5. improvements must be an array.
6. idealAnswer must be a clear example.

Return exactly:

{
  "score": 0,
  "rating": "Needs Improvement",
  "feedback": "Detailed but concise feedback",
  "strengths": [],
  "improvements": [],
  "idealAnswer": "Example of a better answer"
}
`;

      const aiText = await generateOrFallback(
        { task: "mock_interview_evaluate", prompt, userId: req.studentId || null },
        fallback.ruleBasedEvaluation({ answer })
      );

      const result =
        cleanAIJson(aiText);

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return res.status(500).json({
          success: false,
          message:
            "AI returned invalid evaluation.",
        });
      }

      result.score =
        clampScore(
          result.score
        );

      result.rating =
        normalizeString(
          result.rating,
          "Needs Improvement"
        );

      result.feedback =
        normalizeString(
          result.feedback
        );

      result.strengths =
        normalizeArray(
          result.strengths
        );

      result.improvements =
        normalizeArray(
          result.improvements
        );

      result.idealAnswer =
        normalizeString(
          result.idealAnswer
        );

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
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// MOCK INTERVIEW — FINAL REPORT
// =====================================================

app.post(
  "/api/mock-interview/report",
  optionalAuth,
  async (req, res) => {
    try {
      if (!checkAI(res)) {
        return;
      }

      const data =
        req.body || {};

      const prompt = `
You are an expert career interview coach.

Create a final mock interview performance report based on the student's interview data below.

DATA:
${JSON.stringify(
  data,
  null,
  2
)}

Return valid JSON only.

Rules:

1. overallScore must be from 0 to 100.
2. technicalScore must be from 0 to 100.
3. communicationScore must be from 0 to 100.
4. problemSolvingScore must be from 0 to 100.
5. strengths must be an array.
6. weaknesses must be an array.
7. recommendations must be an array.
8. Summary must be personalized.
9. Do not use markdown.
10. Do not add anything outside JSON.

Return exactly:

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

      const aiResult = await aiOrchestrator.generate({ task: "mock_interview_report", prompt, userId: req.studentId || null });
      const aiText = aiResult.text;

      const result =
        cleanAIJson(aiText);

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return res.status(500).json({
          success: false,
          message:
            "AI returned invalid interview report.",
        });
      }

      result.overallScore =
        clampScore(
          result.overallScore
        );

      result.technicalScore =
        clampScore(
          result.technicalScore
        );

      result.communicationScore =
        clampScore(
          result.communicationScore
        );

      result.problemSolvingScore =
        clampScore(
          result.problemSolvingScore
        );

      result.summary =
        normalizeString(
          result.summary
        );

      result.strengths =
        normalizeArray(
          result.strengths
        );

      result.weaknesses =
        normalizeArray(
          result.weaknesses
        );

      result.recommendations =
        normalizeArray(
          result.recommendations
        );

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
        error:
          getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// FEEDBACK (quantitative ratings + verbatim comments)
// =====================================================

app.post("/api/feedback", optionalAuth, (req, res) => {
  const { feature, rating, comment } = req.body || {};
  const score = Number(rating);

  if (
    !feature ||
    typeof feature !== "string" ||
    !Number.isInteger(score) ||
    score < 1 ||
    score > 5
  ) {
    return res.status(400).json({
      success: false,
      message: "feature (string) and rating (integer 1-5) are required.",
    });
  }

  const result = db
    .prepare(
      "INSERT INTO feedback (student_id, feature, rating, comment) VALUES (?, ?, ?, ?)"
    )
    .run(
      req.studentId || null,
      feature.trim().slice(0, 100),
      score,
      typeof comment === "string" ? comment.trim().slice(0, 2000) : null
    );

  return res.status(201).json({
    success: true,
    id: Number(result.lastInsertRowid),
  });
});

app.get("/api/feedback/summary", (req, res) => {
  const rows = db
    .prepare(
      `SELECT feature, COUNT(*) AS responses,
              ROUND(AVG(rating), 2) AS average_rating
       FROM feedback GROUP BY feature ORDER BY feature`
    )
    .all();

  return res.json({ success: true, summary: rows });
});

// =====================================================
// AI ORCHESTRATION AUDIT LOG (authenticated)
// =====================================================

app.get("/api/ai/logs", requireAuth, (req, res) => {
  res.json({
    success: true,
    providers: aiOrchestrator.availableProviders(),
    stats: aiOrchestrator.stats(),
    logs: aiOrchestrator.recentLogs(req.query.limit),
  });
});

// =====================================================
// MULTER / FILE ERROR HANDLER
// =====================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Resume file is too large. Maximum size is 10 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          `File upload error: ${error.message}`,
      });
    }

    if (
      error &&
      error.message &&
      error.message.startsWith(
        "Only PDF"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    if (
      error &&
      error.message &&
      error.message.startsWith(
        "CORS policy"
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Request blocked by CORS policy.",
      });
    }

    return next(error);
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Global Server Error:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    res.status(500).json({
      success: false,

      message:
        "Internal server error.",

      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : getErrorMessage(
              error
            ),
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {
    console.log(
      "=========================================="
    );

    console.log(
      "AI CAREER NAVIGATOR BACKEND"
    );

    console.log(
      "=========================================="
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `AI model: ${AI_MODEL}`
    );

    console.log(
      `OpenAI configured: ${Boolean(
        openai
      )}`
    );

    console.log(
      `JWT configured: ${Boolean(
        process.env.JWT_SECRET
      )}`
    );

    console.log(
      `Email configured: ${Boolean(
        emailTransporter
      )}`
    );

    console.log(
      "=========================================="
    );
  }
);