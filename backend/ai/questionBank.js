/**
 * Offline question banks.
 *  - SUBJECT_BANK   : MCQs per subject/level (used when no AI key; AI generates fresh ones otherwise)
 *  - INTERVIEW_BANK : interview questions per career role with scoring keywords
 * Every call shuffles questions AND options, and skips previously-seen questions,
 * so a different set is served each time.
 */
const q = (level, question, correct, w1, w2, w3, explanation) => ({
  level, question, correctAnswer: correct, options: [correct, w1, w2, w3], explanation,
});

const SUBJECT_BANK = {
  python: [
    q("beginner","Which of these is an immutable data type in Python?","tuple","list","dict","set","Tuples cannot be modified after creation; lists, dicts and sets can."),
    q("beginner","What does len([1, 2, 3]) return?","3","2","4","Error","len returns the number of items."),
    q("beginner","Which keyword defines a function in Python?","def","func","function","lambda only","Functions are declared with def."),
    q("medium","What is the output of [x*x for x in range(3)]?","[0, 1, 4]","[1, 4, 9]","[0, 1, 2]","[0, 2, 4]","range(3) yields 0,1,2 and each is squared."),
    q("medium","What does the 'self' parameter represent in a class method?","The current instance","The class itself","The parent class","A global variable","self refers to the instance the method is called on."),
    q("advanced","What does a generator function use to produce values lazily?","yield","return","break","pass","yield pauses the function and resumes on next()."),
    q("advanced","Which is true about the GIL in CPython?","Only one thread executes Python bytecode at a time","It speeds up multithreading for CPU-bound code","It is removed in all Python versions","It only affects multiprocessing","The GIL limits CPU-bound thread parallelism; use multiprocessing for that."),
  ],
  javascript: [
    q("beginner","Which keyword declares a block-scoped variable that can be reassigned?","let","var","const","static","let is block scoped and reassignable; const cannot be reassigned."),
    q("beginner","What is the result of typeof null?","object","null","undefined","number","A historical quirk: typeof null is 'object'."),
    q("beginner","Which method adds an element to the end of an array?","push()","pop()","shift()","unshift()","push appends; pop removes the last element."),
    q("medium","What does === check compared to ==?","Value and type without coercion","Only value","Only type","Reference equality always","=== does not perform type coercion."),
    q("medium","What is a closure?","A function that remembers variables from its outer scope","A function with no parameters","A way to close a browser tab","A private class field","Closures keep access to their lexical environment."),
    q("advanced","What does await do inside an async function?","Pauses the function until the Promise settles","Blocks the whole thread","Creates a new thread","Cancels the Promise","await suspends only the async function, not the event loop."),
    q("advanced","Which queue runs first after the call stack empties?","Microtask queue (Promises)","Macrotask queue (setTimeout)","Render queue","Network queue","Promise callbacks (microtasks) run before timers."),
  ],
  java: [
    q("beginner","Which keyword is used to inherit a class in Java?","extends","implements","inherits","super","extends creates a subclass; implements is for interfaces."),
    q("beginner","What is the entry point method signature of a Java program?","public static void main(String[] args)","public void main()","static main()","void start()","The JVM looks for this exact signature."),
    q("medium","Which collection does NOT allow duplicate elements?","HashSet","ArrayList","LinkedList","Vector","Sets store unique elements."),
    q("medium","What is method overriding?","Redefining a parent method in a child class with the same signature","Defining two methods with different parameters","Hiding a variable","Calling a constructor","Overriding is runtime polymorphism."),
    q("advanced","What does the 'final' keyword on a class mean?","It cannot be subclassed","It cannot be instantiated","It is abstract","It is thread-safe","final classes (e.g., String) cannot be extended."),
    q("advanced","Which memory area stores objects in the JVM?","Heap","Stack","Method area only","Register","Objects live on the heap; locals/references on the stack."),
  ],
  sql: [
    q("beginner","Which SQL clause filters rows before grouping?","WHERE","HAVING","ORDER BY","GROUP BY","WHERE filters rows; HAVING filters groups."),
    q("beginner","Which statement retrieves data from a table?","SELECT","INSERT","UPDATE","CREATE","SELECT reads data."),
    q("medium","What does an INNER JOIN return?","Rows with matching values in both tables","All rows from the left table","All rows from both tables","Only unmatched rows","INNER JOIN keeps matches only."),
    q("medium","Which key uniquely identifies a row in a table?","Primary key","Foreign key","Composite index only","Candidate view","A primary key is unique and not null."),
    q("medium","What is normalization?","Organising data to reduce redundancy","Encrypting a database","Backing up data","Speeding up joins by duplication","Normal forms reduce anomalies and duplicates."),
    q("advanced","What does the ACID property 'Isolation' guarantee?","Concurrent transactions do not interfere","Data is never lost","All steps succeed or none do","Data satisfies constraints","Isolation hides intermediate states between transactions."),
    q("advanced","Which index type is most common for range queries in RDBMS?","B-tree","Hash","Bitmap only","Bloom filter","B-trees keep sorted order, supporting ranges."),
  ],
  dsa: [
    q("beginner","What is the time complexity of accessing an array element by index?","O(1)","O(n)","O(log n)","O(n^2)","Arrays offer constant-time indexing."),
    q("beginner","Which data structure follows LIFO?","Stack","Queue","Heap","Graph","Last In First Out is a stack."),
    q("medium","What is the average time complexity of binary search?","O(log n)","O(n)","O(1)","O(n log n)","Each step halves the search space."),
    q("medium","Which traversal uses a queue?","BFS","DFS","Inorder","Preorder","Breadth-first search uses a queue."),
    q("medium","Which sort has O(n log n) worst-case time?","Merge sort","Quick sort","Bubble sort","Insertion sort","Merge sort always runs in O(n log n)."),
    q("advanced","Dijkstra's algorithm fails when the graph has...","Negative edge weights","Cycles","Self loops with positive weight","Multiple components","Use Bellman-Ford for negative weights."),
    q("advanced","What technique stores sub-problem results to avoid recomputation?","Dynamic programming","Greedy","Backtracking","Divide and conquer only","DP uses memoization/tabulation."),
  ],
  react: [
    q("beginner","What is JSX?","A syntax extension that lets you write HTML-like code in JavaScript","A CSS preprocessor","A database","A build tool","JSX compiles to React.createElement calls."),
    q("beginner","Which hook manages local component state?","useState","useRef only","useRouter","useFetch","useState returns state and a setter."),
    q("medium","When does useEffect with an empty dependency array run?","Once after the first render","On every render","Never","Before render","[] means mount-only."),
    q("medium","Why are keys needed in lists?","To help React identify items between renders","To style items","To sort items","To make items clickable","Stable keys enable efficient reconciliation."),
    q("advanced","What does React.memo do?","Skips re-rendering when props are unchanged","Stores data in localStorage","Creates global state","Delays rendering","It memoizes the component output."),
    q("advanced","Which hook avoids prop drilling by reading shared values?","useContext","useMemo","useCallback","useReducer only","Context provides values to descendants."),
  ],
  "html/css": [
    q("beginner","Which HTML tag creates a hyperlink?","<a>","<link>","<href>","<url>","Anchor tags create links."),
    q("beginner","Which CSS property changes text colour?","color","font-color","text-style","foreground","color sets the text colour."),
    q("medium","Which CSS layout model is best for one-dimensional alignment?","Flexbox","Float","Table","Position absolute","Flexbox lays out items in a row or column."),
    q("medium","What does the box model include from inside out?","Content, padding, border, margin","Margin, border, padding, content","Content, margin, border, padding","Padding, content, margin, border","Standard CSS box model order."),
    q("advanced","What does 'position: sticky' do?","Toggles between relative and fixed based on scroll","Fixes an element permanently","Removes it from flow","Centres it","Sticky elements stick once a scroll threshold is reached."),
  ],
  "machine learning": [
    q("beginner","Which type of learning uses labelled data?","Supervised learning","Unsupervised learning","Reinforcement learning","Self-play only","Supervised learning maps inputs to known labels."),
    q("beginner","Which of these is a regression task?","Predicting house prices","Classifying spam","Clustering customers","Detecting faces","Regression predicts continuous values."),
    q("medium","What is overfitting?","Model fits training data too closely and generalises poorly","Model is too simple","Model trains too fast","Data is too small to load","Overfit models have low train error but high test error."),
    q("medium","Which technique helps reduce overfitting?","Regularisation","Adding more layers always","Removing validation data","Training longer without checks","L1/L2, dropout and early stopping reduce overfitting."),
    q("medium","What does the confusion matrix help evaluate?","Classification performance","Clustering speed","Memory usage","Feature names","It shows TP, FP, TN, FN."),
    q("advanced","What does gradient descent minimise?","The loss function","The dataset size","The number of features","Training time directly","Parameters are updated opposite the gradient of the loss."),
    q("advanced","Which metric is better than accuracy for imbalanced classes?","F1-score","Mean squared error","R-squared","Epoch count","F1 balances precision and recall."),
  ],
  networking: [
    q("beginner","Which layer of the OSI model handles IP addressing?","Network layer","Data link layer","Transport layer","Application layer","Layer 3 deals with IP and routing."),
    q("beginner","What does DNS do?","Translates domain names to IP addresses","Encrypts traffic","Assigns MAC addresses","Blocks ports","DNS is the internet's phonebook."),
    q("medium","Which protocol is connection-oriented?","TCP","UDP","ICMP","ARP","TCP uses a three-way handshake."),
    q("medium","Which port does HTTPS use by default?","443","80","21","25","HTTPS uses port 443."),
    q("advanced","What is the purpose of NAT?","Map private IP addresses to a public address","Encrypt packets","Assign hostnames","Route BGP","NAT lets many private hosts share one public IP."),
  ],
  "operating systems": [
    q("beginner","What is a process?","A program in execution","A file on disk","A CPU register","A kernel module only","A process is an executing instance of a program."),
    q("medium","Which scheduling algorithm can cause starvation?","Priority scheduling","Round robin","FCFS","Multilevel feedback with ageing","Low-priority processes may never run without ageing."),
    q("medium","What is a deadlock?","Processes waiting on each other forever","A crashed process","A full disk","A slow CPU","Circular wait over resources."),
    q("advanced","Which technique maps virtual to physical memory?","Paging","Caching only","Spooling","Swapping disks","Page tables translate virtual pages to frames."),
    q("advanced","What does a semaphore provide?","Synchronisation between processes/threads","Faster disk reads","Memory compression","Network routing","Semaphores control access to shared resources."),
  ],
  git: [
    q("beginner","Which command creates a local copy of a remote repo?","git clone","git init","git fetch","git pull","clone downloads the repo and history."),
    q("beginner","Which command stages changes?","git add","git commit","git push","git stash","add moves changes to the staging area."),
    q("medium","What does git merge do?","Combines histories of two branches","Deletes a branch","Reverts a commit","Lists branches","merge integrates another branch into the current one."),
    q("advanced","What does git rebase do?","Reapplies commits on top of another base","Deletes remote history","Creates a tag","Resets the index only","Rebase rewrites commits onto a new base."),
  ],
  cybersecurity: [
    q("beginner","What does the CIA triad stand for?","Confidentiality, Integrity, Availability","Control, Identity, Access","Cryptography, Integrity, Authentication","Confidentiality, Identity, Authorization","The three core security goals."),
    q("medium","What is SQL injection?","Inserting malicious SQL through user input","A database backup","A hashing method","A firewall rule","Use parameterised queries to prevent it."),
    q("medium","Which attack tricks users into revealing credentials via fake messages?","Phishing","DDoS","Buffer overflow","Man-in-the-middle only","Phishing relies on social engineering."),
    q("advanced","What does XSS allow an attacker to do?","Run scripts in a victim's browser","Crash the database","Sniff Wi-Fi","Brute-force SSH","Cross-site scripting injects client-side scripts; escape output."),
    q("advanced","Why salt passwords before hashing?","To defeat precomputed rainbow tables","To make hashes reversible","To shorten hashes","To speed up login","Unique salts make identical passwords hash differently."),
  ],
  "node.js": [
    q("beginner","Node.js runs JavaScript on...","The server using the V8 engine","Only in browsers","The JVM","A database","Node embeds Chrome's V8."),
    q("medium","Which module system does require() belong to?","CommonJS","ES Modules","AMD only","UMD only","require is CommonJS; import is ESM."),
    q("medium","What is middleware in Express?","A function that handles requests before the final handler","A database driver","A template engine","A frontend library","Middleware has access to req, res and next."),
    q("advanced","Why is Node.js good for I/O-heavy apps?","Non-blocking event loop","Multi-threaded by default","Compiled to machine code","It has no garbage collector","Async I/O keeps the single thread free."),
  ],
  docker: [
    q("beginner","What is a Docker image?","A read-only template used to create containers","A running process","A virtual machine disk","A network driver","Containers are instances of images."),
    q("medium","Which file defines how to build an image?","Dockerfile","docker-compose.yml only","package.json","Makefile","A Dockerfile lists build instructions."),
    q("advanced","What does Kubernetes primarily provide?","Container orchestration","Source control","Database hosting","Code compilation","It schedules, scales and heals containers."),
  ],
  statistics: [
    q("beginner","What is the median?","The middle value of ordered data","The most frequent value","The average","The range","Median splits the ordered data in half."),
    q("medium","What does a p-value below 0.05 usually indicate?","Evidence against the null hypothesis","The null hypothesis is true","The result is practically important","The sample is biased","It suggests statistical significance."),
    q("advanced","What does standard deviation measure?","Spread of data around the mean","Central value","Skewness only","Sample size","Larger SD means more dispersion."),
  ],
};

