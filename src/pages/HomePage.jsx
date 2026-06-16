import { QuizConfigurator } from "@/components/quiz-configurator";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary underline decoration-2 underline-offset-8">
            Pilih materi yang kamu inginkan!
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sesuaikan kebutuhan quiz mu, pilih dengan bijak ya!
          </p>
        </div>

        <QuizConfigurator />
      </div>
    </div>
  );
};

export default HomePage;
