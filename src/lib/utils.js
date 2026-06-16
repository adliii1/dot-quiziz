import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Code, Sigma, Globe, Trophy, Smile, Meh, Frown } from "lucide-react";

const LOCALSTORAGEKEY = "quizConfiguration";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const DIFFICULTIES = [
  {
    id: "easy",
    label: "Mudah",
    desc: "Pengetahuan umum, dan ",
    icon: Smile,
    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  },
  {
    id: "medium",
    label: "Sedang",
    desc: "A fair challenge",
    icon: Meh,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
  },
  {
    id: "hard",
    label: "Sulit",
    desc: "Expert mode only",
    icon: Frown,
    color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
  },
];

export const TOPICS = [
  {
    id: 18,
    label: "Computer Science",
    desc: "Algoritma dan Perangkat Keras",
    icon: Code,
  },
  { id: 19, label: "Matematika", desc: "Perhitungan dan Logika", icon: Sigma },
  { id: 22, label: "Geografi", desc: "Maps & places", icon: Globe },
  { id: 21, label: "Sports", desc: "Game dan Atletik", icon: Trophy },
];

export const QUESTION_COUNTS = [5, 10, 15, 20];

export const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function decodeHtml(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

export const saveQuizSession = (session) => {
  localStorage.setItem(LOCALSTORAGEKEY, JSON.stringify(session));
};

export const loadQuizSession = () => {
  try {
    const rawDataQuiz = localStorage.getItem(LOCALSTORAGEKEY);
    if (!rawDataQuiz) return null;

    return JSON.parse(rawDataQuiz);
  } catch {
    return null;
  }
};

export const removeQuizSession = () => {
  localStorage.removeItem(LOCALSTORAGEKEY);
};
