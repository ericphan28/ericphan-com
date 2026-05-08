/**
 * Cache service for file manager data
 * 
 * Features:
 * - LocalStorage/SessionStorage support
 * - TTL (Time To Live)
 * - Cache invalidation
 * - Compression for large data
 */

export type CacheStorage = 'localStorage' | 'sessionStorage';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  storage?: CacheStorage;
  compress?: boolean;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Get storage instance
 */
function getStorage(type: CacheStorage): Storage {
  return type === 'localStorage' ? localStorage : sessionStorage;
}

/**
 * Set item in cache
 */
export function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): void {
  const {
    ttl = 3600000, // 1 hour default
    storage = 'localStorage',
    compress = false,
  } = options;

  const cachedData: CachedData<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  try {
    let value = JSON.stringify(cachedData);

    // Simple compression by removing whitespace
    if (compress) {
      value = value.replace(/\s+/g, '');
    }

    getStorage(storage).setItem(key, value);
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

/**
 * Get item from cache
 */
export function getCache<T>(
  key: string,
  options: { storage?: CacheStorage } = {}
): T | null {
  const { storage = 'localStorage' } = options;

  try {
    const value = getStorage(storage).getItem(key);
    if (!value) return null;

    const cachedData: CachedData<T> = JSON.parse(value);

    // Check if expired
    const now = Date.now();
    const age = now - cachedData.timestamp;

    if (age > cachedData.ttl) {
      // Expired, remove and return null
      removeCache(key, { storage });
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

/**
 * Remove item from cache
 */
export function removeCache(
  key: string,
  options: { storage?: CacheStorage } = {}
): void {
  const { storage = 'localStorage' } = options;

  try {
    getStorage(storage).removeItem(key);
  } catch (error) {
    console.error('Error removing cache:', error);
  }
}

/**
 * Clear all cache with prefix
 */
export function clearCacheByPrefix(
  prefix: string,
  options: { storage?: CacheStorage } = {}
): void {
  const { storage = 'localStorage' } = options;

  try {
    const store = getStorage(storage);
    const keys: string[] = [];

    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    keys.forEach((key) => store.removeItem(key));
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Check if cache exists and is valid
 */
export function hasValidCache(
  key: string,
  options: { storage?: CacheStorage } = {}
): boolean {
  return getCache(key, options) !== null;
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(
  key: string,
  options: { storage?: CacheStorage } = {}
): number | null {
  const { storage = 'localStorage' } = options;

  try {
    const value = getStorage(storage).getItem(key);
    if (!value) return null;

    const cachedData: CachedData<any> = JSON.parse(value);
    return Date.now() - cachedData.timestamp;
  } catch (error) {
    return null;
  }
}

/**
 * Refresh cache TTL without changing data
 */
export function refreshCache(
  key: string,
  options: CacheOptions = {}
): boolean {
  const { storage = 'localStorage', ttl = 3600000 } = options;

  try {
    const value = getStorage(storage).getItem(key);
    if (!value) return false;

    const cachedData: CachedData<any> = JSON.parse(value);
    cachedData.timestamp = Date.now();
    cachedData.ttl = ttl;

    getStorage(storage).setItem(key, JSON.stringify(cachedData));
    return true;
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return false;
  }
}

/**
 * Get all cache keys with prefix
 */
export function getCacheKeys(
  prefix: string = '',
  options: { storage?: CacheStorage } = {}
): string[] {
  const { storage = 'localStorage' } = options;

  try {
    const store = getStorage(storage);
    const keys: string[] = [];

    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    return keys;
  } catch (error) {
    console.error('Error getting cache keys:', error);
    return [];
  }
}
