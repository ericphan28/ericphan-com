'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackageOpen, File, Folder, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import type { FileItem } from '../../types';

interface ExtractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem;
  onSuccess?: () => void;
}

interface ZipEntry {
  name: string;
  size: number;
  isDir: boolean;
}

/**
 * Dialog giải nén file ZIP
 *
 * ✅ Download ZIP từ Supabase
 * ✅ Liệt kê nội dung archive trước khi giải nén
 * ✅ Chọn thư mục đích (mặc định = thư mục con cùng tên)
 * ✅ Giải nén bằng JSZip client-side
 * ✅ Upload từng file lên Supabase Storage
 * ✅ Progress bar với chi tiết
 * ✅ Xử lý lỗi từng file
 */
export function ExtractDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: ExtractDialogProps) {
  const { state, config, supabase } = useFileManagerContext();
  const { toast } = useToast();

  // Trạng thái
  const [scanning, setScanning] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [targetFolder, setTargetFolder] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });

  // Tên thư mục mặc định = tên file không có extension
  const defaultFolderName = file?.name?.replace(/\.(zip|tar\.gz|tgz|tar\.bz2|tbz2|tar|gz)$/i, '') || 'extracted';

  // Reset state khi mở dialog
  useEffect(() => {
    if (open && file) {
      setTargetFolder(defaultFolderName);
      setEntries([]);
      setProgress(0);
      setCurrentFile('');
      setExtracting(false);
      setResults({ success: 0, failed: 0, errors: [] });
      // Scan nội dung ZIP
      scanArchive();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.path]);

  // Scan nội dung ZIP (không giải nén)
  const scanArchive = useCallback(async () => {
    if (!file?.path) return;

    setScanning(true);
    try {
      // Download ZIP từ Supabase
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .download(file.path);

      if (error) throw error;
      if (!data) throw new Error('Không thể tải file');

      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(data);

      // Liệt kê entries
      const zipEntries: ZipEntry[] = [];
      for (const [name, zipFile] of Object.entries(zip.files)) {
        if (zipFile.dir) {
          zipEntries.push({ name, size: 0, isDir: true });
        } else {
          // Lấy kích thước giải nén
          const content = await zipFile.async('arraybuffer');
          zipEntries.push({ name, size: content.byteLength, isDir: false });
        }
      }

      // Sắp xếp: folders trước, rồi files
      zipEntries.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      setEntries(zipEntries);
    } catch (error: unknown) {
      console.error('Lỗi scan ZIP:', error);
      toast({
        title: 'Không thể đọc file nén',
        description: error instanceof Error ? error.message : 'File có thể bị hỏng hoặc không phải định dạng ZIP',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  }, [file?.path, supabase, config.bucketName, toast]);

  // Giải nén + upload
  const handleExtract = async () => {
    if (!file?.path) return;

    setExtracting(true);
    setProgress(0);
    setResults({ success: 0, failed: 0, errors: [] });

    try {
      // Download ZIP
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .download(file.path);

      if (error) throw error;
      if (!data) throw new Error('Không thể tải file');

      // Import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(data);

      // Tách files và directories
      const allEntries = Object.entries(zip.files);
      const fileEntries = allEntries.filter(([, f]) => !f.dir);
      const dirEntries = allEntries.filter(([, f]) => f.dir);

      // Tìm thư mục rỗng (không có file con nào bên trong)
      const filePaths = new Set(fileEntries.map(([name]) => name));
      const emptyDirs = dirEntries.filter(([dirName]) => {
        // Kiểm tra xem có file nào bắt đầu bằng dirName không
        for (const fp of filePaths) {
          if (fp.startsWith(dirName)) return false;
        }
        return true;
      });

      const totalItems = fileEntries.length + emptyDirs.length;

      if (totalItems === 0) {
        toast({ title: 'Archive rỗng', description: 'Không có file nào để giải nén' });
        setExtracting(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];
      let processed = 0;

      // Tính base path
      const basePath = state.currentPath
        ? `${state.currentPath}/${targetFolder.trim()}`
        : targetFolder.trim();

      // Detect MIME type từ extension
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
        webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf',
        json: 'application/json', xml: 'application/xml',
        html: 'text/html', css: 'text/css', js: 'text/javascript',
        ts: 'text/typescript', md: 'text/markdown', txt: 'text/plain',
        zip: 'application/zip',
      };

      // 1. Upload từng file (giữ nguyên cấu trúc thư mục)
      for (const [name, zipFile] of fileEntries) {
        const uploadPath = `${basePath}/${name}`;

        setCurrentFile(name);
        processed++;
        setProgress(Math.round((processed / totalItems) * 100));

        try {
          const content = await zipFile.async('blob');
          const ext = name.split('.').pop()?.toLowerCase() || '';
          const contentType = mimeMap[ext] || 'application/octet-stream';

          const { error: uploadError } = await supabase.storage
            .from(config.bucketName)
            .upload(uploadPath, content, {
              contentType,
              upsert: true,
            });

          if (uploadError) throw uploadError;
          successCount++;
        } catch (err: unknown) {
          failedCount++;
          errors.push(`${name}: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
          console.error(`Lỗi upload ${name}:`, err);
        }
      }

      // 2. Tạo thư mục rỗng bằng placeholder (Supabase cần file để thư mục tồn tại)
      const { PLACEHOLDER_FILE } = await import('@/lib/file-manager/constants');
      for (const [dirName] of emptyDirs) {
        const placeholderPath = `${basePath}/${dirName}${PLACEHOLDER_FILE}`;
        setCurrentFile(`📁 ${dirName}`);
        processed++;
        setProgress(Math.round((processed / totalItems) * 100));

        try {
          await supabase.storage
            .from(config.bucketName)
            .upload(placeholderPath, new Blob([''], { type: 'text/plain' }), {
              contentType: 'text/plain',
              upsert: true,
            });
          successCount++;
        } catch {
          // Bỏ qua lỗi tạo thư mục rỗng — không quan trọng
        }
      }

      setResults({ success: successCount, failed: failedCount, errors });
      setProgress(100);

      // Toast kết quả
      const folderNote = emptyDirs.length > 0 ? ` (bao gồm ${emptyDirs.length} thư mục rỗng)` : '';
      if (failedCount === 0) {
        toast({
          title: '✅ Giải nén thành công',
          description: `Đã giải nén ${successCount} mục vào ${targetFolder}/${folderNote}`,
        });
        // Đóng dialog và reload
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1000);
      } else {
        toast({
          title: 'Giải nén một phần',
          description: `${successCount} thành công, ${failedCount} lỗi${folderNote}`,
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      console.error('Lỗi giải nén:', error);
      toast({
        title: 'Lỗi giải nén',
        description: error instanceof Error ? error.message : 'Không thể giải nén file',
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const fileCount = entries.filter(e => !e.isDir).length;
  const folderCount = entries.filter(e => e.isDir).length;
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);

  return (
    <Dialog open={open} onOpenChange={extracting ? undefined : onOpenChange}>
      <DialogContent className="!max-w-[420px] p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <PackageOpen className="h-4 w-4 text-purple-500" />
            Giải nén — {file?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Thư mục đích */}
          <div className="space-y-1.5">
            <Label htmlFor="targetFolder" className="text-xs">Giải nén vào</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {state.currentPath || '/'}/
              </span>
              <Input
                id="targetFolder"
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                placeholder="Tên thư mục"
                className="flex-1 h-9"
                disabled={extracting}
              />
            </div>
          </div>

          {/* Nội dung archive */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Nội dung ({fileCount} file{folderCount > 0 ? `, ${folderCount} thư mục` : ''})
              {totalSize > 0 && (
                <span className="text-muted-foreground ml-1">— {formatSize(totalSize)}</span>
              )}
            </Label>

            {scanning ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Đang đọc file nén...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <AlertTriangle className="h-6 w-6 mx-auto mb-1.5 text-yellow-500" />
                Không thể đọc nội dung file nén
              </div>
            ) : (
              <div className="border rounded-md max-h-[140px] overflow-y-auto divide-y">
                {entries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1 text-xs hover:bg-muted/50"
                  >
                    {entry.isDir ? (
                      <Folder className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    ) : (
                      <File className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{entry.name}</span>
                    {!entry.isDir && entry.size > 0 && (
                      <span className="text-muted-foreground flex-shrink-0">
                        {formatSize(entry.size)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress khi đang giải nén */}
          {extracting && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Đang giải nén...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground truncate">
                {currentFile}
              </p>
            </div>
          )}

          {/* Kết quả */}
          {!extracting && results.success > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-600">{results.success} file thành công</span>
                {results.failed > 0 && (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-red-500 ml-1" />
                    <span className="text-red-600">{results.failed} lỗi</span>
                  </>
                )}
              </div>
              {results.errors.length > 0 && (
                <div className="border rounded-md border-red-200 max-h-[60px] overflow-y-auto p-2 space-y-0.5">
                  {results.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-600">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={extracting}
          >
            {results.success > 0 ? 'Đóng' : 'Hủy'}
          </Button>
          <Button
            size="sm"
            onClick={handleExtract}
            disabled={extracting || scanning || entries.length === 0 || !targetFolder.trim()}
          >
            {extracting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Đang giải nén...
              </>
            ) : (
              <>
                <PackageOpen className="mr-1.5 h-3.5 w-3.5" />
                Giải nén {fileCount} file
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
