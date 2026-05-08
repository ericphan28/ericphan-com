import { useCallback, useSyncExternalStore } from 'react';

/**
 * Thông tin 1 link đã chia sẻ
 */
export interface SharedLinkItem {
  /** ID duy nhất (timestamp-based) */
  id: string;
  /** Tên file */
  fileName: string;
  /** Full path trong storage */
  filePath: string;
  /** Loại link */
  linkType: 'signed' | 'public';
  /** URL đã tạo */
  url: string;
  /** Thời điểm tạo link */
  createdAt: string;
  /** Thời điểm hết hạn (chỉ signed URL) */
  expiresAt?: string;
  /** Mô tả thời hạn */
  expiryLabel?: string;
}

interface UseSharedLinksReturn {
  /** Tất cả shared links */
  sharedLinks: SharedLinkItem[];
  /** Kiểm tra file đã được chia sẻ chưa (theo filePath) */
  isShared: (filePath: string) => boolean;
  /** Lấy tất cả links của 1 file */
  getLinksForFile: (filePath: string) => SharedLinkItem[];
  /** Đếm số link active (chưa hết hạn) */
  activeLinksCount: number;
  /** Thêm shared link mới */
  addSharedLink: (link: Omit<SharedLinkItem, 'id' | 'createdAt'>) => void;
  /** Xóa 1 shared link theo id */
  removeSharedLink: (id: string) => void;
  /** Xóa tất cả links của 1 file */
  removeLinksForFile: (filePath: string) => void;
  /** Xóa tất cả links đã hết hạn */
  cleanupExpired: () => number;
  /** Xóa tất cả */
  clearAll: () => void;
}

const STORAGE_KEY = 'file-manager-shared-links';
const MAX_LINKS = 200;
const SHARED_LINKS_CHANGE_EVENT = 'file-manager-shared-links-changed';

// === Helpers đọc/ghi localStorage ===

function readLinksFromStorage(): SharedLinkItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('Lỗi đọc shared links:', error);
  }
  return [];
}

function writeLinksToStorage(links: SharedLinkItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    window.dispatchEvent(new CustomEvent(SHARED_LINKS_CHANGE_EVENT));
  } catch (error) {
    console.error('Lỗi ghi shared links:', error);
  }
}

// === useSyncExternalStore setup ===

function subscribeSharedLinks(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener(SHARED_LINKS_CHANGE_EVENT, callback);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(SHARED_LINKS_CHANGE_EVENT, callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) || '[]';
}

/**
 * Hook quản lý danh sách link đã chia sẻ
 *
 * Dùng useSyncExternalStore (giống useFavorites) để:
 * - Mọi instance đều sync cùng localStorage
 * - Cross-tab sync qua storage event
 * - Same-tab sync qua CustomEvent
 */
export function useSharedLinks(): UseSharedLinksReturn {
  const linksJson = useSyncExternalStore(subscribeSharedLinks, getSnapshot, () => '[]');

  let sharedLinks: SharedLinkItem[];
  try {
    sharedLinks = JSON.parse(linksJson);
  } catch {
    sharedLinks = [];
  }

  // Đếm links chưa hết hạn
  const activeLinksCount = sharedLinks.filter((link) => {
    if (!link.expiresAt) return true; // Public URL, không hết hạn
    return new Date(link.expiresAt).getTime() > Date.now();
  }).length;

  // Kiểm tra file đã chia sẻ chưa (có ít nhất 1 active link)
  const isShared = useCallback(
    (filePath: string): boolean => {
      return sharedLinks.some((link) => {
        if (link.filePath !== filePath) return false;
        if (!link.expiresAt) return true;
        return new Date(link.expiresAt).getTime() > Date.now();
      });
    },
    [sharedLinks]
  );

  // Lấy tất cả links cho 1 file
  const getLinksForFile = useCallback(
    (filePath: string): SharedLinkItem[] => {
      return sharedLinks.filter((link) => link.filePath === filePath);
    },
    [sharedLinks]
  );

  // Thêm link mới
  const addSharedLink = useCallback(
    (link: Omit<SharedLinkItem, 'id' | 'createdAt'>) => {
      const current = readLinksFromStorage();
      const newLink: SharedLinkItem = {
        ...link,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newLink, ...current].slice(0, MAX_LINKS);
      writeLinksToStorage(updated);
    },
    []
  );

  // Xóa 1 link theo id
  const removeSharedLink = useCallback((id: string) => {
    const current = readLinksFromStorage();
    writeLinksToStorage(current.filter((link) => link.id !== id));
  }, []);

  // Xóa tất cả links của 1 file
  const removeLinksForFile = useCallback((filePath: string) => {
    const current = readLinksFromStorage();
    writeLinksToStorage(current.filter((link) => link.filePath !== filePath));
  }, []);

  // Dọn links đã hết hạn
  const cleanupExpired = useCallback((): number => {
    const current = readLinksFromStorage();
    const now = Date.now();
    const active = current.filter((link) => {
      if (!link.expiresAt) return true;
      return new Date(link.expiresAt).getTime() > now;
    });
    const removed = current.length - active.length;
    if (removed > 0) {
      writeLinksToStorage(active);
    }
    return removed;
  }, []);

  // Xóa tất cả
  const clearAll = useCallback(() => {
    writeLinksToStorage([]);
  }, []);

  return {
    sharedLinks,
    isShared,
    getLinksForFile,
    activeLinksCount,
    addSharedLink,
    removeSharedLink,
    removeLinksForFile,
    cleanupExpired,
    clearAll,
  };
}
