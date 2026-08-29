"use client";

import Link from "next/link";
import { LandingNav } from "@/components/LandingNav";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui";
import { LangToggle } from "@/components/LangToggle";
import { useI18n } from "@/lib/i18n";
import { cx } from "@/lib/util";

const STAT_VALUES = ["2,840", "12,600", "4.8"];

export default function Landing() {
  const { t, lang } = useI18n();
  const isMy = lang === "my";
  const stats = [
    { value: STAT_VALUES[0], label: t.stats.sellers },
    { value: STAT_VALUES[1], label: t.stats.reused },
    { value: STAT_VALUES[2], label: t.stats.rating },
  ];
  const offerings = [
    { ...t.products.buyers, href: "/buyer/marketplace" },
    { ...t.products.sellers, href: "/login" },
  ];

  return (
    <div className="min-h-dvh bg-page">
      <LandingNav />

      <section id="home" className="relative overflow-hidden border-b border-line bg-action-soft">
        <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-action">{t.hero.eyebrow}</p>
            <h1
              className={cx(
                "mt-4 font-extrabold text-ink",
                isMy
                  ? "text-[clamp(1.9rem,4.6vw,3rem)] leading-[1.6] tracking-normal"
                  : "text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.05] tracking-tight",
              )}
            >
              {t.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-secondary sm:text-[17px]">{t.hero.desc}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/register" size="md">
                {t.hero.primary}
              </Button>
              <Button href="/buyer/marketplace" variant="secondary" size="md">
                {t.hero.secondary}
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-[22px] font-extrabold tracking-tight text-ink">{s.value}</dt>
                  <dd className="mt-0.5 text-[12px] leading-tight text-ink-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="absolute h-72 w-72 rounded-full bg-action/10 blur-3xl" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pt-logo.png"
              alt="Pyan Thone"
              width={360}
              height={288}
              className="relative w-[min(360px,80%)] drop-shadow-[0_20px_40px_rgba(37,99,235,0.18)]"
            />
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="pyt-section-title text-[26px]">{t.products.title}</h2>
        <p className="mt-2 text-[15px] text-ink-secondary">{t.products.subtitle}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {offerings.map((o) => (
            <div key={o.title} className="flex flex-col rounded-card border border-line bg-surface p-7 shadow-subtle">
              <h3 className="text-[20px] font-bold text-ink">{o.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">{o.desc}</p>
              <ul className="mt-5 space-y-2 text-[13px] text-ink-secondary">
                {o.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-0.5 text-trust">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <Button href={o.href} variant="secondary" size="sm" className="mt-6 self-start">
                {o.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="pyt-section-title text-[26px]">{t.about.title}</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">{t.about.lead}</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-card border border-warning/30 bg-warning-soft/50 p-7">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-warning">{t.about.problemTag}</span>
              <h3 className="mt-2 text-[19px] font-bold text-ink">{t.about.problemTitle}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-secondary">{t.about.problemBody}</p>
            </div>
            <div className="rounded-card border border-trust/25 bg-[#e6f4ec]/40 p-7">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-trust">{t.about.solutionTag}</span>
              <h3 className="mt-2 text-[19px] font-bold text-ink">{t.about.solutionTitle}</h3>
              <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-ink-secondary">
                {t.about.solutionPoints.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-0.5 text-trust">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
        <h2 className="mx-auto max-w-2xl text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-tight text-ink">{t.cta.title}</h2>
        <p className="mt-3 text-[15px] text-ink-secondary">{t.cta.desc}</p>
        <Button href="/register" size="md" className="mt-7">
          {t.cta.button}
        </Button>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Brand href="/" size={26} />
            <p className="mt-2 text-[13px] text-ink-muted">{t.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-ink-secondary">
            <Link href="/buyer/marketplace" className="hover:text-ink">
              {t.nav.forBuyers}
            </Link>
            <Link href="/login" className="hover:text-ink">
              {t.nav.forSellers}
            </Link>
            <Link href="/register" className="hover:text-ink">
              {t.nav.getStarted}
            </Link>
            <LangToggle />
          </div>
        </div>
        <p className="border-t border-line px-4 py-4 text-center text-[12px] text-ink-muted sm:px-6 lg:px-8">
          Pyan Thone · {t.footer.rights}
        </p>
      </footer>
    </div>
  );
}
