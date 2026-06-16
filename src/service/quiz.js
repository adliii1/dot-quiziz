import { quizApiInstance } from "@/lib/axios";

export const getQuiz = async (values) =>
  quizApiInstance
    .get("api.php", {
      params: {
        amount: values.amount,
        category: values.category,
        difficulty: values.difficulty,
        type: "multiple",
      },
    })
    .then((res) => res.data);
