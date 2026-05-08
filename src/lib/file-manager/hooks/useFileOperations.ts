/**
 * File Manager Package - File Operations Hook
 * Reusable file operations logic
 */

'use client';

import { useCallback } from 'react';
import { useFileManagerContext } from '../FileManagerProvider';
import { useToast } from '@/hooks/use-toast';
import { isPlaceholderFile } from '../constants';
import { sanitizeStorageKey, sanitizeStoragePath } from '../utils/sanitizeKey';
import {
  getDisplayNames,
  setDisplayName,
  removeDisplayName,
  removeDisplayNamesUnder,
} from '../services/displayNamesService';
import type { FileItem } from '../types';

/**
 * Hook providing file operation methods
 * Used by dialogs and components to perform file actions
 */
export function useFileOperations() {
  const { state, dispatch, config, supabase } = useFileManagerContext();
  const { toast } = useToast();

  /**
   * Load files from current path or specified path
   */
  const loadFiles = useCallback(
    async (page = 1, targetPath?: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const pathToLoad = targetPath !== undefined ? targetPath : state.currentPath;
        
        console.log('[FileManager] loadFiles called:', { page, targetPath, pathToLoad, stateCurrentPath: state.currentPath });
        
        // Ensure page is valid (>= 1)
        const validPage = Math.max(1, Math.floor(page) || 1);
        const offset = Math.max(0, (validPage - 1) * 50); // itemsPerPage

        const { data, error } = await supabase.storage
          .from(config.bucketName)
          .list(pathToLoad, {
            limit: 50,
            offset: offset,
            sortBy: { column: 'name', order: 'asc' },
          });

        console.log('[FileManager] Supabase response:', { pathToLoad, dataLength: data?.length, data, error });

        if (error) throw error;

        const fileItems: FileItem[] = (data || [])
          .filter((item) => item.name !== '.trash' && item.name !== '.trash/' && !isPlaceholderFile(item.name))
          .map((item) => {
            const isFolder = item.id === null;
            const uniqueId = isFolder
              ? `folder-${pathToLoad}-${item.name}`
              : item.id;

            const now = new Date().toISOString();

            // Xây dựng full path cho file/folder
            const fullPath = pathToLoad
              ? `${pathToLoad}/${item.name}`
              : item.name;

            return {
              id: uniqueId,
              name: item.name,
              path: fullPath,
              type: isFolder ? 'folder' : 'file',
              size: item.metadata?.size,
              created_at: item.created_at || now,
              updated_at: item.updated_at || now,
              metadata: item.metadata,
            } as FileItem;
          });

        // Attach display names (mapping ASCII storage key -> Unicode tên hiển thị)
        if (fileItems.length > 0) {
          try {
            const map = await getDisplayNames(
              supabase,
              config.bucketName,
              fileItems.map((f) => f.path)
            );
            for (const f of fileItems) {
              const dn = map.get(f.path);
              if (dn) f.displayName = dn;
            }
          } catch (e) {
            console.warn('[loadFiles] không tải được display names', e);
          }
        }

        dispatch({ type: 'SET_FILES', payload: fileItems });

        // Cache if enabled
        if (config.cache.enabled) {
          const storage =
            config.cache.storage === 'localStorage'
              ? localStorage
              : sessionStorage;
          storage.setItem(
            `fm-files-${config.bucketName}-${pathToLoad}`,
            JSON.stringify(fileItems)
          );
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast({
          title: 'Lỗi tải file',
          description: err.message || 'Không thể tải danh sách file',
          variant: 'destructive',
        });

        config.callbacks?.onError?.(error as Error, 'load_files');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    // Không cần state.currentPath vì luôn truyền targetPath khi gọi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, supabase, dispatch, toast]
  );

  /**
   * Upload file to current path
   */
  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      if (!config.features.upload) {
        throw new Error('Upload feature is disabled');
      }

      // Check file size
      if (config.maxFileSize && file.size > config.maxFileSize) {
        throw new Error(
          `File quá lớn. Kích thước tối đa: ${(config.maxFileSize / 1024 / 1024).toFixed(0)}MB`
        );
      }

      // Check file type
      if (config.allowedFileTypes && config.allowedFileTypes.length > 0) {
        const isAllowed = config.allowedFileTypes.some((type) => {
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(category + '/');
          }
          return file.type === type;
        });

        if (!isAllowed) {
          throw new Error('Loại file không được phép');
        }
      }

      const safeName = sanitizeStorageKey(file.name) || file.name;
      const filePath = state.currentPath
        ? `${state.currentPath}/${safeName}`
        : safeName;

      const { error } = await supabase.storage
        .from(config.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Lưu display name nếu khác safeName (tức là tên gốc có dấu/đặc biệt)
      if (file.name !== safeName) {
        await setDisplayName(supabase, config.bucketName, filePath, file.name);
      }

      // Auto-cleanup: xóa placeholder cũ trong folder (nếu có)
      if (state.currentPath) {
        const { PLACEHOLDER_NAMES } = await import('../constants');
        const placeholders = [...PLACEHOLDER_NAMES].map(name => `${state.currentPath}/${name}`);
        await supabase.storage.from(config.bucketName).remove(placeholders).catch(() => {});
      }

      // Callback
      config.callbacks?.onFileUpload?.(file, state.currentPath);

      // Reload files
      await loadFiles();
    },
    [config, state.currentPath, supabase, loadFiles]
  );

  /**
   * Upload multiple files from folder selection
   * Supports webkitdirectory attribute
   */
  const uploadFolder = useCallback(
    async (files: FileList): Promise<void> => {
      if (!config.features.upload) {
        throw new Error('Upload feature is disabled');
      }

      const filesArray = Array.from(files);
      let successCount = 0;
      let errorCount = 0;

      for (const file of filesArray) {
        try {
          // Get relative path from webkitRelativePath
          const rawPath = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name;
          const safePath = sanitizeStoragePath(rawPath) || sanitizeStorageKey(file.name);

          // Build full path in storage
          const fullPath = state.currentPath
            ? `${state.currentPath}/${safePath}`
            : safePath;

          // Lưu display name cho từng segment khác nhau
          if (rawPath !== safePath) {
            const rawSegs = rawPath.split('/');
            const safeSegs = safePath.split('/');
            const baseSegs = state.currentPath ? state.currentPath.split('/') : [];
            for (let i = 0; i < rawSegs.length; i++) {
              if (rawSegs[i] && safeSegs[i] && rawSegs[i] !== safeSegs[i]) {
                const segPath = [...baseSegs, ...safeSegs.slice(0, i + 1)].join('/');
                await setDisplayName(supabase, config.bucketName, segPath, rawSegs[i]);
              }
            }
          }

          // Check file size
          if (config.maxFileSize && file.size > config.maxFileSize) {
            console.warn(`Skipping ${file.name}: file too large`);
            errorCount++;
            continue;
          }

          // Upload file
          const { error } = await supabase.storage
            .from(config.bucketName)
            .upload(fullPath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            console.error(`Error uploading ${file.name}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          errorCount++;
        }
      }

      // Show result
      if (successCount > 0) {
        toast({
          title: 'Upload thành công',
          description: `Đã upload ${successCount} file${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`,
        });
        // Folder upload có thể tạo subfolders mới → refresh tree
        dispatch({ type: 'BUMP_TREE_REFRESH' });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: 'Lỗi upload',
          description: `Không thể upload ${errorCount} file`,
          variant: 'destructive',
        });
      }

      // Reload files
      await loadFiles();
    },
    [config, state.currentPath, supabase, toast, loadFiles]
  );

  /**
   * Download file
   */
  const downloadFile = useCallback(
    async (file: FileItem): Promise<void> => {
      if (!config.features.download) {
        throw new Error('Download feature is disabled');
      }

      const filePath = state.currentPath
        ? `${state.currentPath}/${file.name}`
        : file.name;

      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Callback
      config.callbacks?.onFileDownload?.(file);
    },
    [config, state.currentPath, supabase]
  );

  /**
   * Recursively list every file path under a prefix (folders themselves
   * aren't real objects in Supabase Storage, only their children are).
   */
  const listAllFilesUnder = useCallback(
    async (prefix: string): Promise<string[]> => {
      const result: string[] = [];
      const PAGE = 1000;
      let offset = 0;
      while (true) {
        const { data, error } = await supabase.storage
          .from(config.bucketName)
          .list(prefix, { limit: PAGE, offset });
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const item of data) {
          const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id === null) {
            const sub = await listAllFilesUnder(fullPath);
            result.push(...sub);
          } else {
            result.push(fullPath);
          }
        }
        if (data.length < PAGE) break;
        offset += PAGE;
      }
      return result;
    },
    [config.bucketName, supabase]
  );

  /**
   * Delete file or folder (move contents to trash). Tolerates the case where
   * the source object has already disappeared between listing and delete.
   */
  const deleteFile = useCallback(
    async (file: FileItem): Promise<void> => {
      if (!config.features.delete) {
        throw new Error('Delete feature is disabled');
      }

      const sourcePath =
        file.path ||
        (state.currentPath ? `${state.currentPath}/${file.name}` : file.name);
      const isMissing = (msg?: string) => /not.?found/i.test(msg || '');

      if (file.type === 'folder') {
        const allFiles = await listAllFilesUnder(sourcePath);
        if (allFiles.length > 0) {
          const stamp = Date.now();
          await Promise.all(
            allFiles.map(async (fullPath) => {
              const rel = fullPath.startsWith(`${sourcePath}/`)
                ? fullPath.slice(sourcePath.length + 1)
                : fullPath;
              const trashPath = `.trash/${stamp}_${file.name}/${rel}`;
              const { error } = await supabase.storage
                .from(config.bucketName)
                .copy(fullPath, trashPath);
              if (error && !isMissing(error.message)) {
                throw error;
              }
            })
          );
          const { error: removeError } = await supabase.storage
            .from(config.bucketName)
            .remove(allFiles);
          if (removeError && !isMissing(removeError.message)) throw removeError;
        }
        // Cleanup display-name mappings dưới folder này
        await removeDisplayNamesUnder(supabase, config.bucketName, sourcePath);
        // Folder thay đổi → tree refresh
        dispatch({ type: 'BUMP_TREE_REFRESH' });
      } else {
        const trashPath = `.trash/${Date.now()}_${file.name}`;
        const { error: copyError } = await supabase.storage
          .from(config.bucketName)
          .copy(sourcePath, trashPath);
        if (copyError && !isMissing(copyError.message)) throw copyError;

        const { error: removeError } = await supabase.storage
          .from(config.bucketName)
          .remove([sourcePath]);
        if (removeError && !isMissing(removeError.message)) throw removeError;

        await removeDisplayName(supabase, config.bucketName, sourcePath);
      }

      config.callbacks?.onFileDelete?.(file);
      await loadFiles();
    },
    [config, state.currentPath, supabase, loadFiles, listAllFilesUnder]
  );

  /**
   * Clear folder tree cache
   */
  const clearFolderTreeCache = useCallback(() => {
    if (config.cache.enabled) {
      const storage =
        config.cache.storage === 'localStorage'
          ? localStorage
          : sessionStorage;
      storage.removeItem(`fm-folder-tree-${config.bucketName}`);
    }
  }, [config]);

  /**
   * Clear files cache
   */
  const clearFilesCache = useCallback(() => {
    if (config.cache.enabled) {
      const storage =
        config.cache.storage === 'localStorage'
          ? localStorage
          : sessionStorage;
      storage.removeItem(
        `fm-files-${config.bucketName}-${state.currentPath}`
      );
    }
  }, [config, state.currentPath]);

  return {
    loadFiles,
    uploadFile,
    uploadFolder,
    downloadFile,
    deleteFile,
    clearFolderTreeCache,
    clearFilesCache,
  };
}
