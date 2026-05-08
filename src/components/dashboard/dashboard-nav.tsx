"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/blog", label: "Blog" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/file-manager", label: "Files" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const isItemActive = (item: (typeof navItems)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const activeLabel = navItems.find(isItemActive)?.label ?? "";

  return (
    <header className="hidden md:block sticky top-0 z-30 border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
              EP
            </div>
            <span className="text-sm font-semibold tracking-wide text-white hidden sm:inline">
              Dashboard
            </span>
          </Link>

          {/* Desktop nav (mobile dùng DashboardDock thay thế) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = isItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white font-medium"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          {/* Section title trên mobile để user biết đang ở đâu */}
          {activeLabel && (
            <span className="md:hidden text-sm font-medium text-white">
              {activeLabel}
            </span>
          )}

          <Link
            href="/"
            className="hidden sm:inline text-gray-400 hover:text-white transition-colors"
          >
            ← Portfolio
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
