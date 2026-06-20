import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      footerHref="/login"
      footerLabel="Voltar para o login"
      footerText="Já possui cadastro?"
      title="Criar conta"
    >
      <RegisterForm />
    </AuthShell>
  );
}
