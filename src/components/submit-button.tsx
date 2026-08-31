"use client";
import { useFormStatus } from "react-dom";
import { cx } from "@/lib/util";

export function SubmitButton({children,pending="Working…",className,confirmMessage,disabled}:{children:React.ReactNode;pending?:string;className?:string;confirmMessage?:string;disabled?:boolean}){
  const {pending:isPending}=useFormStatus();
  return <button className={cx("inline-flex min-h-11 items-center justify-center rounded-button bg-action px-5 font-semibold text-white shadow-subtle transition hover:bg-action/90 focus-visible:ring-4 focus-visible:ring-action/25 disabled:pointer-events-none disabled:opacity-50",className)} disabled={disabled||isPending} aria-disabled={disabled||isPending} onClick={event=>{if(confirmMessage&&!window.confirm(confirmMessage))event.preventDefault()}}>{isPending?pending:children}</button>;
}
