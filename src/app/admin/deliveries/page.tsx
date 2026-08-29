import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusChip } from "@/components/status";
import { one, requireUser } from "@/lib/marketplace";
export default async function DeliveriesPage(){
  const {supabase}=await requireUser("admin");
  const {data}=await supabase.from("deliveries").select("id,status,courier_name,updated_at,orders(id,reference,listings(title))").order("updated_at",{ascending:false});
  return <AppShell role="admin"><header><p className="eyebrow">Courier simulation</p><h1>Deliveries</h1></header><section className="panel table">{data?.map(d=>{const order=one(d.orders);return <div className="row" key={d.id}><div><strong>{one(order?.listings)?.title}</strong><small>{d.courier_name??"Courier unassigned"}</small></div><StatusChip value={d.status}/><Link href={`/admin/orders/${order?.id}`}>Manage →</Link></div>})}</section></AppShell>
}
