/**
 * File Manager Package - Main Export
 * Standalone, reusable File Manager component
 * 
 * @example Basic Usage
 * ```tsx
 * import { FileManager } from '@/lib/file-manager';
 * 
 * <FileManager
 *   bucketName="my-files"
 *   supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
 *   supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
 *   onFileSelect={(file) => console.log('Selected:', file)}
 * />
 * ```
 * 
 * @example With Existing Supabase Client
 * ```tsx
 * import { createClient } from '@/lib/supabase/client';
 * import { FileManager } from '@/lib/file-manager';
 * 
 * const supabase = createClient();
 * 
 * <FileManager
 *   bucketName="uploads"
 *   supabaseClient={supabase}
 *   features={{
 *     imageEditor: true,
 *     versionHistory: true,
 *   }}
 * />
 * ```
 * 
 * @example Custom Theme
 * ```tsx
 * <FileManager
 *   bucketName="documents"
 *   supabaseUrl={url}
 *   supabaseAnonKey={key}
 *   ui={{
 *     theme: 'dark',
 *     primaryColor: 'purple',
 *     defaultView: 'list',
 *     compact: true,
 *   }}
 * />
 * ```
 */

'use client';

import React from 'react';
import type { FileManagerConfig } from './types';
import { FileManagerProvider } from './FileManagerProvider';
import { FileManagerUI } from './FileManagerUI';

interface FileManagerProps extends FileManagerConfig {
  className?: string;
}

/**
 * Standalone File Manager Component
 * 
 * Features:
 * - ✅ Upload/Download files & folders
 * - ✅ Folder tree navigation
 * - ✅ Multiple view modes (Grid, List, Details)
 * - ✅ Advanced search & filters
 * - ✅ Drag & drop support
 * - ✅ File preview (images, code, archives)
 * - ✅ Image editor với Canvas API
 * - ✅ Compress & extract archives (ZIP, GZIP)
 * - ✅ Version history
 * - ✅ File sharing & permissions
 * - ✅ Background tasks
 * - ✅ Trash & restore
 * - ✅ Favorites & recent files
 * - ✅ Clipboard (cut, copy, paste)
 * - ✅ Context menu
 * - ✅ Keyboard shortcuts
 * - ✅ Responsive mobile/desktop
 * - ✅ Dark mode support
 * - ✅ Caching for performance
 */
export function FileManager({ className, ...config }: FileManagerProps) {
  return (
    <FileManagerProvider config={config}>
      <React.Suspense
        fallback={
          <div className={`flex items-center justify-center min-h-[600px] ${className || ''}`}>
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-blue-50 dark:bg-blue-950 rounded-full">
                <svg
                  className="h-12 w-12 animate-spin text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Đang tải File Manager...
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Vui lòng đợi một chút
                </p>
              </div>
            </div>
          </div>
        }
      >
        <FileManagerUI />
      </React.Suspense>
    </FileManagerProvider>
  );
}

// Re-export types for external usage
export type {
  FileManagerConfig,
  FileItem,
  FileMetadata,
  FolderNode,
  BackgroundTask,
  ViewMode,
  SortBy,
  SortOrder,
} from './types';

// Re-export provider for advanced usage
export { FileManagerProvider, useFileManagerContext } from './FileManagerProvider';
export { FileManagerUI } from './FileManagerUI';

// Re-export constants
export { DEFAULT_CONFIG, DEFAULT_FEATURES, DEFAULT_UI, CACHE_KEYS } from './constants';

// Re-export all components for granular imports
export * from './components/dialogs';
export * from './components/views';
export * from './components/cards';
export * from './components/ui';

// Re-export all hooks
export * from './hooks';

// Re-export all services
export * from './services';
