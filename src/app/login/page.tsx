import { AuthForm } from "@/components/auth-form";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) { const p = await searchParams; return <AuthForm mode="login" message={p.error ?? p.message} />; }
