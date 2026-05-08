'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase-browser';
import type { FileItem } from '@/lib/file-manager/types';

const FileManager = dynamic(
  () => import('@/lib/file-manager/index').then((mod) => ({ default: mod.FileManager })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <svg
            className="mx-auto h-10 w-10 animate-spin text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-gray-400">Đang tải File Manager...</p>
        </div>
      </div>
    ),
  }
);

export default function FileManagerPage() {
  const supabase = createClient();

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.add('dark');
    return () => {
      if (!hadDark) root.classList.remove('dark');
    };
  }, []);

  return (
    <div className="sm:-mx-2">
      {/* Header — ẨN trên mobile (tab bar đã chỉ active "Tệp"), chỉ hiện desktop */}
      <div className="hidden sm:block px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">File Manager</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Quản lý tài liệu, hình ảnh và file dự án
            </p>
          </div>
        </div>
      </div>

      <div className="px-0 sm:px-4 pb-0 sm:pb-4">
        {/* Mobile: full viewport trừ tab bar (~64px + safe area). Desktop: trừ header. */}
        <div className="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border sm:border-white/10 bg-background shadow-none sm:shadow-2xl sm:shadow-black/40 h-[calc(100dvh-64px-env(safe-area-inset-bottom))] sm:h-[calc(100vh-9rem)]">
          <FileManager
            supabaseClient={supabase}
            bucketName="file-manager"
            maxFileSize={50 * 1024 * 1024}
            storageLimit={1024 * 1024 * 1024}
            features={{
              upload: true,
              download: true,
              delete: true,
              copy: true,
              rename: true,
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
              bulkRename: true,
              codeEditor: true,
            }}
            ui={{
              theme: 'dark',
              primaryColor: 'blue',
              showBreadcrumb: true,
              showToolbar: true,
              defaultView: 'grid',
              compact: true,
            }}
            callbacks={{
              onFileSelect: (file: FileItem) => console.log('File selected:', file),
              onFileUpload: (file: File, path: string) =>
                console.log('File uploaded:', file.name, 'to', path),
              onFileDownload: (file: FileItem) => console.log('File downloaded:', file.name),
              onFileDelete: (file: FileItem) => console.log('File deleted:', file.name),
              onFolderChange: (path: string) => console.log('Navigated to:', path),
              onError: (error: Error, context: string) =>
                console.error(`Error in ${context}:`, error),
              onSuccess: (message: string) => console.log('Success:', message),
            }}
            cache={{
              enabled: true,
              ttl: 300,
              storage: 'localStorage',
            }}
          />
        </div>
      </div>
    </div>
  );
}
