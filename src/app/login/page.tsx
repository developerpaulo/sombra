import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-semibold text-brand-600">CRM Sites</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Entrar no sistema</h1>
          <p className="mt-2 text-sm text-slate-500">Use o e-mail e senha cadastrados no Supabase.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
