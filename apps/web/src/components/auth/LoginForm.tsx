"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";
import { api, ApiError } from "@/lib/api";
import { setTokenCookie } from "@/lib/cookies";
import { loginSchema } from "@/lib/validation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import styles from "./AuthForms.module.css";

export const LoginForm = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setError("");
    setPending(true);

    try {
      const payload = loginSchema.parse({ username, password });
      const session = await api.login(payload);
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
        setError("Não foi possível entrar agora.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        autoComplete="username"
        error={fieldErrors.username}
        label="Nome de usuário"
        name="username"
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Digite seu nome de usuário"
        value={username}
      />
      <Input
        autoComplete="current-password"
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
        label="Senha"
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Digite sua senha"
        type={passwordVisible ? "text" : "password"}
        value={password}
      />
      {error ? <div className={styles.errorBox}>{error}</div> : null}
      <Button arrow disabled={pending} type="submit">
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};
