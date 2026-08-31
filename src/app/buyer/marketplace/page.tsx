import { AppShell } from "@/components/app-shell";
import { ListingCard } from "@/components/listing-card";
import { getCategories, getOptionalUser } from "@/lib/marketplace";
import type { Role } from "@/lib/domain";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; condition?: string; sort?: string }>;
}) {
  const filters = await searchParams;
  const { supabase, profile } = await getOptionalUser();
  const categories = await getCategories();
  let query = supabase
    .from("listings")
    .select(
      "id,title,current_price,currency,condition,created_at,categories(name),profiles!listings_seller_id_fkey(display_name,seller_stats(completed_sales,average_rating,dispute_count)),listing_images(storage_path,alt_text,sort_order)",
    )
    .eq("status", "active");
  if (filters.q) query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.sort === "price-low") query = query.order("current_price", { ascending: true });
  else if (filters.sort === "price-high") query = query.order("current_price", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  const role = (profile?.role as Role | undefined) ?? null;

  return (
    <AppShell role={role === "buyer" || role === "seller" || role === "admin" ? role : null}>
      <section className="-mx-4 mb-8 border-b border-line bg-action-soft px-4 py-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-action">Buy local · Reuse more</p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight text-ink">
          Give your belongings a new life.
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-secondary">
          Buy and sell trusted second-hand products from people around you. Payment is held by Pyan Thone through verification and delivery.
        </p>
      </section>
      <form className="filters">
        <label>
          Search
          <input name="q" defaultValue={filters.q} placeholder="Camera, desk, fashion…" />
        </label>
        <label>
          Category
          <select name="category" defaultValue={filters.category}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Condition
          <select name="condition" defaultValue={filters.condition}>
            <option value="">Any condition</option>
            {["new", "like_new", "good", "fair", "poor"].map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select name="sort" defaultValue={filters.sort}>
            <option value="newest">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
        <button>Apply</button>
      </form>
      {error ? (
        <p className="notice error">{error.message}</p>
      ) : data?.length ? (
        <section className="listing-grid">
          {data.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </section>
      ) : (
        <section className="empty">
          <h2>No listings found</h2>
          <p>Try removing a filter or checking again later.</p>
        </section>
      )}
    </AppShell>
  );
}
