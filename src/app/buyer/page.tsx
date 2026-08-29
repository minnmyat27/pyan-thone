import { Dashboard } from "@/components/dashboard"; import { loadDashboardData } from "@/lib/dashboard-data";
export default async function BuyerPage() { return <Dashboard role="buyer" data={await loadDashboardData("buyer")} />; }
