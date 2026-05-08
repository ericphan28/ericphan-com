/**
 * Display names mapping: storage_key (ASCII) -> display_name (Unicode).
 *
 * Supabase Storage chỉ chấp nhận key ASCII, nên khi user đặt tên tiếng Việt
 * ("Tài liệu") ta lưu key là "Tai lieu" và mapping displayName="Tài liệu"
 * vào bảng public.file_display_names. Khi render danh sách, đọc mapping
 * lên để hiện tên có dấu.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'file_display_names';

interface Row {
  storage_key: string;
  display_name: string;
}

/**
 * Lấy mapping cho 1 batch storage_keys. Trả về Map<storage_key, display_name>.
 * Bỏ qua các key không có trong DB (sẽ fallback về tên ASCII gốc).
 */
export async function getDisplayNames(
  supabase: SupabaseClient,
  bucketId: string,
  storageKeys: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (storageKeys.length === 0) return result;
  const { data, error } = await supabase
    .from(TABLE)
    .select('storage_key, display_name')
    .eq('bucket_id', bucketId)
    .in('storage_key', storageKeys);
  if (error) {
    console.warn('[displayNames] Lỗi đọc mapping:', error.message);
    return result;
  }
  for (const row of (data || []) as Row[]) {
    result.set(row.storage_key, row.display_name);
  }
  return result;
}

/**
 * Set/update display name. Chỉ ghi nếu displayName !== storageKey segment cuối
 * (không cần lưu khi tên gốc đã đẹp).
 */
export async function setDisplayName(
  supabase: SupabaseClient,
  bucketId: string,
  storageKey: string,
  displayName: string
): Promise<void> {
  const segment = storageKey.split('/').pop() || storageKey;
  if (!displayName.trim() || displayName === segment) {
    // Tên gốc đẹp rồi, không cần lưu mapping. Xoá mapping cũ nếu có.
    await removeDisplayName(supabase, bucketId, storageKey);
    return;
  }
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      {
        bucket_id: bucketId,
        storage_key: storageKey,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'bucket_id,storage_key' }
    );
  if (error) console.warn('[displayNames] Lỗi ghi mapping:', error.message);
}

export async function removeDisplayName(
  supabase: SupabaseClient,
  bucketId: string,
  storageKey: string
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('bucket_id', bucketId)
    .eq('storage_key', storageKey);
  if (error) console.warn('[displayNames] Lỗi xoá mapping:', error.message);
}

/**
 * Đổi storage_key (vd: rename/move). Nếu mapping mới có displayName thì upsert,
 * nếu cùng tên ASCII thì chỉ xoá mapping cũ.
 */
export async function renameDisplayName(
  supabase: SupabaseClient,
  bucketId: string,
  oldKey: string,
  newKey: string,
  newDisplayName: string
): Promise<void> {
  await removeDisplayName(supabase, bucketId, oldKey);
  await setDisplayName(supabase, bucketId, newKey, newDisplayName);
}

/**
 * Xoá tất cả mapping có storage_key bắt đầu bằng prefix (dùng khi xoá folder).
 */
export async function removeDisplayNamesUnder(
  supabase: SupabaseClient,
  bucketId: string,
  prefix: string
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('bucket_id', bucketId)
    .or(`storage_key.eq.${prefix},storage_key.like.${prefix}/%`);
  if (error) console.warn('[displayNames] Lỗi xoá mapping prefix:', error.message);
}

/**
 * Khi move/rename 1 folder: di chuyển toàn bộ mapping từ oldPrefix sang newPrefix.
 * Vd: oldPrefix="Tai lieu", newPrefix="Backup/Tai lieu"
 *   -> "Tai lieu" → "Backup/Tai lieu"
 *   -> "Tai lieu/file.pdf" → "Backup/Tai lieu/file.pdf"
 */
export async function moveDisplayNamesPrefix(
  supabase: SupabaseClient,
  bucketId: string,
  oldPrefix: string,
  newPrefix: string
): Promise<void> {
  if (oldPrefix === newPrefix) return;
  const { data, error } = await supabase
    .from(TABLE)
    .select('storage_key, display_name')
    .eq('bucket_id', bucketId)
    .or(`storage_key.eq.${oldPrefix},storage_key.like.${oldPrefix}/%`);
  if (error) {
    console.warn('[displayNames] Lỗi đọc prefix để move:', error.message);
    return;
  }
  const rows = (data || []) as Row[];
  if (rows.length === 0) return;
  const upserts = rows.map((r) => ({
    bucket_id: bucketId,
    storage_key:
      r.storage_key === oldPrefix
        ? newPrefix
        : `${newPrefix}${r.storage_key.slice(oldPrefix.length)}`,
    display_name: r.display_name,
    updated_at: new Date().toISOString(),
  }));
  // Insert new rows
  const { error: upErr } = await supabase
    .from(TABLE)
    .upsert(upserts, { onConflict: 'bucket_id,storage_key' });
  if (upErr) {
    console.warn('[displayNames] Lỗi upsert mapping mới:', upErr.message);
    return;
  }
  // Xoá mapping cũ
  await removeDisplayNamesUnder(supabase, bucketId, oldPrefix);
}
