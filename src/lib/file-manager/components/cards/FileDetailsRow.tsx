'use client';

import { useFileManagerContext } from '../../FileManagerProvider';
import { useLongPress } from '../../hooks/useLongPress';
import type { FileItem } from '../../types';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileIcon, getFileTypeInfo } from '../ui/FileIcon';

interface FileDetailsRowProps {
  file: FileItem;
  onContextMenu?: (e: React.MouseEvent, item: FileItem) => void;
}

/**
 * File details row component for table view
 * 
 * Features:
 * - Table row with all file details
 * - Selection checkbox
 * - File icon and name
 * - Size, type, date columns
 * - Right-click context menu
 * - Actions dropdown
 */
export function FileDetailsRow({ file, onContextMenu }: FileDetailsRowProps) {
  const { state, dispatch } = useFileManagerContext();

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

  const longPress = useLongPress<HTMLTableRowElement>((pos) => {
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

  const renderIcon = () => {
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
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFileType = () => {
    if (isFolder) return 'Thư mục';
    const typeInfo = getFileTypeInfo(file.name);
    return typeInfo.label;
  };

  return (
    <TableRow
      className={`cursor-pointer select-none [-webkit-touch-callout:none] ${isSelected ? 'bg-accent' : ''}`}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu?.(e, file)}
      {...longPress}
    >
      {/* Checkbox */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelect}
        />
      </TableCell>

      {/* Name with icon */}
      <TableCell>
        <div className="flex items-center gap-2">
          {renderIcon()}
          <span className="font-medium truncate" title={file.displayName || file.name}>{file.displayName || file.name}</span>
        </div>
      </TableCell>

      {/* Size */}
      <TableCell className="text-muted-foreground">
        {formatSize(file.metadata?.size)}
      </TableCell>

      {/* Type */}
      <TableCell className="text-muted-foreground">
        {getFileType()}
      </TableCell>

      {/* Date */}
      <TableCell className="text-muted-foreground">
        {formatDate(file.updated_at)}
      </TableCell>
    </TableRow>
  );
}