const SUBJECT_ALIASES = {
  python: ["python", "py", "pandas", "numpy"], javascript: ["javascript", "js", "typescript", "ts", "es6"], java: ["java", "spring", "oop", "oops"],
  sql: ["sql", "dbms", "database", "databases", "mysql", "postgres", "mongodb"], dsa: ["dsa", "data structures", "algorithms", "problem solving", "data structures and algorithms"],
  react: ["react", "reactjs", "frontend"], "html/css": ["html", "css", "web design", "html/css", "web development", "tailwind"],
  "machine learning": ["machine learning", "ml", "ai", "deep learning", "artificial intelligence", "data science", "tensorflow", "pytorch"],
  networking: ["networking", "computer networks", "network", "networks"], "operating systems": ["operating systems", "os", "operating system", "linux"],
  git: ["git", "github", "version control"], cybersecurity: ["cybersecurity", "cyber security", "security", "ethical hacking", "network security", "cryptography"],
  "node.js": ["node", "node.js", "nodejs", "express", "backend"], docker: ["docker", "devops", "kubernetes", "cloud", "aws"], statistics: ["statistics", "probability", "maths", "math"],
};

function resolveSubject(subject) {
  const s = String(subject || "").toLowerCase().trim();
  if (!s) return null;
  if (SUBJECT_BANK[s]) return s;
  for (const [key, aliases] of Object.entries(SUBJECT_ALIASES)) if (aliases.includes(s)) return key;
  for (const [key, aliases] of Object.entries(SUBJECT_ALIASES)) if (aliases.some((a) => a.length > 2 && s.includes(a))) return key;
  return null;
}
function listSubjects() {
  return Object.keys(SUBJECT_BANK).map((k) => ({ subject: k, questions: SUBJECT_BANK[k].length }));
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function levelOrder(level) {
  const l = String(level || "beginner").toLowerCase();
  const norm = l === "intermediate" ? "medium" : l;
  return norm === "advanced" ? ["advanced", "medium", "beginner"] : norm === "medium" ? ["medium", "beginner", "advanced"] : ["beginner", "medium", "advanced"];
}
function subjectQuestions({ subject, difficulty, count = 10, exclude = [] }) {
  const key = resolveSubject(subject);
  if (!key) return null;
  const seen = new Set(exclude.map((x) => String(x?.question || x).toLowerCase().trim()));
  const order = levelOrder(difficulty);
  const pool = [];
  for (const lvl of order) pool.push(...shuffle(SUBJECT_BANK[key].filter((x) => x.level === lvl)));
  const fresh = pool.filter((x) => !seen.has(x.question.toLowerCase()));
  const chosen = (fresh.length >= Math.min(count, pool.length) ? fresh : pool).slice(0, count);
  return {
    subject: key,
    questions: chosen.map((x, i) => ({
      id: i + 1, question: x.question, options: shuffle(x.options), correctAnswer: x.correctAnswer,
      explanation: x.explanation, difficulty: x.level,
    })),
    poolSize: pool.length,
  };
}

// ---------------- interview bank ----------------
const iq = (question, keywords, ideal, level = "beginner") => ({ question, keywords, ideal, level });
const INTERVIEW_BANK = {
  default: [
    iq("Tell me about a project you built and the hardest problem you solved in it.", ["problem","solution","tested","result","learned","team"], "Describe the project goal, the specific problem, your approach, and the measurable result."),
    iq("How do you debug a problem you have never seen before?", ["reproduce","logs","isolate","hypothesis","test","fix"], "Reproduce, read logs, isolate the cause, form hypotheses, fix and add a test."),
    iq("Explain the difference between a process and a thread.", ["memory","shared","context","concurrent","lightweight","isolation"], "Processes have isolated memory; threads share memory inside a process and are lighter to switch."),
    iq("What is Big-O notation and why does it matter?", ["complexity","time","space","scale","worst","input"], "It describes how time/space grow with input size so you can choose scalable algorithms."),
    iq("How do you keep your technical skills up to date?", ["projects","docs","courses","community","practice","learn"], "Mix of building projects, reading docs, structured courses and community involvement."),
  ],
  fullstack: [
    iq("Explain how the virtual DOM works in React.", ["diff","reconciliation","render","update","real dom","efficient"], "React keeps an in-memory tree, diffs it against the previous one and patches only the changed real DOM nodes."),
    iq("What is the difference between SQL and NoSQL, and when would you pick MongoDB?", ["schema","relational","document","scale","flexible","joins"], "SQL is relational with strict schema and joins; document stores suit flexible, nested data."),
    iq("How would you secure a REST API?", ["jwt","authentication","https","validation","rate limit","cors"], "Use HTTPS, JWT/session auth, input validation, rate limiting, CORS rules and least-privilege.", "medium"),
    iq("Explain the event loop in Node.js.", ["single","non-blocking","callback","queue","async","libuv"], "Node runs JS on one thread and offloads I/O; callbacks/promises are queued and processed by the event loop.", "medium"),
    iq("How would you optimise a slow React page?", ["memo","lazy","split","profiling","key","render"], "Profile, memoise, lazy-load/code-split, virtualise long lists and avoid needless re-renders.", "advanced"),
  ],
  aiml: [
    iq("What is the bias-variance trade-off?", ["underfit","overfit","complexity","generalize","error","regular"], "Simple models underfit (high bias); complex ones overfit (high variance); balance for generalisation."),
    iq("How do you evaluate a classification model on imbalanced data?", ["precision","recall","f1","roc","confusion","accuracy"], "Use precision/recall/F1, ROC-AUC and confusion matrix instead of plain accuracy.", "medium"),
    iq("Explain gradient descent.", ["loss","gradient","learning rate","update","minimum","iteration"], "Iteratively update parameters opposite to the loss gradient scaled by a learning rate."),
    iq("How do you prevent overfitting in neural networks?", ["dropout","regular","early stopping","data","augmentation","validation"], "Dropout, regularisation, early stopping, more/augmented data and validation monitoring.", "medium"),
    iq("Describe how you would take an ML model to production.", ["api","monitor","drift","version","pipeline","deploy"], "Package the model behind an API, version it, monitor drift/latency and automate retraining.", "advanced"),
  ],
  data: [
    iq("What is the difference between WHERE and HAVING?", ["group","aggregate","filter","rows","after","before"], "WHERE filters rows before grouping; HAVING filters groups after aggregation."),
    iq("How do you handle missing values in a dataset?", ["impute","drop","mean","median","analysis","bias"], "Understand why data is missing, then drop or impute (mean/median/model) while checking for bias."),
    iq("Explain the difference between correlation and causation.", ["relationship","cause","confound","experiment","variable"], "Correlation shows association; causation needs controlled experiments or causal analysis.", "medium"),
    iq("How would you present insights to a non-technical stakeholder?", ["story","visual","kpi","simple","action","audience"], "Lead with the business question, use simple visuals and KPIs and end with a recommended action."),
    iq("What is a window function in SQL?", ["over","partition","rank","row_number","running","aggregate"], "It computes values across related rows (e.g., rank, running total) without collapsing them.", "advanced"),
  ],
  cyber: [
    iq("Explain the difference between symmetric and asymmetric encryption.", ["key","public","private","aes","rsa","speed"], "Symmetric uses one shared key (fast, e.g., AES); asymmetric uses a public/private pair (e.g., RSA)."),
    iq("What is the OWASP Top 10 and name three risks.", ["injection","xss","authentication","access control","misconfiguration"], "A list of critical web risks such as injection, broken access control and XSS.", "medium"),
    iq("How does a TCP three-way handshake work?", ["syn","ack","syn-ack","connection","establish"], "Client SYN, server SYN-ACK, client ACK establishes the connection."),
    iq("What steps would you follow in an incident response?", ["identify","contain","eradicate","recover","lessons","log"], "Prepare, identify, contain, eradicate, recover and review lessons learned.", "medium"),
    iq("Explain how a man-in-the-middle attack works and how to prevent it.", ["intercept","tls","certificate","https","encrypt","verify"], "Attacker intercepts traffic between parties; prevent with TLS, certificate validation and secure Wi-Fi.", "advanced"),
  ],
  backend: [
    iq("Explain the four pillars of OOP.", ["encapsulation","inheritance","polymorphism","abstraction"], "Encapsulation, inheritance, polymorphism and abstraction."),
    iq("What is the difference between an abstract class and an interface in Java?", ["abstract","implement","multiple","default","method","state"], "Abstract classes can hold state and partial implementation; interfaces define contracts and allow multiple implementation.", "medium"),
    iq("How does HashMap work internally?", ["hash","bucket","collision","equals","resize","key"], "It hashes keys to buckets, handles collisions via chaining/trees and resizes at a load factor.", "medium"),
    iq("What is database indexing and its trade-off?", ["faster","read","write","b-tree","storage","query"], "Indexes speed up reads but cost storage and slow writes.", "medium"),
    iq("How would you design a URL shortener?", ["hash","database","cache","collision","scale","redirect"], "Generate unique IDs, store mappings, cache hot URLs, handle collisions and scale reads.", "advanced"),
  ],
  devops: [
    iq("What is the difference between a container and a virtual machine?", ["kernel","isolation","lightweight","hypervisor","image","os"], "Containers share the host kernel and are lightweight; VMs include a full guest OS on a hypervisor."),
    iq("Explain a CI/CD pipeline.", ["build","test","deploy","automation","commit","release"], "Automates build, test and deployment on every commit.", "medium"),
    iq("What is Infrastructure as Code?", ["terraform","version","declarative","reproducible","automation","template"], "Managing infrastructure through versioned, declarative code so it is reproducible.", "medium"),
    iq("How does Kubernetes handle a crashed pod?", ["restart","replica","controller","desired state","schedule","health"], "Controllers compare desired and actual state and recreate the pod, using probes for health.", "advanced"),
    iq("How do you monitor a production service?", ["metrics","logs","alert","latency","dashboard","uptime"], "Collect metrics, logs and traces, build dashboards and alert on SLOs.", "medium"),
  ],
  mobile: [
    iq("What is the difference between native and cross-platform development?", ["performance","code","platform","native","flutter","react native"], "Native uses platform languages for best performance; cross-platform shares code across iOS and Android."),
    iq("How do you manage state in a mobile app?", ["state","redux","provider","context","bloc","lifecycle"], "Use a state management approach (Context/Redux/Provider/Bloc) scoped to the app lifecycle.", "medium"),
    iq("How would you handle offline support?", ["cache","sync","local","storage","queue","conflict"], "Cache locally, queue writes, sync when online and resolve conflicts.", "medium"),
    iq("How do you optimise list performance in mobile apps?", ["virtualize","flatlist","recycle","lazy","memo","images"], "Virtualise/recycle list items, lazy-load images and avoid re-renders.", "advanced"),
    iq("How do you secure data stored on a device?", ["encrypt","keychain","keystore","token","https","sensitive"], "Use Keychain/Keystore, encryption, HTTPS and avoid storing secrets in plain text.", "advanced"),
  ],
};

function interviewQuestion({ roleId, difficulty, previousQuestions = [] }) {
  const asked = new Set(previousQuestions.map((x) => String(x?.question || x).toLowerCase().trim()));
  const bank = [...(INTERVIEW_BANK[roleId] || []), ...INTERVIEW_BANK.default];
  const order = levelOrder(difficulty);
  const ranked = [...shuffle(bank)].sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  const fresh = ranked.filter((x) => !asked.has(x.question.toLowerCase()));
  return (fresh.length ? fresh : ranked)[0];
}
function findInterviewItem(questionText) {
  const t = String(questionText || "").toLowerCase().trim();
  for (const list of Object.values(INTERVIEW_BANK)) {
    const hit = list.find((x) => x.question.toLowerCase() === t);
    if (hit) return hit;
  }
  return null;
}

module.exports = { SUBJECT_BANK, INTERVIEW_BANK, resolveSubject, listSubjects, subjectQuestions, interviewQuestion, findInterviewItem, shuffle };
