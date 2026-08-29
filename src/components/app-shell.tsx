import Link from "next/link";
import { logout } from "@/app/actions";
import type { Role } from "@/lib/domain";

const nav: Record<Role, [string,string][]> = {
  buyer: [["Overview","/buyer"],["Marketplace","/buyer/marketplace"],["Purchases","/buyer/orders"],["Messages","/buyer/messages"]],
  seller: [["Overview","/seller"],["Listings","/seller/listings"],["Create listing","/seller/listings/new"],["Orders & sales","/seller/orders"],["Messages","/seller/messages"]],
  admin: [["Operations overview","/admin"],["Verification queue","/admin/verifications"],["Transactions","/admin/orders"],["Disputes","/admin/disputes"],["Deliveries","/admin/deliveries"]],
};
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  return <div className="app-shell"><aside><Link href={`/${role}`} className="brand">Pyan Thone</Link><span className={`role role-${role}`}>{role}</span><nav>{nav[role].map(([item,href]) => <Link key={href} href={href}>{item}</Link>)}</nav><form action={logout}><button className="quiet">Log out</button></form></aside><main className="dashboard">{children}</main></div>;
}
