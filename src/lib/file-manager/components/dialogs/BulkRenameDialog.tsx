'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileEdit, ArrowRight } from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { FileItem } from '../../types';

interface BulkRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileItem[];
  onSuccess?: () => void;
}

type RenameMode = 'prefix' | 'suffix' | 'replace' | 'number';

/**
 * Dialog đổi tên hàng loạt files
 * 
 * Features:
 * - Thêm prefix/suffix
 * - Thay thế text
 * - Đánh số tự động
 * - Preview trước khi apply
 */
export function BulkRenameDialog({
  open,
  onOpenChange,
  files,
  onSuccess,
}: BulkRenameDialogProps) {
  const { state, dispatch, config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<RenameMode>('prefix');
  const [inputValue, setInputValue] = useState('');
  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');
  const [numberStart, setNumberStart] = useState(1);
  const [numberPadding, setNumberPadding] = useState(3);

  // Kiểm tra feature flag
  if (!config.features.rename) {
    return null;
  }

  // Generate new name dựa theo mode
  const generateNewName = (file: FileItem, index: number): string => {
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
    const nameWithoutExt = ext ? file.name.slice(0, -ext.length) : file.name;

    switch (mode) {
      case 'prefix':
        return `${inputValue}${file.name}`;

      case 'suffix':
        return `${nameWithoutExt}${inputValue}${ext}`;

      case 'replace':
        if (!replaceFrom) return file.name;
        return file.name.replace(new RegExp(replaceFrom, 'g'), replaceTo);

      case 'number':
        const num = numberStart + index;
        const paddedNum = num.toString().padStart(numberPadding, '0');
        return `${inputValue || 'File'}_${paddedNum}${ext}`;

      default:
        return file.name;
    }
  };

  // Preview new names
  const previews = files.map((file, index) => ({
    old: file.name,
    new: generateNewName(file, index),
  }));

  // Check for duplicate names
  const hasDuplicates = () => {
    const newNames = previews.map((p) => p.new);
    return new Set(newNames).size !== newNames.length;
  };

  // Đổi tên hàng loạt
  const handleBulkRename = async () => {
    if (hasDuplicates()) {
      toast({
        title: 'Lỗi',
        description: 'Có tên file trùng nhau. Vui lòng điều chỉnh.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const newName = previews[i].new;

        if (newName === file.name) {
          continue; // Skip if name unchanged
        }

        try {
          const pathParts = file.path.split('/');
          pathParts[pathParts.length - 1] = newName;
          const newPath = pathParts.join('/');

          if (file.type === 'folder') {
            // Rename folder: tạo folder mới và xóa folder cũ
            const { PLACEHOLDER_FILE, PLACEHOLDER_NAMES } = await import('@/lib/file-manager/constants');
            const placeholderPath = `${newPath}/${PLACEHOLDER_FILE}`;
            await supabase.storage
              .from(config.bucketName)
              .upload(placeholderPath, new Blob([''], { type: 'text/plain' }), {
                contentType: 'text/plain',
              });

            // Xóa tất cả placeholder cũ (backward compat)
            const oldPlaceholders = [...PLACEHOLDER_NAMES].map(name => `${file.path}/${name}`);
            await supabase.storage.from(config.bucketName).remove(oldPlaceholders);
          } else {
            // Rename file: move file
            await supabase.storage
              .from(config.bucketName)
              .move(file.path, newPath);
          }

          successCount++;
        } catch (error) {
          console.error(`Lỗi khi đổi tên ${file.name}:`, error);
          config.callbacks?.onError?.(error as Error, 'rename_item');
        }
      }

      // Clear cache
      if (config.cache.enabled) {
        localStorage.removeItem('file_manager_folder_tree');
        localStorage.removeItem('file_manager_files');
        sessionStorage.removeItem('file_manager_files');
      }

      // Toast notification
      toast({
        title: 'Thành công',
        description: `Đã đổi tên ${successCount}/${files.length} mục`,
      });

      // Reload files
      dispatch({ type: 'SET_LOADING', payload: true });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Lỗi khi đổi tên hàng loạt:', error);
      config.callbacks?.onError?.(error as Error, 'bulk_rename');

      toast({
        title: 'Lỗi',
        description: 'Không thể đổi tên. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[560px] p-5 max-h-[600px] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileEdit className="h-4 w-4" />
            Đổi Tên Hàng Loạt ({files.length} file)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Rename mode selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Phương thức đổi tên</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as RenameMode)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prefix">Thêm tiền tố (Prefix)</SelectItem>
                <SelectItem value="suffix">Thêm hậu tố (Suffix)</SelectItem>
                <SelectItem value="replace">Thay thế văn bản</SelectItem>
                <SelectItem value="number">Đánh số tự động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mode-specific inputs */}
          {mode === 'prefix' && (
            <div className="space-y-2">
              <Label htmlFor="prefix">Tiền tố</Label>
              <Input
                id="prefix"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tiền tố..."
              />
              <p className="text-xs text-muted-foreground">
                Thêm văn bản vào đầu tên file. VD: "New_" → New_file.txt
              </p>
            </div>
          )}

          {mode === 'suffix' && (
            <div className="space-y-2">
              <Label htmlFor="suffix">Hậu tố</Label>
              <Input
                id="suffix"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập hậu tố..."
              />
              <p className="text-xs text-muted-foreground">
                Thêm văn bản vào cuối tên file (trước extension). VD: "_backup" → file_backup.txt
              </p>
            </div>
          )}

          {mode === 'replace' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="replaceFrom">Tìm</Label>
                <Input
                  id="replaceFrom"
                  value={replaceFrom}
                  onChange={(e) => setReplaceFrom(e.target.value)}
                  placeholder="Văn bản cần thay thế..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replaceTo">Thay bằng</Label>
                <Input
                  id="replaceTo"
                  value={replaceTo}
                  onChange={(e) => setReplaceTo(e.target.value)}
                  placeholder="Văn bản mới..."
                />
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">
                Thay thế tất cả các xuất hiện của văn bản. VD: "old" → "new"
              </p>
            </div>
          )}

          {mode === 'number' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseName">Tên cơ sở</Label>
                <Input
                  id="baseName"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="File"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startNum">Bắt đầu từ số</Label>
                  <Input
                    id="startNum"
                    type="number"
                    value={numberStart}
                    onChange={(e) => setNumberStart(parseInt(e.target.value) || 1)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="padding">Số chữ số (padding)</Label>
                  <Input
                    id="padding"
                    type="number"
                    value={numberPadding}
                    onChange={(e) => setNumberPadding(parseInt(e.target.value) || 1)}
                    min={1}
                    max={10}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                VD: "File_001.txt", "File_002.txt",...
              </p>
            </div>
          )}

          {/* Preview section */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Preview ({previews.length} files)</span>
              {hasDuplicates() && (
                <span className="text-xs text-destructive font-normal">
                  ⚠️ Có tên file trùng nhau!
                </span>
              )}
            </Label>
            <div className="border rounded-md max-h-[300px] overflow-y-auto">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                    preview.old === preview.new ? 'opacity-50' : ''
                  } ${
                    previews.filter((p) => p.new === preview.new).length > 1
                      ? 'bg-destructive/10'
                      : ''
                  }`}
                >
                  <span className="flex-1 text-sm truncate text-muted-foreground">
                    {preview.old}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm truncate font-medium">
                    {preview.new}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          {previews.some((p) => p.old !== p.new) && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ Hành động này không thể hoàn tác. Hãy kiểm tra kỹ preview trước khi tiếp tục.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleBulkRename}
            disabled={loading || hasDuplicates() || previews.every((p) => p.old === p.new)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Đang đổi tên...' : 'Đổi Tên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
