"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({children,pending="Working…",className,confirmMessage,disabled}:{children:React.ReactNode;pending?:string;className?:string;confirmMessage?:string;disabled?:boolean}){
  const {pending:isPending}=useFormStatus();
  return <button className={className} disabled={disabled||isPending} aria-disabled={disabled||isPending} onClick={event=>{if(confirmMessage&&!window.confirm(confirmMessage))event.preventDefault()}}>{isPending?pending:children}</button>;
}
