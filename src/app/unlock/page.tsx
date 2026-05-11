/**
 * /unlock — gate truy cập dashboard bằng access code (không cần email/password).
 *
 * Flow:
 *  - User vào /dashboard chưa có session → middleware redirect về /unlock?next=...
 *  - Nhập đúng mã → POST /api/file-manager/unlock → set Supabase session cookie
 *  - Redirect về `next` (mặc định /dashboard)
 *
 * Nếu đã có session sẵn → tự redirect luôn, khỏi nhập lại.
 */

import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { UnlockForm } from "./form";

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ next?: string }>;

export const metadata = {
  title: "Unlock — Eric Phan",
  robots: { index: false, follow: false },
};

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/dashboard";

  const user = await getUser();
  if (user) redirect(safeNext);

  return <UnlockForm next={safeNext} />;
}
