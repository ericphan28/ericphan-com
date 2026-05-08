import React from 'react';
import {
  Eye,
  Download,
  FileText,
  Image as ImageIcon,
  Edit,
  Copy,
  Move,
  Trash2,
  FolderOpen,
  PackageOpen,
  Archive,
  Star,
  FileCheck,
  Info,
  Share2,
  ClipboardCopy,
} from 'lucide-react';
import { FileItem } from '../../types';

interface ContextMenuProps {
  item: FileItem;
  position: { x: number; y: number };
  onClose: () => void;
  onPreview: (item: FileItem) => void;
  onDownload: (item: FileItem) => void;
  onRename: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
  onCopy: (item: FileItem) => void;
  onMove: (item: FileItem) => void;
  onEditCode?: (item: FileItem) => void;
  onEditImage?: (item: FileItem) => void;
  onOpenFolder?: (item: FileItem) => void;
  onExtractZip?: (item: FileItem) => void;
  onToggleFavorite: (item: FileItem) => void;
  onCopyPath?: (item: FileItem) => void;
  onShowPermissions?: (item: FileItem) => void;
  onShowAuditLog?: (item: FileItem) => void;
  onShowProperties: (item: FileItem) => void;
  isFavorite: boolean;
  isPublic?: boolean;
  hasAuditLog?: boolean;
  getFileIcon: (item: FileItem) => React.ReactNode;
}

/**
 * Context Menu Component
 * Desktop: Popup at cursor position
 * Mobile: Bottom sheet drawer
 */
