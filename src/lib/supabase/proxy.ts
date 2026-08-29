import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (values) => {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const protectedPath = /^\/(buyer|seller|admin)(\/|$)/.test(path);
  if (!user && protectedPath) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));
  if (user && protectedPath) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const requestedRole = path.split("/")[1];
    if (data?.role && data.role !== requestedRole) return NextResponse.redirect(new URL(`/${data.role}`, request.url));
  }
  return response;
}
