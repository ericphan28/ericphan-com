/**
 * Public File Manager — bảo vệ bằng access code (không cần email/password).
 *
 * Server Component:
 *  - Check Supabase session (cookie)
 *  - Có session → render FileManager
 *  - Không có → render UnlockGate (nhập mã)
 */

import { getUser } from "@/lib/supabase-server";
import { FileManagerClient } from "./client";
import { UnlockGate } from "./unlock-gate";

export const metadata = {
  title: "File Manager — Eric Phan",
  robots: { index: false, follow: false },
};

export default async function PublicFileManagerPage() {
  const user = await getUser();
  if (!user) return <UnlockGate />;
  return <FileManagerClient />;
}
