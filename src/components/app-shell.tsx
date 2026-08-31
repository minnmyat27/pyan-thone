import Link from "next/link";
import { logout } from "@/app/actions";
import type { Role } from "@/lib/domain";
import { Brand } from "./Brand";
import { MarketplaceNav } from "./MarketplaceNav";

const nav: Record<Role, [string, string][]> = {
  buyer: [
    ["Overview", "/buyer"],
    ["Marketplace", "/buyer/marketplace"],
    ["Purchases", "/buyer/orders"],
    ["Messages", "/buyer/messages"],
  ],
  seller: [
    ["Overview", "/seller"],
    ["Listings", "/seller/listings"],
    ["Create listing", "/seller/listings/new"],
    ["Orders & sales", "/seller/orders"],
    ["Messages", "/seller/messages"],
  ],
  admin: [
    ["Operations overview", "/admin"],
    ["Verification queue", "/admin/verifications"],
    ["Transactions", "/admin/orders"],
    ["Disputes", "/admin/disputes"],
    ["Deliveries", "/admin/deliveries"],
  ],
};

export function AppShell({
  role,
  storefront,
  children,
}: {
  role: Role | null;
  storefront?: boolean;
  children: React.ReactNode;
}) {
  if (storefront || role === "buyer" || role === null) {
    return (
      <div className="min-h-dvh bg-page">
        <MarketplaceNav role={role} />
        <main className="dashboard mx-auto w-full max-w-content px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside>
        <Brand href={`/${role}`} invert size={28} />
        <span className={`role role-${role}`}>{role}</span>
        <nav>
          {nav[role].map(([item, href]) => (
            <Link key={href} href={href}>
              {item}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="quiet" type="submit">
            Log out
          </button>
        </form>
      </aside>
      <main className="dashboard">{children}</main>
    </div>
  );
}
