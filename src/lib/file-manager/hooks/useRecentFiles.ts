import { useState, useEffect, useCallback } from 'react';

interface RecentFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  accessedAt: string;
  accessCount: number;
}

interface UseRecentFilesReturn {
  recentFiles: RecentFile[];
  addRecentFile: (file: { id: string; name: string; path: string; type: 'file' | 'folder' }) => void;
  clearRecentFiles: () => void;
  removeRecentFile: (id: string) => void;
}

const STORAGE_KEY = 'file-manager-recent-files';
const MAX_RECENT_FILES = 20; // Giới hạn số file recent
const EXPIRY_DAYS = 30; // Xóa file không truy cập trong 30 ngày

/**
 * Hook để track file truy cập gần đây
 * Lưu vào localStorage với TTL
 */
export function useRecentFiles(): UseRecentFilesReturn {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  // Load recent files từ localStorage khi mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RecentFile[] = JSON.parse(stored);
        
        // Lọc bỏ các file đã hết hạn
        const now = new Date();
        const filtered = parsed.filter((file) => {
          const accessDate = new Date(file.accessedAt);
          const daysDiff = (now.getTime() - accessDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= EXPIRY_DAYS;
        });
        
        setRecentFiles(filtered);
      }
    } catch (error) {
      console.error('Error loading recent files:', error);
    }
  }, []);

  // Save recent files vào localStorage khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFiles));
    } catch (error) {
      console.error('Error saving recent files:', error);
    }
  }, [recentFiles]);

  // Thêm/update file vào recent
  const addRecentFile = useCallback(
    (file: { id: string; name: string; path: string; type: 'file' | 'folder' }) => {
      setRecentFiles((prev) => {
        // Tìm file đã tồn tại
        const existingIndex = prev.findIndex((f) => f.id === file.id);
        
        if (existingIndex !== -1) {
          // Update existing file - move to top and increment count
          const updated = [...prev];
          const existing = updated[existingIndex];
          updated.splice(existingIndex, 1);
          updated.unshift({
            ...existing,
            accessedAt: new Date().toISOString(),
            accessCount: existing.accessCount + 1,
          });
          return updated;
        } else {
          // Add new file to top
          const newFiles = [
            {
              id: file.id,
              name: file.name,
              path: file.path,
              type: file.type,
              accessedAt: new Date().toISOString(),
              accessCount: 1,
            },
            ...prev,
          ];
          
          // Giới hạn số lượng
          return newFiles.slice(0, MAX_RECENT_FILES);
        }
      });
    },
    []
  );

  // Xóa file khỏi recent
  const removeRecentFile = useCallback((id: string) => {
    setRecentFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  // Xóa tất cả recent files
  const clearRecentFiles = useCallback(() => {
    setRecentFiles([]);
  }, []);

  return {
    recentFiles,
    addRecentFile,
    clearRecentFiles,
    removeRecentFile,
  };
}
