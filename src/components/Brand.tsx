import Link from "next/link";
import { BASE_PATH, cx } from "@/lib/util";

export function Brand({
  href = "/",
  wordmark = true,
  className,
  size = 32,
  invert = false,
}: {
  href?: string | null;
  wordmark?: boolean;
  className?: string;
  size?: number;
  invert?: boolean;
}) {
  const inner = (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${BASE_PATH}/logo.png`}
        alt="Pyan Thone"
        width={size}
        height={size}
        className="rounded-[22%]"
        style={{ width: size, height: size }}
      />
      {wordmark && (
        <span
          className={cx(
            "text-[17px] font-extrabold tracking-tight",
            invert ? "text-white" : "text-action",
          )}
        >
          Pyan Thone
        </span>
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="Pyan Thone home">
      {inner}
    </Link>
  );
}
