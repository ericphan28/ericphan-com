'use client';

import { useFileManagerContext } from '../../FileManagerProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SortBy, SortOrder } from '../../types';

/**
 * Sort controls component
 * 
 * Features:
 * - Sort by: name, size, date, type
 * - Sort order: asc, desc
 * - Toggle order button
 */
export function SortControls() {
  const { state, dispatch } = useFileManagerContext();

  const handleSortByChange = (sortBy: SortBy) => {
    dispatch({
      type: 'SET_SORT',
      payload: { sortBy, sortOrder: state.sortOrder },
    });
  };

  const toggleSortOrder = () => {
    const newOrder: SortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch({
      type: 'SET_SORT',
      payload: { sortBy: state.sortBy, sortOrder: newOrder },
    });
  };

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'name', label: 'Tên' },
    { value: 'date', label: 'Ngày' },
    { value: 'size', label: 'Kích thước' },
    { value: 'type', label: 'Loại' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Select value={state.sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="h-9 w-[140px]">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="outline"
        onClick={toggleSortOrder}
        className="h-9 px-2"
        title={state.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
      >
        {state.sortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
