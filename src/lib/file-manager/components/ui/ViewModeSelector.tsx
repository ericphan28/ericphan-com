'use client';

import { useFileManagerContext } from '../../FileManagerProvider';
import { Button } from '@/components/ui/button';
import { Grid3x3, List, TableProperties } from 'lucide-react';
import type { ViewMode } from '../../types';

/**
 * View mode selector component
 * 
 * Features:
 * - Grid view
 * - List view
 * - Details/Table view
 * - Active state indicator
 */
export function ViewModeSelector() {
  const { state, dispatch } = useFileManagerContext();

  const setViewMode = (mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const modes: { value: ViewMode; icon: any; label: string }[] = [
    { value: 'grid', icon: Grid3x3, label: 'Grid' },
    { value: 'list', icon: List, label: 'List' },
    { value: 'details', icon: TableProperties, label: 'Details' },
  ];

  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = state.viewMode === mode.value;

        return (
          <Button
            key={mode.value}
            size="sm"
            variant={isActive ? 'default' : 'ghost'}
            onClick={() => setViewMode(mode.value)}
            className="h-8 sm:h-7 px-2"
            title={mode.label}
          >
            <Icon className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">{mode.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
