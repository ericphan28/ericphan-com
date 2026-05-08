'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Search, Loader2, ChevronsDownUp, ChevronsUpDown, Minus } from 'lucide-react';
import type { FolderNode } from '../../types';
import { isPlaceholderFile } from '../../constants';
import { getDisplayNames } from '../../services/displayNamesService';

/**
 * FolderTreeSidebar - Cây thư mục sidebar
 *
 * ✅ Load root folders on mount
 * ✅ Lazy-load children khi expand folder
 * ✅ Recursive tree structure
 * ✅ Search/filter folders
 * ✅ Active folder highlight
 * ✅ Navigate on click
 * ✅ Expand All / Collapse All
 * ✅ Tree guide lines + leaf node indicator
 */

// Memoized tree node component
const TreeNode = memo(function TreeNode({
  node,
  level,
  isLast,
  currentPath,
  expandedPaths,
  loadedPaths,
  loadingPaths,
  folderCounts,
  onToggle,
  onClick,
}: {
  node: FolderNode;
  level: number;
  isLast: boolean;
  currentPath: string;
  expandedPaths: Set<string>;
  loadedPaths: Set<string>;
  loadingPaths: Set<string>;
  folderCounts: Map<string, number>;
  onToggle: (path: string) => void;
  onClick: (path: string) => void;
}) {
  const isExpanded = expandedPaths.has(node.path);
  const isActive = currentPath === node.path;
  const isLoading = loadingPaths.has(node.path);
  const hasChildren = node.children.length > 0;
  const isLoaded = loadedPaths.has(node.path);
  // Leaf = đã load xong nhưng không có children
  const isLeaf = isLoaded && !hasChildren;

  return (
    <div className="relative">
      {/* Đường kẻ dọc nối với parent (tree guide line) */}
      {level > 0 && (
        <div
          className="absolute border-l border-muted-foreground/20"
          style={{
            left: `${(level - 1) * 16 + 16}px`,
            top: 0,
            height: isLast ? '16px' : '100%',
          }}
        />
      )}

      {/* Đường kẻ ngang nối vào node */}
      {level > 0 && (
        <div
          className="absolute border-t border-muted-foreground/20"
          style={{
            left: `${(level - 1) * 16 + 16}px`,
            top: '16px',
            width: '10px',
          }}
        />
      )}

      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start h-8 px-2 font-normal text-sm relative z-[1]"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onClick(node.path)}
      >
        {/* Expand/collapse icon — chỉ hiện cho folder có/có thể có children */}
        <span
          className="mr-1 flex-shrink-0 w-4 h-4 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            if (!isLeaf) onToggle(node.path);
          }}
          style={{ cursor: isLeaf ? 'default' : 'pointer' }}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : isLeaf ? (
            // Leaf node — chấm nhỏ thay vì mũi tên
            <Minus className="h-3 w-3 text-muted-foreground/40" />
          ) : isExpanded ? (
            <ChevronDown className="h-3 w-3 text-foreground/70" />
          ) : (
            <ChevronRight className="h-3 w-3 text-foreground/70" />
          )}
        </span>

        {/* Folder icon — màu khác nhau theo trạng thái */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="mr-2 h-4 w-4 text-amber-500 flex-shrink-0" />
        ) : isLeaf ? (
          <Folder className="mr-2 h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
        ) : (
          <Folder className="mr-2 h-4 w-4 text-blue-500 flex-shrink-0" />
        )}

        <span className="truncate" title={node.displayName || node.name}>{node.displayName || node.name}</span>

        {/* Số lượng items — chỉ hiện khi đã load */}
        {folderCounts.has(node.path) && (
          <span className="ml-auto flex-shrink-0 text-[10px] leading-none font-medium tabular-nums text-muted-foreground/70 bg-muted/60 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {folderCounts.get(node.path)}
          </span>
        )}
      </Button>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              isLast={idx === node.children.length - 1}
              currentPath={currentPath}
              expandedPaths={expandedPaths}
              loadedPaths={loadedPaths}
              loadingPaths={loadingPaths}
              folderCounts={folderCounts}
              onToggle={onToggle}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export function FolderTreeSidebar() {
  const { state, dispatch, config, supabase } = useFileManagerContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loadedPaths, setLoadedPaths] = useState<Set<string>>(new Set());
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<FolderNode[]>([]);
  const [folderCounts, setFolderCounts] = useState<Map<string, number>>(new Map());

  // Load folders tại 1 path + đếm tổng items
  const loadFoldersAt = useCallback(async (path: string): Promise<FolderNode[]> => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .list(path, { limit: 1000 });

      if (error) throw error;

      const items = data || [];
      // Đếm tổng items thực (bỏ placeholder .emptyFolderPlaceholder và .trash)
      const validItems = items.filter(item => !isPlaceholderFile(item.name) && item.name !== '.trash');
      // Lưu count cho folder này
      if (path !== '') {
        setFolderCounts(prev => {
          const next = new Map(prev);
          next.set(path, validItems.length);
          return next;
        });
      }

      const folders = items
        .filter(item => item.id === null && item.name !== '.trash') // Folders don't have id; bỏ qua .trash
        .map(folder => ({
          name: folder.name,
          path: path ? `${path}/${folder.name}` : folder.name,
          children: [] as FolderNode[],
          isExpanded: false,
          level: 0,
        }));

      // Batch fetch display names cho các folder vừa load
      if (folders.length > 0) {
        try {
          const map = await getDisplayNames(
            supabase,
            config.bucketName,
            folders.map((f) => f.path)
          );
          for (const f of folders) {
            const dn = map.get(f.path);
            if (dn) (f as FolderNode).displayName = dn;
          }
        } catch (e) {
          console.warn('[FolderTree] không tải được display names', e);
        }
      }

      return folders;
    } catch (error) {
      console.error(`Lỗi load folders tại ${path}:`, error);
      return [];
    }
  }, [supabase, config.bucketName]);

  // Load root folders on mount + preload counts cho root folders
  useEffect(() => {
    const loadRoot = async () => {
      dispatch({ type: 'SET_TREE_LOADING', payload: true });
      const rootFolders = await loadFoldersAt('');
      setTreeData(rootFolders);
      dispatch({ type: 'SET_FOLDER_TREE', payload: rootFolders });
      dispatch({ type: 'SET_TREE_LOADING', payload: false });

      // Preload counts cho root folders (background, không block UI)
      for (const folder of rootFolders) {
        supabase.storage
          .from(config.bucketName)
          .list(folder.path, { limit: 1000 })
          .then(({ data }) => {
            if (data) {
              const count = data.filter(
                item => !isPlaceholderFile(item.name) && item.name !== '.trash'
              ).length;
              setFolderCounts(prev => {
                const next = new Map(prev);
                next.set(folder.path, count);
                return next;
              });
            }
          })
          .catch(() => { /* bỏ qua lỗi preload */ });
      }
    };
    loadRoot();
  }, [loadFoldersAt, dispatch, supabase, config.bucketName]);

  // React tới treeRefreshKey: khi mutator (tạo/đổi/xoá folder) bump key, reload
  // root + tất cả các path đang expanded để tree phản ánh thay đổi ngay lập tức.
  const treeRefreshKey = state.treeRefreshKey;
  useEffect(() => {
    if (treeRefreshKey === 0) return; // initial render đã có loadRoot ở effect khác
    let alive = true;
    (async () => {
      const root = await loadFoldersAt('');
      if (!alive) return;
      // Reload children cho mỗi expanded path (theo độ sâu tăng dần để parent
      // có sẵn trước khi gắn children).
      const sortedExpanded = Array.from(expandedPaths).sort(
        (a, b) => a.split('/').length - b.split('/').length
      );
      let nextTree = root;
      for (const exp of sortedExpanded) {
        try {
          const children = await loadFoldersAt(exp);
          if (!alive) return;
          nextTree = updateNodeChildren(nextTree, exp, children);
        } catch { /* bỏ qua từng path lỗi */ }
      }
      if (alive) {
        setTreeData(nextTree);
        dispatch({ type: 'SET_FOLDER_TREE', payload: nextTree });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeRefreshKey]);

  // Hàm update node con trong cây (đệ quy)
  const updateNodeChildren = useCallback((
    nodes: FolderNode[],
    targetPath: string,
    children: FolderNode[]
  ): FolderNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, children };
      }
      if (node.children.length > 0) {
        return { ...node, children: updateNodeChildren(node.children, targetPath, children) };
      }
      return node;
    });
  }, []);

  // Toggle expand/collapse
  const handleToggle = useCallback(async (path: string) => {
    if (expandedPaths.has(path)) {
      // Collapse
      const newExpanded = new Set(expandedPaths);
      newExpanded.delete(path);
      setExpandedPaths(newExpanded);
    } else {
      // Expand: lazy load children
      const newExpanded = new Set(expandedPaths);
      newExpanded.add(path);
      setExpandedPaths(newExpanded);

      // Load children nếu chưa có
      const findNode = (nodes: FolderNode[], p: string): FolderNode | null => {
        for (const n of nodes) {
          if (n.path === p) return n;
          const found = findNode(n.children, p);
          if (found) return found;
        }
        return null;
      };

      const node = findNode(treeData, path);
      if (node && node.children.length === 0 && !loadedPaths.has(path)) {
        // Chưa load children → load từ Supabase
        setLoadingPaths(prev => new Set([...prev, path]));
        const children = await loadFoldersAt(path);
        setTreeData(prev => updateNodeChildren(prev, path, children));
        setLoadedPaths(prev => new Set([...prev, path]));
        setLoadingPaths(prev => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }
    }
  }, [expandedPaths, treeData, loadedPaths, loadFoldersAt, updateNodeChildren]);

  // Navigate to folder. Auto-đóng drawer trên mobile để show file list.
  const handleClick = useCallback((path: string) => {
    dispatch({ type: 'NAVIGATE_TO', payload: path });
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      dispatch({ type: 'TOGGLE_FOLDER_TREE' });
    }
  }, [dispatch]);

  // Filter folders by search (match cả storage name + display name có dấu)
  const filterFolders = useCallback((nodes: FolderNode[], query: string): FolderNode[] => {
    if (!query) return nodes;
    const lower = query.toLowerCase();
    return nodes.reduce<FolderNode[]>((acc, node) => {
      const childMatch = filterFolders(node.children, query);
      const matchesSelf =
        node.name.toLowerCase().includes(lower) ||
        (node.displayName?.toLowerCase().includes(lower) ?? false);
      if (matchesSelf || childMatch.length > 0) {
        acc.push({ ...node, children: childMatch });
      }
      return acc;
    }, []);
  }, []);

  // Thu thập tất cả paths trong cây (đệ quy)
  const collectAllPaths = useCallback((nodes: FolderNode[]): string[] => {
    const paths: string[] = [];
    const walk = (list: FolderNode[]) => {
      for (const n of list) {
        paths.push(n.path);
        if (n.children.length > 0) walk(n.children);
      }
    };
    walk(nodes);
    return paths;
  }, []);

  // Đệ quy load tất cả children sâu xuống từ Supabase
  const loadAllChildrenRecursive = useCallback(async (
    nodes: FolderNode[]
  ): Promise<FolderNode[]> => {
    return Promise.all(
      nodes.map(async (node) => {
        // Load children nếu chưa có
        let children = node.children;
        if (children.length === 0) {
          children = await loadFoldersAt(node.path);
        }
        // Đệ quy load tiếp children sâu hơn
        if (children.length > 0) {
          children = await loadAllChildrenRecursive(children);
        }
        return { ...node, children };
      })
    );
  }, [loadFoldersAt]);

  // Mở tất cả folders (load toàn bộ tree từ Supabase)
  const [isExpandingAll, setIsExpandingAll] = useState(false);

  const handleExpandAll = useCallback(async () => {
    setIsExpandingAll(true);
    try {
      // Đệ quy load toàn bộ tree
      const fullyLoadedTree = await loadAllChildrenRecursive(treeData);
      setTreeData(fullyLoadedTree);
      // Expand tất cả paths + mark tất cả là loaded
      const allPaths = collectAllPaths(fullyLoadedTree);
      setExpandedPaths(new Set(allPaths));
      setLoadedPaths(new Set(allPaths));
    } catch (error) {
      console.error('Lỗi expand all:', error);
    } finally {
      setIsExpandingAll(false);
    }
  }, [treeData, loadAllChildrenRecursive, collectAllPaths]);

  // Thu gọn tất cả
  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const displayedFolders = searchQuery ? filterFolders(treeData, searchQuery) : treeData;

  if (!config.features.folderTree || !state.showFolderTree) {
    return null;
  }

  return (
    <>
      {/* Backdrop chỉ hiện trên mobile khi sidebar mở */}
      <div
        className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        onClick={() => dispatch({ type: 'TOGGLE_FOLDER_TREE' })}
      />
    <div className="
      md:relative md:flex md:flex-shrink-0
      fixed inset-y-0 left-0 z-40
      w-[85vw] max-w-[300px] md:w-56 lg:w-64
      border-r bg-background flex flex-col shadow-2xl md:shadow-none
    ">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm thư mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Expand All / Collapse All */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 flex-1 text-xs gap-1.5"
            onClick={handleExpandAll}
            disabled={isExpandingAll || treeData.length === 0}
            title="Mở tất cả thư mục"
          >
            {isExpandingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Mở tất cả</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 flex-1 text-xs gap-1.5"
            onClick={handleCollapseAll}
            disabled={expandedPaths.size === 0}
            title="Thu gọn tất cả thư mục"
          >
            <ChevronsDownUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Thu gọn</span>
          </Button>
        </div>
      </div>

      {/* Header thanh trên cùng (chỉ mobile) — Close button */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-semibold">Thư mục</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => dispatch({ type: 'TOGGLE_FOLDER_TREE' })}
          title="Đóng"
        >
          <Minus className="h-4 w-4 rotate-90" />
        </Button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* Root folder */}
          <Button
            variant={state.currentPath === '' ? 'secondary' : 'ghost'}
            className="w-full justify-start h-8 px-2 font-normal text-sm"
            onClick={() => handleClick('')}
          >
            <Folder className="mr-2 h-4 w-4 text-blue-500" />
            <span>Root</span>
          </Button>

          {/* Tree nodes */}
          {state.treeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayedFolders.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchQuery ? 'Không tìm thấy' : 'Không có thư mục'}
            </div>
          ) : (
            displayedFolders.map((folder, idx) => (
              <TreeNode
                key={folder.path}
                node={folder}
                level={0}
                isLast={idx === displayedFolders.length - 1}
                currentPath={state.currentPath}
                expandedPaths={expandedPaths}
                loadedPaths={loadedPaths}
                loadingPaths={loadingPaths}
                folderCounts={folderCounts}
                onToggle={handleToggle}
                onClick={handleClick}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
    </>
  );
}
