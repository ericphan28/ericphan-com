'use client';

import { useFileManagerContext } from '../FileManagerProvider';
import { useCallback } from 'react';
import { CACHE_KEYS } from '../constants';
import type { FileItem } from '../types';

/**
 * Hook for clipboard operations (cut/copy/paste)
 * 
 * Features:
 * - Copy files
 * - Cut files
 * - Paste to folder
 * - Clear clipboard
 */
export function useClipboard() {
  const { state, dispatch, config, supabase } = useFileManagerContext();

  const copy = useCallback((items: FileItem[]) => {
    dispatch({
      type: 'SET_CLIPBOARD',
      payload: {
        items: items.map((f) => f.name),
        action: 'copy',
      },
    });
  }, [dispatch]);

  const cut = useCallback((items: FileItem[]) => {
    dispatch({
      type: 'SET_CLIPBOARD',
      payload: {
        items: items.map((f) => f.name),
        action: 'cut',
      },
    });
  }, [dispatch]);

  const paste = useCallback(async (targetPath: string) => {
    if (!state.clipboard || state.clipboard.items.length === 0) {
      return;
    }

    try {
      const { items, action } = state.clipboard;

      for (const itemName of items) {
        const file = state.files.find((f) => f.name === itemName);
        if (!file) continue;

        const sourcePath = file.path || file.name;
        const targetFilePath = `${targetPath}/${file.name}`;

        if (action === 'copy') {
          // Copy file
          const { error } = await supabase.storage
            .from(config.bucketName)
            .copy(sourcePath, targetFilePath);

          if (error) throw error;
        } else if (action === 'cut') {
          // Move file
          const { error } = await supabase.storage
            .from(config.bucketName)
            .move(sourcePath, targetFilePath);

          if (error) throw error;
        }
      }

      // Clear clipboard after cut operation
      if (action === 'cut') {
        dispatch({ type: 'CLEAR_CLIPBOARD' });
      }

      // Clear cache cho path hiện tại
      if (config.cache.enabled) {
        const storage = config.cache.storage === 'localStorage' ? localStorage : sessionStorage;
        storage.removeItem(CACHE_KEYS.FILES(config.bucketName, targetPath));
      }

      // Reload files
      dispatch({ type: 'SET_LOADING', payload: true });

      config.callbacks?.onSuccess?.(`${action === 'copy' ? 'Copied' : 'Moved'} ${items.length} item(s)`);
    } catch (error) {
      config.callbacks?.onError?.(error as Error, 'clipboard_paste');
    }
  }, [state.clipboard, state.files, config, supabase, dispatch]);

  const clearClipboard = useCallback(() => {
    dispatch({ type: 'CLEAR_CLIPBOARD' });
  }, [dispatch]);

  return {
    clipboard: state.clipboard,
    hasClipboard: state.clipboard !== null && state.clipboard.items.length > 0,
    copy,
    cut,
    paste,
    clearClipboard,
  };
}
