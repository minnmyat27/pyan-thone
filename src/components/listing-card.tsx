import Link from "next/link";
import Image from "next/image";
import { calculateTrustScore, formatStatus } from "@/lib/domain";
import { money, one, publicImageUrl } from "@/lib/marketplace";

type ListingCardData={id:string;title:string;current_price:number;currency:string;condition:string;created_at:string;categories:{name:string}[];profiles:{display_name:string;seller_stats:{completed_sales:number;average_rating:number;dispute_count:number}[]}[];listing_images:{storage_path:string;alt_text:string|null}[]};
export function ListingCard({ listing }: { listing: ListingCardData }) {
  const image=publicImageUrl(listing.listing_images?.[0]?.storage_path);
  const seller=one(listing.profiles); const stats=one(seller?.seller_stats);
  return <article className="listing-card">
    <Link href={`/listings/${listing.id}`} className="listing-image">
      {image?<Image src={image} alt={listing.listing_images?.[0]?.alt_text||listing.title} width={640} height={420} sizes="(max-width: 800px) 100vw, 33vw"/>:<span>Photo coming soon</span>}
    </Link>
    <div className="listing-copy"><div className="split"><span className="chip">{formatStatus(listing.condition)}</span><small>{new Date(listing.created_at).toLocaleDateString()}</small></div>
      <h2><Link href={`/listings/${listing.id}`}>{listing.title}</Link></h2>
      <strong className="price">{money(listing.current_price,listing.currency)}</strong>
      <p>{one(listing.categories)?.name??"Uncategorized"} · {seller?.display_name??"Seller"}</p>
      <span className="trust-line"><span aria-hidden="true">●</span> Trust {calculateTrustScore(stats?.completed_sales??0,Number(stats?.average_rating??0),stats?.dispute_count??0)} · {stats?.completed_sales??0} verified sales</span>
    </div>
  </article>;
}
