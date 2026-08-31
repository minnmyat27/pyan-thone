export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function mmk(value: number): string {
  return `${value.toLocaleString("en-US")} MMK`;
}
