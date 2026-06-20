import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      footerHref="/register"
      footerLabel="Criar conta"
      footerText="Ainda não tem acesso?"
      subtitle="Use seu nome de usuário e senha para continuar."
      title="Entrar"
    >
      <LoginForm />
    </AuthShell>
  );
}
