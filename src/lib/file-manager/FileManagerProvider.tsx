/**
 * File Manager Package - Context Provider
 * Standalone, reusable across projects
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  FileManagerConfig,
  FileManagerState,
  FileManagerAction,
} from './types';
import { DEFAULT_CONFIG, DEFAULT_FEATURES, DEFAULT_UI } from './constants';

// Initial state
const initialState: FileManagerState = {
  files: [],
  items: [], // Alias for compatibility
  currentPath: '',
  breadcrumbs: [{ name: 'Home', path: '' }],
  folderTree: [],
  selectedItems: new Set(),
  lastSelectedIndex: null,
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  searchQuery: '',
  filterFileType: 'all',
  filterMinSize: '',
  filterMaxSize: '',
  filterDateFrom: '',
  filterDateTo: '',
  loading: false,
  treeLoading: false,
  treeRefreshKey: 0,
  showFolderTree: true,
  showAdvancedSearch: false,
  // Dialog state
  dialogs: {
    upload: false,
    newFolder: false,
    newFile: false,
    rename: null,
    move: null,
    copy: false,
    compress: false,
    extract: null,
    bulkRename: false,
    preview: null,
    codeEditor: null,
    imageEditor: null,
    share: null,
    versionHistory: null,
    permissions: null,
    properties: null,
    hash: null,
    auditLog: null,
    delete: false,
  },
  // Navigation history
  navigationHistory: [''],
  navigationIndex: 0,
  // Pagination
  currentPage: 1,
  totalItems: 0,
  itemsPerPage: 50,
  // Trash
  isTrashView: false,
  trashItems: [],
  favoriteFiles: new Set(),
  showFavoritesView: false,
  showSharedLinksView: false,
  recentFiles: [],
  showRecentView: false,
  backgroundTasks: [],
  uploadQueue: [],
  showTasksPanel: false,
  clipboard: null,
  clipboardItems: [],
  clipboardAction: null,
  storageUsed: 0,
  storageLimit: 0,
};

// Reducer
function fileManagerReducer(
  state: FileManagerState,
  action: FileManagerAction
): FileManagerState {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload, items: action.payload };
      
    case 'SET_CURRENT_PATH':
      return { ...state, currentPath: action.payload };
      
    case 'SET_BREADCRUMBS':
      return { ...state, breadcrumbs: action.payload };
      
    case 'SET_FOLDER_TREE':
      return { ...state, folderTree: action.payload };
      
    case 'SELECT_ITEM': {
      const newSelection = new Set(state.selectedItems);
      if (newSelection.has(action.payload)) {
        newSelection.delete(action.payload);
      } else {
        newSelection.add(action.payload);
      }
      return { ...state, selectedItems: newSelection };
    }
    
    case 'DESELECT_ITEM': {
      const newSelection = new Set(state.selectedItems);
      newSelection.delete(action.payload);
      return { ...state, selectedItems: newSelection };
    }
    
    case 'SELECT_MULTIPLE':
      return {
        ...state,
        selectedItems: new Set([...state.selectedItems, ...action.payload]),
      };
      
    case 'CLEAR_SELECTION':
      return { ...state, selectedItems: new Set(), lastSelectedIndex: null };
      
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
      
    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };
      
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
      
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_TREE_LOADING':
      return { ...state, treeLoading: action.payload };

    case 'BUMP_TREE_REFRESH':
      return { ...state, treeRefreshKey: state.treeRefreshKey + 1 };

    case 'TOGGLE_FOLDER_TREE':
      return { ...state, showFolderTree: !state.showFolderTree };
      
    case 'TOGGLE_ADVANCED_SEARCH':
      return { ...state, showAdvancedSearch: !state.showAdvancedSearch };
      
    // Dialog management
    case 'OPEN_DIALOG':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          [action.payload.dialog]: action.payload.data ?? true,
        },
      };
      
    case 'CLOSE_DIALOG':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          [action.payload]: action.payload === 'rename' || action.payload === 'move' || 
            action.payload === 'preview' || action.payload === 'codeEditor' || 
            action.payload === 'imageEditor' || action.payload === 'share' || 
            action.payload === 'versionHistory' || action.payload === 'permissions' ||
            action.payload === 'properties' || action.payload === 'hash' ||
            action.payload === 'auditLog' ? null : false,
        },
      };
      
    // Legacy dialog toggles (backward compat with Toolbar)
    case 'TOGGLE_UPLOAD_DIALOG':
      return { ...state, dialogs: { ...state.dialogs, upload: action.payload } };
    case 'TOGGLE_NEW_FOLDER_DIALOG':
      return { ...state, dialogs: { ...state.dialogs, newFolder: action.payload } };
    case 'TOGGLE_DELETE_DIALOG':
      return { ...state, dialogs: { ...state.dialogs, delete: action.payload } };
      
    // Navigation history
    case 'NAVIGATE_TO': {
      console.log('[FileManager REDUCER] NAVIGATE_TO:', action.payload, 'from:', state.currentPath);
      const newHistory = state.navigationHistory.slice(0, state.navigationIndex + 1);
      newHistory.push(action.payload);
      const newBreadcrumbs = [{ name: 'Home', path: '' }];
      if (action.payload) {
        const parts = action.payload.split('/');
        let currentBreadcrumbPath = '';
        for (const part of parts) {
          currentBreadcrumbPath = currentBreadcrumbPath ? `${currentBreadcrumbPath}/${part}` : part;
          newBreadcrumbs.push({ name: part, path: currentBreadcrumbPath });
        }
      }
      return {
        ...state,
        currentPath: action.payload,
        breadcrumbs: newBreadcrumbs,
        navigationHistory: newHistory,
        navigationIndex: newHistory.length - 1,
        selectedItems: new Set(),
        currentPage: 1,
      };
    }
    
    case 'NAVIGATE_BACK': {
      if (state.navigationIndex <= 0) return state;
      const newIndex = state.navigationIndex - 1;
      const newPath = state.navigationHistory[newIndex];
      const newBreadcrumbs = [{ name: 'Home', path: '' }];
      if (newPath) {
        const parts = newPath.split('/');
        let currentBreadcrumbPath = '';
        for (const part of parts) {
          currentBreadcrumbPath = currentBreadcrumbPath ? `${currentBreadcrumbPath}/${part}` : part;
          newBreadcrumbs.push({ name: part, path: currentBreadcrumbPath });
        }
      }
      return {
        ...state,
        currentPath: newPath,
        breadcrumbs: newBreadcrumbs,
        navigationIndex: newIndex,
        selectedItems: new Set(),
        currentPage: 1,
      };
    }
    
    case 'NAVIGATE_FORWARD': {
      if (state.navigationIndex >= state.navigationHistory.length - 1) return state;
      const newIndex = state.navigationIndex + 1;
      const newPath = state.navigationHistory[newIndex];
      const newBreadcrumbs = [{ name: 'Home', path: '' }];
      if (newPath) {
        const parts = newPath.split('/');
        let currentBreadcrumbPath = '';
        for (const part of parts) {
          currentBreadcrumbPath = currentBreadcrumbPath ? `${currentBreadcrumbPath}/${part}` : part;
          newBreadcrumbs.push({ name: part, path: currentBreadcrumbPath });
        }
      }
      return {
        ...state,
        currentPath: newPath,
        breadcrumbs: newBreadcrumbs,
        navigationIndex: newIndex,
        selectedItems: new Set(),
        currentPage: 1,
      };
    }
    
    // Pagination
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
      
    case 'SET_TOTAL_ITEMS':
      return { ...state, totalItems: action.payload };
    
    // Storage
    case 'SET_STORAGE_INFO':
      return { ...state, storageUsed: action.payload.used, storageLimit: action.payload.limit };
    
    // Trash items
    case 'SET_TRASH_ITEMS':
      return { ...state, trashItems: action.payload };
    
    // Filters
    case 'SET_FILTERS':
      return {
        ...state,
        ...(action.payload.filterFileType !== undefined && { filterFileType: action.payload.filterFileType }),
        ...(action.payload.filterMinSize !== undefined && { filterMinSize: action.payload.filterMinSize }),
        ...(action.payload.filterMaxSize !== undefined && { filterMaxSize: action.payload.filterMaxSize }),
        ...(action.payload.filterDateFrom !== undefined && { filterDateFrom: action.payload.filterDateFrom }),
        ...(action.payload.filterDateTo !== undefined && { filterDateTo: action.payload.filterDateTo }),
      };
      
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filterFileType: 'all',
        filterMinSize: '',
        filterMaxSize: '',
        filterDateFrom: '',
        filterDateTo: '',
        showAdvancedSearch: false,
      };
      
    case 'ADD_TASK':
      return {
        ...state,
        backgroundTasks: [...state.backgroundTasks, action.payload],
      };
      
    case 'UPDATE_TASK': {
      const tasks = state.backgroundTasks.map((task) =>
        task.id === action.payload.id
          ? { ...task, ...action.payload.updates }
          : task
      );
      return { ...state, backgroundTasks: tasks };
    }
    
    case 'REMOVE_TASK':
      return {
        ...state,
        backgroundTasks: state.backgroundTasks.filter(
          (task) => task.id !== action.payload
        ),
      };
      
    case 'SET_CLIPBOARD':
      return {
        ...state,
        clipboard: action.payload,
        clipboardItems: [],
        clipboardAction: action.payload.action,
      };
      
    case 'CLEAR_CLIPBOARD':
      return { ...state, clipboard: null, clipboardItems: [], clipboardAction: null };
      
    case 'TOGGLE_FAVORITE': {
      const newFavorites = new Set(state.favoriteFiles);
      if (newFavorites.has(action.payload)) {
        newFavorites.delete(action.payload);
      } else {
        newFavorites.add(action.payload);
      }
      return { ...state, favoriteFiles: newFavorites };
    }
    
    case 'SET_TRASH_VIEW':
      return { ...state, isTrashView: action.payload, showFavoritesView: false, showSharedLinksView: false };

    case 'SET_FAVORITES_VIEW':
      return { ...state, showFavoritesView: action.payload, isTrashView: false, showSharedLinksView: false };

    case 'SET_SHARED_LINKS_VIEW':
      return { ...state, showSharedLinksView: action.payload, isTrashView: false, showFavoritesView: false };
      
    default:
      return state;
  }
}

// Context
interface FileManagerContextValue {
  state: FileManagerState;
  dispatch: React.Dispatch<FileManagerAction>;
  config: Required<FileManagerConfig>;
  supabase: SupabaseClient;
}

const FileManagerContext = createContext<FileManagerContextValue | null>(null);

// Provider Props
interface FileManagerProviderProps {
  config: FileManagerConfig;
  children: React.ReactNode;
}

// Provider Component
export function FileManagerProvider({
  config,
  children,
}: FileManagerProviderProps) {
  const [state, dispatch] = useReducer(fileManagerReducer, initialState);

  // Create or use existing Supabase client
  const supabase = React.useMemo(() => {
    if (config.supabaseClient) {
      return config.supabaseClient;
    }
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error(
        'FileManager: Phải cung cấp supabaseClient HOẶC (supabaseUrl + supabaseAnonKey)'
      );
    }
    
    return createClient(config.supabaseUrl, config.supabaseAnonKey);
  }, [config.supabaseClient, config.supabaseUrl, config.supabaseAnonKey]);

  // Merge config with defaults
  const fullConfig: Required<FileManagerConfig> = React.useMemo(
    () => ({
      supabaseClient: supabase,
      supabaseUrl: config.supabaseUrl || '',
      supabaseAnonKey: config.supabaseAnonKey || '',
      bucketName: config.bucketName,
      maxFileSize: config.maxFileSize || DEFAULT_CONFIG.maxFileSize,
      allowedFileTypes: config.allowedFileTypes || [],
      storageLimit: config.storageLimit || 1024 * 1024 * 1024, // 1GB default
      features: { ...DEFAULT_FEATURES, ...config.features },
      ui: { ...DEFAULT_UI, ...config.ui },
      callbacks: config.callbacks || {},
      cache: {
        enabled: config.cache?.enabled ?? true,
        ttl: config.cache?.ttl || DEFAULT_CONFIG.cacheTTL,
        storage: config.cache?.storage || 'localStorage',
      },
    }),
    [config, supabase]
  );

  // Load favorites from cache on mount
  useEffect(() => {
    if (!fullConfig.cache.enabled) return;
    
    try {
      const storage = fullConfig.cache.storage === 'localStorage' 
        ? localStorage 
        : sessionStorage;
      
      const cached = storage.getItem(`fm-favorites-${fullConfig.bucketName}`);
      if (cached) {
        const favorites = JSON.parse(cached) as string[];
        dispatch({
          type: 'SELECT_MULTIPLE',
          payload: [],
        });
        // Update favorites separately if needed
      }
    } catch (error) {
      console.warn('Failed to load favorites from cache:', error);
    }
  }, [fullConfig.bucketName, fullConfig.cache]);

  const value: FileManagerContextValue = {
    state,
    dispatch,
    config: fullConfig,
    supabase,
  };

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  );
}

// Hook to use FileManager context
export function useFileManagerContext() {
  const context = useContext(FileManagerContext);
  
  if (!context) {
    throw new Error(
      'useFileManagerContext phải được sử dụng trong FileManagerProvider'
    );
  }
  
  return context;
}

// Export context for advanced usage
export { FileManagerContext };
