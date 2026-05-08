'use client';

import { useFileManagerContext } from '../../FileManagerProvider';
import { FileDetailsRow } from '../cards/FileDetailsRow';
import { Loader2, FolderOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { applyFilters } from '../../utils/filterFiles';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { SortBy, FileItem } from '../../types';

interface DetailsViewProps {
  onContextMenu?: (e: React.MouseEvent, item: FileItem) => void;
}

/**
 * Details/Table view component
 * 
 * Features:
 * - Table layout with all details
 * - Sortable columns
 * - Scrollable
 * - Loading/empty states
 * - Context menu support
 */
export function DetailsView({ onContextMenu }: DetailsViewProps) {
  const { state, dispatch } = useFileManagerContext();

  const handleSort = (sortBy: SortBy) => {
    const newOrder = state.sortBy === sortBy && state.sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch({
      type: 'SET_SORT',
      payload: { sortBy, sortOrder: newOrder },
    });
  };

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (state.sortBy !== column) return null;
    return state.sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

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
      <div className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  Tên
                  <SortIcon column="name" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('size')}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  Kích thước
                  <SortIcon column="size" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('type')}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  Loại
                  <SortIcon column="type" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('date')}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  Ngày sửa
                  <SortIcon column="date" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFiles.map((file) => (
              <FileDetailsRow key={file.id} file={file} onContextMenu={onContextMenu} />
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
