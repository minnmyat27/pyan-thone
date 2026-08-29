import { AppShell } from "@/components/app-shell";
import { ListingCard } from "@/components/listing-card";
import { getCategories, requireUser } from "@/lib/marketplace";

export default async function MarketplacePage({ searchParams }: { searchParams:Promise<{q?:string;category?:string;condition?:string;sort?:string}> }) {
  const filters=await searchParams; const {supabase}=await requireUser("buyer"); const categories=await getCategories();
  let query=supabase.from("listings").select("id,title,current_price,currency,condition,created_at,categories(name),profiles!listings_seller_id_fkey(display_name,seller_stats(completed_sales,average_rating,dispute_count)),listing_images(storage_path,alt_text,sort_order)").eq("status","active");
  if(filters.q) query=query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  if(filters.category) query=query.eq("category_id",filters.category);
  if(filters.condition) query=query.eq("condition",filters.condition);
  if(filters.sort==="price-low") query=query.order("current_price",{ascending:true}); else if(filters.sort==="price-high") query=query.order("current_price",{ascending:false}); else query=query.order("created_at",{ascending:false});
  const {data,error}=await query;
  return <AppShell role="buyer"><header><p className="eyebrow">Browse verified local sellers</p><h1>Marketplace</h1><p className="lede">Prices are seller-controlled. Payment is simulated and held by Pyan Thone through verification and delivery.</p></header>
    <form className="filters"><label>Search<input name="q" defaultValue={filters.q} placeholder="Camera, desk, fashion…"/></label><label>Category<select name="category" defaultValue={filters.category}><option value="">All categories</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Condition<select name="condition" defaultValue={filters.condition}><option value="">Any condition</option>{["new","like_new","good","fair","poor"].map(c=><option key={c}>{c.replaceAll("_"," ")}</option>)}</select></label><label>Sort<select name="sort" defaultValue={filters.sort}><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label><button>Apply</button></form>
    {error?<p className="notice error">{error.message}</p>:data?.length?<section className="listing-grid">{data.map(item=><ListingCard key={item.id} listing={item}/>)}</section>:<section className="empty"><h2>No listings found</h2><p>Try removing a filter or checking again later.</p></section>}
  </AppShell>;
}
