/**
 * File Manager Package - Type Definitions
 * Standalone, reusable across projects
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ===== FILE TYPES =====

export interface FileItem {
  id: string;
  name: string;                    // Storage segment (ASCII, what Supabase has on disk)
  displayName?: string;            // Pretty Unicode name (vd: tiếng Việt) — render this if set
  path: string;                    // Full storage path in bucket
  type: 'file' | 'folder';
  size?: number;
  created_at: string;
  updated_at: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  size?: number;
  mimetype?: string;
  cacheControl?: string;
  contentType?: string;
  eTag?: string;
  lastModified?: string;
  httpStatusCode?: number;
}

export interface TrashItem extends FileItem {
  deletedAt: string;
  originalPath: string;
}

// ===== FOLDER TREE =====

export interface FolderNode {
  name: string;
  displayName?: string;
  path: string;
  children: FolderNode[];
  isExpanded: boolean;
  level: number;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

// ===== BACKGROUND TASKS =====

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BackgroundTask {
  id: string;
  type: 'compress' | 'extract' | 'upload' | 'download' | 'delete';
  status: TaskStatus;
  progress: number;
  fileName: string;
  startTime: number;
  endTime?: number;
  error?: string;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// ===== VERSION HISTORY =====

export interface FileVersion {
  id: string;
  version: string;
  name: string;
  created_at: string;
  size: number;
  metadata?: FileMetadata;
}

// ===== PERMISSIONS & SHARING =====

export interface FilePermission {
  userId: string;
  userName: string;
  role: 'viewer' | 'editor' | 'owner';
  grantedAt: string;
}

export interface ShareLink {
  id: string;
  url: string;
  expiresAt?: string;
  password?: string;
  viewCount: number;
  maxViews?: number;
  createdAt: string;
}

export interface FilePermissions {
  isPublic: boolean;
  accessLevel: 'view' | 'download' | 'edit';
  expiryDate?: Date;
  password?: string;
  maxViews?: number;
  currentViews?: number;
  sharedLink?: string;
}

// ===== AUDIT LOG =====

export interface AuditLogEntry {
  id: string;
  action: 'view' | 'download' | 'edit' | 'delete' | 'copy' | 'share' | 'rename' | 'move';
  timestamp: Date;
  user: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

// ===== FAVORITES & RECENT =====

export interface FavoriteFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  addedAt: string;
}

export interface RecentFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  accessedAt: string;
  accessCount: number;
}

// ===== CONTEXT MENU =====

export interface ContextMenuPosition {
  x: number;
  y: number;
}

// ===== VIEW MODES =====

export type ViewMode = 'grid' | 'list' | 'details';
export type SortBy = 'name' | 'size' | 'date' | 'type';
export type SortOrder = 'asc' | 'desc';

// ===== CONFIGURATION =====

/**
 * Configuration for File Manager instance
 * Pass these props to <FileManager /> component
 */
export interface FileManagerConfig {
  // Supabase configuration
  supabaseClient?: SupabaseClient; // Pass existing client OR
  supabaseUrl?: string;             // Create new client from URL + Key
  supabaseAnonKey?: string;
  
  // Storage configuration
  bucketName: string;                // Required: Supabase bucket name
  maxFileSize?: number;              // Optional: Max file size in bytes (default: 50MB)
  allowedFileTypes?: string[];       // Optional: MIME types whitelist
  storageLimit?: number;             // Optional: Total storage limit in bytes (default: 1GB)
  
