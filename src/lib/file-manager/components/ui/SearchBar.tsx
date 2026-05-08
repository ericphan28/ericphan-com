'use client';

import { useState, useEffect } from 'react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';

/**
 * Search bar component với Advanced Search Panel
 *
 * Features:
 * - Real-time search (debounced)
 * - Clear search
 * - Advanced search toggle
 * - Lọc theo loại file, kích thước, ngày tháng
 */
export function SearchBar() {
  const { state, dispatch, config } = useFileManagerContext();
  const [localQuery, setLocalQuery] = useState(state.searchQuery);

  // Sync với global state
  useEffect(() => {
    setLocalQuery(state.searchQuery);
  }, [state.searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== state.searchQuery) {
        dispatch({ type: 'SET_SEARCH_QUERY', payload: localQuery });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, state.searchQuery, dispatch]);

  const handleClear = () => {
    setLocalQuery('');
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
  };

  const toggleAdvancedSearch = () => {
    dispatch({ type: 'TOGGLE_ADVANCED_SEARCH' });
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { [key]: value },
    });
  };

  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  // Kiểm tra có filter nào đang hoạt động (loại trừ giá trị mặc định)
  const hasActiveFilters =
    (state.filterFileType && state.filterFileType !== 'all') ||
    state.filterMinSize ||
    state.filterMaxSize ||
    state.filterDateFrom ||
    state.filterDateTo;

  return (
    <div>
      {/* Thanh tìm kiếm chính */}
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm files..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="pl-9 pr-9 h-9"
          />
          {localQuery && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {config.features.search && (
          <Button
            size="sm"
            variant={state.showAdvancedSearch ? 'default' : 'outline'}
            onClick={toggleAdvancedSearch}
            className="h-9 relative"
          >
            <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nâng cao</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        )}
      </div>

      {/* Panel lọc nâng cao */}
      {state.showAdvancedSearch && (
        <div className="px-3 py-3 border-b bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Loại file */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loại file</Label>
              <Select
                value={state.filterFileType || 'all'}
                onValueChange={(v) => handleFilterChange('filterFileType', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="image">🖼️ Hình ảnh</SelectItem>
                  <SelectItem value="video">🎬 Video</SelectItem>
                  <SelectItem value="audio">🎵 Audio</SelectItem>
                  <SelectItem value="document">📄 Tài liệu</SelectItem>
                  <SelectItem value="spreadsheet">📊 Bảng tính</SelectItem>
                  <SelectItem value="archive">📦 Nén</SelectItem>
                  <SelectItem value="code">💻 Code</SelectItem>
                  <SelectItem value="folder">📁 Thư mục</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kích thước tối thiểu */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tối thiểu (KB)</Label>
              <Input
                type="number"
                placeholder="0"
                value={state.filterMinSize}
                onChange={(e) => handleFilterChange('filterMinSize', e.target.value)}
                className="h-8 text-xs"
                min={0}
              />
            </div>

            {/* Kích thước tối đa */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tối đa (KB)</Label>
              <Input
                type="number"
                placeholder="Không giới hạn"
                value={state.filterMaxSize}
                onChange={(e) => handleFilterChange('filterMaxSize', e.target.value)}
                className="h-8 text-xs"
                min={0}
              />
            </div>

            {/* Ngày từ */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Từ ngày</Label>
              <Input
                type="date"
                value={state.filterDateFrom}
                onChange={(e) => handleFilterChange('filterDateFrom', e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Ngày đến */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Đến ngày</Label>
              <Input
                type="date"
                value={state.filterDateTo}
                onChange={(e) => handleFilterChange('filterDateTo', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Nút xóa bộ lọc */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearFilters}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
