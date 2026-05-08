'use client';

import { useFileManagerContext } from './FileManagerProvider';
import { GridView, ListView, DetailsView } from './components/views';
import { Toolbar, Breadcrumb, SearchBar, ViewModeSelector, SortControls, FolderTreeSidebar, FileIcon } from './components/ui';
import {
  NewFolderDialog,
  RenameDialog,
  MoveDialog,
  CopyDialog,
  CompressionDialog,
  BulkRenameDialog,
  CodeEditorDialog,
  VersionHistoryDialog,
  BulkUploadDialog,
  ShareDialog,
  FilePreviewDialog,
  ImageEditorDialog,
} from './components/dialogs';
import { ExtractDialog } from './components/dialogs/ExtractDialog';
import { NewFileDialog } from './components/dialogs/NewFileDialog';
import { ConfirmDialog } from './components/dialogs/ConfirmDialog';
import ContextMenu from './components/ui/ContextMenu';
import PropertiesDialog from './components/dialogs/PropertiesDialog';
import HashDialog from './components/dialogs/HashDialog';
import AuditLogDialog from './components/dialogs/AuditLogDialog';

import { useFileOperations } from './hooks';
import { useFavorites } from './hooks/useFavorites';
import { useSharedLinks } from './hooks/useSharedLinks';
import { useRecentFiles } from './hooks/useRecentFiles';
import { useClipboard } from './hooks/useClipboard';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { FileItem, ContextMenuPosition, AuditLogEntry, TrashItem } from './types';
import {
  ChevronLeft, ChevronRight, Trash2, RotateCcw, XCircle,
  HardDrive, Copy, Scissors, ClipboardPaste,
  Archive, Download, Star, ExternalLink, Share2, Link2, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Main File Manager UI Component - Hoàn chỉnh
 *
 * ✅ Tất cả dialogs hoạt động
 * ✅ Keyboard shortcuts (Ctrl+C/X/V, Del, F2, Ctrl+A, Esc, Backspace)
 * ✅ Trash view + restore + xóa vĩnh viễn
 * ✅ Navigation back/forward
 * ✅ Batch actions bar khi multi-select
 * ✅ Pagination
 * ✅ Storage usage bar
 * ✅ Context menu kết nối đầy đủ
 * ✅ Drag & drop upload từ desktop
 */
export function FileManagerUI() {
  const { state, config, dispatch, supabase } = useFileManagerContext();
  const { loadFiles, downloadFile, deleteFile, uploadFile } = useFileOperations();
  const { toast } = useToast();
  const { copy: copyItems, cut: cutItems, paste: pasteClipboard, clipboard } = useClipboard();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    item: FileItem;
    position: ContextMenuPosition;
  } | null>(null);

  // Audit logs (demo data)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'destructive' | 'warning' | 'info';
    onConfirm: () => void;
    loading: boolean;
  }>({ open: false, title: '', description: '', confirmLabel: 'Xác nhận', variant: 'destructive', onConfirm: () => {}, loading: false });

  // Drag & drop
  const [dragOver, setDragOver] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { isFavorite, toggleFavorite, favorites, removeFavorite } = useFavorites();
  const { sharedLinks, activeLinksCount, removeSharedLink, cleanupExpired } = useSharedLinks();
  const { addRecentFile } = useRecentFiles();

  // Auto-hide folder tree on mobile lần đầu mount để không che file list
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 767px)').matches && state.showFolderTree) {
      dispatch({ type: 'TOGGLE_FOLDER_TREE' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== LOAD FILES KHI MOUNT & KHI PATH THAY ĐỔI ======
  useEffect(() => {
    console.log('[FileManager] useEffect triggered, currentPath:', state.currentPath);
    loadFiles(1, state.currentPath);
    // Gọi callback onFolderChange khi navigate
    config.callbacks?.onFolderChange?.(state.currentPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPath]);

  // ====== LOAD TRASH ITEMS ======
  const loadTrashItems = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .list('.trash', { limit: 1000 });

      if (error) throw error;

      const items: TrashItem[] = (data || [])
        .filter(item => item.name && item.id)
        .map(item => {
          const match = item.name.match(/^(\d+)_(.+)$/);
          const deletedAt = match
            ? new Date(parseInt(match[1])).toISOString()
            : item.created_at || new Date().toISOString();
          const originalName = match ? match[2] : item.name;

          return {
            id: item.id || item.name,
            name: originalName,
            path: `.trash/${item.name}`,
            type: 'file' as const,
            size: item.metadata?.size,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            metadata: item.metadata ?? undefined,
            deletedAt,
            originalPath: originalName,
          };
        });

      dispatch({ type: 'SET_TRASH_ITEMS', payload: items });
    } catch (error) {
      console.error('Lỗi tải thùng rác:', error);
    }
  }, [supabase, config.bucketName, dispatch]);

  useEffect(() => {
    if (state.isTrashView) {
      loadTrashItems();
    }
  }, [state.isTrashView, loadTrashItems]);

  // ====== RESTORE FROM TRASH ======
  const restoreFromTrash = useCallback(async (item: TrashItem) => {
    try {
      const { error: copyError } = await supabase.storage
        .from(config.bucketName)
        .copy(item.path, item.originalPath);
      if (copyError) throw copyError;

      const { error: deleteError } = await supabase.storage
        .from(config.bucketName)
        .remove([item.path]);
      if (deleteError) throw deleteError;

      toast({ title: 'Khôi phục thành công', description: item.name });
      await loadTrashItems();
    } catch (error: unknown) {
      toast({ title: 'Lỗi khôi phục', description: error instanceof Error ? error.message : 'Không thể khôi phục', variant: 'destructive' });
    }
  }, [supabase, config.bucketName, toast, loadTrashItems]);

  // ====== XÓA VĨNH VIỄN ======
  const permanentDelete = useCallback(async (item: TrashItem) => {
    setConfirmDialog({
      open: true,
      title: 'Xóa vĩnh viễn',
      description: `Bạn có chắc muốn xóa vĩnh viễn "${item.displayName || item.name}"? Hành động này không thể hoàn tác!`,
      confirmLabel: 'Xóa vĩnh viễn',
      variant: 'destructive',
      loading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        try {
          const { error } = await supabase.storage
            .from(config.bucketName)
            .remove([item.path]);
          if (error) throw error;
          toast({ title: 'Đã xóa vĩnh viễn', description: item.name });
          await loadTrashItems();
        } catch (error: unknown) {
          toast({ title: 'Lỗi xóa', description: error instanceof Error ? error.message : 'Không thể xóa', variant: 'destructive' });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        }
      },
    });
  }, [supabase, config.bucketName, toast, loadTrashItems]);

  // ====== TÍNH DUNG LƯỢNG ======
  const calculateStorage = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .list('', { limit: 10000 });
      if (error) return;

      const totalUsed = (data || []).reduce((sum, item) => sum + (item.metadata?.size || 0), 0);
      dispatch({ type: 'SET_STORAGE_INFO', payload: { used: totalUsed, limit: config.storageLimit } });
    } catch {
      // Bỏ qua lỗi
    }
  }, [supabase, config.bucketName, config.storageLimit, dispatch]);

  useEffect(() => {
    calculateStorage();
  }, [calculateStorage]);

  // ====== DỌN SẠCH THÙNG RÁC ======
  const emptyTrash = useCallback(() => {
    if (state.trashItems.length === 0) return;
    setConfirmDialog({
      open: true,
      title: 'Dọn sạch thùng rác',
      description: `Xóa vĩnh viễn tất cả ${state.trashItems.length} mục trong thùng rác? Hành động này không thể hoàn tác!`,
      confirmLabel: 'Dọn sạch',
      variant: 'destructive',
      loading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        try {
          const paths = state.trashItems.map(item => item.path);
          const { error } = await supabase.storage
            .from(config.bucketName)
            .remove(paths);
          if (error) throw error;
          toast({ title: 'Đã dọn sạch thùng rác', description: `${paths.length} mục đã xóa vĩnh viễn` });
          await loadTrashItems();
          calculateStorage();
        } catch (error: unknown) {
          toast({ title: 'Lỗi dọn thùng rác', description: error instanceof Error ? error.message : 'Không thể dọn', variant: 'destructive' });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        }
      },
    });
  }, [state.trashItems, supabase, config.bucketName, toast, loadTrashItems, calculateStorage]);

  // ====== KEYBOARD SHORTCUTS ======
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      const hasOpenDialog = Object.values(state.dialogs).some(v => v !== false && v !== null);
      if (hasOpenDialog) return;

      // Ctrl+A - Chọn tất cả
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        dispatch({ type: 'SELECT_MULTIPLE', payload: state.files.map(f => f.name) });
      }

      // Ctrl+C - Copy
      if (e.ctrlKey && e.key === 'c' && state.selectedItems.size > 0) {
        e.preventDefault();
        const files = state.files.filter(f => state.selectedItems.has(f.name));
        copyItems(files);
        toast({ title: 'Đã copy', description: `${files.length} file` });
      }

      // Ctrl+X - Cắt
      if (e.ctrlKey && e.key === 'x' && state.selectedItems.size > 0) {
        e.preventDefault();
        const files = state.files.filter(f => state.selectedItems.has(f.name));
        cutItems(files);
        toast({ title: 'Đã cắt', description: `${files.length} file` });
      }

      // Ctrl+V - Dán
      if (e.ctrlKey && e.key === 'v' && clipboard) {
        e.preventDefault();
        pasteClipboard(state.currentPath).then(() => {
          loadFiles(1, state.currentPath);
          toast({ title: 'Đã dán thành công' });
        }).catch((err: Error) => {
          toast({ title: 'Lỗi dán', description: err.message, variant: 'destructive' });
        });
      }

      // Delete
      if (e.key === 'Delete' && state.selectedItems.size > 0) {
        e.preventDefault();
        handleBatchDelete();
      }

      // F2 - Đổi tên
      if (e.key === 'F2' && state.selectedItems.size === 1) {
        e.preventDefault();
        const fileName = Array.from(state.selectedItems)[0];
        const file = state.files.find(f => f.name === fileName);
        if (file) dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'rename', data: file } });
      }

      // Escape
      if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_SELECTION' });
        setContextMenu(null);
      }

      // Backspace - lên thư mục cha
      if (e.key === 'Backspace' && state.currentPath) {
        e.preventDefault();
        const parts = state.currentPath.split('/');
        parts.pop();
        dispatch({ type: 'NAVIGATE_TO', payload: parts.join('/') });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedItems, state.files, clipboard, state.currentPath, state.dialogs]);

  // ====== DRAG & DROP TỪ DESKTOP ======
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadFile(files[i]);
        successCount++;
      } catch (error) {
        console.error(`Lỗi upload ${files[i].name}:`, error);
      }
    }

    if (successCount > 0) {
      toast({ title: 'Upload thành công', description: `${successCount}/${files.length} files` });
      await loadFiles(1, state.currentPath);
      calculateStorage();
    }
  }, [uploadFile, loadFiles, state.currentPath, toast, calculateStorage]);

  // ====== CONTEXT MENU HANDLERS ======
  const handleContextMenu = useCallback((e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    addRecentFile({ id: item.id, name: item.name, path: state.currentPath, type: item.type });
    setContextMenu({ item, position: { x: e.clientX, y: e.clientY } });
  }, [state.currentPath, addRecentFile]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Helper: tạo FileItem với đường dẫn đầy đủ
  const withPath = useCallback((item: FileItem) => ({
    ...item,
    path: state.currentPath ? `${state.currentPath}/${item.name}` : item.name,
  }), [state.currentPath]);

  const handlePreview = useCallback((item: FileItem) => {
    closeContextMenu();
    const fileWithPath = withPath(item);
    config.callbacks?.onFileSelect?.(fileWithPath);
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'preview', data: fileWithPath } });
  }, [closeContextMenu, dispatch, withPath, config.callbacks]);

  const handleDownloadItem = useCallback(async (item: FileItem) => {
    closeContextMenu();
    try {
      await downloadFile(item);
      toast({ title: 'Đã tải xuống', description: item.name });
    } catch (error: unknown) {
      toast({ title: 'Lỗi tải file', description: error instanceof Error ? error.message : 'Không thể tải', variant: 'destructive' });
    }
  }, [closeContextMenu, downloadFile, toast]);

  const handleRename = useCallback((item: FileItem) => {
    closeContextMenu();
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'rename', data: item } });
  }, [closeContextMenu, dispatch]);

  const handleDeleteItem = useCallback(async (item: FileItem) => {
    closeContextMenu();
    setConfirmDialog({
      open: true,
      title: 'Chuyển vào thùng rác',
      description: `Chuyển "${item.displayName || item.name}" vào thùng rác?`,
      confirmLabel: 'Xóa',
      variant: 'warning',
      loading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        try {
          await deleteFile(item);
          toast({ title: 'Đã chuyển vào thùng rác', description: item.name });
          await calculateStorage();
        } catch (error: unknown) {
          toast({ title: 'Lỗi xóa file', description: error instanceof Error ? error.message : 'Không thể xóa', variant: 'destructive' });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        }
      },
    });
  }, [closeContextMenu, deleteFile, toast, calculateStorage]);

  const handleOpenFolder = useCallback((item: FileItem) => {
    closeContextMenu();
    if (item.type === 'folder') {
      const newPath = state.currentPath ? `${state.currentPath}/${item.name}` : item.name;
      dispatch({ type: 'NAVIGATE_TO', payload: newPath });
    }
  }, [closeContextMenu, state.currentPath, dispatch]);

  const handleEditCode = useCallback((item: FileItem) => {
    closeContextMenu();
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'codeEditor', data: withPath(item) } });
  }, [closeContextMenu, dispatch, withPath]);

  const handleEditImage = useCallback((item: FileItem) => {
    closeContextMenu();
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'imageEditor', data: withPath(item) } });
  }, [closeContextMenu, dispatch, withPath]);

  const handleCopyItem = useCallback((item: FileItem) => {
    closeContextMenu();
    // Thêm vào selection và mở CopyDialog
    dispatch({ type: 'SELECT_ITEM', payload: item.name });
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'copy' } });
  }, [closeContextMenu, dispatch]);

  const handleMoveItem = useCallback((item: FileItem) => {
    closeContextMenu();
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'move', data: item } });
  }, [closeContextMenu, dispatch]);

  const handleExtractZip = useCallback((item: FileItem) => {
    closeContextMenu();
    const fileWithPath = {
      ...item,
      path: item.path || (state.currentPath ? `${state.currentPath}/${item.name}` : item.name),
    };
    dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'extract', data: fileWithPath } });
  }, [closeContextMenu, dispatch, state.currentPath]);

  // ====== SAO CHÉP ĐƯỜNG DẪN ======
  const handleCopyPath = useCallback((item: FileItem) => {
    closeContextMenu();
    const filePath = item.path || (state.currentPath ? `${state.currentPath}/${item.name}` : item.name);
    navigator.clipboard.writeText(filePath).then(() => {
      toast({ title: 'Đã sao chép đường dẫn', description: filePath });
    }).catch(() => {
      toast({ title: 'Không thể sao chép', description: 'Trình duyệt không hỗ trợ', variant: 'destructive' });
    });
  }, [closeContextMenu, state.currentPath, toast]);

  // ====== BATCH ACTIONS ======
  const selectedFiles = useMemo(
    () => state.files.filter(f => state.selectedItems.has(f.name)),
    [state.files, state.selectedItems]
  );

  const selectedFilesWithPath = useMemo(
    () => selectedFiles.map(f => withPath(f)),
    [selectedFiles, withPath]
  );

  const handleBatchDelete = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    setConfirmDialog({
      open: true,
      title: 'Xóa nhiều file',
      description: `Chuyển ${selectedFiles.length} file/thư mục vào thùng rác?`,
      confirmLabel: `Xóa ${selectedFiles.length} mục`,
      variant: 'warning',
      loading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
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
        calculateStorage();
        setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
      },
    });
  }, [selectedFiles, deleteFile, dispatch, toast, loadFiles, state.currentPath, calculateStorage]);

  // ====== FILE ICON HELPER ======
  const getFileIconElement = useCallback((item: FileItem) => {
    return <FileIcon file={item} size="sm" showThumbnail={false} />;
  }, []);

  // ====== FORMAT HELPERS ======
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const storagePercent = useMemo(() => {
    if (state.storageLimit === 0) return 0;
    return Math.round((state.storageUsed / state.storageLimit) * 100);
  }, [state.storageUsed, state.storageLimit]);

  // ====== RENDER VIEW ======
  const renderView = () => {
    switch (state.viewMode) {
      case 'grid': return <GridView onContextMenu={handleContextMenu} />;
      case 'list': return <ListView onContextMenu={handleContextMenu} />;
      case 'details': return <DetailsView onContextMenu={handleContextMenu} />;
      default: return <GridView onContextMenu={handleContextMenu} />;
    }
  };

  // ====== RENDER TRASH VIEW ======
  const renderTrashView = () => (
    <div className="p-4 space-y-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold">Thùng rác ({state.trashItems.length} mục)</h3>
        </div>
        <div className="flex items-center gap-2">
          {state.trashItems.length > 0 && (
            <Button variant="destructive" size="sm" onClick={emptyTrash}>
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Dọn sạch thùng rác</span>
              <span className="sm:hidden">Dọn sạch</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'SET_TRASH_VIEW', payload: false })}>
            Quay lại
          </Button>
        </div>
      </div>

      {state.trashItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Thùng rác trống</p>
        </div>
      ) : (
        <div className="space-y-1">
          {state.trashItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 border">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIconElement(item)}
                <div className="min-w-0">
                  <p className="font-medium truncate" title={item.displayName || item.name}>{item.displayName || item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Xóa lúc: {new Date(item.deletedAt).toLocaleString('vi-VN')}
                    {item.size ? ` • ${formatBytes(item.size)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => restoreFromTrash(item)} title="Khôi phục">
                  <RotateCcw className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => permanentDelete(item)} title="Xóa vĩnh viễn">
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ====== RENDER FAVORITES VIEW ======
  const renderFavoritesView = () => (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <h3 className="font-semibold">Yêu thích ({favorites.length} mục)</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'SET_FAVORITES_VIEW', payload: false })}>
          Quay lại
        </Button>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Chưa có mục yêu thích nào</p>
          <p className="text-sm mt-2">Click chuột phải vào file → &quot;Yêu thích&quot; để thêm</p>
        </div>
      ) : (
        <div className="space-y-1">
          {favorites.map(fav => (
            <div key={fav.path} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 border group">
              <div className="flex items-center gap-3 min-w-0">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{fav.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    /{fav.path}
                    {fav.addedAt && ` • Thêm lúc: ${new Date(fav.addedAt).toLocaleDateString('vi-VN')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Điều hướng đến file */}
                <Button
                  size="sm" variant="ghost"
                  onClick={() => {
                    // Tính thư mục chứa file
                    const parts = fav.path.split('/');
                    const folderPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
                    dispatch({ type: 'SET_FAVORITES_VIEW', payload: false });
                    dispatch({ type: 'NAVIGATE_TO', payload: folderPath });
                    loadFiles(1, folderPath);
                  }}
                  title="Mở thư mục chứa file"
                >
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                </Button>
                {/* Bỏ yêu thích */}
                <Button
                  size="sm" variant="ghost"
                  onClick={() => {
                    removeFavorite(fav.path);
                    toast({ title: 'Đã bỏ yêu thích', description: fav.name });
                  }}
                  title="Bỏ yêu thích"
                >
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ====== RENDER SHARED LINKS VIEW ======
  const renderSharedLinksView = () => {
    const now = Date.now();
    const activeLinks = sharedLinks.filter(link => {
      if (!link.expiresAt) return true;
      return new Date(link.expiresAt).getTime() > now;
    });
    const expiredLinks = sharedLinks.filter(link => {
      if (!link.expiresAt) return false;
      return new Date(link.expiresAt).getTime() <= now;
    });

    const copyToClipboard = async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: '📋 Đã copy link' });
      } catch {
        toast({ title: 'Lỗi copy', variant: 'destructive' });
      }
    };

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Link đã chia sẻ ({activeLinks.length} active)</h3>
          </div>
          <div className="flex items-center gap-2">
            {expiredLinks.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => {
                const removed = cleanupExpired();
                toast({ title: `Đã dọn ${removed} link hết hạn` });
              }}>
                Dọn hết hạn ({expiredLinks.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'SET_SHARED_LINKS_VIEW', payload: false })}>
              Quay lại
            </Button>
          </div>
        </div>

        {sharedLinks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Share2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Chưa chia sẻ link nào</p>
            <p className="text-sm mt-2">Chuột phải vào file → &quot;Chia Sẻ File&quot; để tạo link</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Active links */}
            {activeLinks.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 pb-1">
                  Đang hoạt động ({activeLinks.length})
                </p>
                {activeLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 border group">
                    <div className="flex items-center gap-3 min-w-0">
                      {link.linkType === 'public' ? (
                        <Globe className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Link2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">{link.fileName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {link.linkType === 'public' ? 'Public — Vĩnh viễn' : (link.expiryLabel || 'Tạm thời')}
                          {' • '}Tạo lúc: {new Date(link.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(link.url)} title="Copy link">
                        <Copy className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(link.url, '_blank')} title="Mở link">
                        <ExternalLink className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        const parts = link.filePath.split('/');
                        const folderPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
                        dispatch({ type: 'SET_SHARED_LINKS_VIEW', payload: false });
                        dispatch({ type: 'NAVIGATE_TO', payload: folderPath });
                        loadFiles(1, folderPath);
                      }} title="Mở thư mục chứa file">
                        <HardDrive className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        removeSharedLink(link.id);
                        toast({ title: 'Đã xóa link', description: link.fileName });
                      }} title="Xóa khỏi danh sách">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Expired links */}
            {expiredLinks.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 pb-1 pt-3">
                  Đã hết hạn ({expiredLinks.length})
                </p>
                {expiredLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 border opacity-50 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm line-through">{link.fileName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Hết hạn: {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString('vi-VN') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" onClick={() => {
                        removeSharedLink(link.id);
                      }} title="Xóa">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ====== MAIN RENDER ======
  return (
    <div
      className="flex h-full w-full bg-background relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Download className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-medium text-blue-700 dark:text-blue-300">Thả file vào đây để upload</p>
          </div>
        </div>
      )}

      {/* Folder tree sidebar */}
      {config.features.folderTree && state.showFolderTree && !state.isTrashView && (
        <FolderTreeSidebar />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <Toolbar onDeleteConfirm={(files) => {
          setConfirmDialog({
            open: true,
            title: 'Xóa files',
            description: `Chuyển ${files.length} file/thư mục vào thùng rác?`,
            confirmLabel: `Xóa ${files.length} mục`,
            variant: 'warning',
            loading: false,
            onConfirm: async () => {
              setConfirmDialog(prev => ({ ...prev, loading: true }));
              let count = 0;
              for (const file of files) {
                try { await deleteFile(file); count++; } catch (e) { console.error(`Lỗi xóa ${file.name}:`, e); }
              }
              dispatch({ type: 'CLEAR_SELECTION' });
              toast({ title: 'Đã xóa', description: `${count} files` });
              await loadFiles(1, state.currentPath);
              calculateStorage();
              setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
            },
          });
        }} />

        {/* Navigation bar */}
        <div className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-1 px-3 pt-2 sm:pt-0">
              {/* Back / Forward */}
              <Button
                variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7"
                onClick={() => dispatch({ type: 'NAVIGATE_BACK' })}
                disabled={state.navigationIndex <= 0}
                title="Quay lại (Backspace)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7"
                onClick={() => dispatch({ type: 'NAVIGATE_FORWARD' })}
                disabled={state.navigationIndex >= state.navigationHistory.length - 1}
                title="Tiến lên"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Favorites toggle */}
              <Button
                variant={state.showFavoritesView ? 'secondary' : 'ghost'}
                size="icon" className="h-9 w-9 sm:h-7 sm:w-7 relative"
                onClick={() => dispatch({ type: 'SET_FAVORITES_VIEW', payload: !state.showFavoritesView })}
                title="Yêu thích"
              >
                <Star className={`h-4 w-4 ${state.showFavoritesView ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                    {favorites.length > 99 ? '99' : favorites.length}
                  </span>
                )}
              </Button>

              {/* Shared links toggle */}
              <Button
                variant={state.showSharedLinksView ? 'secondary' : 'ghost'}
                size="icon" className="h-9 w-9 sm:h-7 sm:w-7 relative"
                onClick={() => dispatch({ type: 'SET_SHARED_LINKS_VIEW', payload: !state.showSharedLinksView })}
                title="Link đã chia sẻ"
              >
                <Share2 className={`h-4 w-4 ${state.showSharedLinksView ? 'text-blue-500' : ''}`} />
                {activeLinksCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                    {activeLinksCount > 99 ? '99' : activeLinksCount}
                  </span>
                )}
              </Button>

              {/* Trash toggle */}
              <Button
                variant={state.isTrashView ? 'secondary' : 'ghost'}
                size="icon" className="h-7 w-7"
                onClick={() => dispatch({ type: 'SET_TRASH_VIEW', payload: !state.isTrashView })}
                title="Thùng rác"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* Breadcrumb */}
              <div className="ml-1">
                <Breadcrumb />
              </div>
            </div>

            {/* View controls */}
            <div className="flex items-center gap-2 px-3 pb-2 sm:pb-0">
              <ViewModeSelector />
              <SortControls />
            </div>
          </div>
        </div>

        {/* Search bar */}
        {config.features.search && !state.isTrashView && <SearchBar />}

        {/* Batch actions bar */}
        {state.selectedItems.size > 0 && !state.isTrashView && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 border-b flex-wrap">
            <Badge variant="secondary">{state.selectedItems.size} đã chọn</Badge>
            <div className="flex items-center gap-1 flex-wrap">
              <Button size="sm" variant="ghost" onClick={() => {
                copyItems(selectedFiles);
                toast({ title: 'Đã copy', description: `${selectedFiles.length} file` });
              }}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                cutItems(selectedFiles);
                toast({ title: 'Đã cắt', description: `${selectedFiles.length} file` });
              }}>
                <Scissors className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Cắt</span>
              </Button>
              {clipboard && (
                <Button size="sm" variant="ghost" onClick={async () => {
                  try {
                    await pasteClipboard(state.currentPath);
                    await loadFiles(1, state.currentPath);
                    toast({ title: 'Đã dán thành công' });
                  } catch (err: unknown) {
                    toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Không thể dán', variant: 'destructive' });
                  }
                }}>
                  <ClipboardPaste className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Dán</span>
                </Button>
              )}
              {config.features.compress && (
                <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'compress' } })}>
                  <Archive className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Nén</span>
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive" onClick={handleBatchDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Xóa</span>
              </Button>
            </div>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}>
              Bỏ chọn
            </Button>
          </div>
        )}

        {/* View area */}
        <div className="flex-1 overflow-auto">
          {state.showFavoritesView
            ? renderFavoritesView()
            : state.showSharedLinksView
              ? renderSharedLinksView()
              : state.isTrashView
                ? renderTrashView()
                : renderView()
          }
        </div>

        {/* Pagination */}
        {!state.isTrashView && state.files.length >= state.itemsPerPage && (
          <div className="flex items-center justify-center gap-2 p-2 border-t bg-background">
            <Button
              size="sm" variant="outline"
              disabled={state.currentPage <= 1}
              onClick={() => {
                const p = state.currentPage - 1;
                dispatch({ type: 'SET_PAGE', payload: p });
                loadFiles(p, state.currentPath);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Trang {state.currentPage}</span>
            <Button
              size="sm" variant="outline"
              disabled={state.files.length < state.itemsPerPage}
              onClick={() => {
                const p = state.currentPage + 1;
                dispatch({ type: 'SET_PAGE', payload: p });
                loadFiles(p, state.currentPath);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Storage usage bar */}
        {state.storageUsed > 0 && (
          <div className="px-3 py-2 border-t bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="flex-shrink-0">{formatBytes(state.storageUsed)} / {formatBytes(state.storageLimit)}</span>
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${storagePercent > 90 ? 'bg-destructive' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(storagePercent, 100)}%` }}
                />
              </div>
              <span className="flex-shrink-0">{storagePercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ====== CONTEXT MENU ====== */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }} />
          <ContextMenu
            item={contextMenu.item}
            position={contextMenu.position}
            getFileIcon={getFileIconElement}
            onClose={closeContextMenu}
            onPreview={() => handlePreview(contextMenu.item)}
            onDownload={() => handleDownloadItem(contextMenu.item)}
            onEditCode={() => handleEditCode(contextMenu.item)}
            onEditImage={() => handleEditImage(contextMenu.item)}
            onRename={() => handleRename(contextMenu.item)}
            onCopy={() => handleCopyItem(contextMenu.item)}
            onMove={() => handleMoveItem(contextMenu.item)}
            onCopyPath={() => handleCopyPath(contextMenu.item)}
            onDelete={() => handleDeleteItem(contextMenu.item)}
            onOpenFolder={() => handleOpenFolder(contextMenu.item)}
            onExtractZip={() => handleExtractZip(contextMenu.item)}
            onToggleFavorite={() => {
              const filePath = contextMenu.item.path || (state.currentPath ? `${state.currentPath}/${contextMenu.item.name}` : contextMenu.item.name);
              const wasFavorite = isFavorite(filePath);
              toggleFavorite({ name: contextMenu.item.name, path: filePath, type: contextMenu.item.type });
              closeContextMenu();
              toast({ title: wasFavorite ? 'Đã bỏ yêu thích' : 'Đã thêm yêu thích', description: contextMenu.item.name });
            }}
            onShowPermissions={() => {
              // Redirect sang ShareDialog (PermissionsDialog đã bị loại bỏ)
              const fileWithPath = {
                ...contextMenu.item,
                path: contextMenu.item.path || (state.currentPath ? `${state.currentPath}/${contextMenu.item.name}` : contextMenu.item.name),
              };
              dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'share', data: fileWithPath } });
              closeContextMenu();
            }}
            onShowAuditLog={() => {
              setAuditLogs([
                { id: '1', action: 'view', timestamp: new Date(), user: 'Bạn', userId: '1', ipAddress: '127.0.0.1', details: 'Xem file' },
                { id: '2', action: 'download', timestamp: new Date(Date.now() - 3600000), user: 'Bạn', userId: '1', details: 'Tải xuống' },
              ]);
              dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'auditLog', data: contextMenu.item } });
              closeContextMenu();
            }}
            onShowProperties={() => {
              dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'properties', data: contextMenu.item } });
              closeContextMenu();
            }}
            isFavorite={isFavorite(contextMenu.item.path || (state.currentPath ? `${state.currentPath}/${contextMenu.item.name}` : contextMenu.item.name))}
          />
        </>
      )}

      {/* ====== TẤT CẢ DIALOGS ====== */}

      {/* Upload Dialog */}
      <BulkUploadDialog
        open={state.dialogs.upload}
        onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'upload' })}
        targetPath={state.currentPath}
        onSuccess={async () => {
          dispatch({ type: 'CLOSE_DIALOG', payload: 'upload' });
          await loadFiles(1, state.currentPath);
          calculateStorage();
        }}
      />

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={state.dialogs.newFolder}
        onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'newFolder' })}
      />

      {/* Rename Dialog */}
      {state.dialogs.rename && (
        <RenameDialog
          open={!!state.dialogs.rename}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'rename' })}
          file={state.dialogs.rename}
          onSuccess={async () => {
            dispatch({ type: 'CLOSE_DIALOG', payload: 'rename' });
            await loadFiles(1, state.currentPath);
          }}
        />
      )}

      {/* Move Dialog */}
      {state.dialogs.move && (
        <MoveDialog
          open={!!state.dialogs.move}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'move' })}
          file={state.dialogs.move}
          selectedFiles={selectedFilesWithPath}
          onSuccess={async () => {
            dispatch({ type: 'CLOSE_DIALOG', payload: 'move' });
            dispatch({ type: 'CLEAR_SELECTION' });
            await loadFiles(1, state.currentPath);
          }}
        />
      )}

      {/* Copy Dialog */}
      <CopyDialog
        open={state.dialogs.copy}
        onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'copy' })}
        files={selectedFilesWithPath}
        onSuccess={async () => {
          dispatch({ type: 'CLOSE_DIALOG', payload: 'copy' });
          dispatch({ type: 'CLEAR_SELECTION' });
          await loadFiles(1, state.currentPath);
          calculateStorage();
        }}
      />

      {/* Compression Dialog */}
      {config.features.compress && (
        <CompressionDialog
          open={state.dialogs.compress}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'compress' })}
          files={selectedFilesWithPath}
          onSuccess={async () => {
            dispatch({ type: 'CLOSE_DIALOG', payload: 'compress' });
            dispatch({ type: 'CLEAR_SELECTION' });
            await loadFiles(1, state.currentPath);
            calculateStorage();
          }}
        />
      )}

      {/* Extract Dialog */}
      {state.dialogs.extract && (
        <ExtractDialog
          open={!!state.dialogs.extract}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'extract' })}
          file={state.dialogs.extract}
          onSuccess={async () => {
            dispatch({ type: 'CLOSE_DIALOG', payload: 'extract' });
            await loadFiles(1, state.currentPath);
            calculateStorage();
          }}
        />
      )}

      {/* New File Dialog */}
      <NewFileDialog
        open={state.dialogs.newFile}
        onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'newFile' })}
        onSuccess={async () => {
          dispatch({ type: 'CLOSE_DIALOG', payload: 'newFile' });
          await loadFiles(1, state.currentPath);
          calculateStorage();
        }}
      />

      {/* Bulk Rename Dialog */}
      <BulkRenameDialog
        open={state.dialogs.bulkRename}
        onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'bulkRename' })}
        files={selectedFilesWithPath}
        onSuccess={async () => {
          dispatch({ type: 'CLOSE_DIALOG', payload: 'bulkRename' });
          dispatch({ type: 'CLEAR_SELECTION' });
          await loadFiles(1, state.currentPath);
        }}
      />

      {/* Preview Dialog */}
      {state.dialogs.preview && (
        <FilePreviewDialog
          open={!!state.dialogs.preview}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'preview' })}
          file={state.dialogs.preview}
          allFiles={state.files}
          onNavigate={(file) => dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'preview', data: file } })}
        />
      )}

      {/* Code Editor Dialog */}
      {state.dialogs.codeEditor && (
        <CodeEditorDialog
          open={!!state.dialogs.codeEditor}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'codeEditor' })}
          file={state.dialogs.codeEditor}
          onSuccess={async () => {
            dispatch({ type: 'CLOSE_DIALOG', payload: 'codeEditor' });
            await loadFiles(1, state.currentPath);
          }}
        />
      )}

      {/* Image Editor Dialog */}
      {state.dialogs.imageEditor && (
        <ImageEditorDialog
          open={!!state.dialogs.imageEditor}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'imageEditor' })}
          file={state.dialogs.imageEditor}
          onSuccess={async () => {
            dispatch({ type: 'CLOSE_DIALOG', payload: 'imageEditor' });
            await loadFiles(1, state.currentPath);
            calculateStorage();
          }}
        />
      )}

      {/* Share Dialog */}
      {state.dialogs.share && (
        <ShareDialog
          open={!!state.dialogs.share}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'share' })}
          file={state.dialogs.share}
          onSuccess={() => dispatch({ type: 'CLOSE_DIALOG', payload: 'share' })}
        />
      )}

      {/* Version History Dialog */}
      {state.dialogs.versionHistory && (
        <VersionHistoryDialog
          open={!!state.dialogs.versionHistory}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'versionHistory' })}
          file={state.dialogs.versionHistory}
          onSuccess={async () => {
            dispatch({ type: 'CLOSE_DIALOG', payload: 'versionHistory' });
            await loadFiles(1, state.currentPath);
          }}
        />
      )}

      {/* PermissionsDialog đã được gộp vào ShareDialog */}

      {/* Properties Dialog */}
      {state.dialogs.properties && (
        <PropertiesDialog
          open={!!state.dialogs.properties}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'properties' })}
          file={state.dialogs.properties}
          currentPath={state.currentPath}
          onCalculateHash={() => {
            if (state.dialogs.properties) {
              dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'hash', data: state.dialogs.properties } });
              dispatch({ type: 'CLOSE_DIALOG', payload: 'properties' });
            }
          }}
        />
      )}

      {/* Hash Dialog */}
      {state.dialogs.hash && (
        <HashDialog
          open={!!state.dialogs.hash}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'hash' })}
          file={state.dialogs.hash}
          onCalculate={async () => {
            try {
              const hashFile = state.dialogs.hash as FileItem;
              const filePath = hashFile.path || `${state.currentPath}/${hashFile.name}`;
              const { data, error } = await supabase.storage
                .from(config.bucketName)
                .download(filePath);
              if (error) throw error;
              const buffer = await data.arrayBuffer();
              const { calculateSHA256 } = await import('./services/hashingService');
              const sha256 = await calculateSHA256(buffer);
              const sha1Buffer = await crypto.subtle.digest('SHA-1', buffer);
              const sha1 = Array.from(new Uint8Array(sha1Buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
              return { md5: `SHA-1: ${sha1}`, sha1, sha256 };
            } catch {
              return { md5: 'Lỗi', sha1: 'Lỗi', sha256: 'Lỗi' };
            }
          }}
        />
      )}

      {/* Audit Log Dialog */}
      {state.dialogs.auditLog && (
        <AuditLogDialog
          open={!!state.dialogs.auditLog}
          onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG', payload: 'auditLog' })}
          file={state.dialogs.auditLog}
          logs={auditLogs}
          onRefresh={() => setAuditLogs([])}
        />
      )}

      {/* Confirm Dialog — thay thế window.confirm() */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        loading={confirmDialog.loading}
      />
    </div>
  );
}
