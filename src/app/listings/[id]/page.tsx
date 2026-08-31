import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { calculateTrustScore, formatStatus, type Role } from "@/lib/domain";
import { getOptionalUser, money, publicImageUrl } from "@/lib/marketplace";
import { startConversation } from "@/app/phase2-actions";
import { Notice } from "@/components/status";
import { AppShell } from "@/components/app-shell";

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const { profile, user, supabase } = await getOptionalUser();
  const { data: listing } = await supabase
    .from("listings")
    .select(
      "*,categories(name),profiles!listings_seller_id_fkey(id,display_name,avatar_url,created_at,seller_stats(completed_sales,review_count,average_rating,dispute_count)),listing_images(storage_path,alt_text,sort_order)",
    )
    .eq("id", id)
    .single();
  if (!listing) notFound();
  const seller = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
  const rawStats = Array.isArray(seller?.seller_stats) ? seller.seller_stats[0] : seller?.seller_stats;
  const score = calculateTrustScore(
    rawStats?.completed_sales ?? 0,
    Number(rawStats?.average_rating ?? 0),
    rawStats?.dispute_count ?? 0,
  );
  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const isOwner = user?.id === listing.seller_id;
  const canBuy = Boolean(user && !isOwner && listing.status === "active");
  const role = (profile?.role as Role | undefined) ?? null;

  return (
    <AppShell role={role === "buyer" || role === "seller" || role === "admin" ? role : null} storefront>
      <Link href="/buyer/marketplace">← Marketplace</Link>
      <Notice searchParams={notices} />
      <div className="listing-detail">
        <section className="gallery">
          {images.length ? (
            images.map((image) => (
              <Image
                key={image.storage_path}
                src={publicImageUrl(image.storage_path)!}
                alt={image.alt_text || listing.title}
                width={900}
                height={675}
                sizes="(max-width: 800px) 100vw, 55vw"
              />
            ))
          ) : (
            <div className="image-placeholder">No images uploaded</div>
          )}
        </section>
        <section>
          <div className="split">
            <span className="chip">{formatStatus(listing.condition)}</span>
            <span className="status-chip">{formatStatus(listing.status)}</span>
          </div>
          <h1>{listing.title}</h1>
          <p className="price">{money(listing.current_price, listing.currency)}</p>
          <p>{listing.categories?.name}</p>
          <p className="lede">{listing.description}</p>
          <div className="seller-summary">
            <p className="eyebrow">Seller</p>
            <h2>{seller?.display_name}</h2>
            <p>
              <strong>Trust score {score}</strong> · {rawStats?.completed_sales ?? 0} completed sales ·{" "}
              {Number(rawStats?.average_rating ?? 0).toFixed(1)} rating · {rawStats?.dispute_count ?? 0} disputes
            </p>
            <Link href={`/sellers/${listing.seller_id}`}>View transparent seller history →</Link>
          </div>
          {canBuy && (
            <div className="actions">
              <form action={startConversation}>
                <input type="hidden" name="listingId" value={id} />
                <button className="secondary">Message seller</button>
              </form>
              <Link className="button-link" href={`/buyer/checkout/${id}`}>
                Buy through Pyan Thone
              </Link>
            </div>
          )}
          {!user && listing.status === "active" && (
            <div className="actions">
              <Link className="button-link" href="/login">
                Log in to buy or message
              </Link>
            </div>
          )}
          {isOwner && (
            <Link className="button-link" href={`/seller/listings/${id}/edit`}>
              Edit your listing
            </Link>
          )}
          {!isOwner && listing.status !== "active" && (
            <p className="notice">This listing is not currently available for purchase.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
