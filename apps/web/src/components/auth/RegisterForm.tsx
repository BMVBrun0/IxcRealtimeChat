"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";
import { api, ApiError } from "@/lib/api";
import { setTokenCookie } from "@/lib/cookies";
import { registerSchema } from "@/lib/validation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import styles from "./AuthForms.module.css";

export const RegisterForm = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setError("");
    setPending(true);

    try {
      const payload = registerSchema.parse(form);
      const session = await api.register({
        name: payload.name,
        username: payload.username,
        password: payload.password
      });
      setTokenCookie(session.token);
      router.replace("/chat");
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof ZodError) {
        const nextErrors: Record<string, string> = {};
        for (const issue of caughtError.issues) {
          const field = String(issue.path[0] ?? "");
          nextErrors[field] = issue.message;
        }
        setFieldErrors(nextErrors);
      } else if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError("Não foi possível criar sua conta agora.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        autoComplete="name"
        error={fieldErrors.name}
        label="Nome completo"
        name="name"
        onChange={(event) => handleChange("name", event.target.value)}
        placeholder="Digite seu nome completo"
        value={form.name}
      />
      <Input
        autoComplete="username"
        error={fieldErrors.username}
        label="Nome de usuário"
        name="username"
        onChange={(event) => handleChange("username", event.target.value)}
        placeholder="Escolha um nome de usuário"
        value={form.username}
      />
      <Input
        autoComplete="new-password"
        endAdornment={
          <button
            aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
            className={styles.iconButton}
            onClick={() => setPasswordVisible((current) => !current)}
            type="button"
          >
            {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        error={fieldErrors.password}
        hint="Use pelo menos 8 caracteres, com letra maiúscula, minúscula e número."
        label="Senha"
        name="password"
        onChange={(event) => handleChange("password", event.target.value)}
        placeholder="Crie uma senha"
        type={passwordVisible ? "text" : "password"}
        value={form.password}
      />
      <Input
        autoComplete="new-password"
        endAdornment={
          <button
            aria-label={confirmVisible ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
            className={styles.iconButton}
            onClick={() => setConfirmVisible((current) => !current)}
            type="button"
          >
            {confirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        error={fieldErrors.confirmPassword}
        label="Confirmar senha"
        name="confirmPassword"
        onChange={(event) => handleChange("confirmPassword", event.target.value)}
        placeholder="Repita sua senha"
        type={confirmVisible ? "text" : "password"}
        value={form.confirmPassword}
      />
      {error ? <div className={styles.errorBox}>{error}</div> : null}
      <Button arrow disabled={pending} type="submit">
        {pending ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
};
