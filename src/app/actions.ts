"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email")), password: String(formData.get("password")) });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  const { data } = await supabase.from("profiles").select("role").single();
  redirect(`/${data?.role ?? "buyer"}`);
}

export async function register(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email")), password: String(formData.get("password")),
    options: { data: { display_name: String(formData.get("displayName")), requested_role: String(formData.get("role")) } },
  });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Account created. Sign in to continue.");
}

export async function logout() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/login"); }
