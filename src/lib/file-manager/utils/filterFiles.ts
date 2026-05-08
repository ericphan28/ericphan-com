import type { FileItem, FileManagerState } from '../types';

/**
 * Phân loại file dựa trên mimetype và extension
 * Dùng cho bộ lọc nâng cao trong Advanced Search
 */
function getFileCategory(file: FileItem): string {
  const mime = file.metadata?.mimetype || '';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Thư mục (không có metadata)
  if (!file.metadata) return 'folder';

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) return 'image';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)) return 'video';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'm4a', 'wma', 'ogg'].includes(ext)) return 'audio';

  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)
  )
    return 'document';

  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
  )
    return 'spreadsheet';

  if (
    mime.includes('zip') ||
    mime.includes('gzip') ||
    mime.includes('tar') ||
    mime.includes('rar') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)
  )
    return 'archive';

  const codeExts = [
    'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'less',
    'py', 'java', 'go', 'rs', 'php', 'rb', 'c', 'cpp', 'h', 'hpp',
    'sql', 'sh', 'bash', 'yaml', 'yml', 'xml', 'toml', 'ini', 'env',
    'vue', 'svelte', 'swift', 'kt', 'dart',
  ];
  if (codeExts.includes(ext)) return 'code';

  return 'other';
}

/**
 * Áp dụng tất cả bộ lọc (text search + advanced filters) lên danh sách files
 *
 * @param files - Danh sách files gốc
 * @param state - State chứa searchQuery và các filter
 * @returns Danh sách files đã lọc
 */
export function applyFilters(files: FileItem[], state: FileManagerState): FileItem[] {
  return files.filter((file) => {
    // 1. Text search
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      if (!file.name.toLowerCase().includes(query)) return false;
    }

    // 2. Lọc theo loại file (bỏ qua nếu 'all' hoặc rỗng)
    if (state.filterFileType && state.filterFileType !== 'all') {
      const category = getFileCategory(file);
      if (category !== state.filterFileType) return false;
    }

    // 3. Lọc theo kích thước tối thiểu (KB → bytes)
    if (state.filterMinSize) {
      const minBytes = parseFloat(state.filterMinSize) * 1024;
      const fileSize = file.metadata?.size || file.size || 0;
      if (fileSize < minBytes) return false;
    }

    // 4. Lọc theo kích thước tối đa (KB → bytes)
    if (state.filterMaxSize) {
      const maxBytes = parseFloat(state.filterMaxSize) * 1024;
      const fileSize = file.metadata?.size || file.size || 0;
      if (fileSize > maxBytes) return false;
    }

    // 5. Lọc theo ngày bắt đầu
    if (state.filterDateFrom) {
      const fromDate = new Date(state.filterDateFrom);
      const fileDate = new Date(file.updated_at);
      if (fileDate < fromDate) return false;
    }

    // 6. Lọc theo ngày kết thúc
    if (state.filterDateTo) {
      const toDate = new Date(state.filterDateTo);
      // Thêm 1 ngày để inclusive (đến hết ngày đã chọn)
      toDate.setDate(toDate.getDate() + 1);
      const fileDate = new Date(file.updated_at);
      if (fileDate > toDate) return false;
    }

    return true;
  });
}
