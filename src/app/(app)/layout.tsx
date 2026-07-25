import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-column">
        <TopBar
          title="TTOCS"
          subtitle="Truck Turnaround & Operations Control · DRC"
        />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
