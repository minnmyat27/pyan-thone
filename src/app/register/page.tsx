import { AuthForm } from "@/components/auth-form";
export default async function Register({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const p = await searchParams; return <AuthForm mode="register" message={p.error} />; }
