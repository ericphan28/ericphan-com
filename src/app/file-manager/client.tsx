'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
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

export function FileManagerClient() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.add('dark');
    return () => {
      if (!hadDark) root.classList.remove('dark');
    };
  }, []);

  async function lock() {
    await fetch('/api/file-manager/lock', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-gray-100 flex flex-col">
      {/* Header sticky — luôn dính trên cùng, không bao giờ bị FileManager đè */}
      <header
        style={{ zIndex: 100 }}
        className="sticky top-0 flex-none flex items-center justify-between gap-3 px-3 sm:px-4 h-12 sm:h-14 border-b border-white/10 bg-[#0a0a1a]/95 backdrop-blur"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-lg">📁</span>
          <h1 className="text-sm sm:text-base font-semibold text-white truncate">
            File Manager
          </h1>
          <span className="hidden md:inline text-xs text-gray-500">
            · truy cập qua mã chia sẻ
          </span>
        </div>

        <button
          type="button"
          onClick={lock}
          className="flex-none inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-red-600 active:bg-red-700 transition cursor-pointer select-none"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Đăng xuất</span>
        </button>
      </header>

      <div className="flex-1 px-2 sm:px-4 py-2 sm:py-4 min-h-0">
        <div className="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border sm:border-white/10 bg-background shadow-none sm:shadow-2xl sm:shadow-black/40 h-[calc(100vh-3rem-1rem)] sm:h-[calc(100vh-3.5rem-2rem)]">
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
              compact: false,
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
