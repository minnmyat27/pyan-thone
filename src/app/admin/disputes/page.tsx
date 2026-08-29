import { AppShell } from "@/components/app-shell";
import { Notice,StatusChip } from "@/components/status";
import { resolveDispute } from "@/app/phase2-actions";
import { one,requireUser } from "@/lib/marketplace";
export default async function DisputesPage({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
  const {supabase}=await requireUser("admin");
  const {data}=await supabase.from("disputes").select("id,reason,description,status,resolution_notes,created_at,orders(reference,listings(title))").order("created_at",{ascending:false});
  return <AppShell role="admin"><header><p className="eyebrow">Private casework</p><h1>Disputes</h1></header><Notice searchParams={await searchParams}/>{data?.map(d=>{const order=one(d.orders);return <article className="panel" key={d.id}><div className="split"><div><h2>{d.reason}</h2><p>{order?.reference} · {one(order?.listings)?.title}</p></div><StatusChip value={d.status}/></div><p>{d.description}</p><form action={resolveDispute} className="form-grid"><input type="hidden" name="disputeId" value={d.id}/><label>Status<select name="status" defaultValue={d.status}>{["under_review","resolved_buyer","resolved_seller","closed"].map(s=><option key={s}>{s}</option>)}</select></label><label>Resolution notes<input name="notes" defaultValue={d.resolution_notes??""}/></label><button>Update case</button></form></article>})}</AppShell>
}
