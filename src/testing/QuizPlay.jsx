import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadQuizSession, saveQuizSession, clearQuizSession } from "./quizApi";

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function QuizPlay() {
  const navigate = useNavigate();

  // Load the session once on mount. Re-loading on every render would be
  // wasteful and would also fight with our own writes below.
  const [session, setSession] = useState(() => loadQuizSession());

  // remaining time in ms, derived from session.endTime vs Date.now().
  // Recomputed every second AND on first load (so a refresh immediately
  // shows the correct remaining time, not the full duration).
  const [remaining, setRemaining] = useState(() => {
    const s = loadQuizSession();
    if (!s) return 0;
    return s.endTime - Date.now();
  });

  // -----------------------------------------------------------------
  // Persist helper: update session state AND localStorage together,
  // so a refresh resumes from the latest answers/currentIndex.
  // -----------------------------------------------------------------
  const updateSession = useCallback((updater) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next =
        typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      saveQuizSession(next);
      return next;
    });
  }, []);

  const handleSubmit = (auto = false) => {
    updateSession((prev) => ({
      ...prev,
      submitted: true,
      autoSubmitted: auto,
    }));
  };

  // -----------------------------------------------------------------
  // Tick every second. Always compute remaining from the absolute
  // endTime, never decrement a counter — this is what makes it
  // refresh-proof.
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!session || session.submitted) return;

    const tick = () => {
      const newRemaining = session.endTime - Date.now();
      setRemaining(newRemaining);
      if (newRemaining <= 0) {
        handleSubmit(true); // auto-submit
      }
    };

    tick(); // run immediately so UI is correct before the first interval fires
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.endTime, session?.submitted]);

  const handleSelect = (optionIndex) => {
    if (!session || session.submitted) return;
    updateSession((prev) => ({
      ...prev,
      answers: { ...prev.answers, [prev.currentIndex]: optionIndex },
    }));
  };

  const handleNext = () => {
    updateSession((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    }));
  };

  const handlePrev = () => {
    updateSession((prev) => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }));
  };

  const handleRestart = () => {
    clearQuizSession();
    navigate("/quiz");
  };

  // -------------------------------------------------------------------
  // Guard: no session at all (never started, or already cleared).
  // -------------------------------------------------------------------
  if (!session?.questions?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Tidak ada quiz yang sedang berjalan. Silakan buat quiz baru dari
              halaman konfigurasi.
            </p>
            <Button onClick={() => navigate("/quiz")}>Buat Quiz Baru</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { questions, answers, currentIndex, submitted, autoSubmitted } =
    session;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;
  const selectedAnswer = answers[currentIndex];

  const score = questions.reduce((acc, q, idx) => {
    return acc + (answers[idx] === q.answerIndex ? 1 : 0);
  }, 0);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  // -------------------------------------------------------------------
  // Results view
  // -------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          <Card>
            <CardContent className="p-8 text-center space-y-2">
              <h1 className="text-2xl font-bold text-primary">Quiz Selesai!</h1>
              {autoSubmitted && (
                <p className="text-sm text-amber-600">
                  Waktu habis — quiz disubmit otomatis.
                </p>
              )}
              <p className="text-4xl font-bold">
                {score} / {questions.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round((score / questions.length) * 100)}% jawaban benar
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const isCorrect = userAnswer === q.answerIndex;
              return (
                <Card key={q.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <p className="font-medium text-sm">{q.question}</p>
                    </div>
                    <div className="pl-7 text-sm space-y-1">
                      <p
                        className={cn(
                          isCorrect ? "text-green-600" : "text-red-600",
                        )}
                      >
                        Jawaban kamu:{" "}
                        {userAnswer !== undefined
                          ? q.options[userAnswer]
                          : "(tidak dijawab)"}
                      </p>
                      {!isCorrect && (
                        <p className="text-muted-foreground">
                          Jawaban benar: {q.options[q.answerIndex]}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button size="lg" className="w-full" onClick={handleRestart}>
            Buat Quiz Baru
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Question view
  // -------------------------------------------------------------------
  const isLowTime = remaining <= 60_000; // last 60 seconds

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Soal {currentIndex + 1} dari {questions.length}
          </p>
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold tabular-nums",
              isLowTime ? "text-destructive" : "text-foreground",
            )}
          >
            <Clock className="h-4 w-4" />
            {formatTime(remaining)}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {currentQuestion.question}
            </h2>

            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option, idx) => (
                <Card
                  key={idx}
                  role="radio"
                  aria-checked={selectedAnswer === idx}
                  tabIndex={0}
                  onClick={() => handleSelect(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(idx);
                    }
                  }}
                  className={cn(
                    "cursor-pointer transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedAnswer === idx
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <CardContent className="p-3 text-sm">{option}</CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handlePrev} disabled={isFirst}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>

          {isLast ? (
            <Button onClick={() => handleSubmit(false)} disabled={!allAnswered}>
              Submit
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Selanjutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {isLast && !allAnswered && (
          <p className="text-sm text-center text-muted-foreground">
            Jawab semua soal terlebih dahulu sebelum submit.
          </p>
        )}
      </div>
    </div>
  );
}
