'use client';

import { useFileManagerContext } from '../../FileManagerProvider';
import { FileCard } from '../cards/FileCard';
import { Loader2, FolderOpen } from 'lucide-react';
import { applyFilters } from '../../utils/filterFiles';
import type { FileItem } from '../../types';

interface GridViewProps {
  onContextMenu?: (e: React.MouseEvent, item: FileItem) => void;
}

/**
 * Grid view component
 * 
 * Features:
 * - Responsive grid layout
 * - File cards with thumbnails
 * - Loading state
 * - Empty state
 * - Auto columns based on screen size
 * - Context menu support (right-click)
 */
export function GridView({ onContextMenu }: GridViewProps) {
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

  // Sort files
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
    <div className="p-2 sm:p-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-1.5 sm:gap-2">
        {sortedFiles.map((file) => (
          <FileCard key={file.id} file={file} onContextMenu={onContextMenu} />
        ))}
      </div>
    </div>
  );
}
