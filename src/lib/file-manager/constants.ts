/**
 * File Manager Package - Constants
 * Standalone, reusable across projects
 */

// Cache keys
export const CACHE_KEYS = {
  FILES: (bucket: string, path: string) => `fm-files-${bucket}-${path}`,
  FOLDER_TREE: (bucket: string) => `fm-folder-tree-${bucket}`,
  TRASH: (bucket: string) => `fm-trash-${bucket}`,
  FAVORITES: (bucket: string) => `fm-favorites-${bucket}`,
  RECENT: (bucket: string) => `fm-recent-${bucket}`,
} as const;

// Default configuration values
export const DEFAULT_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  cacheTTL: 300, // 5 minutes
  itemsPerPage: 50,
  recentFilesLimit: 20,
  maxUploadConcurrency: 3,
} as const;

// Feature flags default values
export const DEFAULT_FEATURES = {
  upload: true,
  download: true,
  delete: true,
  compress: true,
  extract: true,
  preview: true,
  edit: true,
  share: true,
  permissions: true,
  versionHistory: true,
  imageEditor: true,
  folderTree: true,
  search: true,
} as const;

// UI default values
export const DEFAULT_UI = {
  theme: 'auto' as const,
  primaryColor: 'blue',
  showBreadcrumb: true,
  showToolbar: true,
  defaultView: 'grid' as const,
  compact: false,
} as const;

// File type categories
export const FILE_CATEGORIES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  code: [
    'text/javascript',
    'text/typescript',
    'text/html',
    'text/css',
    'application/json',
    'text/plain',
  ],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
  ],
} as const;

// Placeholder file — Supabase Storage (S3) không có khái niệm "thư mục thật"
// Cần 1 file bên trong để thư mục tồn tại. File này sẽ bị ẩn khỏi UI.
export const PLACEHOLDER_FILE = '.emptyFolderPlaceholder';

// Tất cả tên placeholder từng dùng (backward compat: lọc hết khỏi UI)
export const PLACEHOLDER_NAMES = new Set([
  '.emptyFolderPlaceholder',
  '.placeholder',
  '.gitkeep',
]);

// Kiểm tra nhanh: item có phải placeholder không?
export const isPlaceholderFile = (name: string): boolean =>
  PLACEHOLDER_NAMES.has(name);

// Trash prefix for soft delete
export const TRASH_PREFIX = '.trash/';

// Error messages
export const ERROR_MESSAGES = {
  BUCKET_NOT_FOUND: 'Bucket không tồn tại. Vui lòng kiểm tra cấu hình.',
  FILE_TOO_LARGE: 'File quá lớn. Kích thước tối đa:',
  INVALID_FILE_TYPE: 'Loại file không được phép.',
  UPLOAD_FAILED: 'Upload thất bại. Vui lòng thử lại.',
  DOWNLOAD_FAILED: 'Download thất bại. Vui lòng thử lại.',
  DELETE_FAILED: 'Xóa thất bại. Vui lòng thử lại.',
  FOLDER_EXISTS: 'Thư mục đã tồn tại.',
  INVALID_FOLDER_NAME: 'Tên thư mục không hợp lệ.',
  NO_PERMISSION: 'Bạn không có quyền thực hiện thao tác này.',
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  UPLOAD_COMPLETE: 'Upload thành công!',
  DOWNLOAD_COMPLETE: 'Download thành công!',
  DELETE_COMPLETE: 'Đã chuyển vào thùng rác.',
  RESTORE_COMPLETE: 'Khôi phục thành công!',
  FOLDER_CREATED: 'Tạo thư mục thành công!',
  FILE_RENAMED: 'Đổi tên thành công!',
  FILE_MOVED: 'Di chuyển thành công!',
  FILE_COPIED: 'Sao chép thành công!',
} as const;