  // Feature flags
  features?: {
    upload?: boolean;                // Enable file upload (default: true)
    download?: boolean;              // Enable file download (default: true)
    delete?: boolean;                // Enable delete to trash (default: true)
    copy?: boolean;                  // Enable copy files/folders (default: true)
    rename?: boolean;                // Enable rename files/folders (default: true)
    compress?: boolean;              // Enable compression (default: true)
    extract?: boolean;               // Enable archive extraction (default: true)
    preview?: boolean;               // Enable file preview (default: true)
    edit?: boolean;                  // Enable file editing (default: true)
    share?: boolean;                 // Enable file sharing (default: true)
    permissions?: boolean;           // Enable permissions (default: true)
    versionHistory?: boolean;        // Enable version history (default: true)
    imageEditor?: boolean;           // Enable image editor (default: true)
    folderTree?: boolean;            // Enable folder tree sidebar (default: true)
    search?: boolean;                // Enable advanced search (default: true)
    bulkRename?: boolean;            // Enable bulk rename (default: true)
    codeEditor?: boolean;            // Enable code editor (default: true)
  };
  
  // UI customization
  ui?: {
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;           // Tailwind color class (e.g., 'blue', 'purple')
    showBreadcrumb?: boolean;        // Show breadcrumb navigation (default: true)
    showToolbar?: boolean;           // Show toolbar (default: true)
    defaultView?: ViewMode;          // Default view mode (default: 'grid')
    compact?: boolean;               // Use compact layout (default: false)
  };
  
  // Callbacks
  callbacks?: {
    onFileSelect?: (file: FileItem) => void;
    onFileUpload?: (file: File, path: string) => void;
    onFileDownload?: (file: FileItem) => void;
    onFileDelete?: (file: FileItem) => void;
    onFolderChange?: (path: string) => void;
    onError?: (error: Error, context: string) => void;
    onSuccess?: (message: string) => void;
  };
  
  // Cache configuration
  cache?: {
    enabled?: boolean;               // Enable caching (default: true)
    ttl?: number;                    // Cache TTL in seconds (default: 300)
    storage?: 'localStorage' | 'sessionStorage' | 'memory';
  };
}

// ===== CONTEXT STATE =====

export interface FileManagerState {
  // Files & Folders
  files: FileItem[];
  items: FileItem[];                // Alias for compatibility
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  folderTree: FolderNode[];
  
  // Selection
  selectedItems: Set<string>;
  lastSelectedIndex: number | null;
  
  // View & Sort
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  
  // Search & Filter
  searchQuery: string;
  filterFileType: string;
  filterMinSize: string;
  filterMaxSize: string;
  filterDateFrom: string;
  filterDateTo: string;
  
  // UI State
  loading: boolean;
  treeLoading: boolean;
  treeRefreshKey: number;          // bump để force FolderTreeSidebar reload
  showFolderTree: boolean;
  showAdvancedSearch: boolean;
  
  // Dialog state
  dialogs: {
    upload: boolean;
    newFolder: boolean;
    newFile: boolean;
    rename: FileItem | null;
    move: FileItem | null;
    copy: boolean;
    compress: boolean;
    extract: FileItem | null;
    bulkRename: boolean;
    preview: FileItem | null;
    codeEditor: FileItem | null;
    imageEditor: FileItem | null;
    share: FileItem | null;
    versionHistory: FileItem | null;
    permissions: FileItem | null;
    properties: FileItem | null;
    hash: FileItem | null;
    auditLog: FileItem | null;
    delete: boolean;
  };
  
  // Navigation history (Back/Forward)
  navigationHistory: string[];
  navigationIndex: number;
  
  // Pagination
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  
  // Trash
  isTrashView: boolean;
  trashItems: TrashItem[];
  
  // Favorites & Recent
  favoriteFiles: Set<string>;
  showFavoritesView: boolean;
  showSharedLinksView: boolean;
  recentFiles: FileItem[];
  showRecentView: boolean;
  
  // Tasks
  backgroundTasks: BackgroundTask[];
  uploadQueue: UploadQueueItem[];
  showTasksPanel: boolean;
  
  // Clipboard
  clipboard: { items: string[]; action: 'copy' | 'cut' } | null;
  clipboardItems: FileItem[];
  clipboardAction: 'copy' | 'cut' | null;
  
