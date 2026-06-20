import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username deve ter pelo menos 3 caracteres.")
  .max(30, "Username deve ter no máximo 30 caracteres.")
  .regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou underline.")
  .transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(80, "Nome deve ter no máximo 80 caracteres."),
  username: usernameSchema,
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres.")
    .max(64, "Senha deve ter no máximo 64 caracteres.")
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres.")
    .max(64, "Senha deve ter no máximo 64 caracteres.")
});
