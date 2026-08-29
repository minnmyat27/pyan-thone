import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusChip } from "@/components/status";
import { one, requireUser } from "@/lib/marketplace";
export default async function VerificationsPage(){
  const {supabase}=await requireUser("admin");
  const {data}=await supabase.from("verification_records").select("id,status,updated_at,orders(id,reference,status,listings(title))").order("updated_at",{ascending:false});
  return <AppShell role="admin"><header><p className="eyebrow">Middleman inspection</p><h1>Verification queue</h1></header><section className="panel table">{data?.map(v=>{const order=one(v.orders);return <div className="row" key={v.id}><div><strong>{one(order?.listings)?.title}</strong><small>{order?.reference}</small></div><StatusChip value={v.status}/><Link href={`/admin/orders/${order?.id}`}>Inspect →</Link></div>})}</section></AppShell>
}
