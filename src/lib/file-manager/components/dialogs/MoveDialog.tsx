/**
 * File Manager Package - Move Dialog
 * Di chuyển files/folders sang thư mục khác
 * 
 * Dùng supabase.storage.move() (không copy+delete)
 * Có folder tree browser để chọn thư mục đích
 * Handle folder move (liệt kê files bên trong rồi move từng cái)
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { isPlaceholderFile, PLACEHOLDER_FILE, PLACEHOLDER_NAMES } from '../../constants';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Home, Folder, FolderOpen, Loader2, ChevronRight, ChevronDown, ArrowRight } from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { useToast } from '@/hooks/use-toast';
import {
  moveDisplayNamesPrefix,
  renameDisplayName,
} from '../../services/displayNamesService';
import type { FileItem } from '../../types';

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  selectedFiles?: FileItem[];
  onSuccess?: () => void;
}

export function MoveDialog({ 
  open, 
  onOpenChange, 
  file, 
  selectedFiles,
  onSuccess 
}: MoveDialogProps) {
  const { state, dispatch, config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [moving, setMoving] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  /**
   * Đệ quy load tất cả folders trong bucket để build tree
   */
  const loadFolderTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const allFolders: string[] = [];
      
      // Đệ quy load folders
      const scanFolder = async (path: string) => {
        const { data, error } = await supabase.storage
          .from(config.bucketName)
          .list(path, { limit: 500, sortBy: { column: 'name', order: 'asc' } });

        if (error || !data) return;

        for (const item of data) {
          // Folder trong Supabase: id === null
          if (item.id === null && !isPlaceholderFile(item.name) && item.name !== '.trash') {
            const folderPath = path ? `${path}/${item.name}` : item.name;
            allFolders.push(folderPath);
            await scanFolder(folderPath);
          }
        }
      };

      await scanFolder('');

      // Build tree structure
      const tree: FolderNode[] = [];
      const nodeMap = new Map<string, FolderNode>();

      // Sort để parent folder được xử lý trước
      allFolders.sort();

      for (const folderPath of allFolders) {
        const parts = folderPath.split('/');
        const name = parts[parts.length - 1];
        const node: FolderNode = { name, path: folderPath, children: [] };
        nodeMap.set(folderPath, node);

        if (parts.length === 1) {
          // Root level folder
          tree.push(node);
        } else {
          // Sub folder — tìm parent
          const parentPath = parts.slice(0, -1).join('/');
          const parentNode = nodeMap.get(parentPath);
          if (parentNode) {
            parentNode.children.push(node);
          }
        }
      }

      setFolderTree(tree);
    } catch (error) {
      console.error('Lỗi load folder tree:', error);
    } finally {
      setLoadingTree(false);
    }
  }, [supabase, config.bucketName]);

  // Load folder tree khi dialog mở
  useEffect(() => {
    if (open) {
      setSelectedDestination(null);
      setExpandedFolders(new Set());
      loadFolderTree();
    }
  }, [open, loadFolderTree]);

  // Feature flag check — phải đặt sau tất cả hooks
  if (!config.features.edit) {
    return null;
  }

  const isBulkMove = selectedFiles && selectedFiles.length > 0;
  const itemsToMove = isBulkMove ? selectedFiles : (file ? [file] : []);

  // Xác định đường dẫn nguồn của các items đang move (để disable chúng trong tree)
  const sourceNames = new Set(itemsToMove.map(item => item.name));

  // Toggle expand/collapse folder
  const toggleExpand = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  /**
   * Liệt kê tất cả files bên trong 1 folder (đệ quy)
   * Cần vì Supabase không có native "move folder"
   */
  const listAllFilesInFolder = async (folderPath: string): Promise<string[]> => {
    const files: string[] = [];
    
    const scan = async (path: string) => {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .list(path, { limit: 1000 });

      if (error || !data) return;

      for (const item of data) {
        if (isPlaceholderFile(item.name)) continue;
        const itemPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.id === null) {
          // Folder — đệ quy vào
          await scan(itemPath);
        } else {
          // File
          files.push(itemPath);
        }
      }
    };

    await scan(folderPath);
    return files;
  };

  /**
   * Di chuyển file/folder đến thư mục đích
   * - File: dùng supabase.storage.move()
   * - Folder: liệt kê tất cả files bên trong, move từng cái
   */
  const handleMove = async () => {
    if (selectedDestination === null || itemsToMove.length === 0) return;

    setMoving(true);

    try {
      let successCount = 0;
      let skipCount = 0;

      for (const item of itemsToMove) {
        const sourcePath = item.path || (state.currentPath 
          ? `${state.currentPath}/${item.name}` 
          : item.name);

        // Tính target path
        const targetPath = selectedDestination
          ? `${selectedDestination}/${item.name}`
          : item.name;

        // Bỏ qua nếu cùng vị trí
        if (sourcePath === targetPath) {
          skipCount++;
          continue;
        }

        // Kiểm tra không được move vào chính nó (folder)
        if (item.type === 'folder' && selectedDestination.startsWith(sourcePath + '/')) {
          toast({
            title: 'Không thể di chuyển',
            description: `Không thể di chuyển "${item.name}" vào chính thư mục con của nó`,
            variant: 'destructive',
          });
          continue;
        }

        if (item.type === 'folder') {
          // Move folder: liệt kê tất cả files rồi move từng cái
          const filesInFolder = await listAllFilesInFolder(sourcePath);

          if (filesInFolder.length === 0) {
            // Folder rỗng — tạo placeholder ở đích
            const placeholderTarget = `${targetPath}/${PLACEHOLDER_FILE}`;
            await supabase.storage
              .from(config.bucketName)
              .upload(placeholderTarget, new Blob(['']), { contentType: 'text/plain' });

            // Xóa tất cả placeholder cũ ở nguồn (backward compat)
            const oldPlaceholders = [...PLACEHOLDER_NAMES].map(name => `${sourcePath}/${name}`);
            await supabase.storage
              .from(config.bucketName)
              .remove(oldPlaceholders);
          } else {
            // Move từng file bên trong folder
            for (const filePath of filesInFolder) {
              const relativePath = filePath.substring(sourcePath.length); // ví dụ: /sub/file.txt
              const newFilePath = `${targetPath}${relativePath}`;

              const { error } = await supabase.storage
                .from(config.bucketName)
                .move(filePath, newFilePath);

              if (error) {
                console.error(`Lỗi move ${filePath} → ${newFilePath}:`, error.message);
                throw error;
              }
            }
          }

          // Di chuyển toàn bộ display-name mappings dưới folder
          await moveDisplayNamesPrefix(supabase, config.bucketName, sourcePath, targetPath);

          successCount++;
        } else {
          // Move file đơn
          const { error } = await supabase.storage
            .from(config.bucketName)
            .move(sourcePath, targetPath);

          if (error) throw error;

          // Cập nhật display-name mapping (giữ tên hiển thị tiếng Việt)
          await renameDisplayName(
            supabase,
            config.bucketName,
            sourcePath,
            targetPath,
            item.displayName || item.name
          );

          successCount++;
        }
      }

      // Thông báo kết quả
      if (successCount > 0) {
        toast({
          title: '✅ Đã di chuyển',
          description: isBulkMove
            ? `Đã di chuyển ${successCount}/${itemsToMove.length} mục${skipCount > 0 ? ` (bỏ qua ${skipCount} mục cùng vị trí)` : ''}`
            : `"${file?.name}" đã di chuyển đến ${selectedDestination ? `/${selectedDestination}` : 'thư mục gốc'}`,
        });
      } else if (skipCount > 0) {
        toast({
          title: 'Không có gì thay đổi',
          description: 'Tất cả mục đã ở đúng thư mục đích',
        });
      }

      // Clear cache
      if (config.cache.enabled) {
        const storage = config.cache.storage === 'localStorage'
          ? localStorage
          : sessionStorage;
        // Xóa nhiều cache liên quan
        const keys = Object.keys(storage === localStorage ? localStorage : sessionStorage);
        keys.forEach(key => {
          if (key.startsWith('fm-files-') || key.startsWith('fm-folder-tree-')) {
            storage.removeItem(key);
          }
        });
      }

      // Đóng dialog trước, rồi callback reload
      onOpenChange(false);
      onSuccess?.();

      // Nếu có folder bị move → tree cũng cần refresh
      if (itemsToMove.some((it) => it.type === 'folder')) {
        dispatch({ type: 'BUMP_TREE_REFRESH' });
      }

    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'Lỗi di chuyển',
        description: err.message || 'Không thể di chuyển file. Vui lòng thử lại.',
        variant: 'destructive',
      });

      config.callbacks?.onError?.(error as Error, 'move_file');
    } finally {
      setMoving(false);
    }
  };

  /**
   * Render folder tree đệ quy
   */
  const renderFolderNode = (node: FolderNode, level: number) => {
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedDestination === node.path;
    
    // Disable nếu folder này là 1 trong các items đang move,
    // hoặc nếu đây chính là thư mục nguồn hiện tại (cùng level)
    const isSourceFolder = state.currentPath === node.path 
      && itemsToMove.length > 0 
      && !isBulkMove;
    const isItemBeingMoved = sourceNames.has(node.name) 
      && (state.currentPath === node.path.split('/').slice(0, -1).join('/'));
    const isDisabled = isItemBeingMoved;

    return (
      <div key={node.path}>
        <button
          type="button"
          onClick={() => {
            if (!isDisabled) {
              setSelectedDestination(node.path);
              if (hasChildren) toggleExpand(node.path);
            }
          }}
          disabled={isDisabled}
          className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors ${
            isSelected 
              ? 'bg-primary/10 border border-primary text-primary font-medium' 
              : 'hover:bg-accent'
          } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${
            isSourceFolder ? 'bg-muted' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Expand/collapse icon */}
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {/* Folder icon */}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-500" />
          )}

          <span className="truncate flex-1">{node.name}</span>

          {isSourceFolder && (
            <span className="text-[10px] text-muted-foreground ml-1">(hiện tại)</span>
          )}
          {isItemBeingMoved && (
            <span className="text-[10px] text-muted-foreground ml-1">(đang chọn)</span>
          )}
        </button>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Xác định thư mục nguồn để hiển thị
  const sourceDisplay = state.currentPath
    ? `/${state.currentPath}`
    : '/ (gốc)';

  // Xác định thư mục đích để hiển thị
  const destDisplay = selectedDestination === null
    ? 'Chưa chọn'
    : selectedDestination === ''
      ? '/ (gốc)'
      : `/${selectedDestination}`;

  // Không cho move nếu đích trùng nguồn
  const isSameLocation = selectedDestination === state.currentPath;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!moving) onOpenChange(v); }}>
      <DialogContent className="!max-w-[460px] p-5 max-h-[80vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowRight className="h-4 w-4" />
            Di chuyển {isBulkMove ? `${itemsToMove.length} mục` : `"${file?.name}"`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-2.5">
          {/* Thông tin nguồn → đích */}
          <div className="p-2.5 bg-muted rounded-md text-xs space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground">Từ:</span>
              <span className="font-medium">{sourceDisplay}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Đến:</span>
              <span className={`font-medium ${selectedDestination !== null ? 'text-primary' : 'text-muted-foreground'}`}>
                {destDisplay}
              </span>
            </div>
            {isSameLocation && selectedDestination !== null && (
              <p className="text-xs text-destructive">⚠️ Thư mục đích trùng với thư mục hiện tại</p>
            )}
          </div>

          {/* Folder tree */}
          <div>
            <Label className="text-xs text-muted-foreground">Chọn thư mục đích</Label>
            <div className="mt-1 border rounded-lg p-1.5 max-h-[240px] overflow-y-auto">
              {/* Thư mục gốc */}
              <button
                type="button"
                onClick={() => setSelectedDestination('')}
                className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors ${
                  selectedDestination === ''
                    ? 'bg-primary/10 border border-primary text-primary font-medium'
                    : 'hover:bg-accent'
                }`}
              >
                <Home className="h-4 w-4 shrink-0 text-blue-500" />
                <span>Thư mục gốc</span>
                {state.currentPath === '' && (
                  <span className="text-[10px] text-muted-foreground ml-auto">(hiện tại)</span>
                )}
              </button>

              {/* Loading */}
              {loadingTree ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải thư mục...
                </div>
              ) : folderTree.length > 0 ? (
                folderTree.map(node => renderFolderNode(node, 1))
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Chưa có thư mục nào
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={moving}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleMove}
            disabled={moving || selectedDestination === null || isSameLocation}
          >
            {moving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Đang di chuyển...
              </>
            ) : (
              <>
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                Di chuyển
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
