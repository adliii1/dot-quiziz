import z from "zod";

const LoginSchema = z.object({
  username: z
    .string()
    .min(8, "username minimal 8 karakter")
    .max(16, "username maximal 16 karakter"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(16, "Password maximal 16 karakter"),
});

export default LoginSchema;
