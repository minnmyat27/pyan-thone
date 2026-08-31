"use client";

import Link from "next/link";
import { login, register } from "@/app/actions";
import { AuthShell } from "./AuthShell";
import { SubmitButton } from "./submit-button";
import { useI18n } from "@/lib/i18n";

export function AuthForm({ mode, message }: { mode: "login" | "register"; message?: string }) {
  const { t } = useI18n();
  const isRegister = mode === "register";
  const copy = isRegister ? t.auth.signup : t.auth.login;

  return (
    <AuthShell>
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-action">{t.hero.eyebrow}</p>
      <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-ink">{copy.title}</h1>
      <p className="mt-2 text-[14px] text-ink-secondary">{copy.subtitle}</p>
      {message && <p className="notice mt-4">{message}</p>}
      <form action={isRegister ? register : login} className="mt-6 grid gap-4">
        {isRegister && (
          <label>
            <span className="pyt-label">{t.auth.signup.nameLabel}</span>
            <input className="pyt-input" name="displayName" required minLength={2} placeholder={t.auth.signup.namePlaceholder} />
          </label>
        )}
        <label>
          <span className="pyt-label">{copy.emailLabel}</span>
          <input className="pyt-input" name="email" type="email" required />
        </label>
        <label>
          <span className="pyt-label">{copy.passwordLabel}</span>
          <input
            className="pyt-input"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder={isRegister ? t.auth.signup.passwordPlaceholder : undefined}
          />
        </label>
        {isRegister && (
          <label>
            <span className="pyt-label">{t.auth.role.title}</span>
            <select className="pyt-input" name="role" defaultValue="buyer">
              <option value="buyer">{t.auth.role.buyer}</option>
              <option value="seller">{t.auth.role.seller}</option>
            </select>
          </label>
        )}
        <SubmitButton className="w-full" pending={isRegister ? "Creating account…" : "Signing in…"}>
          {copy.submit}
        </SubmitButton>
      </form>
      <p className="mt-5 text-[14px] text-ink-secondary">
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-action hover:underline">
          {copy.alt}
        </Link>
      </p>
      <p className="mt-4 text-[12px] text-ink-muted">{t.auth.login.terms}</p>
    </AuthShell>
  );
}
