'use client';

import { useState } from 'react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { useLongPress } from '../../hooks/useLongPress';
import type { FileItem } from '../../types';
import { Checkbox } from '@/components/ui/checkbox';
import { FileIcon } from '../ui/FileIcon';

interface FileListItemProps {
  file: FileItem;
  onContextMenu?: (e: React.MouseEvent, item: FileItem) => void;
}

/**
 * File list item component for list view
 * 
 * Features:
 * - Compact row layout
 * - File icon, name, size, date
 * - Selection checkbox
 * - Quick actions
 * - Right-click context menu
 */
export function FileListItem({ file, onContextMenu }: FileListItemProps) {
  const { state, dispatch } = useFileManagerContext();
  const [isHovered, setIsHovered] = useState(false);

  const isSelected = state.selectedItems.has(file.name);
  const isFolder = !file.metadata;
  // Text/code files — double-click mở editor
  const isTextFile = !isFolder && /\.(txt|js|jsx|ts|tsx|json|html|css|scss|md|py|java|php|sql|xml|yaml|yml|sh|env|csv|log|ini|cfg|conf|toml)$/i.test(file.name);

  const handleSelect = (checked: boolean) => {
    if (checked) {
      dispatch({ type: 'SELECT_ITEM', payload: file.name });
    } else {
      dispatch({ type: 'DESELECT_ITEM', payload: file.name });
    }
  };

  const longPress = useLongPress<HTMLDivElement>((pos) => {
    onContextMenu?.(
      {
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: pos.clientX,
        clientY: pos.clientY,
      } as unknown as React.MouseEvent,
      file
    );
  });

  const handleClick = () => {
    if (isFolder) {
      dispatch({ type: 'NAVIGATE_TO', payload: file.path || file.name });
    } else {
      // Tạo đường dẫn đầy đủ cho file
      const filePath = file.path || `${state.currentPath}/${file.name}`.replace(/^\//, '');
      const fileWithPath = { ...file, path: filePath };

      if (isTextFile) {
        // Text/code files → mở code editor
        dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'codeEditor', data: fileWithPath } });
      } else {
        // Ảnh, PDF, etc. → mở preview
        dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'preview', data: fileWithPath } });
      }
    }
  };

  const getFileIcon = () => {
    return <FileIcon file={file} size="sm" showThumbnail={true} />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors select-none [-webkit-touch-callout:none] ${
        isSelected ? 'bg-accent' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu?.(e, file)}
      {...longPress}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleSelect}
        onClick={(e) => e.stopPropagation()}
        className={`transition-opacity max-md:opacity-100 ${isHovered || isSelected ? 'md:opacity-100' : 'md:opacity-0'}`}
      />

      {/* Icon */}
      <div className="flex-shrink-0">
        {getFileIcon()}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={file.displayName || file.name}>{file.displayName || file.name}</p>
      </div>

      {/* Size */}
      <div className="hidden sm:block w-20 text-sm text-muted-foreground">
        {formatSize(file.metadata?.size)}
      </div>

      {/* Date */}
      <div className="hidden md:block w-28 text-sm text-muted-foreground">
        {formatDate(file.updated_at)}
      </div>
    </div>
  );
}
