/**
 * Supabase Storage giới hạn key chỉ chấp nhận ký tự ASCII trong tập:
 *   /^(\w|\/|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)*$/
 *
 * Nghĩa là: tiếng Việt có dấu (ặ, ớ, ư, ...) sẽ bị reject với "Invalid key".
 * Hai utility dưới đây transliterate Việt → ASCII rồi chỉ giữ các ký tự
 * Supabase chấp nhận, để upload/rename/move không bị lỗi server.
 */

const ALLOWED_CHAR =
  /[A-Za-z0-9_!\-.*'() &$@=;:+,?]/;

/**
 * Transliterate tiếng Việt sang ASCII.
 * "mặt trước" → "mat truoc", "Đường" → "Duong".
 */
export function transliterateVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Sanitize tên file/folder cho Supabase Storage.
 * - Transliterate tiếng Việt
 * - Thay ký tự không hợp lệ bằng "_"
 * - Bỏ "/" (path separator) khỏi tên 1 segment
 * - Collapse khoảng trắng & "_" trùng
 */
export function sanitizeStorageKey(name: string): string {
  const ascii = transliterateVietnamese(name);
  let out = '';
  for (const ch of ascii) {
    if (ch === '/' || ch === '\\') {
      out += '_';
    } else if (ALLOWED_CHAR.test(ch)) {
      out += ch;
    } else {
      out += '_';
    }
  }
  return out
    .replace(/\s+/g, ' ')
    .replace(/_+/g, '_')
    .replace(/^[._\-\s]+|[._\-\s]+$/g, '');
}

/**
 * Sanitize đường dẫn nhiều segment (cho upload folder, webkitRelativePath).
 * "Tài liệu/Hình ảnh/cảnh đẹp.jpg" → "Tai lieu/Hinh anh/canh dep.jpg"
 */
export function sanitizeStoragePath(path: string): string {
  return path
    .split('/')
    .filter((seg) => seg.length > 0)
    .map(sanitizeStorageKey)
    .filter((seg) => seg.length > 0)
    .join('/');
}
