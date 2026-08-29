import { createClient } from "@/lib/supabase/server";
import { adminData, buyerData, sellerData } from "@/lib/demo";
import type { Role } from "@/lib/domain";

type DashboardData = { name: string; stats: string[][]; activity: string[][] };
const fallback: Record<Role, DashboardData> = { buyer: buyerData, seller: sellerData, admin: adminData };
const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export async function loadDashboardData(role: Role): Promise<DashboardData> {
  if (!configured()) return fallback[role];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fallback[role];
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();

  if (role === "buyer") {
    const [active, messages, recent] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).not("status", "in", "(completed,closed)"),
      supabase.from("messages").select("id", { count: "exact", head: true }).is("read_at", null).neq("sender_id", user.id),
      supabase.from("orders").select("reference,status,agreed_price,currency").order("created_at", { ascending: false }).limit(3),
    ]);
    return { name: profile?.display_name ?? "Buyer", stats: [["Active purchases", String(active.count ?? 0)], ["Saved sellers", "—"], ["Unread messages", String(messages.count ?? 0)]], activity: (recent.data ?? []).map((o) => [o.reference, String(o.status).replaceAll("_", " "), `${Number(o.agreed_price).toLocaleString()} ${o.currency}`]) };
  }
  if (role === "seller") {
    const [listings, stats, recent] = await Promise.all([
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("seller_stats").select("completed_sales,average_rating,dispute_count").eq("seller_id", user.id).single(),
      supabase.from("orders").select("reference,status").order("created_at", { ascending: false }).limit(3),
    ]);
    return { name: profile?.display_name ?? "Seller", stats: [["Active listings", String(listings.count ?? 0)], ["Completed sales", String(stats.data?.completed_sales ?? 0)], ["Average rating", `${stats.data?.average_rating ?? 0} / 5`], ["Disputes", String(stats.data?.dispute_count ?? 0)]], activity: (recent.data ?? []).map((o) => [o.reference, String(o.status).replaceAll("_", " "), o.status === "completed" ? "Historical price private" : "Private to participants"]) };
  }
  const [verification, deliveries, disputes, refunds, recent] = await Promise.all([
    supabase.from("verification_records").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress"]),
    supabase.from("deliveries").select("id", { count: "exact", head: true }).eq("status", "in_transit_to_buyer"),
    supabase.from("disputes").select("id", { count: "exact", head: true }).in("status", ["open", "under_review"]),
    supabase.from("escrow_records").select("id", { count: "exact", head: true }).eq("status", "refund_pending"),
    supabase.from("orders").select("reference,status").order("updated_at", { ascending: false }).limit(3),
  ]);
  return { name: profile?.display_name ?? "Operations", stats: [["Awaiting verification", String(verification.count ?? 0)], ["Active deliveries", String(deliveries.count ?? 0)], ["Open disputes", String(disputes.count ?? 0)], ["Refund pending", String(refunds.count ?? 0)]], activity: (recent.data ?? []).map((o) => [o.reference, String(o.status).replaceAll("_", " "), "Operational queue"]) };
}
