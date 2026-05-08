'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileIcon,
  Trash2,
  RefreshCw,
  Pause,
  Play,
} from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { sanitizeStorageKey } from '../../utils/sanitizeKey';
import { setDisplayName } from '../../services/displayNamesService';
import { UploadQueueItem } from '../../types';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPath?: string;
  onSuccess?: () => void;
}

/**
 * Dialog upload nhiều files cùng lúc
 * 
 * Features:
 * - Drag & drop support
 * - Multiple file selection
 * - Upload queue với progress tracking
 * - Pause/Resume/Cancel individual uploads
 * - Retry failed uploads
 * - File validation (size, type)
 * - Preview upload list
 */
export function BulkUploadDialog({
  open,
  onOpenChange,
  targetPath = '',
  onSuccess,
}: BulkUploadDialogProps) {
  const { state, dispatch, config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Kiểm tra feature flag
  if (!config.features.upload) {
    return null;
  }

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    const maxSize = config.maxFileSize || 50 * 1024 * 1024; // 50MB default
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File quá lớn (max: ${formatBytes(maxSize)})`,
      };
    }

    // Check file type
    if (config.allowedFileTypes && config.allowedFileTypes.length > 0) {
      const isAllowed = config.allowedFileTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -2));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: 'Loại file không được phép',
        };
      }
    }

    return { valid: true };
  };

  // Add files to queue
  const addFilesToQueue = useCallback((files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file);
      
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: validation.valid ? 'pending' : 'failed',
        progress: 0,
        error: validation.error,
      });
    });

    setUploadQueue((prev) => [...prev, ...newItems]);

    toast({
      title: 'Đã thêm vào hàng đợi',
      description: `${newItems.length} file`,
    });
  }, [config.maxFileSize, config.allowedFileTypes]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  // Upload single file
  const uploadFile = async (item: UploadQueueItem): Promise<void> => {
    const safeName = sanitizeStorageKey(item.file.name) || item.file.name;
    const uploadPath = targetPath
      ? `${targetPath}/${safeName}`
      : safeName;
    const originalName = item.file.name;

    try {
      // Update status to uploading
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i
        )
      );

      // Upload với progress tracking
      const { error } = await supabase.storage
        .from(config.bucketName)
        .upload(uploadPath, item.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Lưu display name nếu user upload file có dấu/ký tự đặc biệt
      if (originalName !== safeName) {
        await setDisplayName(supabase, config.bucketName, uploadPath, originalName);
      }

      // Update status to completed
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'completed', progress: 100 }
            : i
        )
      );

      // Callback
      config.callbacks?.onFileUpload?.(item.file, uploadPath);
    } catch (error: any) {
      console.error(`Lỗi khi upload ${item.file.name}:`, error);

      // Update status to failed
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'failed',
                error: error.message || 'Lỗi không xác định',
              }
            : i
        )
      );

      config.callbacks?.onError?.(error as Error, 'upload_file');
    }
  };

  // Start upload queue
  const startUpload = async () => {
    setIsUploading(true);
    setIsPaused(false);

    const pendingItems = uploadQueue.filter((item) => item.status === 'pending');

    for (const item of pendingItems) {
      if (isPaused) break;
      await uploadFile(item);
    }

    setIsUploading(false);

    // Auto-cleanup: xóa placeholder cũ trong folder đích (nếu có file upload thành công)
    const successCount = uploadQueue.filter(
      (item) => item.status === 'completed'
    ).length;

    if (successCount > 0 && state.currentPath) {
      try {
        const { PLACEHOLDER_NAMES } = await import('@/lib/file-manager/constants');
        const placeholders = [...PLACEHOLDER_NAMES].map(name => `${state.currentPath}/${name}`);
        await supabase.storage.from(config.bucketName).remove(placeholders);
      } catch { /* bỏ qua */ }
    }

    // Check if all completed
    const allCompleted = uploadQueue.every(
      (item) => item.status === 'completed' || item.status === 'failed'
    );

    if (allCompleted) {
      toast({
        title: 'Upload hoàn tất',
        description: `${successCount}/${uploadQueue.length} file thành công`,
      });

      // Clear cache
      if (config.cache.enabled) {
        localStorage.removeItem('file_manager_files');
        sessionStorage.removeItem('file_manager_files');
      }

      // Reload files
      dispatch({ type: 'SET_LOADING', payload: true });

      onSuccess?.();
    }
  };

  // Pause/Resume upload
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Remove item from queue
  const removeItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Retry failed item
  const retryItem = async (item: UploadQueueItem) => {
    // Reset status to pending
    setUploadQueue((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: 'pending', progress: 0, error: undefined }
          : i
      )
    );

    // Upload
    await uploadFile(item);
  };

  // Clear completed items
  const clearCompleted = () => {
    setUploadQueue((prev) =>
      prev.filter((item) => item.status !== 'completed')
    );
  };

  // Calculate statistics
  const stats = {
    total: uploadQueue.length,
    pending: uploadQueue.filter((i) => i.status === 'pending').length,
    uploading: uploadQueue.filter((i) => i.status === 'uploading').length,
    completed: uploadQueue.filter((i) => i.status === 'completed').length,
    failed: uploadQueue.filter((i) => i.status === 'failed').length,
  };

  const totalSize = uploadQueue.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[560px] p-5 max-h-[600px] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Upload Nhiều Files
          </DialogTitle>
          <DialogDescription className="text-xs">
            {stats.total > 0 ? (
              <span>
                {stats.completed}/{stats.total} hoàn thành • {formatBytes(totalSize)}
              </span>
            ) : (
              'Chọn hoặc kéo thả files vào đây'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs font-medium mb-1">
              Kéo thả files vào đây hoặc click để chọn
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {config.allowedFileTypes
                ? `Chỉ chấp nhận: ${config.allowedFileTypes.join(', ')}`
                : 'Chấp nhận tất cả các loại file'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              accept={config.allowedFileTypes?.join(',')}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Chọn Files
            </Button>
          </div>

          {/* Upload queue */}
          {uploadQueue.length > 0 && (
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-3 space-y-2">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border rounded-md bg-background"
                  >
                    <FileIcon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {item.file.name}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatBytes(item.file.size)}
                        </span>
                      </div>

                      {item.status === 'uploading' && (
                        <Progress value={item.progress} className="h-1 mb-1" />
                      )}

                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && (
                          <span className="text-xs text-muted-foreground">
                            Đang chờ...
                          </span>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Đang upload {item.progress}%
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Hoàn thành
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {item.error || 'Lỗi'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => retryItem(item)}
                          disabled={isUploading}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {item.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2">
          {stats.completed > 0 && (
            <Button
              variant="outline"
              onClick={clearCompleted}
              disabled={isUploading}
            >
              Xóa Đã Hoàn Thành
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            {uploadQueue.length === 0 ? 'Đóng' : 'Hủy'}
          </Button>

          {stats.pending > 0 && (
            <>
              {isUploading ? (
                <Button onClick={togglePause} variant="outline">
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Tiếp Tục
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Tạm Dừng
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={startUpload} disabled={stats.pending === 0}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {stats.pending} Files
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
