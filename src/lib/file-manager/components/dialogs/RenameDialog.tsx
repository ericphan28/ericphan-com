/**
 * File Manager Package - Rename Dialog
 * Rename files and folders
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFileManagerContext } from '../../FileManagerProvider';
import { useToast } from '@/hooks/use-toast';
import { sanitizeStorageKey } from '../../utils/sanitizeKey';
import {
  moveDisplayNamesPrefix,
  renameDisplayName,
  setDisplayName,
} from '../../services/displayNamesService';
import type { FileItem } from '../../types';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  onSuccess?: () => void;
}

export function RenameDialog({ open, onOpenChange, file, onSuccess }: RenameDialogProps) {
  const { state, dispatch, config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Check if feature is enabled
  if (!config.features.edit) {
    return null;
  }

  // Update newName when file changes — prefer the pretty Unicode name if any
  useEffect(() => {
    if (file) {
      setNewName(file.displayName || file.name);
    }
  }, [file]);

  const handleRename = async () => {
    if (!file || !newName.trim()) return;

    const trimmedNew = newName.trim();
    const safeName = sanitizeStorageKey(trimmedNew);
    if (!safeName) {
      toast({ title: 'Lỗi', description: 'Tên không hợp lệ', variant: 'destructive' });
      return;
    }

    const currentDisplay = file.displayName || file.name;
    // Truly no change — cùng cả storage key và display name
    if (safeName === file.name && trimmedNew === currentDisplay) {
      onOpenChange(false);
      return;
    }

    setRenaming(true);

    try {
      const oldPath = file.path || (state.currentPath
        ? `${state.currentPath}/${file.name}`
        : file.name);
      const newPath = state.currentPath
        ? `${state.currentPath}/${safeName}`
        : safeName;

      // Storage key không đổi → chỉ cập nhật display name (không move)
      if (safeName === file.name) {
        await setDisplayName(supabase, config.bucketName, oldPath, trimmedNew);
        toast({
          title: 'Đã đổi tên hiển thị',
          description: `"${currentDisplay}" → "${trimmedNew}"`,
        });
        if (config.cache.enabled) {
          const storage = config.cache.storage === 'localStorage'
            ? localStorage
            : sessionStorage;
          storage.removeItem(`fm-folder-tree-${config.bucketName}`);
        }
        setNewName('');
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      if (file.type === 'folder') {
        // Folder = prefix, không phải object đơn → liệt kê hết files con + move từng cái
        const listAll = async (prefix: string): Promise<string[]> => {
          const out: string[] = [];
          const PAGE = 1000;
          let offset = 0;
          while (true) {
            const { data, error } = await supabase.storage
              .from(config.bucketName)
              .list(prefix, { limit: PAGE, offset });
            if (error) throw error;
            if (!data || data.length === 0) break;
            for (const it of data) {
              const full = prefix ? `${prefix}/${it.name}` : it.name;
              if (it.id === null) {
                const sub = await listAll(full);
                out.push(...sub);
              } else {
                out.push(full);
              }
            }
            if (data.length < PAGE) break;
            offset += PAGE;
          }
          return out;
        };

        const filesUnder = await listAll(oldPath);
        for (const fp of filesUnder) {
          const rel = fp.startsWith(`${oldPath}/`) ? fp.slice(oldPath.length + 1) : fp;
          const newFp = `${newPath}/${rel}`;
          const { error: mvErr } = await supabase.storage
            .from(config.bucketName)
            .move(fp, newFp);
          if (mvErr) throw mvErr;
        }

        // Di chuyển toàn bộ display-name mapping con
        await moveDisplayNamesPrefix(supabase, config.bucketName, oldPath, newPath);
        // Set display name cho folder mới (chính nó)
        if (newName.trim() !== safeName) {
          await setDisplayName(supabase, config.bucketName, newPath, newName.trim());
        }
      } else {
        // File đơn
        const { error } = await supabase.storage
          .from(config.bucketName)
          .move(oldPath, newPath);
        if (error) throw error;

        await renameDisplayName(
          supabase,
          config.bucketName,
          oldPath,
          newPath,
          newName.trim()
        );
      }

      const prettyOld = file.displayName || file.name;
      toast({
        title: 'Đã đổi tên',
        description: `"${prettyOld}" → "${newName.trim()}"`,
      });

      // Clear folder tree cache
      if (config.cache.enabled) {
        const storage = config.cache.storage === 'localStorage' 
          ? localStorage 
          : sessionStorage;
        storage.removeItem(`fm-folder-tree-${config.bucketName}`);
      }

      // Close dialog
      setNewName('');
      onOpenChange(false);

      // Callback (sẽ tự reload + reset loading)
      onSuccess?.();

      // Folder rename → tree cũng cần refresh
      if (file.type === 'folder') {
        dispatch({ type: 'BUMP_TREE_REFRESH' });
      }

    } catch (error: unknown) {
      const err = error as { message?: string };
      const msg = err.message || '';
      const friendly = /already exists|resource already exists|duplicate/i.test(msg)
        ? `Đã có file/thư mục tên "${newName.trim()}" trong thư mục này. Hãy chọn tên khác.`
        : msg || 'Không thể đổi tên';
      toast({
        title: 'Lỗi đổi tên',
        description: friendly,
        variant: 'destructive',
      });

      config.callbacks?.onError?.(
        error as Error,
        'rename_file'
      );
    } finally {
      setRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !renaming) {
      handleRename();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[380px] p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base">Đổi tên</DialogTitle>
          <DialogDescription className="text-xs truncate">
            {file?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rename-name" className="text-xs">Tên mới</Label>
            <Input
              id="rename-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tên mới..."
              className="h-9"
              disabled={renaming}
              autoFocus
            />
            
            {file?.type === 'file' && (
              <p className="text-xs text-muted-foreground">
                Tên hiển thị giữ nguyên dấu tiếng Việt. Storage key (lưu ngầm) sẽ chuyển sang ASCII.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={renaming}
          >
            Hủy
          </Button>
          <Button 
            size="sm"
            onClick={handleRename}
            disabled={!newName.trim() || newName === file?.name || renaming}
          >
            {renaming ? 'Đang đổi tên...' : 'Đổi tên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
