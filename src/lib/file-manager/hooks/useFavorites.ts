import { useCallback, useSyncExternalStore } from 'react';

interface FavoriteFile {
  id: string;       // dùng full path làm id (unique, ổn định)
  name: string;
  path: string;     // full path: "folder/subfolder/file.txt"
  type: 'file' | 'folder';
  addedAt: string;
}

interface UseFavoritesReturn {
  favorites: FavoriteFile[];
  isFavorite: (fileFullPath: string) => boolean;
  addFavorite: (file: { name: string; path: string; type: 'file' | 'folder' }) => void;
  removeFavorite: (fileFullPath: string) => void;
  toggleFavorite: (file: { name: string; path: string; type: 'file' | 'folder' }) => void;
  clearFavorites: () => void;
}

const STORAGE_KEY = 'file-manager-favorites';
const MAX_FAVORITES = 100;

// Custom event name dùng để sync giữa các instances
const FAVORITES_CHANGE_EVENT = 'file-manager-favorites-changed';

/**
 * Đọc favorites từ localStorage (helper)
 */
function readFavoritesFromStorage(): FavoriteFile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Lỗi đọc favorites:', error);
  }
  return [];
}

/**
 * Ghi favorites vào localStorage + dispatch event để sync
 */
function writeFavoritesToStorage(favorites: FavoriteFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    // Dispatch custom event để các instance useFavorites() khác re-render
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGE_EVENT));
  } catch (error) {
    console.error('Lỗi ghi favorites:', error);
  }
}

/**
 * useSyncExternalStore cần 1 subscribe function ổn định
 * Khi localStorage thay đổi (cùng tab qua custom event, hoặc khác tab qua storage event)
 * → component re-render
 */
function subscribeFavorites(callback: () => void): () => void {
  // Lắng nghe custom event (cùng tab)
  window.addEventListener(FAVORITES_CHANGE_EVENT, callback);
  // Lắng nghe storage event (khác tab)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) callback();
  });

  return () => {
    window.removeEventListener(FAVORITES_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/**
 * getSnapshot: trả về serialized string để useSyncExternalStore so sánh
 */
function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) || '[]';
}

/**
 * Hook quản lý file yêu thích
 * 
 * Dùng useSyncExternalStore để:
 * - Tất cả instances useFavorites() chia sẻ cùng 1 nguồn dữ liệu (localStorage)
 * - Khi 1 instance thay đổi, tất cả instances đều re-render
 * - Không bị bug ghi đè localStorage trước khi load
 * 
 * Identifier: dùng full path (ví dụ "images/photo.jpg") — ổn định, unique
 */
export function useFavorites(): UseFavoritesReturn {
  // useSyncExternalStore đảm bảo re-render khi localStorage thay đổi
  const favoritesJson = useSyncExternalStore(subscribeFavorites, getSnapshot, () => '[]');
  
  let favorites: FavoriteFile[];
  try {
    favorites = JSON.parse(favoritesJson);
  } catch {
    favorites = [];
  }

  // Kiểm tra xem file có trong favorites không — dùng path làm key
  const isFavorite = useCallback(
    (fileFullPath: string) => {
      return favorites.some((fav) => fav.path === fileFullPath);
    },
    [favorites]
  );

  // Thêm file vào favorites
  const addFavorite = useCallback(
    (file: { name: string; path: string; type: 'file' | 'folder' }) => {
      const current = readFavoritesFromStorage();

      // Kiểm tra đã tồn tại chưa (dùng path)
      if (current.some((fav) => fav.path === file.path)) {
        return;
      }

      const newFavorites = [
        {
          id: file.path,  // dùng path làm id
          name: file.name,
          path: file.path,
          type: file.type,
          addedAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, MAX_FAVORITES);

      writeFavoritesToStorage(newFavorites);
    },
    []
  );

  // Xóa file khỏi favorites (dùng path)
  const removeFavorite = useCallback((fileFullPath: string) => {
    const current = readFavoritesFromStorage();
    const updated = current.filter((fav) => fav.path !== fileFullPath);
    writeFavoritesToStorage(updated);
  }, []);

  // Toggle favorite (add nếu chưa có, remove nếu đã có)
  const toggleFavorite = useCallback(
    (file: { name: string; path: string; type: 'file' | 'folder' }) => {
      const current = readFavoritesFromStorage();
      const exists = current.some((fav) => fav.path === file.path);

      if (exists) {
        const updated = current.filter((fav) => fav.path !== file.path);
        writeFavoritesToStorage(updated);
      } else {
        const newFavorites = [
          {
            id: file.path,
            name: file.name,
            path: file.path,
            type: file.type,
            addedAt: new Date().toISOString(),
          },
          ...current,
        ].slice(0, MAX_FAVORITES);

        writeFavoritesToStorage(newFavorites);
      }
    },
    []
  );

  // Xóa tất cả favorites
  const clearFavorites = useCallback(() => {
    writeFavoritesToStorage([]);
  }, []);

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
  };
}
