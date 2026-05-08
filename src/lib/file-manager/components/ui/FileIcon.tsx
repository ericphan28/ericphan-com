'use client';

import { useState, useEffect, useRef, memo } from 'react';
import {
  Folder,
  FolderOpen,
  Image as ImageIcon,
  FileText,
  FileArchive,
  File,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  FileType,
  Presentation,
  Database,
  Settings,
  Shield,
  Terminal,
  Globe,
  Palette,
  type LucideIcon,
} from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import type { FileItem } from '../../types';

/**
 * Hệ thống File Icon giống Windows Explorer
 *
 * ✅ Thumbnail thật cho ảnh (lazy-load + IntersectionObserver + cache)
 * ✅ Icons có màu theo loại file (giống Explorer)
 * ✅ Quick preview on hover
 * ✅ Skeleton loading state
 */

// ============= FILE TYPE ICON MAP =============

interface FileTypeInfo {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  label: string;
}

// Mapping extension → icon + color (giống Windows Explorer)
const EXTENSION_MAP: Record<string, FileTypeInfo> = {
  // Images
  jpg: { icon: ImageIcon, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'Ảnh JPEG' },
  jpeg: { icon: ImageIcon, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'Ảnh JPEG' },
  png: { icon: ImageIcon, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'Ảnh PNG' },
  gif: { icon: ImageIcon, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'Ảnh GIF' },
  webp: { icon: ImageIcon, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'Ảnh WebP' },
  svg: { icon: ImageIcon, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'SVG' },
  bmp: { icon: ImageIcon, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'Ảnh BMP' },
  ico: { icon: ImageIcon, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'Icon' },

  // Videos
  mp4: { icon: FileVideo, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950', label: 'Video MP4' },
  webm: { icon: FileVideo, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950', label: 'Video WebM' },
  avi: { icon: FileVideo, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950', label: 'Video AVI' },
  mov: { icon: FileVideo, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950', label: 'Video MOV' },
  mkv: { icon: FileVideo, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950', label: 'Video MKV' },

  // Audio
  mp3: { icon: FileAudio, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950', label: 'Audio MP3' },
  wav: { icon: FileAudio, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950', label: 'Audio WAV' },
  flac: { icon: FileAudio, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950', label: 'Audio FLAC' },
  aac: { icon: FileAudio, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950', label: 'Audio AAC' },
  ogg: { icon: FileAudio, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950', label: 'Audio OGG' },
  m4a: { icon: FileAudio, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950', label: 'Audio M4A' },

  // Documents - PDF
  pdf: { icon: FileText, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950', label: 'PDF' },

  // Documents - Word
  doc: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950', label: 'Word' },
  docx: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950', label: 'Word' },

  // Documents - Excel
  xls: { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950', label: 'Excel' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950', label: 'Excel' },
  csv: { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950', label: 'CSV' },

  // Documents - PowerPoint
  ppt: { icon: Presentation, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950', label: 'PowerPoint' },
  pptx: { icon: Presentation, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950', label: 'PowerPoint' },

  // Archives
  zip: { icon: FileArchive, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950', label: 'ZIP' },
  rar: { icon: FileArchive, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950', label: 'RAR' },
  '7z': { icon: FileArchive, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950', label: '7-Zip' },
  tar: { icon: FileArchive, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950', label: 'TAR' },
  gz: { icon: FileArchive, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950', label: 'GZip' },
  bz2: { icon: FileArchive, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950', label: 'BZip2' },

  // Code - Web
  html: { icon: Globe, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950', label: 'HTML' },
  css: { icon: Palette, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950', label: 'CSS' },
  scss: { icon: Palette, color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-950', label: 'SCSS' },
  js: { icon: FileCode, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-950', label: 'JavaScript' },
  jsx: { icon: FileCode, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-950', label: 'JSX' },
  ts: { icon: FileCode, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950', label: 'TypeScript' },
  tsx: { icon: FileCode, color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-950', label: 'TSX' },
  json: { icon: FileCode, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950', label: 'JSON' },
  xml: { icon: FileCode, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950', label: 'XML' },
  yaml: { icon: FileCode, color: 'text-red-400', bgColor: 'bg-red-50 dark:bg-red-950', label: 'YAML' },
  yml: { icon: FileCode, color: 'text-red-400', bgColor: 'bg-red-50 dark:bg-red-950', label: 'YAML' },

  // Code - Backend
  py: { icon: FileCode, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-950', label: 'Python' },
  java: { icon: FileCode, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950', label: 'Java' },
  php: { icon: FileCode, color: 'text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-950', label: 'PHP' },
  rb: { icon: FileCode, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950', label: 'Ruby' },
  go: { icon: FileCode, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-950', label: 'Go' },
  rs: { icon: FileCode, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950', label: 'Rust' },
  c: { icon: FileCode, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950', label: 'C' },
  cpp: { icon: FileCode, color: 'text-blue-700', bgColor: 'bg-blue-50 dark:bg-blue-950', label: 'C++' },
  sql: { icon: Database, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950', label: 'SQL' },

  // Shell / Config
  sh: { icon: Terminal, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950', label: 'Shell' },
  bash: { icon: Terminal, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950', label: 'Bash' },
  env: { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900', label: 'Env' },
  ini: { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900', label: 'INI' },
  toml: { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900', label: 'TOML' },

  // Text
  txt: { icon: FileText, color: 'text-slate-500', bgColor: 'bg-slate-50 dark:bg-slate-900', label: 'Text' },
  md: { icon: FileText, color: 'text-slate-600', bgColor: 'bg-slate-50 dark:bg-slate-900', label: 'Markdown' },
  log: { icon: FileText, color: 'text-slate-500', bgColor: 'bg-slate-50 dark:bg-slate-900', label: 'Log' },

  // Font
  ttf: { icon: FileType, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900', label: 'Font TTF' },
  otf: { icon: FileType, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900', label: 'Font OTF' },
  woff: { icon: FileType, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900', label: 'Font WOFF' },
  woff2: { icon: FileType, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900', label: 'Font WOFF2' },

  // Security
  pem: { icon: Shield, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950', label: 'Certificate' },
  key: { icon: Shield, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950', label: 'Key' },
  crt: { icon: Shield, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950', label: 'Certificate' },
};

// Lấy thông tin icon theo file name
export function getFileTypeInfo(fileName: string): FileTypeInfo {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_MAP[ext] || {
    icon: File,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    label: ext.toUpperCase() || 'File',
  };
}

// Kiểm tra có phải image file không
export function isImageFile(fileName: string): boolean {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return imageExts.includes(ext);
}

// ============= FILE ICON COMPONENT =============

interface FileIconProps {
  file: FileItem;
  /** Kích thước: sm (20px), md (32px), lg (48px), xl (64px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Hiện thumbnail thật cho ảnh? */
  showThumbnail?: boolean;
  /** Hiện badge extension? */
  showExtBadge?: boolean;
  /** Folder đang mở? */
  isOpen?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: 'h-5 w-5', container: 'w-8 h-8', thumb: 'w-8 h-8', badge: 'text-[8px]' },
  md: { icon: 'h-8 w-8', container: 'w-12 h-12', thumb: 'w-12 h-12', badge: 'text-[9px]' },
  lg: { icon: 'h-10 w-10', container: 'w-16 h-16', thumb: 'w-16 h-16', badge: 'text-[10px]' },
  xl: { icon: 'h-14 w-14', container: 'w-full h-full', thumb: 'w-full h-full', badge: 'text-[10px]' },
};

// Thumbnail cache toàn cục (không bị mất khi re-render)
const thumbnailCache = new Map<string, string>();

/**
 * Component FileIcon thân thiện giống Windows Explorer
 * - Folder: icon vàng giống Explorer
 * - Image: thumbnail thật (lazy-loaded + cached)
 * - Khác: icons có màu + badge extension
 */
export const FileIcon = memo(function FileIcon({
  file,
  size = 'lg',
  showThumbnail = true,
  showExtBadge = false,
  isOpen = false,
  className = '',
}: FileIconProps) {
  const isFolder = !file.metadata;
  const sizeConfig = SIZE_MAP[size];

  if (isFolder) {
    return (
      <div className={`${sizeConfig.container} flex items-center justify-center ${className}`}>
        {isOpen ? (
          <FolderOpen className={`${sizeConfig.icon} text-amber-500 fill-amber-100 dark:fill-amber-900 drop-shadow-sm`} />
        ) : (
          <Folder className={`${sizeConfig.icon} text-amber-500 fill-amber-100 dark:fill-amber-900 drop-shadow-sm`} />
        )}
      </div>
    );
  }

  // Nếu là ảnh → render thumbnail thật
  if (showThumbnail && isImageFile(file.name)) {
    return (
      <ImageThumbnail
        file={file}
        size={size}
        className={className}
      />
    );
  }

  // Non-image file → render icon có màu
  const typeInfo = getFileTypeInfo(file.name);
  const Icon = typeInfo.icon;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  return (
    <div className={`${sizeConfig.container} flex items-center justify-center relative ${className}`}>
      <div className={`${sizeConfig.container} rounded-lg ${typeInfo.bgColor} flex items-center justify-center`}>
        <Icon className={`${sizeConfig.icon} ${typeInfo.color} drop-shadow-sm`} />
      </div>
      {/* Badge extension nhỏ ở góc dưới */}
      {showExtBadge && ext && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${sizeConfig.badge} font-bold uppercase px-1 py-0.5 rounded bg-background border shadow-sm ${typeInfo.color}`}>
          {ext}
        </span>
      )}
    </div>
  );
});

// ============= IMAGE THUMBNAIL COMPONENT =============

interface ImageThumbnailProps {
  file: FileItem;
  size: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Thumbnail thật cho ảnh
 * - IntersectionObserver lazy-loading
 * - Cache bằng Map toàn cục
 * - Skeleton loading state
 * - Fallback về icon nếu lỗi
 */
const ImageThumbnail = memo(function ImageThumbnail({
  file,
  size,
  className = '',
}: ImageThumbnailProps) {
  const { supabase, config } = useFileManagerContext();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeConfig = SIZE_MAP[size];
  const cacheKey = `${config.bucketName}:${file.path || file.name}:${file.updated_at}`;

  // IntersectionObserver → chỉ load khi xuất hiện trong viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load thumbnail khi visible
  useEffect(() => {
    if (!isVisible) return;

    // Kiểm tra cache
    if (thumbnailCache.has(cacheKey)) {
      setThumbnailUrl(thumbnailCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadThumbnail = async () => {
      try {
        const filePath = file.path || file.name;
        const { data, error: dlError } = await supabase.storage
          .from(config.bucketName)
          .download(filePath);

        if (dlError || !data || cancelled) {
          if (!cancelled) setError(true);
          return;
        }

        const url = URL.createObjectURL(data);
        thumbnailCache.set(cacheKey, url);
        if (!cancelled) {
          setThumbnailUrl(url);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };

    loadThumbnail();
    return () => { cancelled = true; };
  }, [isVisible, cacheKey, file.path, file.name, supabase, config.bucketName]);

  // Fallback về icon nếu lỗi
  if (error) {
    const typeInfo = getFileTypeInfo(file.name);
    const Icon = typeInfo.icon;
    return (
      <div className={`${sizeConfig.container} rounded-lg ${typeInfo.bgColor} flex items-center justify-center ${className}`}>
        <Icon className={`${sizeConfig.icon} ${typeInfo.color}`} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${sizeConfig.thumb} rounded-lg overflow-hidden ${size === 'xl' ? '' : 'shadow-sm hover:shadow-md'} transition-shadow ${className}`}
    >
      {loading || !thumbnailUrl ? (
        // Skeleton loading
        <div className={`${sizeConfig.thumb} bg-muted animate-pulse rounded-lg ${size === 'xl' ? 'min-h-[120px]' : ''}`} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt={file.name}
          className={`w-full h-full object-cover transition-transform duration-300 ${size === 'xl' ? 'group-hover:scale-105' : 'hover:scale-110'}`}
          loading="lazy"
          draggable={false}
        />
      )}
    </div>
  );
});

export default FileIcon;
