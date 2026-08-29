import { Dashboard } from "@/components/dashboard"; import { loadDashboardData } from "@/lib/dashboard-data";
export default async function SellerPage() { return <Dashboard role="seller" data={await loadDashboardData("seller")} />; }
