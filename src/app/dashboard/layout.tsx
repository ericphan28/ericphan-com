import type { Metadata } from "next";

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
    <div className="min-h-screen bg-[#0a0a1a] text-gray-100">
      {/* Dashboard nav bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
              EP
            </div>
            <span className="text-sm font-semibold tracking-wide text-white">
              Dashboard
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-gray-400">
            <a href="/dashboard" className="hover:text-white transition-colors">
              Overview
            </a>
            <a href="/" className="hover:text-white transition-colors">
              ← Portfolio
            </a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  );
}
