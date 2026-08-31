import { Brand } from "@/components/Brand";

export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-page px-4 text-center" aria-live="polite">
      <section className="w-full max-w-lg rounded-card border border-line bg-surface p-8 shadow-card">
        <Brand href={null} className="justify-center" />
        <span className="mx-auto mt-7 block size-9 animate-spin rounded-full border-4 border-action-soft border-t-action" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-extrabold text-ink">Loading Pyan Thone</h1>
        <p className="mt-2 text-sm text-ink-secondary">Fetching the latest marketplace and transaction details…</p>
      </section>
    </main>
  );
}
