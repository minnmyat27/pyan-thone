import { Dashboard } from "@/components/dashboard"; import { loadDashboardData } from "@/lib/dashboard-data";
export default async function AdminPage() { return <Dashboard role="admin" data={await loadDashboardData("admin")} />; }
