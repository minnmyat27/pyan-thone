import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Notice,OrderTimeline,StatusChip } from "@/components/status";
import { adminAdvanceOrder } from "@/app/phase2-actions";
import { money,one,requireUser } from "@/lib/marketplace";
import { formatStatus,type OrderStatus } from "@/lib/domain";
import { DeliveryTracker } from "@/components/delivery-tracker";
const actions:Record<string,[string,string][]>={
  shipping_to_verification:[["receive","Mark received"]],received_at_verification:[["start_inspection","Begin inspection"]],
  verification_failed:[["refund_pending","Start refund"]],buyer_refund_pending:[["refund","Mark refunded"]],
  buyer_refunded:[["return","Return to seller"]],return_to_seller:[["close","Close return"]],
  verified:[["start_delivery","Start delivery"]],out_for_delivery:[["advance_delivery","Advance demo route"],["delivered","Mark delivered"]],
  delivered:[["release_payment","Release payment"]],payment_released:[["complete","Complete transaction"]],
};
export default async function AdminOrderPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string;message?:string}>}){
  const {id}=await params;const {supabase}=await requireUser("admin");
  const [{data},{data:deliveryAddress}]=await Promise.all([supabase.from("orders").select("id,reference,status,agreed_price,currency,listings(title),escrow_records(status),verification_records(status,notes,rejection_reason,listing_matches,condition_matches),deliveries(id,status,courier_name,estimated_delivery,delivery_location_updates(id,latitude,longitude,recorded_at))").eq("id",id).single(),supabase.rpc("get_order_delivery_address",{target_order:id})]);
  if(!data)notFound();
  const verification=data.verification_records?.[0],delivery=data.deliveries?.[0],escrow=data.escrow_records?.[0];
  return <AppShell role="admin"><Notice searchParams={await searchParams}/><header><p className="eyebrow">{data.reference}</p><h1>{one(data.listings)?.title}</h1><div className="actions"><StatusChip value={data.status}/>{escrow&&<StatusChip value={escrow.status}/>}</div><p className="price">{money(data.agreed_price,data.currency)}</p></header>
    <div className="detail-grid"><section className="panel"><h2>Progress</h2><OrderTimeline status={data.status as OrderStatus}/></section><section className="panel"><h2>Operational action</h2>
    {data.status==="inspection_in_progress"?<><form action={adminAdvanceOrder} className="form"><input type="hidden" name="orderId" value={id}/><input type="hidden" name="operation" value="pass"/><label>Inspection notes<textarea name="notes"/></label><button>Pass verification</button></form><form action={adminAdvanceOrder} className="form danger-zone"><input type="hidden" name="orderId" value={id}/><input type="hidden" name="operation" value="fail"/><input type="hidden" name="listingMatches" value="false"/><input type="hidden" name="conditionMatches" value="false"/><label>Failure reason<input name="reason" required/></label><label>Participant-safe summary<textarea name="notes"/></label><button className="danger">Fail verification</button></form></>
    :actions[data.status]?.map(([operation,label])=><form action={adminAdvanceOrder} className="form" key={operation}><input type="hidden" name="orderId" value={id}/><input type="hidden" name="operation" value={operation}/>{operation==="start_delivery"&&<><label>Courier name<input name="courierName" defaultValue="Demo Courier 12"/></label><label>Courier phone<input name="courierPhone"/></label></>}<button>{label}</button></form>)??<p>No operational action required.</p>}
    {verification&&<p>Verification: {formatStatus(verification.status)} {verification.rejection_reason&&`· ${verification.rejection_reason}`}</p>}</section></div>
    {delivery&&<section className="panel"><h2>Delivery control</h2><DeliveryTracker deliveryId={delivery.id} initialPoints={delivery.delivery_location_updates??[]} destination={deliveryAddress??"Buyer destination on file"}/></section>}
  </AppShell>
}
