import Link from "next/link";
import Image from "next/image";
import { calculateTrustScore, formatStatus } from "@/lib/domain";
import { money, one, publicImageUrl } from "@/lib/marketplace";

type ListingCardData = {
  id: string;
  title: string;
  current_price: number;
  currency: string;
  condition: string;
  created_at: string;
  categories: { name: string }[];
  profiles: { display_name: string; seller_stats: { completed_sales: number; average_rating: number; dispute_count: number }[] }[];
  listing_images: { storage_path: string; alt_text: string | null }[];
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const image = publicImageUrl(listing.listing_images?.[0]?.storage_path);
  const seller = one(listing.profiles);
  const stats = one(seller?.seller_stats);
  const score = calculateTrustScore(stats?.completed_sales ?? 0, Number(stats?.average_rating ?? 0), stats?.dispute_count ?? 0);

  return (
    <article className="listing-card">
      <Link href={`/listings/${listing.id}`} className="listing-image">
        {image ? (
          <Image
            src={image}
            alt={listing.listing_images?.[0]?.alt_text || listing.title}
            width={640}
            height={420}
            sizes="(max-width: 800px) 50vw, 25vw"
          />
        ) : (
          <span>Photo coming soon</span>
        )}
      </Link>
      <div className="listing-copy">
        <h2 className="!text-[15px] !font-semibold">
          <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
        </h2>
        <strong className="price !text-[15px]">{money(listing.current_price, listing.currency)}</strong>
        <p className="flex items-center gap-2 text-[12px] text-ink-muted">
          <span className="chip">{formatStatus(listing.condition)}</span>
        </p>
        <p className="mt-auto flex items-center gap-1.5 pt-1 text-[12px] text-ink-secondary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-trust" />
          {seller?.display_name ?? "Seller"}
          <span className="text-ink-muted">·</span>
          <span className="font-semibold text-trust">★ {Number(stats?.average_rating ?? 0).toFixed(1)}</span>
          <span className="text-ink-muted">· Trust {score}</span>
        </p>
      </div>
    </article>
  );
}