export default function ContextMenu({
  item,
  position,
  onClose,
  onPreview,
  onDownload,
  onRename,
  onDelete,
  onCopy,
  onMove,
  onEditCode,
  onEditImage,
  onOpenFolder,
  onExtractZip,
  onToggleFavorite,
  onCopyPath,
  onShowPermissions,
  onShowAuditLog,
  onShowProperties,
  isFavorite,
  isPublic: _isPublic,
  hasAuditLog,
  getFileIcon,
}: ContextMenuProps) {
  const isFile = item.type === 'file';
  const isFolder = item.type === 'folder';
  const isCodeFile = /\.(txt|js|jsx|ts|tsx|json|html|css|scss|md|py|java|php|sql|xml|yaml|yml|sh|env)$/i.test(item.name);
  const isImageFile = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(item.name);
  const isZipFile = item.name.toLowerCase().endsWith('.zip');
  const isArchiveFile = /\.(tar|tar\.gz|tgz|tar\.bz2|tbz2)$/i.test(item.name);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Menu items configuration
  const menuItems = [
    // File-specific actions
    ...(isFile ? [
      {
        icon: <Eye className="h-4 w-4 lg:h-4 lg:w-4" />,
        label: 'Xem trước',
        onClick: () => { onPreview(item); onClose(); },
        color: 'default'
      },
      {
        icon: <Download className="h-4 w-4 lg:h-4 lg:w-4" />,
        label: 'Tải xuống',
        onClick: () => { onDownload(item); onClose(); },
        color: 'default'
      },
    ] : []),

    // Code editor for text files
    ...(isFile && isCodeFile && onEditCode ? [{
      icon: <FileText className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Chỉnh sửa Code',
      onClick: () => { onEditCode(item); onClose(); },
      color: 'blue'
    }] : []),

    // Image editor for images
    ...(isFile && isImageFile && onEditImage ? [{
      icon: <ImageIcon className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Chỉnh sửa Ảnh',
      onClick: () => { onEditImage(item); onClose(); },
      color: 'purple'
    }] : []),

    // Divider after view/edit actions
    ...(isFile ? [{ type: 'divider' as const }] : []),

    // Folder actions
    ...(isFolder && onOpenFolder ? [{
      icon: <FolderOpen className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Mở thư mục',
      onClick: () => { onOpenFolder(item); onClose(); },
      color: 'default'
    }] : []),

    // Extract actions for archives
    ...(isZipFile && onExtractZip ? [{
      icon: <PackageOpen className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Giải nén ZIP',
      onClick: () => { onExtractZip(item); onClose(); },
      color: 'purple'
    }] : []),

    ...(isArchiveFile && onExtractZip ? [{
      icon: <Archive className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: `Giải nén ${item.name.match(/\.(tar\.gz|tgz|tar\.bz2|tbz2|tar)$/i)?.[0].toUpperCase()}`,
      onClick: () => { onExtractZip(item); onClose(); },
      color: 'purple'
    }] : []),

    // Divider after special actions
    ...((isFolder || isZipFile || isArchiveFile) ? [{ type: 'divider' as const }] : []),

    // Common file operations
    {
      icon: <Edit className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Đổi tên',
      onClick: () => { onRename(item); onClose(); },
      color: 'default'
    },
    {
      icon: <Copy className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Sao chép',
      onClick: () => { onCopy(item); onClose(); },
      color: 'default'
    },
    {
      icon: <Move className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Di chuyển',
      onClick: () => { onMove(item); onClose(); },
      color: 'default'
    },

    // Sao chép đường dẫn
    ...(onCopyPath ? [{
      icon: <ClipboardCopy className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Sao chép đường dẫn',
      onClick: () => { onCopyPath(item); onClose(); },
      color: 'default'
    }] : []),

    { type: 'divider' as const },

    // Favorite
    {
      icon: <Star className={`h-4 w-4 lg:h-4 lg:w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />,
      label: isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích',
      onClick: () => { onToggleFavorite(item); onClose(); },
      color: 'default'
    },

    // Chia sẻ file (mở ShareDialog)
    ...(isFile && onShowPermissions ? [{
      icon: <Share2 className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Chia Sẻ File',
      onClick: () => { onShowPermissions(item); onClose(); },
      color: 'blue'
    }] : []),

    // Audit log (if has logs)
    ...(hasAuditLog && onShowAuditLog ? [{
      icon: <FileCheck className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Xem Nhật Ký Truy Cập',
      onClick: () => { onShowAuditLog(item); onClose(); },
      color: 'purple'
    }] : []),

    // Properties
    {
      icon: <Info className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Thuộc tính',
      onClick: () => { onShowProperties(item); onClose(); },
      color: 'default'
    },

    { type: 'divider' as const },

    // Delete
    {
      icon: <Trash2 className="h-4 w-4 lg:h-4 lg:w-4" />,
      label: 'Xóa',
      onClick: () => { onDelete(item); onClose(); },
      color: 'red'
    },
  ];

  const getColorClass = (color: string, isMobile: boolean) => {
    const base = isMobile ? 'active:bg-' : 'hover:bg-';
    switch (color) {
      case 'blue':
        return `text-blue-600 dark:text-blue-400 ${base}blue-100 dark:${base}blue-900`;
      case 'purple':
        return `text-purple-600 dark:text-purple-400 ${base}purple-100 dark:${base}purple-900`;
      case 'red':
        return `text-red-600 ${base}red-100 dark:${base}red-900`;
      default:
        return isMobile 
          ? 'active:bg-gray-200 dark:active:bg-gray-600'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700';
    }
  };

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div className="lg:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={onClose}
        />
        
        {/* Bottom Sheet */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
          {/* Handle */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
            
            {/* Item info */}
            <div className="flex items-center gap-3">
              {getFileIcon(item)}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold truncate">{item.displayName || item.name}</p>
                <p className="text-xs text-gray-500">
                  {isFolder ? 'Thư mục' : formatFileSize(item.size)}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2 max-h-[70vh] overflow-y-auto">
            {menuItems.map((menuItem, index) => {
              if (menuItem.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="my-2 border-t border-gray-200 dark:border-gray-700" />
                );
              }

              return (
                <button
                  key={index}
                  className={`w-full px-6 py-4 text-base text-left flex items-center gap-3 transition-colors ${getColorClass(menuItem.color, true)}`}
                  onClick={menuItem.onClick}
                >
                  {menuItem.icon}
                  {menuItem.label}
                </button>
              );
            })}
          </div>

          {/* Safe area for iPhone */}
          <div className="h-8" />
        </div>
      </div>

      {/* Desktop: Popup */}
      <div className="hidden lg:block">
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 min-w-[220px] animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {getFileIcon(item)}
              <span className="text-sm font-semibold truncate max-w-[180px]">{item.displayName || item.name}</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((menuItem, index) => {
              if (menuItem.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="my-1 border-t border-gray-200 dark:border-gray-700" />
                );
              }

              return (
                <button
                  key={index}
                  className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors ${getColorClass(menuItem.color, false)}`}
                  onClick={menuItem.onClick}
                >
                  {menuItem.icon}
                  {menuItem.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
