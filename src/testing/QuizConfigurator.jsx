import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code,
  Sigma,
  Globe,
  Trophy,
  Smile,
  Meh,
  Frown,
  HelpCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TOPICS,
  DIFFICULTIES,
  QUESTION_COUNTS,
  generateQuiz,
  startQuizSession,
} from "./quizApi";

const TOPIC_ICONS = { Code, Sigma, Globe, Trophy };
const DIFFICULTY_ICONS = {
  easy: { icon: Smile, color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" },
  medium: { icon: Meh, color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300" },
  hard: { icon: Frown, color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" },
};

export default function QuizConfigurator() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState(TOPICS[0].id);
  const [difficulty, setDifficulty] = useState("easy");
  const [count, setCount] = useState(10);

  // "idle" | "loading" | "ready" | "unavailable" | "error"
  const [status, setStatus] = useState("idle");
  const [quizData, setQuizData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleGenerate = async () => {
    setStatus("loading");
    setErrorMessage(null);
    setQuizData(null);

    try {
      const data = await generateQuiz({ topic, difficulty, count });
      setQuizData(data);
      setStatus("ready");
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong");
      setStatus(err.code === "UNAVAILABLE" || err.code === "RATE_LIMITED" ? "unavailable" : "error");
    }
  };

  const handleStart = () => {
    if (status !== "ready" || !quizData) return;
    // Persist the session (questions + answers + endTime) so QuizPlay
    // survives a refresh. This OVERWRITES any previous in-progress quiz.
    startQuizSession(quizData);
    navigate("/quiz/play");
  };

  // Reset readiness whenever the user changes the form, since the
  // previously generated quiz no longer matches the selected config.
  const updateConfig = (setter) => (value) => {
    setter(value);
    if (status !== "idle") {
      setStatus("idle");
      setQuizData(null);
      setErrorMessage(null);
    }
  };

  const handleTopicChange = updateConfig(setTopic);
  const handleDifficultyChange = updateConfig(setDifficulty);
  const handleCountChange = updateConfig(setCount);

  const isGenerating = status === "loading";
  const isUnavailable = status === "unavailable";
  const hasError = status === "error";
  const canStart = status === "ready" && !!quizData;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate();
        }}
        className="w-full max-w-3xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary underline decoration-2 underline-offset-8">
            Pick Your Challenge
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Customize your quiz session. Choose wisely!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Topic selection */}
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-medium mb-3">
              <span aria-hidden>🧪</span> Choose Topic
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map(({ id, label, desc, icon }) => {
                const Icon = TOPIC_ICONS[icon];
                return (
                  <Card
                    key={id}
                    role="radio"
                    aria-checked={topic === id}
                    tabIndex={0}
                    onClick={() => handleTopicChange(id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleTopicChange(id);
                      }
                    }}
                    className={cn(
                      "cursor-pointer transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      topic === id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <CardContent className="p-4">
                      <Icon className="h-5 w-5 mb-2 text-primary" />
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </fieldset>

          {/* Difficulty selection */}
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-medium mb-3">
              <span aria-hidden>⚡</span> Difficulty Level
            </legend>
            <div className="flex flex-col gap-3">
              {DIFFICULTIES.map(({ id, label, desc }) => {
                const { icon: Icon, color } = DIFFICULTY_ICONS[id];
                return (
                  <Card
                    key={id}
                    role="radio"
                    aria-checked={difficulty === id}
                    tabIndex={0}
                    onClick={() => handleDifficultyChange(id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleDifficultyChange(id);
                      }
                    }}
                    className={cn(
                      "cursor-pointer transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      difficulty === id
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Question count + actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-8">
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-medium mb-3">
              <HelpCircle className="h-4 w-4" /> Questions Count
            </legend>
            <Card className="inline-flex border-2 border-border p-1">
              <CardContent className="flex gap-1 p-0">
                {QUESTION_COUNTS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={count === n ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleCountChange(n)}
                    className="w-12"
                  >
                    {n}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </fieldset>

          <div className="flex flex-col items-stretch md:items-end gap-2 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                type="submit"
                size="lg"
                variant="outline"
                disabled={isGenerating}
                className="px-8 text-base font-semibold"
              >
                {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isGenerating ? "Generating..." : "Generate"}
              </Button>

              <Button
                type="button"
                size="lg"
                disabled={!canStart}
                onClick={handleStart}
                className="px-10 text-base font-semibold"
              >
                Start Quiz!
              </Button>
            </div>

            {isUnavailable && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errorMessage === "Rate limited by OpenTDB, please wait a few seconds"
                  ? "Terlalu banyak request ke OpenTDB. Tunggu beberapa detik lalu coba lagi."
                  : "Soal tidak tersedia untuk kombinasi ini. Coba kurangi jumlah soal atau ganti difficulty/topik."}
              </p>
            )}

            {hasError && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Gagal memuat soal{errorMessage ? `: ${errorMessage}` : "."} Coba lagi.
              </p>
            )}

            {canStart && (
              <p className="text-sm text-muted-foreground">
                {quizData.questions.length} soal siap ({quizData.questions.length} menit). Klik "Start Quiz!" untuk mulai.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
