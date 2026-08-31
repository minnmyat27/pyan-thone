"use client";

import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-page px-4 text-center">
      <section className="w-full max-w-lg rounded-card border border-line bg-surface p-8 shadow-card">
        <Brand href={null} className="justify-center" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.14em] text-action">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">We could not load this view.</h1>
        <p className="mt-3 text-sm text-ink-secondary">Your account and transaction data were not changed. Try the request again.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </section>
    </main>
  );
}
