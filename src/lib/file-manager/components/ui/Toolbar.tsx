'use client';

import { useRef } from 'react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { useFileOperations } from '../../hooks';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FolderPlus,
  FilePlus,
  Download,
  Trash2,
  Share2,
  RefreshCw,
  MoreVertical,
  FolderTree,
  Archive,
  Edit,
  History,
  ListTodo,
  Menu,
  Camera,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Toolbar component - Kết nối đầy đủ với dialog state
 *
 * Actions:
 * - Upload files (mở BulkUploadDialog)
 * - Tạo thư mục mới (mở NewFolderDialog)
 * - Tải xuống (download selected)
 * - Chia sẻ (mở ShareDialog)
 * - Xóa (deleteFile)
 * - Nén (mở CompressionDialog)
 * - Đổi tên hàng loạt (mở BulkRenameDialog)
 * - Toggle folder tree
 * - Refresh
 */
interface ToolbarProps {
  onDeleteConfirm?: (files: import('../../types').FileItem[]) => void;
}

export function Toolbar({ onDeleteConfirm }: ToolbarProps = {}) {
  const { state, dispatch, config } = useFileManagerContext();
  const { loadFiles, downloadFile, deleteFile, uploadFile } = useFileOperations();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const hasSelection = state.selectedItems.size > 0;
  const singleSelection = state.selectedItems.size === 1;

  // Lấy file đã chọn đầu tiên (cho single actions)
  const getSelectedFile = () => {
    if (!singleSelection) return null;
    const name = Array.from(state.selectedItems)[0];
    return state.files.find(f => f.name === name) || null;
  };

  // Upload
  const handleUpload = () => {
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'upload' } });
  };

  // Tạo thư mục
  const handleNewFolder = () => {
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'newFolder' } });
  };

  // Download selected files
  const handleDownload = async () => {
    const selectedFiles = state.files.filter(f => state.selectedItems.has(f.name));
    for (const file of selectedFiles) {
      try {
        await downloadFile(file);
      } catch (error) {
        console.error(`Lỗi tải ${file.name}:`, error);
      }
    }
    if (selectedFiles.length > 0) {
      toast({ title: 'Đang tải xuống', description: `${selectedFiles.length} file` });
    }
  };

  // Share selected file
  const handleShare = () => {
    const file = getSelectedFile();
    if (file) {
      const fileWithPath = {
        ...file,
        path: state.currentPath ? `${state.currentPath}/${file.name}` : file.name,
      };
      dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'share', data: fileWithPath } });
    }
  };

  // Delete selected files
  const handleDelete = async () => {
    const selectedFiles = state.files.filter(f => state.selectedItems.has(f.name));
    if (selectedFiles.length === 0) return;

    if (onDeleteConfirm) {
      // Sử dụng ConfirmDialog từ FileManagerUI
      onDeleteConfirm(selectedFiles);
    } else {
      // Fallback: xóa trực tiếp
      let count = 0;
      for (const file of selectedFiles) {
        try {
          await deleteFile(file);
          count++;
        } catch (e) {
          console.error(`Lỗi xóa ${file.name}:`, e);
        }
      }
      dispatch({ type: 'CLEAR_SELECTION' });
      toast({ title: 'Đã xóa', description: `${count} files` });
      await loadFiles(1, state.currentPath);
    }
  };

  // Refresh
  const handleRefresh = () => {
    loadFiles(1, state.currentPath);
  };

  // Nén files
  const handleCompress = () => {
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'compress' } });
  };

  // Bulk rename
  const handleBulkRename = () => {
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'bulkRename' } });
  };

  // Toggle folder tree
  const handleToggleTree = () => {
    dispatch({ type: 'TOGGLE_FOLDER_TREE' });
  };

  // Toggle advanced search
  const handleAdvancedSearch = () => {
    dispatch({ type: 'TOGGLE_ADVANCED_SEARCH' });
  };

  // Quick file upload via hidden input
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'upload' } });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Mở camera mobile để chụp ảnh
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // Sau khi user chụp xong, upload thẳng vào folder hiện tại
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    const file = files[0];
    // Đặt tên file dạng IMG_<timestamp>.<ext> (camera trả về tên kiểu image.jpg)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const renamed = new File([file], `IMG_${stamp}.${ext}`, { type: file.type });

    try {
      toast({ title: 'Đang upload ảnh...', description: renamed.name });
      await uploadFile(renamed);
      toast({ title: 'Đã upload ảnh', description: renamed.name });
    } catch (err: unknown) {
      toast({
        title: 'Lỗi upload',
        description: err instanceof Error ? err.message : 'Không thể upload ảnh',
        variant: 'destructive',
      });
    } finally {
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-wrap">
      {/* Mobile: hamburger để mở sidebar (chỉ hiện trên mobile) */}
      {config.features.folderTree && (
        <Button
          size="sm"
          variant="ghost"
          className="md:hidden h-8 w-8 p-0"
          onClick={handleToggleTree}
          title="Mở cây thư mục"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Primary actions */}
      <div className="flex items-center gap-1">
        {config.features.upload && (
          <Button size="sm" variant="default" onClick={handleUpload} title="Upload files">
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        )}

        {/* Camera — chỉ hiện trên mobile (desktop không có camera input như mong đợi) */}
        {config.features.upload && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCameraClick}
            title="Chụp ảnh từ camera"
            className="md:hidden"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}

        <Button size="sm" variant="outline" onClick={handleNewFolder} title="Tạo thư mục mới">
          <FolderPlus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Thư mục</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'newFile' } })}
          title="Tạo file mới"
          className="hidden sm:inline-flex"
        >
          <FilePlus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Tạo file</span>
        </Button>
      </div>

      <div className="h-6 w-px bg-border hidden sm:block" />

      {/* Selection actions — chỉ hiện khi có selection trên mobile */}
      <div className={`items-center gap-1 ${hasSelection ? 'flex' : 'hidden sm:flex'}`}>
        {config.features.download && (
          <Button size="sm" variant="ghost" onClick={handleDownload} disabled={!hasSelection} title="Tải xuống">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Tải xuống</span>
          </Button>
        )}

        {config.features.share && (
          <Button size="sm" variant="ghost" onClick={handleShare} disabled={!singleSelection} title="Chia sẻ" className="hidden sm:inline-flex">
            <Share2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </Button>
        )}

        {config.features.delete && (
          <Button size="sm" variant="ghost" onClick={handleDelete} disabled={!hasSelection} title="Xóa">
            <Trash2 className="h-4 w-4 sm:mr-2 text-destructive" />
            <span className="hidden sm:inline text-destructive">Xóa</span>
          </Button>
        )}
      </div>

      <div className="h-6 w-px bg-border hidden md:block" />

      {/* More actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" title="Thêm thao tác">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem
            onClick={() => dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'newFile' } })}
            className="sm:hidden"
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Tạo file
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare} disabled={!singleSelection} className="sm:hidden">
            <Share2 className="mr-2 h-4 w-4" />
            Chia sẻ
          </DropdownMenuItem>
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuItem onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleTree} className="hidden md:flex">
            <FolderTree className="mr-2 h-4 w-4" />
            {state.showFolderTree ? 'Ẩn cây thư mục' : 'Hiện cây thư mục'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAdvancedSearch}>
            <ListTodo className="mr-2 h-4 w-4" />
            Tìm kiếm nâng cao
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {config.features.compress && (
            <DropdownMenuItem onClick={handleCompress} disabled={!hasSelection}>
              <Archive className="mr-2 h-4 w-4" />
              Nén files
            </DropdownMenuItem>
          )}
          {config.features.bulkRename && (
            <DropdownMenuItem onClick={handleBulkRename} disabled={state.selectedItems.size < 2}>
              <Edit className="mr-2 h-4 w-4" />
              Đổi tên hàng loạt
            </DropdownMenuItem>
          )}
          {config.features.versionHistory && singleSelection && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const file = getSelectedFile();
                if (file) {
                  const fileWithPath = {
                    ...file,
                    path: state.currentPath ? `${state.currentPath}/${file.name}` : file.name,
                  };
                  dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'versionHistory', data: fileWithPath } });
                }
              }}>
                <History className="mr-2 h-4 w-4" />
                Lịch sử phiên bản
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Selection info */}
      {hasSelection && (
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <span className="tabular-nums">{state.selectedItems.size}</span>
          <span className="hidden sm:inline">đã chọn</span>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}>
            <span className="hidden sm:inline">Bỏ chọn</span>
            <span className="sm:hidden">Hủy</span>
          </Button>
        </div>
      )}

      {/* Hidden file input cho upload thông thường */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleQuickUpload} />

      {/* Hidden camera input — capture="environment" mở camera sau trên mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
    </div>
  );
}
