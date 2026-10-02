/**
 * Static knowledge base used by the rule-based engines (works with NO API key)
 * and as grounding context injected into LLM prompts.
 */

// ---------- skill normalisation ----------
const SYNONYMS = {
  js: "javascript", "java script": "javascript", es6: "javascript", ecmascript: "javascript",
  ts: "typescript", reactjs: "react", "react.js": "react", nodejs: "node.js", node: "node.js",
  expressjs: "express", "express.js": "express", mongo: "mongodb", postgres: "sql", postgresql: "sql",
  mysql: "sql", sqlite: "sql", dbms: "sql", ml: "machine learning", dl: "deep learning",
  "artificial intelligence": "machine learning", ai: "machine learning", sklearn: "scikit-learn",
  "scikit learn": "scikit-learn", py: "python", "c plus plus": "c++", cpp: "c++", "html5": "html",
  "css3": "css", tailwindcss: "tailwind", "rest api": "rest apis", "rest": "rest apis", api: "rest apis",
  apis: "rest apis", "data structures": "dsa", "data structure": "dsa", algorithms: "dsa",
  "data structures and algorithms": "dsa", "operating system": "operating systems", os: "operating systems",
  "computer networks": "networking", network: "networking", "version control": "git", github: "git",
  k8s: "kubernetes", "amazon web services": "aws", "google cloud": "gcp", "power bi": "power bi",
  powerbi: "power bi", excel: "excel", "ms excel": "excel", pandas: "pandas", numpy: "numpy",
  "problem solving": "dsa", oops: "oop", "object oriented programming": "oop", "object oriented": "oop",
  "tensor flow": "tensorflow", "pytorch": "pytorch", "cyber security": "cybersecurity",
  "ethical hacking": "penetration testing", pentesting: "penetration testing", "ui ux": "ui/ux",
  figma: "ui/ux", flutter: "flutter", "react native": "react native", android: "android", kotlin: "kotlin",
};