  // Storage Info
  storageUsed: number;
  storageLimit: number;
}

// ===== ACTION TYPES =====

export type FileManagerAction =
  | { type: 'SET_FILES'; payload: FileItem[] }
  | { type: 'SET_CURRENT_PATH'; payload: string }
  | { type: 'SET_BREADCRUMBS'; payload: BreadcrumbItem[] }
  | { type: 'SET_FOLDER_TREE'; payload: FolderNode[] }
  | { type: 'SELECT_ITEM'; payload: string }
  | { type: 'DESELECT_ITEM'; payload: string }
  | { type: 'SELECT_MULTIPLE'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SORT'; payload: { sortBy: SortBy; sortOrder: SortOrder } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TREE_LOADING'; payload: boolean }
  | { type: 'BUMP_TREE_REFRESH' }
  | { type: 'TOGGLE_FOLDER_TREE' }
  | { type: 'TOGGLE_ADVANCED_SEARCH' }
  // Dialog actions
  | { type: 'OPEN_DIALOG'; payload: { dialog: keyof FileManagerState['dialogs']; data?: any } }
  | { type: 'CLOSE_DIALOG'; payload: keyof FileManagerState['dialogs'] }
  // Legacy dialog toggles (backward compat)
  | { type: 'TOGGLE_UPLOAD_DIALOG'; payload: boolean }
  | { type: 'TOGGLE_NEW_FOLDER_DIALOG'; payload: boolean }
  | { type: 'TOGGLE_DELETE_DIALOG'; payload: boolean }
  // Tasks
  | { type: 'ADD_TASK'; payload: BackgroundTask }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<BackgroundTask> } }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'SET_CLIPBOARD'; payload: { items: string[]; action: 'copy' | 'cut' } }
  | { type: 'CLEAR_CLIPBOARD' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_TRASH_VIEW'; payload: boolean }
  | { type: 'SET_TRASH_ITEMS'; payload: TrashItem[] }
  | { type: 'SET_FAVORITES_VIEW'; payload: boolean }
  | { type: 'SET_SHARED_LINKS_VIEW'; payload: boolean }
  // Navigation
  | { type: 'NAVIGATE_TO'; payload: string }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'NAVIGATE_FORWARD' }
  // Pagination
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_TOTAL_ITEMS'; payload: number }
  // Storage
  | { type: 'SET_STORAGE_INFO'; payload: { used: number; limit: number } }
  // Filters
  | { type: 'SET_FILTERS'; payload: { filterFileType?: string; filterMinSize?: string; filterMaxSize?: string; filterDateFrom?: string; filterDateTo?: string } }
  | { type: 'CLEAR_FILTERS' };

// ===== HOOKS RETURN TYPES =====

export interface UseFileManagerReturn {
  state: FileManagerState;
  dispatch: React.Dispatch<FileManagerAction>;
  
  // File operations
  loadFiles: (page?: number, targetPath?: string) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  downloadFile: (file: FileItem) => Promise<void>;
  deleteFile: (file: FileItem) => Promise<void>;
  renameFile: (file: FileItem, newName: string) => Promise<void>;
  moveFile: (file: FileItem, targetPath: string) => Promise<void>;
  copyFile: (file: FileItem, targetPath: string) => Promise<void>;
  
  // Folder operations
  createFolder: (folderName: string) => Promise<void>;
  navigateToFolder: (path: string) => void;
  
  // Selection
  selectItem: (id: string, isCtrl?: boolean, isShift?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Clipboard
  cutItems: (items: FileItem[]) => void;
  copyItems: (items: FileItem[]) => void;
  pasteItems: () => Promise<void>;
  
  // View
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  
  // Search
  setSearchQuery: (query: string) => void;
  
  // Trash
  toggleTrashView: () => void;
  restoreFromTrash: (item: TrashItem) => Promise<void>;
  permanentDelete: (item: TrashItem) => Promise<void>;
}
