import Link from "next/link";import {Brand} from "./brand";
export function PublicNav({backHref="/",backLabel="Marketplace"}:{backHref?:string;backLabel?:string}){return <nav className="landing-nav"><Brand/><div><Link className="text-link" href={backHref}>← {backLabel}</Link><Link className="button-link secondary" href="/login">Log in</Link></div></nav>}
