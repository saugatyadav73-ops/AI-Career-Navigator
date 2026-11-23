/** Extra offline question banks: aptitude (logical/numerical/verbal) and communication (situational). */
const q = (topic, level, question, correct, w1, w2, w3, explanation) => ({ topic, level, question, correctAnswer: correct, options: [correct, w1, w2, w3], explanation });

const APTITUDE = [
  q("numerical", "beginner", "What is 15% of 240?", "36", "32", "38", "24", "10% of 240 is 24 and 5% is 12, so 24 + 12 = 36."),
  q("logical", "beginner", "What comes next: 2, 6, 12, 20, 30, ?", "42", "40", "44", "36", "Differences are 4, 6, 8, 10, so the next difference is 12 and 30 + 12 = 42."),
  q("numerical", "beginner", "A train 120 m long passes a pole in 6 seconds. What is its speed?", "20 m/s", "12 m/s", "15 m/s", "24 m/s", "Speed = distance / time = 120 / 6 = 20 m/s."),
  q("logical", "beginner", "5 machines make 5 widgets in 5 minutes. How long do 100 machines need to make 100 widgets?", "5 minutes", "100 minutes", "20 minutes", "1 minute", "Each machine makes one widget in 5 minutes, so 100 machines make 100 widgets in 5 minutes."),
  q("verbal", "beginner", "Odd one out: Python, Java, HTML, C++", "HTML", "Python", "Java", "C++", "HTML is a markup language; the others are programming languages."),
  q("logical", "medium", "1, 1, 2, 3, 5, 8, ? - what comes next?", "13", "11", "12", "15", "Each term is the sum of the previous two (Fibonacci): 5 + 8 = 13."),
  q("numerical", "medium", "A is twice as old as B. Ten years ago A was three times as old as B. How old is A now?", "40", "30", "50", "60", "A = 2B and A - 10 = 3(B - 10) gives B = 20, so A = 40."),
  q("numerical", "medium", "A price rises 20% and then falls 20%. What is the net change?", "4% decrease", "No change", "4% increase", "20% decrease", "1.2 x 0.8 = 0.96, which is a 4% decrease."),
  q("numerical", "medium", "Two pipes fill a tank in 12 hours and 6 hours. How long do they take together?", "4 hours", "9 hours", "6 hours", "3 hours", "1/12 + 1/6 = 1/4 of the tank per hour, so 4 hours."),
  q("logical", "medium", "All roses are flowers. Some flowers fade quickly. Which conclusion is certain?", "None of the other statements can be concluded for certain", "Some roses fade quickly", "All flowers are roses", "No roses fade quickly", "The premises do not say whether the quickly fading flowers include roses."),
  q("numerical", "advanced", "In how many distinct ways can the letters of LEVEL be arranged?", "30", "60", "120", "15", "5! / (2! x 2!) = 120 / 4 = 30 because L and E each repeat twice."),
  q("numerical", "advanced", "The average of 5 numbers is 20. After removing one number the average of the rest is 18. Which number was removed?", "28", "26", "30", "32", "Total = 100, remaining total = 72, removed = 100 - 72 = 28."),
  q("numerical", "advanced", "What is the probability of exactly two heads in three fair coin tosses?", "3/8", "1/4", "1/2", "1/8", "There are 3 favourable outcomes (HHT, HTH, THH) out of 8, so 3/8."),
];

const COMMUNICATION = [
  q("interview", "beginner", "In an interview you did not hear the question clearly. What is the best response?", "Politely ask the interviewer to repeat or clarify it", "Guess and answer confidently", "Stay silent until they move on", "Change the topic", "Asking for clarification shows care and avoids answering the wrong question."),
  q("written", "beginner", "Which opening is most suitable for a formal email to your professor?", "Dear Professor Rao, I am writing to ask about the project deadline.", "Hey sir!!", "Yo prof, need help urgent", "Hi, reply fast", "A polite salutation and a clear purpose make formal emails effective."),
  q("listening", "beginner", "Active listening mainly involves:", "Giving full attention and paraphrasing to confirm understanding", "Preparing your reply while the other person speaks", "Interrupting to save time", "Checking your phone while nodding", "Active listening means focusing, reflecting back and asking questions."),
  q("teamwork", "medium", "A teammate misses a deadline that affects you. What is the best first step?", "Talk to them privately, describe the impact and ask how to resolve it", "Complain to the whole group", "Redo their work silently", "Report to the manager without speaking to them", "A direct, respectful conversation resolves most issues and preserves trust."),
  q("interview", "medium", "The STAR method for behavioural interview answers stands for:", "Situation, Task, Action, Result", "Skill, Time, Attitude, Result", "Situation, Team, Approach, Review", "Story, Task, Answer, Reflection", "STAR structures an example as Situation, Task, Action and Result."),
  q("clarity", "medium", "You must explain a technical concept to a non-technical stakeholder. What works best?", "Use plain language and an analogy, then check for understanding", "Use precise jargon so nothing is lost", "Send the documentation only", "Keep it extremely short and skip the context", "Adapting to the audience and checking understanding makes the message land."),
  q("presence", "medium", "Which behaviour shows confidence on a video call?", "Looking at the camera, upright posture and a calm pace", "Watching your own video constantly", "Speaking very fast", "Leaning back with arms crossed", "Eye contact with the camera, posture and pace project confidence."),
  q("feedback", "medium", "You receive critical feedback on your project. What should you do?", "Listen, ask clarifying questions and thank them", "Defend every decision immediately", "Ignore it", "Argue that the reviewer lacks context", "Receiving feedback openly helps you improve and builds credibility."),
  q("presentation", "advanced", "You do not know the answer to a question in a presentation Q&A. Best response?", "Admit it, share what you do know and promise a follow-up", "Make up a plausible answer", "Deflect to another person", "Say the question is irrelevant", "Honesty plus a follow-up protects your credibility."),
  q("influence", "advanced", "How should you disagree with a senior colleague's design in a meeting?", "Acknowledge their reasoning and present a data-backed alternative respectfully", "Stay quiet and complain later", "Say it will fail", "Change it after the meeting without telling them", "Respectful, evidence-based disagreement is constructive and builds influence."),
];

module.exports = { APTITUDE, COMMUNICATION };
