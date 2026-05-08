'use client';

import { useState } from 'react';
import { isPlaceholderFile } from '../../constants';
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
import { Loader2, FileArchive } from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { FileItem } from '../../types';

interface CompressionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileItem[];
  onSuccess?: () => void;
}

type CompressionFormat = 'zip' | 'gzip' | 'tar';

/**
 * Dialog nén files thành archive
 * 
 * Features:
 * - Hỗ trợ ZIP, GZIP, TAR formats
 * - Tùy chỉnh tên file đầu ra
 * - Hiển thị tổng kích thước
 * - Upload archive sau khi nén
 */
export function CompressionDialog({
  open,
  onOpenChange,
  files,
  onSuccess,
}: CompressionDialogProps) {
  const { state, dispatch, config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<CompressionFormat>('zip');
  const [archiveName, setArchiveName] = useState(
    files.length === 1 ? files[0].name : 'archive'
  );

  // Kiểm tra feature flag
  if (!config.features.compress) {
    return null;
  }

  // Tính tổng kích thước
  const totalSize = files.reduce((sum, file) => {
    return sum + (file.metadata?.size || 0);
  }, 0);

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  /**
   * Đệ quy liệt kê tất cả files + thư mục rỗng bên trong 1 folder
   * Trả về { files, emptyFolders } để download + add vào zip
   */
  const listAllFilesInFolder = async (
    folderStoragePath: string,
    folderNameInZip: string
  ): Promise<{
    files: { storagePath: string; zipPath: string }[];
    emptyFolders: string[];
  }> => {
    const files: { storagePath: string; zipPath: string }[] = [];
    const emptyFolders: string[] = [];

    const scan = async (currentPath: string, zipPrefix: string) => {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .list(currentPath, { limit: 1000 });

      if (error || !data) return;

      // Lọc placeholder files (tất cả tên cũ + mới)
      const realItems = data.filter(
        item => !isPlaceholderFile(item.name)
      );

      // Thư mục rỗng (hoặc chỉ có placeholder) → ghi nhận
      if (realItems.length === 0) {
        emptyFolders.push(zipPrefix);
        return;
      }

      for (const item of realItems) {
        const itemStoragePath = currentPath
          ? `${currentPath}/${item.name}`
          : item.name;
        const itemZipPath = `${zipPrefix}/${item.name}`;

        if (item.id === null) {
          // Folder — đệ quy vào
          await scan(itemStoragePath, itemZipPath);
        } else {
          // File
          files.push({ storagePath: itemStoragePath, zipPath: itemZipPath });
        }
      }
    };

    await scan(folderStoragePath, folderNameInZip);
    return { files, emptyFolders };
  };

  // Nén files
  const handleCompress = async () => {
    if (!archiveName.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên file nén',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Import compression library dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let addedCount = 0;

      // Download và add files vào archive
      for (const file of files) {
        if (file.type === 'file') {
          // File đơn — download + add trực tiếp
          try {
            const { data: fileData, error: dlError } = await supabase.storage
              .from(config.bucketName)
              .download(file.path);

            if (dlError) throw dlError;
            if (fileData) {
              zip.file(file.name, fileData);
              addedCount++;
            }
          } catch (err) {
            console.error(`Lỗi khi tải ${file.name}:`, err);
          }
        } else if (file.type === 'folder') {
          // Folder — liệt kê đệ quy rồi download từng file
          try {
            const { files: folderFiles, emptyFolders } = await listAllFilesInFolder(file.path, file.name);

            // Download + add từng file bên trong folder
            for (const ff of folderFiles) {
              try {
                const { data: fileData, error: dlError } = await supabase.storage
                  .from(config.bucketName)
                  .download(ff.storagePath);

                if (dlError) throw dlError;
                if (fileData) {
                  zip.file(ff.zipPath, fileData);
                  addedCount++;
                }
              } catch (err) {
                console.error(`Lỗi khi tải ${ff.storagePath}:`, err);
              }
            }

            // Tạo entry cho thư mục con rỗng (giữ cấu trúc thư mục)
            for (const emptyFolder of emptyFolders) {
              zip.folder(emptyFolder);
            }

            // Nếu folder hoàn toàn rỗng (không file, không subfolder)
            if (folderFiles.length === 0 && emptyFolders.length === 0) {
              zip.folder(file.name);
            }
          } catch (err) {
            console.error(`Lỗi khi quét folder ${file.name}:`, err);
          }
        }
      }

      // Kiểm tra có file nào được add không
      if (addedCount === 0) {
        throw new Error('Không có file nào để nén. Các thư mục có thể đang rỗng.');
      }

      // Generate archive dựa theo format
      let blob: Blob;
      let extension: string;

      if (format === 'zip') {
        blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        extension = '.zip';
      } else if (format === 'gzip') {
        // GZIP chỉ nén 1 file, nên ta nén toàn bộ zip trước
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        
        // Import pako for gzip compression
        const pako = await import('pako');
        const arrayBuffer = await zipBlob.arrayBuffer();
        const compressed = pako.gzip(new Uint8Array(arrayBuffer));
        blob = new Blob([compressed], { type: 'application/gzip' });
        extension = '.tar.gz';
      } else {
        // TAR format (uncompressed archive)
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        blob = zipBlob;
        extension = '.tar';
      }

      // Tạo tên file output (sanitize cho Supabase Storage)
      const { sanitizeStorageKey } = await import('../../utils/sanitizeKey');
      let outputName = sanitizeStorageKey(archiveName) || 'archive';
      if (!outputName.endsWith(extension)) {
        outputName += extension;
      }

      // Upload archive lên storage
      const currentPath = state.currentPath || '';
      const uploadPath = currentPath ? `${currentPath}/${outputName}` : outputName;

      const { error: uploadError } = await supabase.storage
        .from(config.bucketName)
        .upload(uploadPath, blob, {
          contentType: format === 'zip' ? 'application/zip' : 'application/gzip',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Clear cache
      if (config.cache.enabled) {
        localStorage.removeItem('file_manager_files');
        sessionStorage.removeItem('file_manager_files');
      }

      // Callback
      const archiveFile = new File([blob], outputName, { type: blob.type });
      config.callbacks?.onFileUpload?.(archiveFile, uploadPath);

      // Toast notification
      toast({
        title: '✅ Đã nén thành công',
        description: `${addedCount} file → ${outputName} (${formatBytes(blob.size)})`,
      });

      // Reload files
      dispatch({ type: 'SET_LOADING', payload: true });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errMsg = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'Lỗi không xác định';
      console.error('Lỗi khi nén:', errMsg, error);
      config.callbacks?.onError?.(error as Error, 'compress');

      toast({
        title: 'Lỗi nén file',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[420px] p-5">
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileArchive className="h-4 w-4 text-blue-600" />
            Nén {files.length} file
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Định dạng + Tên — 2 cột trên desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="format" className="text-xs">Định dạng</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as CompressionFormat)}>
                <SelectTrigger id="format" className="h-9">
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zip">ZIP</SelectItem>
                  <SelectItem value="gzip">GZIP</SelectItem>
                  <SelectItem value="tar">TAR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="archiveName" className="text-xs">Tên file nén</Label>
              <Input
                id="archiveName"
                className="h-9"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder={`archive.${format}`}
              />
            </div>
          </div>

          {/* Mô tả ngắn format */}
          <p className="text-[11px] text-muted-foreground -mt-1">
            {format === 'zip' && 'Tương thích Windows, macOS, Linux'}
            {format === 'gzip' && 'Tỷ lệ nén cao, phổ biến trên Linux'}
            {format === 'tar' && 'Archive không nén, giữ nguyên kích thước'}
          </p>

          {/* File list — compact */}
          <div className="space-y-1.5">
            <Label className="text-xs">Files ({files.length}) — {formatBytes(totalSize)}</Label>
            <div className="border rounded-md max-h-[140px] overflow-y-auto divide-y">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs truncate flex-1 font-medium">{file.name}</span>
                  <span className="text-[11px] text-muted-foreground ml-2 tabular-nums">
                    {formatBytes(file.metadata?.size || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning — nhỏ gọn */}
          {totalSize > 10 * 1024 * 1024 && (
            <p className="text-[11px] text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 px-2.5 py-1.5 rounded border border-yellow-200 dark:border-yellow-800">
              ⚠ Nén có thể mất vài phút với files lớn
            </p>
          )}
        </div>

        <DialogFooter className="pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button size="sm" onClick={handleCompress} disabled={loading || !archiveName.trim()}>
            {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {loading ? 'Đang nén...' : 'Nén'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
