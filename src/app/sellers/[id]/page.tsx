import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateTrustScore, formatStatus } from "@/lib/domain";
import { PublicNav } from "@/components/public-nav";

export default async function SellerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: profile }, { data: stats }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("display_name,created_at").eq("id", id).eq("role", "seller").maybeSingle(),
    supabase.from("seller_stats").select("completed_sales,review_count,average_rating,dispute_count").eq("seller_id", id).maybeSingle(),
    supabase
      .from("public_seller_history")
      .select("listing_id,title,condition,completed_at,rating,comment")
      .eq("seller_id", id)
      .order("completed_at", { ascending: false }),
  ]);

  if (!profile) notFound();
  const score=calculateTrustScore(stats?.completed_sales??0,Number(stats?.average_rating??0),stats?.dispute_count??0);

  return (
    <><PublicNav/><main className="public-profile">
      <p className="eyebrow">Public seller profile</p>
      <h1>{profile.display_name}</h1>
      <p className="lede">Member since {new Date(profile.created_at).getFullYear()}</p>
      <section className="stats">
        <article><span>Trust score</span><strong>{score}</strong></article>
        <article><span>Completed sales</span><strong>{stats?.completed_sales ?? 0}</strong></article>
        <article><span>Buyer rating</span><strong>{Number(stats?.average_rating ?? 0).toFixed(1)}</strong><small>{stats?.review_count??0} reviews</small></article>
        <article><span>Disputes</span><strong>{stats?.dispute_count ?? 0}</strong></article>
      </section>
      <section className="panel">
        <h2>Verified sale history</h2>
        <p>Successful items are visible as reputation evidence. Historical transaction prices are intentionally absent from this public projection.</p>
        {history?.length ? history.map((sale) => (
          <article className="panel history-card" key={sale.listing_id}><div className="split"><strong>{sale.title}</strong><span className="status-chip status-completed">Verified sale</span></div><p>{new Date(sale.completed_at).toLocaleDateString()} · {formatStatus(sale.condition)}</p><small>{sale.rating ? `Buyer rated ${sale.rating} / 5` : "Verified completed sale"}</small>{sale.comment&&<p>“{sale.comment}”</p>}</article>
        )) : <p>No verified completed sales yet.</p>}
      </section>
    </main></>
  );
}
