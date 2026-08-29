import Link from "next/link";
import { login, register } from "@/app/actions";

export function AuthForm({ mode, message }: { mode: "login" | "register"; message?: string }) {
  const isRegister = mode === "register";
  return <main className="auth-wrap"><section className="auth-card">
    <Link href="/" className="brand">Pyan Thone</Link>
    <p className="eyebrow">Trusted second-hand marketplace</p>
    <h1>{isRegister ? "Create an account" : "Welcome back"}</h1>
    {message && <p className="notice">{message}</p>}
    <form action={isRegister ? register : login} className="form">
      {isRegister && <label>Display name<input name="displayName" required minLength={2} /></label>}
      <label>Email<input name="email" type="email" required /></label>
      <label>Password<input name="password" type="password" required minLength={8} /></label>
      {isRegister && <label>Account type<select name="role" defaultValue="buyer"><option value="buyer">Buyer</option><option value="seller">Seller</option></select></label>}
      <button type="submit">{isRegister ? "Register" : "Log in"}</button>
    </form>
    <p>{isRegister ? "Already registered?" : "New here?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></p>
  </section></main>;
}
