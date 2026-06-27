import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2, AlertCircle } from "lucide-react";
import {
  cn,
  decodeHtml,
  DIFFICULTIES,
  QUESTION_COUNTS,
  saveQuizSession,
  shuffle,
  TOPICS,
} from "@/lib/utils";
import { getQuiz } from "@/service/quiz";
import { useNavigate } from "react-router";

export function QuizConfigurator() {
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [difficulty, setDifficulty] = useState("easy");
  const [count, setCount] = useState(10);

  const [status, setStatus] = useState("idle");
  const [quizData, setQuizData] = useState(null);

  const navigate = useNavigate();

  const handleGenerate = async () => {
    setStatus("loading");
    setQuizData(null);

    try {
      const dataQuizRaw = await getQuiz({
        amount: count,
        category: topic,
        difficulty,
      });

      const questions = dataQuizRaw.results.map((q, idx) => {
        const options = shuffle([
          decodeHtml(q.correct_answer),
          ...q.incorrect_answers.map(decodeHtml),
        ]);
        return {
          id: `${idx}`,
          question: decodeHtml(q.question),
          options,
          answerIndex: options.indexOf(q.correct_answer),
        };
      });

      setTimeout(() => {
        setQuizData(questions);
        setStatus("ready");
      }, 4000);
    } catch (err) {
      console.log(err);
      setStatus(err.code === "UNAVAILABLE" ? "unavailable" : "error");
    }
  };

  const handleStart = () => {
    if (status !== "ready") return;
    const duration = count * 60 * 1000;

    const session = {
      questions: quizData,
      answers: {},
      currentIndex: 0,
      endTime: Date.now() + duration,
      submitted: false,
    };

    saveQuizSession(session);
    navigate("/quiz");
  };

  const updateConfig = (setter) => (value) => {
    setter(value);
    if (status !== "idle") {
      setStatus("idle");
      setQuizData(null);
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleGenerate();
      }}
      className="w-full max-w-3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-medium mb-3">
              <span aria-hidden>🧪</span> Topik Quiz
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map(({ id, label, desc, icon: Icon }) => (
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
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <CardContent className="p-4">
                    <Icon className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </fieldset>
        </div>

        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-medium mb-3">
            <span aria-hidden>⚡</span> Tingkat Kesusahan
          </legend>
          <div className="flex flex-col gap-3">
            {DIFFICULTIES.map(({ id, label, desc, icon: Icon, color }) => (
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
                    : "border-border hover:border-primary/40",
                )}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      color,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end items-center justify-between  gap-6 mt-8 md:mb-4 mb-8">
        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-medium mb-3">
            <HelpCircle className="h-4 w-4" /> Jumlah Soal
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
              {isGenerating && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isGenerating ? "Lagi ambil soal..." : "Generate"}
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
        </div>
      </div>
      {isUnavailable && (
        <p className="flex items-center gap-1.5 text-sm text-destructive text-center">
          <AlertCircle className="h-4 w-4" />
          Soal tidak tersedia untuk kategori yang kamu pilih!
        </p>
      )}
      {hasError && (
        <p className="flex items-center gap-1.5 text-sm text-destructive text-center">
          <AlertCircle className="h-4 w-4" />
          Gagal ambil soal nih, kamu coba beberapa saat lagi!
        </p>
      )}
      {canStart && (
        <p className="text-sm text-muted-foreground text-center">
          {quizData.length} soal udah siap nih. Klik "Start Quiz!" untuk mulai.
        </p>
      )}
    </form>
  );
}
