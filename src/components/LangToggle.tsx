"use client";

import { useI18n } from "@/lib/i18n";
import { cx } from "@/lib/util";

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={cx(
        "inline-flex items-center rounded-pill border border-line bg-surface p-0.5 text-[12px] font-semibold",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        className={cx("whitespace-nowrap rounded-pill px-3 py-1 transition", lang === "en" ? "bg-action text-white" : "text-ink-secondary")}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("my")}
        className={cx("whitespace-nowrap rounded-pill px-3 py-1 transition", lang === "my" ? "bg-action text-white" : "text-ink-secondary")}
      >
        မြန်မာ
      </button>
    </div>
  );
}
