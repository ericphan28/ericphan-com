import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardDock } from "@/components/dashboard/dashboard-dock";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Dashboard — Eric Phan",
  description: "Freelancing management dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-[#0a0a1a] text-gray-100">
        <DashboardNav />
        <div className="mx-auto max-w-7xl px-0 md:px-4 py-0 md:py-6 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-6">{children}</div>
        <DashboardDock />
      </div>
    </Providers>
  );
}
