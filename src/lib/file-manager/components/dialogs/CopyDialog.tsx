/**
 * File Manager Package - Copy Dialog
 * Copy files/folders sang thư mục khác
 *
 * Features:
 * - Folder tree browser (đệ quy scan toàn bộ bucket)
 * - Copy file dùng supabase.storage.copy()
 * - Copy folder đệ quy (liệt kê tất cả files bên trong rồi copy từng cái)
 * - Tự động rename nếu trùng tên (thêm số)
 * - UI hiển thị Từ → Đến rõ ràng
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { isPlaceholderFile, PLACEHOLDER_FILE } from '../../constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Copy,
  Home,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { FileItem } from '../../types';

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

interface CopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileItem[];
  onSuccess?: () => void;
}

export function CopyDialog({
  open,
  onOpenChange,
  files,
  onSuccess,
}: CopyDialogProps) {
  const { state, config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

      const scanFolder = async (path: string) => {
        const { data, error } = await supabase.storage
          .from(config.bucketName)
          .list(path, { limit: 500, sortBy: { column: 'name', order: 'asc' } });

        if (error || !data) return;

        for (const item of data) {
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

      allFolders.sort();

      for (const folderPath of allFolders) {
        const parts = folderPath.split('/');
        const name = parts[parts.length - 1];
        const node: FolderNode = { name, path: folderPath, children: [] };
        nodeMap.set(folderPath, node);

        if (parts.length === 1) {
          tree.push(node);
        } else {
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

  // Kiểm tra feature flag — phải đặt sau tất cả hooks
  if (!config.features.copy) {
    return null;
  }

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
   * Cần cho copy folder — Supabase không có native "copy folder"
   */
  const listAllFilesInFolder = async (folderPath: string): Promise<string[]> => {
    const foundFiles: string[] = [];

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
          foundFiles.push(itemPath);
        }
      }
    };

    await scan(folderPath);
    return foundFiles;
  };

  /**
   * Kiểm tra xem file/folder có tồn tại ở đích chưa
   * Trả về tên unique nếu trùng (thêm số đếm)
   */
  const getUniqueName = async (destFolder: string, originalName: string): Promise<string> => {
    // List files ở thư mục đích
    const { data } = await supabase.storage
      .from(config.bucketName)
      .list(destFolder, { limit: 1000 });

    if (!data) return originalName;

    const existingNames = new Set(data.map(item => item.name));

    if (!existingNames.has(originalName)) {
      return originalName;
    }

    // Tách tên và extension
    const dotIndex = originalName.lastIndexOf('.');
    const hasExt = dotIndex > 0;
    const nameWithoutExt = hasExt ? originalName.slice(0, dotIndex) : originalName;
    const ext = hasExt ? originalName.slice(dotIndex) : '';

    let counter = 1;
    let newName: string;
    do {
      newName = `${nameWithoutExt} (${counter})${ext}`;
      counter++;
    } while (existingNames.has(newName) && counter < 100);

    return newName;
  };

  /**
   * Copy files/folders đến thư mục đích
   */
  const handleCopy = async () => {
    if (selectedDestination === null || files.length === 0) return;

    setLoading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          const sourcePath = file.path || (state.currentPath
            ? `${state.currentPath}/${file.name}`
            : file.name);

          // Lấy tên unique nếu trùng
          const uniqueName = await getUniqueName(selectedDestination, file.name);
          const targetPath = selectedDestination
            ? `${selectedDestination}/${uniqueName}`
            : uniqueName;

          if (file.type === 'folder') {
            // Copy folder: liệt kê tất cả files rồi copy từng cái
            const filesInFolder = await listAllFilesInFolder(sourcePath);

            if (filesInFolder.length === 0) {
              // Folder rỗng — tạo placeholder ở đích
              const placeholderTarget = `${targetPath}/${PLACEHOLDER_FILE}`;
              await supabase.storage
                .from(config.bucketName)
                .upload(placeholderTarget, new Blob(['']), { contentType: 'text/plain' });
            } else {
              // Copy từng file bên trong folder
              for (const filePath of filesInFolder) {
                const relativePath = filePath.substring(sourcePath.length); // ví dụ: /sub/file.txt
                const newFilePath = `${targetPath}${relativePath}`;

                const { error } = await supabase.storage
                  .from(config.bucketName)
                  .copy(filePath, newFilePath);

                if (error) {
                  // Fallback: download rồi upload nếu copy() lỗi
                  const { data: fileData } = await supabase.storage
                    .from(config.bucketName)
                    .download(filePath);

                  if (fileData) {
                    const { error: uploadError } = await supabase.storage
                      .from(config.bucketName)
                      .upload(newFilePath, fileData);

                    if (uploadError) throw uploadError;
                  }
                }
              }
            }

            successCount++;
          } else {
            // Copy file đơn — dùng supabase.copy()
            const { error } = await supabase.storage
              .from(config.bucketName)
              .copy(sourcePath, targetPath);

            if (error) {
              // Fallback: download rồi upload
              const { data: fileData } = await supabase.storage
                .from(config.bucketName)
                .download(sourcePath);

              if (fileData) {
                const { error: uploadError } = await supabase.storage
                  .from(config.bucketName)
                  .upload(targetPath, fileData, {
                    contentType: file.metadata?.mimetype || 'application/octet-stream',
                  });

                if (uploadError) throw uploadError;
              } else {
                throw error;
              }
            }

            successCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Lỗi khi copy ${file.name}:`, error);
          config.callbacks?.onError?.(error as Error, 'copy_item');
        }
      }

      // Clear cache
      if (config.cache.enabled) {
        const storage = config.cache.storage === 'localStorage'
          ? localStorage
          : sessionStorage;
        const keys = Object.keys(storage === localStorage ? localStorage : sessionStorage);
        keys.forEach(key => {
          if (key.startsWith('fm-files-') || key.startsWith('fm-folder-tree-')) {
            storage.removeItem(key);
          }
        });
      }

      // Thông báo kết quả
      if (successCount > 0) {
        toast({
          title: '✅ Đã copy',
          description: files.length === 1
            ? `"${files[0].name}" đã copy đến ${selectedDestination ? `/${selectedDestination}` : 'thư mục gốc'}`
            : `Đã copy ${successCount}/${files.length} mục${errorCount > 0 ? ` (${errorCount} lỗi)` : ''}`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: 'Lỗi',
          description: 'Không thể copy. Vui lòng thử lại.',
          variant: 'destructive',
        });
        return;
      }

      // Đóng dialog rồi callback reload
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Lỗi khi copy:', error);
      config.callbacks?.onError?.(error as Error, 'copy');

      toast({
        title: 'Lỗi',
        description: 'Không thể copy. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render folder tree đệ quy
   */
  const renderFolderNode = (node: FolderNode, level: number) => {
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedDestination === node.path;

    return (
      <div key={node.path}>
        <button
          type="button"
          onClick={() => {
            setSelectedDestination(node.path);
            if (hasChildren) toggleExpand(node.path);
          }}
          className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
            isSelected
              ? 'bg-primary/10 border border-primary text-primary font-medium'
              : 'hover:bg-accent'
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

          {state.currentPath === node.path && (
            <span className="text-[10px] text-muted-foreground ml-1">(hiện tại)</span>
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

  // Hiển thị thông tin đích
  const destDisplay = selectedDestination === null
    ? 'Chưa chọn'
    : selectedDestination === ''
      ? '/ (gốc)'
      : `/${selectedDestination}`;

  // Thư mục nguồn
  const sourceDisplay = state.currentPath
    ? `/${state.currentPath}`
    : '/ (gốc)';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <DialogContent className="!max-w-[460px] p-5 max-h-[80vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Copy className="h-4 w-4" />
            Copy {files.length > 1 ? `${files.length} mục` : `"${files[0]?.name}"`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Chọn thư mục đích. Nếu trùng tên sẽ tự đổi tên.
          </DialogDescription>
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
            <p className="text-muted-foreground">
              {files.length > 1
                ? `${files.length} mục đã chọn`
                : files[0]?.type === 'folder'
                  ? 'Toàn bộ nội dung thư mục sẽ được copy'
                  : `${files[0]?.name}`}
            </p>
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
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={loading || selectedDestination === null}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Đang copy...
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
