"use client";

import Link from "next/link";
import { useState } from "react";
import { Brand } from "./Brand";
import { Button } from "./ui";
import { LangToggle } from "./LangToggle";
import { useI18n } from "@/lib/i18n";
import { cx } from "@/lib/util";

export function LandingNav() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const products = [
    { label: t.nav.forBuyers, href: "/buyer/marketplace", desc: t.products.buyers.desc },
    { label: t.nav.forSellers, href: "/login", desc: t.products.sellers.desc },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-content items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Brand href="/" size={30} />

        <nav className="hidden items-center gap-1 md:flex">
          <a href="#home" className="rounded-control px-3 py-2 text-[14px] font-medium text-ink-secondary hover:text-ink">
            {t.nav.home}
          </a>
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              type="button"
              className="flex items-center gap-1 rounded-control px-3 py-2 text-[14px] font-medium text-ink-secondary hover:text-ink"
              onClick={() => setProductsOpen((v) => !v)}
              aria-expanded={productsOpen}
            >
              {t.nav.products}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {productsOpen && (
              <div className="absolute left-0 top-full w-[520px] pt-2">
                <div className="grid grid-cols-2 gap-2 rounded-card border border-line bg-surface p-2 shadow-card">
                  {products.map((p) => (
                    <Link
                      key={p.label}
                      href={p.href}
                      className="rounded-control p-3 transition hover:bg-page"
                      onClick={() => setProductsOpen(false)}
                    >
                      <span className="block text-[14px] font-bold text-ink">{p.label}</span>
                      <span className="mt-1 block text-[12px] leading-snug text-ink-muted">{p.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <a href="#about" className="rounded-control px-3 py-2 text-[14px] font-medium text-ink-secondary hover:text-ink">
            {t.nav.about}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LangToggle className="hidden sm:inline-flex" />
          <Button href="/register" size="sm" className="hidden sm:inline-flex">
            {t.nav.getStarted}
          </Button>
          <button
            type="button"
            aria-label="Menu"
            className="rounded-control border border-line p-2 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={cx("space-y-1 border-t border-line bg-surface px-4 py-3 md:hidden")}>
          <a href="#home" className="block rounded-control px-2 py-2 text-[15px] text-ink-secondary" onClick={() => setMenuOpen(false)}>
            {t.nav.home}
          </a>
          <p className="px-2 pt-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{t.nav.products}</p>
          {products.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="block rounded-control px-2 py-2 text-[15px] text-ink-secondary"
              onClick={() => setMenuOpen(false)}
            >
              {p.label}
            </Link>
          ))}
          <a href="#about" className="block rounded-control px-2 py-2 text-[15px] text-ink-secondary" onClick={() => setMenuOpen(false)}>
            {t.nav.about}
          </a>
          <div className="flex items-center justify-between px-2 pt-2">
            <LangToggle />
            <Button href="/register" size="sm">
              {t.nav.getStarted}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
