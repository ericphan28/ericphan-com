"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Briefcase,
  FolderOpen,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  action?: () => Promise<void> | void;
  variant?: "default" | "danger";
  matchExact?: boolean;
}

/**
 * iOS-style bottom tab bar — luôn hiển thị (1 tap navigate ngay).
 *
 * Mobile: cố định ở đáy, có safe-area cho iPhone notch.
 * Desktop: ẩn (md:hidden), dùng top nav (DashboardNav) thay thế.
 */
export function DashboardDock() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/unlock");
    }
  };

  const tabs: TabItem[] = [
    { icon: LayoutDashboard, label: "Tổng quan", href: "/dashboard", matchExact: true },
    { icon: FolderOpen, label: "Files", href: "/dashboard/file-manager" },
    { icon: FolderKanban, label: "Projects", href: "/dashboard/projects" },
    { icon: FileText, label: "Blog", href: "/dashboard/blog" },
    { icon: Briefcase, label: "Services", href: "/dashboard/services" },
    {
      icon: LogOut,
      label: loggingOut ? "..." : "Khoá",
      action: handleLogout,
      variant: "danger",
    },
  ];

  const isActive = (item: TabItem) => {
    if (!item.href) return false;
    return item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
  };

  return (
    <nav
      aria-label="Điều hướng dashboard"
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-40",
        "border-t border-white/10",
        "bg-[#0a0a1a]/95 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <ul className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
        {tabs.map((tab, i) => (
          <li key={i} className="flex-1 min-w-0">
            <TabButton tab={tab} active={isActive(tab)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TabButton({ tab, active }: { tab: TabItem; active: boolean }) {
  const Icon = tab.icon;
  const danger = tab.variant === "danger";

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg",
        "active:scale-95 transition-transform",
        active && !danger && "bg-blue-500/10"
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          active && !danger && "text-blue-400",
          !active && !danger && "text-gray-400",
          danger && "text-rose-400"
        )}
      />
      <span
        className={cn(
          "text-[10px] leading-none truncate max-w-full mt-0.5",
          active && !danger && "text-blue-400 font-medium",
          !active && !danger && "text-gray-400",
          danger && "text-rose-400"
        )}
      >
        {tab.label}
      </span>
    </div>
  );

  if (tab.href) {
    return (
      <Link href={tab.href} className="block w-full" aria-label={tab.label}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => tab.action?.()}
      className="block w-full"
      aria-label={tab.label}
    >
      {content}
    </button>
  );
}
