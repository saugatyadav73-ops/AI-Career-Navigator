/**
 * Deterministic (no-LLM) engines used when no AI provider is configured
 * or every provider fails, so the application keeps working offline.
 * Responses carry `engine: "rules"` so the UI/logs can tell them apart.
 */

const CAREERS = [
  {
    name: "AI / Machine Learning Engineer",
    keywords: ["artificial intelligence", "machine learning", "ai", "ml", "deep learning", "python", "data science", "tensorflow", "pytorch", "nlp", "ai applications"],
    skills: ["Python", "Machine Learning", "Statistics", "Deep Learning", "MLOps"],
  },
  {
    name: "Data Analyst / Data Scientist",
    keywords: ["data", "analytics", "analysis", "statistics", "sql", "databases", "excel", "power bi", "tableau", "data analysis systems"],
    skills: ["SQL", "Data Visualization", "Statistics", "Python (pandas)", "Business Analytics"],
  },
  {
    name: "Full Stack Web Developer",
    keywords: ["web", "frontend", "backend", "react", "javascript", "html", "css", "node", "design", "web applications", "building software", "software"],
    skills: ["JavaScript", "React", "Node.js", "REST APIs", "Databases"],
  },
  {
    name: "Cybersecurity Analyst",
    keywords: ["security", "cybersecurity", "network", "network security", "hacking", "investigation", "penetration", "security systems", "linux"],
    skills: ["Networking", "Linux", "Cryptography", "Penetration Testing", "Incident Response"],
  },
];

function collectText(data) {
  const parts = [];
  const walk = (v) => {
    if (v == null) return;
    if (typeof v === "string") parts.push(v.toLowerCase());
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(data);
  return parts.join(" | ");
}

function ruleBasedCareerAnalysis(data = {}) {
  const text = collectText(data);

  const scored = CAREERS.map((career) => {
    let hits = 0;
    for (const kw of career.keywords) {
      const re = new RegExp(`(^|[^a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "g");
      const m = text.match(re);
      if (m) hits += m.length;
    }
    return { career, hits };
  }).sort((a, b) => b.hits - a.hits);

  const best = scored[0];
  const total = scored.reduce((s, x) => s + x.hits, 0);
  const match = total === 0 ? 60 : Math.min(95, Math.round(55 + (best.hits / total) * 40));
  const career = best.hits === 0 ? CAREERS[2] : best.career;

  return {
    engine: "rules",
    recommendedCareer: career.name,
    careerMatch: match,
    summary: `Based on your interests and skills, ${career.name} is the closest match (rule-based analysis; configure an AI provider for a personalised LLM report).`,
    strengths: [
      "Clear interest signals aligned with this career path",
      "Foundation in computer science concepts",
      "Willingness to assess skills and plan a roadmap",
    ],
    skillsToImprove: career.skills.slice(0, 4),
    nextSteps: [
      `Build one portfolio project focused on ${career.skills[0]}`,
      `Complete a structured course covering ${career.skills[1]}`,
      "Take the Skill Gap assessment and follow the generated roadmap",
      "Practice with the Mock Interview module weekly",
    ],
    reason: `Highest keyword overlap between your answers and the ${career.name} skill profile.`,
  };
}

const QUESTION_BANK = {
  default: [
    "Tell me about a project you built and the hardest problem you solved in it.",
    "How do you approach debugging a problem you have never seen before?",
    "Explain the difference between a process and a thread.",
    "What is the difference between SQL and NoSQL databases and when would you use each?",
    "How would you explain REST APIs to a non-technical person?",
    "Describe how you manage your time when working on several deadlines.",
    "What is Big-O notation and why does it matter?",
    "How do you keep your technical skills up to date?",
  ],
};

function ruleBasedInterviewQuestion({ career = "Software Developer", difficulty = "beginner", previousQuestions = [] } = {}) {
  const asked = new Set((previousQuestions || []).map((q) => String(q?.question || q).toLowerCase()));
  const pool = QUESTION_BANK.default.filter((q) => !asked.has(q.toLowerCase()));
  const question = (pool.length ? pool : QUESTION_BANK.default)[Math.floor(Math.random() * (pool.length || QUESTION_BANK.default.length))];
  return { engine: "rules", question, category: "General", difficulty, career };
}

function ruleBasedEvaluation({ answer = "" } = {}) {
  const words = String(answer).trim().split(/\s+/).filter(Boolean).length;
  const score = Math.max(10, Math.min(85, Math.round(Math.min(words, 120) * 0.7)));
  return {
    engine: "rules",
    score,
    rating: score >= 70 ? "Good" : score >= 40 ? "Average" : "Needs Improvement",
    feedback:
      "Automatic length-and-structure check (no AI provider configured). Add concrete examples, explain your reasoning and conclude with the result.",
    strengths: words > 40 ? ["Answer has reasonable depth"] : [],
    improvements: ["Add a specific example", "Explain trade-offs and outcomes"],
    idealAnswer: "A strong answer states the concept, gives a short example from your own work, and ends with the result or lesson learned.",
  };
}

module.exports = {
  ruleBasedCareerAnalysis,
  ruleBasedInterviewQuestion,
  ruleBasedEvaluation,
};
