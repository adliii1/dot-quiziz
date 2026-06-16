// ---------------------------------------------------------------------------
// OpenTDB API helper
//
// GET https://opentdb.com/api.php?amount={count}&category={topic}&difficulty={difficulty}&type=multiple
//
// response_code:
//   0 = Success
//   1 = No Results (not enough questions for this combination) -> "unavailable"
//   2 = Invalid Parameter
//   5 = Rate Limit (too many requests, ~1 per 5s per IP)
// ---------------------------------------------------------------------------

// OpenTDB category IDs: https://opentdb.com/api_category.php
export const TOPICS = [
  { id: 18, label: "Computer Science", desc: "Algorithms & hardware", icon: "Code" },
  { id: 19, label: "Mathematics", desc: "Numbers & logic", icon: "Sigma" },
  { id: 22, label: "Geography", desc: "Maps & places", icon: "Globe" },
  { id: 21, label: "Sports", desc: "Games & athletes", icon: "Trophy" },
];

export const DIFFICULTIES = [
  { id: "easy", label: "Easy", desc: "Chill and fun" },
  { id: "medium", label: "Medium", desc: "A fair challenge" },
  { id: "hard", label: "Hard", desc: "Expert mode only" },
];

export const QUESTION_COUNTS = [5, 10, 15, 20];

// Total quiz duration: 60 seconds per question.
export const SECONDS_PER_QUESTION = 60;

function decodeHtml(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

// Fisher-Yates shuffle
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function generateQuiz({ topic, difficulty, count }) {
  const url = `https://opentdb.com/api.php?amount=${count}&category=${topic}&difficulty=${difficulty}&type=multiple`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch quiz (status ${response.status})`);
  }

  const data = await response.json();

  if (data.response_code === 1) {
    const err = new Error("No questions returned");
    err.code = "UNAVAILABLE";
    throw err;
  }

  if (data.response_code === 5) {
    const err = new Error("Rate limited by OpenTDB, please wait a few seconds");
    err.code = "RATE_LIMITED";
    throw err;
  }

  if (data.response_code !== 0) {
    throw new Error(`OpenTDB error (code ${data.response_code})`);
  }

  const questions = data.results.map((q, idx) => {
    const options = shuffle([
      decodeHtml(q.correct_answer),
      ...q.incorrect_answers.map(decodeHtml),
    ]);
    return {
      id: `${idx}`,
      question: decodeHtml(q.question),
      options,
      answerIndex: options.indexOf(decodeHtml(q.correct_answer)),
    };
  });

  return { questions, meta: { topic, difficulty, count } };
}

// ---------------------------------------------------------------------------
// Quiz session persistence (localStorage)
//
// Stores everything needed to resume after a refresh:
// - questions (so QuizPlay doesn't need location.state)
// - answers given so far
// - currentIndex
// - endTime (absolute timestamp, ms since epoch) — survives refresh because
//   it's computed against Date.now(), not a countdown number.
//
// IMPORTANT: localStorage is shared across tabs of the same origin. Opening
// a second tab will share/continue the SAME quiz session and timer, not
// start an independent one. If you need per-tab isolation, this needs to
// move to sessionStorage + a different refresh strategy (out of scope here).
// ---------------------------------------------------------------------------

const STORAGE_KEY = "quiz_session";

export function saveQuizSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadQuizSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearQuizSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function startQuizSession({ questions, meta }) {
  const durationMs = questions.length * SECONDS_PER_QUESTION * 1000;
  const session = {
    questions,
    meta,
    answers: {},
    currentIndex: 0,
    endTime: Date.now() + durationMs,
    submitted: false,
  };
  saveQuizSession(session);
  return session;
}
