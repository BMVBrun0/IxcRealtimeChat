import { z } from "zod";

export const sendMessageSchema = z.object({
  receiverId: z.string().trim().min(1, "receiverId é obrigatório."),
  content: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(4000, "A mensagem deve ter no máximo 4000 caracteres.")
});
