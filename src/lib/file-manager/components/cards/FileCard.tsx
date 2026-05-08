'use client';

import { useState, useRef, useCallback } from 'react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { useFavorites } from '../../hooks/useFavorites';
import { useSharedLinks } from '../../hooks/useSharedLinks';
import { useLongPress } from '../../hooks/useLongPress';
import { isImageFile } from '../ui/FileIcon';
import type { FileItem } from '../../types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Share2,
  Star,
} from 'lucide-react';
import { FileIcon } from '../ui/FileIcon';

interface FileCardProps {
  file: FileItem;
  onContextMenu?: (e: React.MouseEvent, item: FileItem) => void;
}

/**
 * File card component for grid view
 * 
 * Features:
 * - Thumbnail preview
 * - File name and size
 * - Selection checkbox
 * - Quick actions menu
 * - Double click to open
 * - Right-click context menu
 */
export function FileCard({ file, onContextMenu }: FileCardProps) {
  const { state, dispatch, config } = useFileManagerContext();
  const { isFavorite } = useFavorites();
  const { isShared } = useSharedLinks();
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isSelected = state.selectedItems.has(file.name);
  const isFolder = !file.metadata;
  const fileIsFavorite = isFavorite(file.path);
  const fileIsShared = isShared(file.path);
  const isImage = !isFolder && isImageFile(file.name);
  // Text/code files — double-click mở editor
  const isTextFile = !isFolder && /\.(txt|js|jsx|ts|tsx|json|html|css|scss|md|py|java|php|sql|xml|yaml|yml|sh|env|csv|log|ini|cfg|conf|toml)$/i.test(file.name);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleSelect = (checked: boolean) => {
    if (checked) {
      dispatch({
        type: 'SELECT_ITEM',
        payload: file.name,
      });
    } else {
      dispatch({
        type: 'DESELECT_ITEM',
        payload: file.name,
      });
    }
  };

  // Long-press trên mobile = right-click trên desktop
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

  const handleDoubleClick = () => {
    if (isFolder) {
      // Navigate vào folder
      dispatch({ type: 'NAVIGATE_TO', payload: file.path || file.name });
    } else if (isTextFile) {
      // Text/code file → mở Code Editor
      const fileWithPath = {
        ...file,
        path: file.path || (state.currentPath ? `${state.currentPath}/${file.name}` : file.name),
      };
      dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'codeEditor', data: fileWithPath } });
    } else {
      // Ảnh, PDF, v.v. → mở Preview
      const fileWithPath = {
        ...file,
        path: file.path || (state.currentPath ? `${state.currentPath}/${file.name}` : file.name),
      };
      dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'preview', data: fileWithPath } });
    }
  };

  // Single-tap mở file trên touch device (desktop dùng double-click)
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[role="checkbox"]') || target.closest('button')) {
      return; // tap vào checkbox / button — không mở file
    }
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      handleDoubleClick();
    }
  };

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border bg-card hover:shadow-lg hover:border-primary/30 select-none [-webkit-touch-callout:none] ${
        isSelected ? 'ring-2 ring-primary shadow-md bg-primary/5' : 'hover:bg-accent/30'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => onContextMenu?.(e, file)}
      {...longPress}
    >
      {/* Overlay controls - hover trên desktop, luôn hiện trên mobile */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-150 max-md:opacity-100 ${
        isHovered || isSelected ? 'md:opacity-100' : 'md:opacity-0'
      }`}>
        {/* Selection checkbox — touch target đủ to (size-5 thay vì mặc định) */}
        <div className="absolute top-1.5 left-1.5">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelect}
            className="bg-background/90 backdrop-blur-sm shadow-md size-5"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Favorite Star */}
        {fileIsFavorite && (
          <div className="absolute top-2 left-9">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-md" />
          </div>
        )}

        {/* Shared indicator */}
        {fileIsShared && (
          <div className={`absolute top-2 ${fileIsFavorite ? 'left-16' : 'left-9'}`}>
            <Share2 className="h-4 w-4 text-blue-500 drop-shadow-md" />
          </div>
        )}
      </div>

      {/* Favorite indicator - luôn hiện khi ko hover */}
      {fileIsFavorite && !isHovered && !isSelected && (
        <div className="absolute top-2 left-2 z-10">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-md" />
        </div>
      )}

      {/* Shared indicator - luôn hiện khi ko hover */}
      {fileIsShared && !isHovered && !isSelected && (
        <div className={`absolute top-2 z-10 ${fileIsFavorite ? 'left-8' : 'left-2'}`}>
          <Share2 className="h-3.5 w-3.5 text-blue-500 drop-shadow-md" />
        </div>
      )}

      {/* Thumbnail / Icon area */}
      <div className={`relative flex items-center justify-center overflow-hidden ${
        isImage ? 'aspect-[16/10] bg-muted/30' : 'aspect-[4/3] bg-muted/20'
      }`}>
        {isImage ? (
          <FileIcon file={file} size="xl" showThumbnail={true} />
        ) : (
          <div className="flex items-center justify-center p-3">
            <FileIcon file={file} size="lg" showThumbnail={false} showExtBadge={true} />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium truncate leading-tight" title={file.displayName || file.name}>
          {file.displayName || file.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {isFolder ? 'Thư mục' : formatSize(file.metadata?.size)}
        </p>
      </div>
    </div>
  );
}
