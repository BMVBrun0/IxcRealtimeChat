import { z } from "zod";

const usernamePattern = /^[a-zA-Z0-9._-]+$/;

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Informe um nome de usuário válido."),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres.")
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe seu nome completo."),
    username: z
      .string()
      .trim()
      .min(3, "O nome de usuário deve ter ao menos 3 caracteres.")
      .regex(usernamePattern, "Use apenas letras, números, ponto, hífen ou underline."),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula.")
      .regex(/[a-z]/, "Inclua ao menos uma letra minúscula.")
      .regex(/[0-9]/, "Inclua ao menos um número."),
    confirmPassword: z
      .string()
      .min(1, "Confirme sua senha.")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "A confirmação de senha precisa ser igual à senha.",
    path: ["confirmPassword"]
  });
