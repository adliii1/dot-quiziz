import { authApiInstance } from "@/lib/axios";

export const login = async (values) =>
  authApiInstance
    .get("/user", { params: { username: values } })
    .then((res) => res.data);
