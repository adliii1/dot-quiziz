import z from "zod";

const LoginSchema = z.object({
  username: z.string().min(8, "username max 8").max(16, "username min 16"),
  password: z
    .string()
    .min(8, "Password minimal 8")
    .max(16, "Password maximal 16"),
});

export default LoginSchema;
