import axios from "axios";

export const authApiInstance = axios.create({
  baseURL: "http://localhost:3000",
});

export const quizApiInstance = axios.create({
  baseURL:
    "https://opentdb.com/",
});
