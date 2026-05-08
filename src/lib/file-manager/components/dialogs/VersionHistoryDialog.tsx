'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, History, Download, RotateCcw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useFileManagerContext } from '../../FileManagerProvider';
import { FileItem, FileVersion } from '../../types';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem;
  onSuccess?: () => void;
}

/**
 * Dialog xem và khôi phục phiên bản file
 * 
 * Features:
 * - Danh sách các versions
 * - Xem chi tiết version
 * - Tải xuống version cũ
 * - Restore về version cũ
 * - Xóa version không cần
 */
export function VersionHistoryDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: VersionHistoryDialogProps) {
  const { config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Kiểm tra feature flag
  if (!config.features.versionHistory) {
    return null;
  }

  // Load versions
  useEffect(() => {
    if (open && file.path) {
      loadVersions();
    }
  }, [open, file.path]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      // Supabase không có built-in version history
      // Đây là implementation giả định sử dụng custom table hoặc naming convention
      // VD: file.txt -> file_v1.txt, file_v2.txt, etc.
      
      const pathParts = file.path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const directory = pathParts.slice(0, -1).join('/');
      
      const nameWithoutExt = fileName.includes('.')
        ? fileName.slice(0, fileName.lastIndexOf('.'))
        : fileName;
      const extension = fileName.includes('.')
        ? fileName.slice(fileName.lastIndexOf('.'))
        : '';

      // Tìm tất cả versions với pattern: filename_v*.ext
      const { data: allFiles, error } = await supabase.storage
        .from(config.bucketName)
        .list(directory || undefined, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      // Filter versions
      const versionRegex = new RegExp(`^${nameWithoutExt}_v(\\d+)${extension}$`);
      const versionFiles = allFiles
        .filter((f) => versionRegex.test(f.name))
        .map((f) => {
          const match = f.name.match(versionRegex);
          const versionNum = match ? parseInt(match[1]) : 0;
          
          return {
            id: f.id || f.name,
            version: `v${versionNum}`,
            name: f.name,
            created_at: f.created_at || new Date().toISOString(),
            size: f.metadata?.size || 0,
            metadata: f.metadata,
          } as FileVersion;
        })
        .sort((a, b) => {
          const aNum = parseInt(a.version.slice(1));
          const bNum = parseInt(b.version.slice(1));
          return bNum - aNum; // Newest first
        });

      // Add current version as v0
      versionFiles.unshift({
        id: file.id,
        version: 'Hiện tại',
        name: file.name,
        created_at: file.created_at,
        size: file.size || 0,
        metadata: file.metadata,
      });

      setVersions(versionFiles);
    } catch (error) {
      console.error('Lỗi khi tải lịch sử versions:', error);
      config.callbacks?.onError?.(error as Error, 'load_versions');

      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử versions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Download version
  const handleDownload = async (version: FileVersion) => {
    try {
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = version.name;
      const versionPath = pathParts.join('/');

      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .download(versionPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = version.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Đang tải xuống',
        description: version.name,
      });
    } catch (error) {
      console.error('Lỗi khi tải version:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải xuống version này',
        variant: 'destructive',
      });
    }
  };

  // Restore version
  const handleRestore = async (version: FileVersion) => {
    if (!confirm(`Khôi phục về ${version.version}? File hiện tại sẽ được lưu thành version mới.`)) {
      return;
    }

    setRestoring(version.id);
    try {
      // 1. Download old version
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = version.name;
      const versionPath = pathParts.join('/');

      const { data, error: downloadError } = await supabase.storage
        .from(config.bucketName)
        .download(versionPath);

      if (downloadError) throw downloadError;

      // 2. Backup current version
      const currentVersionNum = versions.filter((v) => v.version.startsWith('v')).length;
      const fileName = file.name;
      const nameWithoutExt = fileName.includes('.')
        ? fileName.slice(0, fileName.lastIndexOf('.'))
        : fileName;
      const extension = fileName.includes('.')
        ? fileName.slice(fileName.lastIndexOf('.'))
        : '';
      
      const backupName = `${nameWithoutExt}_v${currentVersionNum}${extension}`;
      const currentPathParts = file.path.split('/');
      currentPathParts[currentPathParts.length - 1] = backupName;
      const backupPath = currentPathParts.join('/');

      // Download current file
      const { data: currentData, error: currentError } = await supabase.storage
        .from(config.bucketName)
        .download(file.path);

      if (currentError) throw currentError;

      // Upload as backup
      await supabase.storage
        .from(config.bucketName)
        .upload(backupPath, currentData, {
          contentType: file.metadata?.mimetype,
        });

      // 3. Replace current with restored version
      const { error: updateError } = await supabase.storage
        .from(config.bucketName)
        .update(file.path, data, {
          contentType: version.metadata?.mimetype,
          upsert: true,
        });

      if (updateError) throw updateError;

      toast({
        title: 'Thành công',
        description: `Đã khôi phục về ${version.version}`,
      });

      // Reload versions
      await loadVersions();
      onSuccess?.();
    } catch (error) {
      console.error('Lỗi khi khôi phục version:', error);
      config.callbacks?.onError?.(error as Error, 'restore_version');

      toast({
        title: 'Lỗi',
        description: 'Không thể khôi phục version này',
        variant: 'destructive',
      });
    } finally {
      setRestoring(null);
    }
  };

  // Delete version
  const handleDelete = async (version: FileVersion) => {
    if (version.version === 'Hiện tại') {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa version hiện tại',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Xóa ${version.version}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setDeleting(version.id);
    try {
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = version.name;
      const versionPath = pathParts.join('/');

      const { error } = await supabase.storage
        .from(config.bucketName)
        .remove([versionPath]);

      if (error) throw error;

      toast({
        title: 'Đã xóa',
        description: `Đã xóa ${version.version}`,
      });

      // Reload versions
      await loadVersions();
    } catch (error) {
      console.error('Lỗi khi xóa version:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa version này',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[560px] p-5 max-h-[600px] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Lịch Sử: {file.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {versions.length > 0
              ? `${versions.length} phiên bản`
              : 'Không có phiên bản nào'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Đang tải...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Không có lịch sử phiên bản</p>
              <p className="text-xs text-muted-foreground mt-1">
                File sẽ có versions khi được chỉnh sửa và lưu
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg ${
                    version.version === 'Hiện tại'
                      ? 'bg-primary/5 border-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {version.version}
                        </span>
                        {version.version === 'Hiện tại' && (
                          <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {version.name}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatSize(version.size)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(version.created_at), 'dd/MM/yyyy HH:mm', {
                            locale: vi,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(version)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {version.version !== 'Hiện tại' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(version)}
                            disabled={restoring !== null}
                          >
                            {restoring === version.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(version)}
                            disabled={deleting !== null}
                          >
                            {deleting === version.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
