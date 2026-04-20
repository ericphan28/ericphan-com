import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — Eric Phan Dashboard",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
      {children}
    </div>
  );
}
