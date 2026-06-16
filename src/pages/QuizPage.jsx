import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  cn,
  formatTime,
  loadQuizSession,
  removeQuizSession,
  saveQuizSession,
} from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

const QuizPage = () => {
  const [session, setSession] = useState(() => loadQuizSession());
  const [remaining, setRemaining] = useState(() => {
    if (!session) return 0;
    return session?.endTime - Date.now();
  });
  const navigate = useNavigate();
  const { questions, answers, currentIndex, submitted, autoSubmitted } =
    session;
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentIndex];

  const updateSession = useCallback((updater) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next =
        typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      saveQuizSession(next);
      return next;
    });
  }, []);

  const handleSelect = (optionIndex) => {
    if (!session || session?.submitted) return;

    const isLastQuestion = session.currentIndex === session.questions.length - 1;

    updateSession((prev) => {
      const updateAnswer = {
        ...prev.answers,
        [prev.currentIndex]: optionIndex,
      };

      if (isLastQuestion) {
        return {
          ...prev,
          answers: updateAnswer,
          submitted: true,
          autoSubmitted: false,
        };
      }

      return {
        ...prev,
        answers: updateAnswer,
        currentIndex: prev.currentIndex + 1,
      };
    });
  };

  const handleSubmit = (auto = false) => {
    updateSession((prev) => ({
      ...prev,
      submitted: true,
      autoSubmitted: auto,
    }));
  };

  useEffect(() => {
    if (!session || session.submitted) return;

    const tick = () => {
      const newRemaining = session?.endTime - Date.now();
      setRemaining(newRemaining);

      if (remaining <= 0) {
        handleSubmit(true);
      }
    };

    tick();
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.endTime, session?.submitted]);

  if (!session?.questions?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Gak ada quiz yang harus kamu selesaikan kok, konfigurasi quiz mu
              sendiri dulu!
            </p>
            <Button onClick={() => navigate("/")}>Konfigurasi Quiz</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const score = questions.reduce((acc, q, idx) => {
    return acc + (answers[idx] === q.answerIndex ? 1 : 0);
  }, 0);

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

          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              navigate("/");
              removeQuizSession();
            }}
          >
            Buat Quiz Baru
          </Button>
        </div>
      </div>
    );
  }

  const isLowTime = remaining <= 60_000;

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
                  onClick={() => handleSelect(idx)}
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
      </div>
    </div>
  );
};

export default QuizPage;
