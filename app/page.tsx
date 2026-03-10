import reportData from "@/data/report-data.json";
import { ReportDashboard } from "@/components/report-dashboard";
import type { ReportData } from "@/lib/report-types";

export default function Home() {
  return <ReportDashboard data={reportData as ReportData} />;
}
