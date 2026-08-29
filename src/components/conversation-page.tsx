import { notFound } from "next/navigation";
import { AppShell } from "./app-shell";
import { ChatThread } from "./chat-thread";
import { Notice } from "./status";
import { one, requireUser } from "@/lib/marketplace";

export async function ConversationPage({ id, role, searchParams }: { id: string; role: "buyer" | "seller"; searchParams: { error?: string } }) {
  const { supabase, user } = await requireUser(role);
  const { data } = await supabase.from("conversations").select("id,listing_id,listings(title,current_price,currency),messages(id,sender_id,body,created_at)").eq("id", id).single();
  if (!data) notFound();
  return <AppShell role={role}>
    <header><p className="eyebrow">Listing conversation</p><h1>{one(data.listings)?.title}</h1><p className="lede">Negotiate here. The seller must update the public listing price before purchase—chat does not create a hidden offer.</p></header>
    <Notice searchParams={searchParams}/>
    <section className="panel chat-panel"><ChatThread conversationId={id} userId={user.id} initialMessages={(data.messages ?? []).sort((a,b)=>a.created_at.localeCompare(b.created_at))} editListingHref={role==="seller" ? `/seller/listings/${data.listing_id}/edit` : undefined}/></section>
  </AppShell>;
}
