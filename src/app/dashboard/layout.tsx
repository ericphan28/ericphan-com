import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
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
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </div>
    </Providers>
  );
}
