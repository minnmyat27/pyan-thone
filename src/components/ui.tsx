"use client";

import Link from "next/link";
import { cx } from "@/lib/util";

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  full?: boolean;
  href?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const base =
  "inline-flex items-center justify-center gap-2 rounded-button font-semibold transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<string, string> = {
  primary: "bg-action text-white hover:bg-action/90 focus-visible:ring-action/25 shadow-subtle",
  secondary:
    "bg-surface text-action border border-line hover:border-action/40 hover:bg-action-soft focus-visible:ring-action/20",
  ghost: "text-ink-secondary hover:bg-black/5 focus-visible:ring-black/10",
  danger: "bg-[#d63c3c] text-white hover:bg-[#c23434] focus-visible:ring-[#d63c3c]/25",
};

const sizes: Record<string, string> = {
  md: "h-11 px-5 text-[15px]",
  sm: "h-9 px-3.5 text-[13px]",
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  href,
  className,
  ...props
}: ButtonProps) {
  const cls = cx(base, variants[variant], sizes[size], full && "w-full", className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {props.children}
      </Link>
    );
  }
  return <button className={cls} {...props} />;
}

export function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="pyt-label">{label}</span>
      <input className="pyt-input" {...props} />
      {hint && <span className="mt-1 block text-[12px] text-ink-muted">{hint}</span>}
    </label>
  );
}

export function Chip({
  active,
  children,
  ...props
}: { active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx(
        "rounded-pill border px-3.5 py-2 text-[13px] font-semibold transition",
        active
          ? "border-action bg-action text-white"
          : "border-line bg-surface text-ink-secondary hover:border-action/40",
      )}
      {...props}
    >
      {children}
    </button>
  );
}
