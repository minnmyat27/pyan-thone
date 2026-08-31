import Image from "next/image";
import Link from "next/link";

export function Brand({href="/",compact=false,invert=false}:{href?:string;compact?:boolean;invert?:boolean}){
  return <Link href={href} className={`brand ${invert?"brand-invert":""}`} aria-label="Pyan Thone home"><Image src="/pyan-thone-logo.svg" alt="" width={38} height={38} priority/><span>{compact?"PT":"Pyan Thone"}</span></Link>;
}
