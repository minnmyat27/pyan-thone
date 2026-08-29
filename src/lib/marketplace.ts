import { createClient } from "@/lib/supabase/server";

export async function requireUser(expectedRole?: "buyer" | "seller" | "admin") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: profile } = await supabase.from("profiles").select("id,display_name,role,avatar_url").eq("id", user.id).single();
  if (!profile || (expectedRole && profile.role !== expectedRole)) throw new Error("Access denied");
  return { supabase, user, profile };
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id,name,slug").order("name");
  return data ?? [];
}

export function publicImageUrl(path?: string | null) {
  if (!path) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url}/storage/v1/object/public/listing-images/${path}` : null;
}

export const money = (value: number | string, currency = "MMK") =>
  `${Number(value).toLocaleString()} ${currency}`;

export const one = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;
