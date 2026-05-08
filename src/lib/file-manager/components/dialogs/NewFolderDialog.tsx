/**
 * File Manager Package - New Folder Dialog
 * Reusable component for creating folders
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFileManagerContext } from '../../FileManagerProvider';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useToast } from '@/hooks/use-toast';
import { sanitizeStorageKey } from '../../utils/sanitizeKey';
import { setDisplayName } from '../../services/displayNamesService';

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sanitizeFolderName = sanitizeStorageKey;

export function NewFolderDialog({ open, onOpenChange }: NewFolderDialogProps) {
  const { state, dispatch, config, supabase } = useFileManagerContext();
  const { loadFiles } = useFileOperations();
  const { toast } = useToast();
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  // Check if feature is enabled
  if (!config.features.upload) {
    return null;
  }

  const handleCreate = async () => {
    const sanitizedName = sanitizeFolderName(folderName);
    
    if (!sanitizedName) {
      toast({
        title: 'Lỗi',
        description: 'Tên thư mục không hợp lệ',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      // Tạo folder bằng cách upload placeholder (Supabase cần file để folder tồn tại)
      const { PLACEHOLDER_FILE } = await import('@/lib/file-manager/constants');
      const folderPath = state.currentPath 
        ? `${state.currentPath}/${sanitizedName}/${PLACEHOLDER_FILE}`
        : `${sanitizedName}/${PLACEHOLDER_FILE}`;

      const { error } = await supabase.storage
        .from(config.bucketName)
        .upload(folderPath, new Blob([''], { type: 'text/plain' }), {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        if (error.message.includes('already exists')) {
          throw new Error('Thư mục đã tồn tại');
        }
        throw error;
      }

      // Lưu display name nếu user gõ tên có dấu/ký tự đặc biệt
      const folderKey = state.currentPath
        ? `${state.currentPath}/${sanitizedName}`
        : sanitizedName;
      if (folderName.trim() !== sanitizedName) {
        await setDisplayName(supabase, config.bucketName, folderKey, folderName.trim());
      }

      toast({
        title: 'Thành công',
        description: `Đã tạo thư mục "${folderName.trim() || sanitizedName}"`,
      });

      // Callback
      config.callbacks?.onFolderChange?.(
        state.currentPath ? `${state.currentPath}/${sanitizedName}` : sanitizedName
      );

      // Close dialog and reset
      setFolderName('');
      onOpenChange(false);

      // Clear cache if enabled
      if (config.cache.enabled) {
        const storage = config.cache.storage === 'localStorage'
          ? localStorage
          : sessionStorage;
        storage.removeItem(`fm-files-${config.bucketName}-${state.currentPath}`);
      }

      // Reload danh sách file (sẽ tự reset SET_LOADING khi xong)
      await loadFiles(1, state.currentPath);

      // Trigger folder tree reload
      dispatch({ type: 'BUMP_TREE_REFRESH' });
      
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'Lỗi tạo thư mục',
        description: err.message || 'Không thể tạo thư mục',
        variant: 'destructive',
      });
      
      config.callbacks?.onError?.(
        error as Error,
        'create_folder'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !creating) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[380px] p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base">Tạo thư mục mới</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name" className="text-xs">Tên thư mục</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên thư mục..."
              className="h-9"
              disabled={creating}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Dấu tiếng Việt sẽ được chuyển sang ASCII vì Supabase Storage không nhận Unicode (vd: &quot;Tài liệu&quot; → &quot;Tai lieu&quot;).
            </p>

            {folderName && sanitizeFolderName(folderName) !== folderName.trim() && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Tên thực tế: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  {sanitizeFolderName(folderName) || '(không hợp lệ)'}
                </code>
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Hủy
          </Button>
          <Button 
            size="sm"
            onClick={handleCreate}
            disabled={!folderName.trim() || creating}
          >
            {creating ? 'Đang tạo...' : 'Tạo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