function normSkill(s) {
  const k = String(s || "").toLowerCase().replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  return SYNONYMS[k] || k;
}
function normList(list) {
  const arr = Array.isArray(list) ? list : typeof list === "string" ? list.split(/[,;\n|]/) : [];
  return [...new Set(arr.map((x) => (typeof x === "object" && x ? x.name || x.skill : x)).map(normSkill).filter(Boolean))];
}
function pretty(s) {
  const special = { sql: "SQL", dsa: "DSA", oop: "OOP", html: "HTML", css: "CSS", aws: "AWS", gcp: "GCP", git: "Git",
    "node.js": "Node.js", "rest apis": "REST APIs", "ui/ux": "UI/UX", javascript: "JavaScript", typescript: "TypeScript",
    mongodb: "MongoDB", tensorflow: "TensorFlow", pytorch: "PyTorch", "scikit-learn": "scikit-learn", "power bi": "Power BI",
    "c++": "C++", cybersecurity: "Cybersecurity", kubernetes: "Kubernetes", docker: "Docker", linux: "Linux", ci: "CI" };
  if (special[s]) return special[s];
  return String(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- career roles ----------
// skills: [name, weight(1-3)]
const ROLES = [
  { id: "fullstack", name: "Full Stack Web Developer",
    keywords: ["web", "frontend", "backend", "react", "javascript", "html", "css", "node", "design", "software", "website", "full stack", "ui"],
    skills: [["html",2],["css",2],["javascript",3],["react",3],["node.js",3],["express",2],["sql",2],["mongodb",1],["rest apis",3],["git",2],["typescript",1],["dsa",1]] },
  { id: "aiml", name: "AI / Machine Learning Engineer",
    keywords: ["ai", "ml", "machine learning", "deep learning", "nlp", "python", "neural", "tensorflow", "pytorch", "artificial intelligence", "llm", "computer vision"],
    skills: [["python",3],["machine learning",3],["statistics",2],["numpy",2],["pandas",2],["scikit-learn",2],["deep learning",3],["tensorflow",1],["pytorch",2],["sql",1],["git",1],["dsa",1]] },
  { id: "data", name: "Data Analyst / Data Scientist",
    keywords: ["data", "analytics", "analysis", "statistics", "sql", "excel", "power bi", "tableau", "visualization", "dashboard", "insights"],
    skills: [["sql",3],["excel",2],["python",3],["pandas",3],["statistics",3],["data visualization",2],["power bi",2],["machine learning",1],["numpy",1]] },
  { id: "cyber", name: "Cybersecurity Analyst",
    keywords: ["security", "cybersecurity", "hacking", "network security", "penetration", "malware", "forensics", "ethical hacking", "linux", "cryptography"],
    skills: [["networking",3],["linux",3],["cybersecurity",3],["cryptography",2],["penetration testing",3],["python",2],["operating systems",2],["sql",1],["git",1]] },
  { id: "backend", name: "Backend / Java Developer",
    keywords: ["backend", "server", "java", "spring", "api", "database", "microservices", "system design"],
    skills: [["java",3],["oop",3],["sql",3],["rest apis",3],["spring",2],["dsa",3],["git",2],["docker",1],["operating systems",1]] },
  { id: "devops", name: "DevOps / Cloud Engineer",
    keywords: ["devops", "cloud", "aws", "azure", "docker", "kubernetes", "ci/cd", "infrastructure", "deployment", "automation"],
    skills: [["linux",3],["git",2],["docker",3],["kubernetes",2],["aws",3],["ci",2],["networking",2],["python",1],["operating systems",1]] },
  { id: "mobile", name: "Mobile App Developer",
    keywords: ["mobile", "android", "ios", "app", "flutter", "react native", "kotlin"],
    skills: [["javascript",2],["react native",3],["flutter",2],["kotlin",1],["rest apis",3],["git",2],["ui/ux",2],["dsa",1],["sql",1]] },
];

function findRole(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return null;
  let best = null;
  let bestScore = 0;
  for (const r of ROLES) {
    let score = 0;
    if (t.includes(r.name.toLowerCase())) score += 10;
    if (t.includes(r.id)) score += 4;
    for (const k of r.keywords) if (t.includes(k)) score += 1;
    if (score > bestScore) { best = r; bestScore = score; }
  }
  return best;
}

// ---------- resources (stable official / search URLs only) ----------
const RES = {
  html: { docs: "https://developer.mozilla.org/en-US/docs/Learn_web_development", course: "freeCodeCamp Responsive Web Design" },
  css: { docs: "https://developer.mozilla.org/en-US/docs/Web/CSS", course: "freeCodeCamp Responsive Web Design" },
  javascript: { docs: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", course: "javascript.info (The Modern JavaScript Tutorial)" },
  typescript: { docs: "https://www.typescriptlang.org/docs/", course: "TypeScript Handbook" },
  react: { docs: "https://react.dev/learn", course: "React official tutorial (react.dev)" },
  "node.js": { docs: "https://nodejs.org/en/learn", course: "Node.js official learn guides" },
  express: { docs: "https://expressjs.com/", course: "Express.js guide" },
  python: { docs: "https://docs.python.org/3/tutorial/", course: "Python for Everybody (Coursera / free on py4e.com)" },
  sql: { docs: "https://www.w3schools.com/sql/", course: "SQLBolt interactive lessons" },
  git: { docs: "https://git-scm.com/doc", course: "Pro Git book (free)" },
  "machine learning": { docs: "https://scikit-learn.org/stable/user_guide.html", course: "Andrew Ng - Machine Learning Specialization" },
  "deep learning": { docs: "https://www.deeplearning.ai/", course: "fast.ai Practical Deep Learning" },
  pandas: { docs: "https://pandas.pydata.org/docs/user_guide/10min.html", course: "Kaggle Learn - Pandas" },
  numpy: { docs: "https://numpy.org/doc/stable/user/absolute_beginners.html", course: "NumPy absolute beginners guide" },
  tensorflow: { docs: "https://www.tensorflow.org/tutorials", course: "TensorFlow tutorials" },
  pytorch: { docs: "https://pytorch.org/tutorials/", course: "PyTorch tutorials" },
  docker: { docs: "https://docs.docker.com/get-started/", course: "Docker Get Started" },
  kubernetes: { docs: "https://kubernetes.io/docs/tutorials/", course: "Kubernetes Basics tutorial" },
  linux: { docs: "https://linuxjourney.com/", course: "Linux Journey" },
  aws: { docs: "https://aws.amazon.com/getting-started/", course: "AWS Cloud Practitioner Essentials" },
  dsa: { docs: "https://neetcode.io/roadmap", course: "NeetCode roadmap + LeetCode practice" },
  java: { docs: "https://dev.java/learn/", course: "dev.java Learn" },
  oop: { docs: "https://dev.java/learn/oop/", course: "OOP concepts practice" },
  networking: { docs: "https://www.cloudflare.com/learning/", course: "Cloudflare Learning Center / Computer Networking (Kurose)" },
  cybersecurity: { docs: "https://owasp.org/www-project-top-ten/", course: "TryHackMe Pre-Security path" },
  "penetration testing": { docs: "https://portswigger.net/web-security", course: "PortSwigger Web Security Academy" },
  cryptography: { docs: "https://cryptopals.com/", course: "Cryptography I (Coursera)" },
  statistics: { docs: "https://www.khanacademy.org/math/statistics-probability", course: "Khan Academy Statistics & Probability" },
  excel: { docs: "https://support.microsoft.com/excel", course: "Excel for Data Analysis (free tutorials)" },
  "power bi": { docs: "https://learn.microsoft.com/power-bi/", course: "Microsoft Learn - Power BI" },
  "data visualization": { docs: "https://matplotlib.org/stable/tutorials/", course: "Kaggle Learn - Data Visualization" },
  "rest apis": { docs: "https://developer.mozilla.org/en-US/docs/Web/HTTP", course: "REST API design basics" },
  mongodb: { docs: "https://learn.mongodb.com/", course: "MongoDB University free courses" },
  flutter: { docs: "https://docs.flutter.dev/get-started", course: "Flutter codelabs" },
  "react native": { docs: "https://reactnative.dev/docs/getting-started", course: "React Native docs" },
  kotlin: { docs: "https://kotlinlang.org/docs/getting-started.html", course: "Kotlin Koans" },
  spring: { docs: "https://spring.io/guides", course: "Spring Guides" },
  "operating systems": { docs: "https://pages.cs.wisc.edu/~remzi/OSTEP/", course: "OSTEP (free book)" },
  "scikit-learn": { docs: "https://scikit-learn.org/stable/tutorial/index.html", course: "scikit-learn tutorials" },
  ci: { docs: "https://docs.github.com/actions", course: "GitHub Actions quickstart" },
  "ui/ux": { docs: "https://www.figma.com/resource-library/", course: "Google UX Design Certificate (audit)" },
};
const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const gs = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

function resourcesFor(skill) {
  const key = normSkill(skill);
  const r = RES[key];
  const name = pretty(key);
  const out = [];
  if (r) {
    out.push({ type: "Documentation", title: `${name} - official/primary docs`, url: r.docs });
    out.push({ type: "Course", title: r.course, url: gs(`${r.course} ${name}`) });
  } else {
    out.push({ type: "Course", title: `${name} - beginner course`, url: gs(`${name} full course for beginners`) });
  }
  out.push({ type: "Video", title: `${name} tutorial for beginners (YouTube)`, url: yt(`${name} tutorial for beginners`) });
  out.push({ type: "Practice", title: `${name} practice projects / exercises`, url: gs(`${name} practice exercises projects`) });
  return out;
}

// ---------- jobs catalogue (for Job Matcher) ----------
const JOBS = [
  { id: "j1", title: "Junior Frontend Developer", role: "fullstack", required: ["html","css","javascript","react","git"], nice: ["typescript","rest apis"] },
  { id: "j2", title: "Full Stack Developer (MERN)", role: "fullstack", required: ["javascript","react","node.js","express","mongodb","rest apis","git"], nice: ["typescript","docker"] },
  { id: "j3", title: "Node.js Backend Developer", role: "fullstack", required: ["javascript","node.js","express","sql","rest apis","git"], nice: ["docker","aws"] },
  { id: "j4", title: "Java Backend Developer", role: "backend", required: ["java","oop","sql","spring","rest apis","git"], nice: ["docker","dsa"] },
  { id: "j5", title: "Machine Learning Engineer (Entry)", role: "aiml", required: ["python","machine learning","numpy","pandas","scikit-learn","statistics"], nice: ["deep learning","pytorch","git"] },
  { id: "j6", title: "Data Analyst", role: "data", required: ["sql","excel","python","pandas","data visualization","statistics"], nice: ["power bi"] },
  { id: "j7", title: "Business Intelligence Analyst", role: "data", required: ["sql","power bi","excel","data visualization"], nice: ["python","statistics"] },
  { id: "j8", title: "SOC / Cybersecurity Analyst", role: "cyber", required: ["networking","linux","cybersecurity","operating systems"], nice: ["python","cryptography","penetration testing"] },
  { id: "j9", title: "Penetration Tester (Junior)", role: "cyber", required: ["networking","linux","penetration testing","python","cybersecurity"], nice: ["cryptography"] },
  { id: "j10", title: "DevOps Engineer (Entry)", role: "devops", required: ["linux","git","docker","ci","aws"], nice: ["kubernetes","python","networking"] },
  { id: "j11", title: "Cloud Support Associate", role: "devops", required: ["linux","aws","networking"], nice: ["docker","python"] },
  { id: "j12", title: "Mobile App Developer (React Native)", role: "mobile", required: ["javascript","react native","rest apis","git"], nice: ["typescript","ui/ux"] },
  { id: "j13", title: "Software Engineer (Generalist)", role: "backend", required: ["dsa","oop","sql","git"], nice: ["python","java","javascript"] },
];

// Extract known skills from free text (job description / resume)
const ALL_SKILLS = [...new Set([...Object.keys(RES), ...ROLES.flatMap((r) => r.skills.map((s) => s[0]))])];
function extractSkills(text) {
  const t = ` ${String(text || "").toLowerCase().replace(/[^a-z0-9+#./ -]/g, " ")} `;
  const found = new Set();
  for (const s of ALL_SKILLS) {
    const esc = s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    if (new RegExp(`[^a-z0-9]${esc}[^a-z0-9]`, "i").test(t)) found.add(s);
  }
  for (const [syn, canon] of Object.entries(SYNONYMS)) {
    if (syn.length < 3) continue;
    const esc = syn.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    if (new RegExp(`[^a-z0-9]${esc}[^a-z0-9]`, "i").test(t)) found.add(canon);
  }
  return [...found];
}

module.exports = { ROLES, JOBS, RES, normSkill, normList, pretty, findRole, resourcesFor, extractSkills, yt, gs };
