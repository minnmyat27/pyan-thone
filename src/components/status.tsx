import { failedProgress, formatStatus, successfulProgress, type OrderStatus } from "@/lib/domain";

export function StatusChip({ value }: { value: string }) {
  return <span className={`status-chip status-${value}`}>{formatStatus(value)}</span>;
}

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const failure=failedProgress.includes(status);
  const flow=failure ? failedProgress : successfulProgress;
  const current=flow.indexOf(status);
  return <ol className="timeline" aria-label="Transaction progress">{flow.map((step,index)=>
    <li className={index<=current?"done":""} key={step}><span aria-hidden="true">{index<current?"✓":index===current?"●":"○"}</span><div><strong>{formatStatus(step)}</strong>{index===current&&<small>Current step</small>}</div></li>
  )}</ol>;
}

export function Notice({ searchParams }: { searchParams?: { error?: string; message?: string } }) {
  return <>{searchParams?.error&&<p className="notice error" role="alert">{searchParams.error}</p>}{searchParams?.message&&<p className="notice success" role="status">{searchParams.message}</p>}</>;
}
