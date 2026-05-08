'use client';

import { useFileManagerContext } from '../../FileManagerProvider';
import { FileListItem } from '../cards/FileListItem';
import { Loader2, FolderOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { applyFilters } from '../../utils/filterFiles';
import type { FileItem } from '../../types';

interface ListViewProps {
  onContextMenu?: (e: React.MouseEvent, item: FileItem) => void;
}

/**
 * List view component
 * 
 * Features:
 * - Compact list layout
 * - File list items
 * - Scrollable area
 * - Loading/empty states
 * - Context menu support
 */
export function ListView({ onContextMenu }: ListViewProps) {
  const { state } = useFileManagerContext();

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Lọc files (text search + advanced filters)
  const visibleFiles = applyFilters(state.files, state);

  const sortedFiles = [...visibleFiles].sort((a, b) => {
    const order = state.sortOrder === 'asc' ? 1 : -1;

    switch (state.sortBy) {
      case 'name':
        return order * a.name.localeCompare(b.name);
      case 'date':
        return order * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      case 'size':
        return order * ((a.metadata?.size || 0) - (b.metadata?.size || 0));
      case 'type':
        const typeA = a.metadata?.mimetype || '';
        const typeB = b.metadata?.mimetype || '';
        return order * typeA.localeCompare(typeB);
      default:
        return 0;
    }
  });

  const hasFiltersActive = state.searchQuery ||
    (state.filterFileType && state.filterFileType !== 'all') ||
    state.filterMinSize || state.filterMaxSize ||
    state.filterDateFrom || state.filterDateTo;

  if (sortedFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <FolderOpen className="h-16 w-16 text-muted-foreground/50 mx-auto" />
          <div>
            <h3 className="text-lg font-medium">
              {hasFiltersActive ? 'Không tìm thấy kết quả' : 'Thư mục trống'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFiltersActive
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Upload files để bắt đầu'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="p-4 space-y-1">
        {sortedFiles.map((file) => (
          <FileListItem key={file.id} file={file} onContextMenu={onContextMenu} />
        ))}
      </div>
    </ScrollArea>
  );
}
