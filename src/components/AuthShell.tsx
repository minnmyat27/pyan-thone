"use client";

import Link from "next/link";
import { Brand } from "./Brand";
import { LangToggle } from "./LangToggle";
import { useI18n } from "@/lib/i18n";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4 py-10 sm:px-6">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 flex items-center justify-between">
          <Brand size={36} />
          <LangToggle />
        </div>
        <div className="rounded-card border border-line bg-surface p-7 shadow-card sm:p-8">{children}</div>
        <p className="mt-6 text-center text-[12px] text-ink-muted">
          <Link href="/" className="hover:text-ink">
            {t.auth.backHome}
          </Link>
        </p>
      </div>
    </div>
  );
}
