import Link from "next/link";
import { logout } from "@/app/actions";
import type { Role } from "@/lib/domain";

const nav: Record<Role, string[]> = {
  buyer: ["Marketplace", "Purchases", "Messages", "Delivery tracking", "Seller profiles", "Account"],
  seller: ["Overview", "Listings", "Create listing", "Orders & sales", "Messages", "Trust & reputation", "Account"],
  admin: ["Operations overview", "Verification queue", "Transactions", "Disputes", "Deliveries", "Users", "Listings"],
};
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  return <div className="app-shell"><aside><Link href={`/${role}`} className="brand">Pyan Thone</Link><span className={`role role-${role}`}>{role}</span><nav>{nav[role].map((item, i) => <a key={item} href={i ? "#foundation" : `/${role}`}>{item}</a>)}</nav><form action={logout}><button className="quiet">Log out</button></form></aside><main className="dashboard">{children}</main></div>;
}
