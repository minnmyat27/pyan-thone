import Link from "next/link";
import { notFound } from "next/navigation";
import { calculateTrustScore, formatStatus, type Role } from "@/lib/domain";
import { getOptionalUser } from "@/lib/marketplace";
import { AppShell } from "@/components/app-shell";

export default async function SellerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await getOptionalUser();
  const [{ data: seller }, { data: stats }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("display_name,created_at").eq("id", id).eq("role", "seller").maybeSingle(),
    supabase.from("seller_stats").select("completed_sales,average_rating,dispute_count").eq("seller_id", id).maybeSingle(),
    supabase
      .from("public_seller_history")
      .select("listing_id,title,condition,completed_at,rating,comment")
      .eq("seller_id", id)
      .order("completed_at", { ascending: false }),
  ]);

  if (!seller) notFound();
  const score = calculateTrustScore(stats?.completed_sales ?? 0, Number(stats?.average_rating ?? 0), stats?.dispute_count ?? 0);
  const role = (profile?.role as Role | undefined) ?? null;

  return (
    <AppShell role={role === "buyer" || role === "seller" || role === "admin" ? role : null} storefront>
      <Link href="/buyer/marketplace">← Marketplace</Link>
      <p className="eyebrow">Public seller profile</p>
      <h1>{seller.display_name}</h1>
      <p className="lede">Member since {new Date(seller.created_at).getFullYear()}</p>
      <section className="stats">
        <article>
          <span>Trust score</span>
          <strong>{score}</strong>
        </article>
        <article>
          <span>Completed sales</span>
          <strong>{stats?.completed_sales ?? 0}</strong>
        </article>
        <article>
          <span>Buyer rating</span>
          <strong>{Number(stats?.average_rating ?? 0).toFixed(1)}</strong>
        </article>
        <article>
          <span>Disputes</span>
          <strong>{stats?.dispute_count ?? 0}</strong>
        </article>
      </section>
      <section className="panel">
        <h2>Verified sale history</h2>
        <p>
          Successful items are visible as reputation evidence. Historical transaction prices are intentionally absent from this
          public projection.
        </p>
        {history?.length ? (
          history.map((sale) => (
            <div className="row" key={sale.listing_id}>
              <strong>{sale.title}</strong>
              <span>
                {new Date(sale.completed_at).toLocaleDateString()} · {formatStatus(sale.condition)}
              </span>
              <small>{sale.rating ? `Buyer rated ${sale.rating} / 5` : "Verified completed sale"}</small>
              {sale.comment && <p>{sale.comment}</p>}
            </div>
          ))
        ) : (
          <p>No verified completed sales yet.</p>
        )}
      </section>
    </AppShell>
  );
}
