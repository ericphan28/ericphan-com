'use client';

import { useEffect, useState } from 'react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDisplayNames } from '../../services/displayNamesService';

/**
 * Breadcrumb navigation component
 *
 * Features:
 * - Show current path
 * - Click to navigate to parent folders
 * - Home button
 * - Responsive (collapse on mobile)
 * - Hiển thị display name (tiếng Việt) cho từng segment khi có
 */
export function Breadcrumb() {
  const { state, dispatch, supabase, config } = useFileManagerContext();
  const [displayMap, setDisplayMap] = useState<Map<string, string>>(new Map());

  const handleNavigate = (path: string) => {
    dispatch({ type: 'NAVIGATE_TO', payload: path });
  };

  // Fetch display names cho các segment trong breadcrumb
  useEffect(() => {
    const paths = state.breadcrumbs.slice(1).map((b) => b.path);
    if (paths.length === 0) {
      setDisplayMap(new Map());
      return;
    }
    let alive = true;
    getDisplayNames(supabase, config.bucketName, paths)
      .then((map) => {
        if (alive) setDisplayMap(map);
      })
      .catch(() => { /* bỏ qua */ });
    return () => {
      alive = false;
    };
  }, [state.breadcrumbs, supabase, config.bucketName]);

  return (
    <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
      {/* Home */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleNavigate('')}
        className="h-7 px-2"
      >
        <Home className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Home</span>
      </Button>

      {state.breadcrumbs.length > 1 && (
        <>
          {state.breadcrumbs.slice(1).map((crumb, index) => {
            const label = displayMap.get(crumb.path) || crumb.name;
            return (
              <div key={index} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleNavigate(crumb.path)}
                  className="h-7 px-2 max-w-[150px] truncate"
                  title={label}
                >
                  {label}
                </Button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
