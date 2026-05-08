import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { File, Folder, Calendar, HardDrive, Hash, MapPin } from 'lucide-react';
import { FileItem } from '../../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  currentPath: string;
  onCalculateHash?: () => void;
}

/**
 * Properties Dialog Component
 * Hiển thị chi tiết đầy đủ của file/folder
 */
export default function PropertiesDialog({
  open,
  onOpenChange,
  file,
  currentPath,
  onCalculateHash,
}: PropertiesDialogProps) {
  if (!file) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  };

  const getFileType = () => {
    if (file.type === 'folder') return 'Thư mục';
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      // Documents
      pdf: 'Tài liệu PDF',
      doc: 'Tài liệu Word',
      docx: 'Tài liệu Word',
      xls: 'Bảng tính Excel',
      xlsx: 'Bảng tính Excel',
      ppt: 'Bản trình bày PowerPoint',
      pptx: 'Bản trình bày PowerPoint',
      txt: 'File văn bản',
      
      // Images
      jpg: 'Hình ảnh JPEG',
      jpeg: 'Hình ảnh JPEG',
      png: 'Hình ảnh PNG',
      gif: 'Hình ảnh GIF',
      webp: 'Hình ảnh WebP',
      svg: 'Hình ảnh SVG',
      bmp: 'Hình ảnh BMP',
      
      // Videos
      mp4: 'Video MP4',
      avi: 'Video AVI',
      mov: 'Video MOV',
      mkv: 'Video MKV',
      webm: 'Video WebM',
      
      // Audio
      mp3: 'Audio MP3',
      wav: 'Audio WAV',
      ogg: 'Audio OGG',
      flac: 'Audio FLAC',
      
      // Code
      js: 'JavaScript',
      ts: 'TypeScript',
      jsx: 'React JSX',
      tsx: 'React TSX',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      py: 'Python',
      java: 'Java',
      php: 'PHP',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      
      // Archives
      zip: 'File nén ZIP',
      rar: 'File nén RAR',
      '7z': 'File nén 7Z',
      tar: 'File nén TAR',
      gz: 'File nén GZIP',
    };
    
    return typeMap[ext || ''] || `File .${ext?.toUpperCase() || 'Unknown'}`;
  };

  const getMimeType = () => {
    return file.metadata?.mimetype || 'Không xác định';
  };

  const getFullPath = () => {
    return currentPath ? `/${currentPath}/${file.name}` : `/${file.name}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[440px] p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            {file.type === 'folder' ? (
              <Folder className="h-4 w-4 text-blue-600" />
            ) : (
              <File className="h-4 w-4 text-gray-600" />
            )}
            Thuộc Tính
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* File Name */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{file.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {getFileType()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="space-y-0 divide-y">
            {/* Type */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <File className="h-3.5 w-3.5" />
                Loại
              </span>
              <span className="text-xs font-medium text-right">{getFileType()}</span>
            </div>

            {/* Size */}
            {file.type === 'file' && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5" />
                  Kích thước
                </span>
                <span className="text-xs font-medium">
                  {formatFileSize(file.size)}
                  {file.size && (
                    <span className="text-gray-500 ml-1">
                      ({file.size.toLocaleString()} bytes)
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Vị trí
              </span>
              <span className="text-xs font-medium font-mono text-right max-w-[180px] truncate">
                {getFullPath()}
              </span>
            </div>

            {/* Created Date */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Ngày tạo
              </span>
              <span className="text-xs font-medium text-right">
                {format(new Date(file.created_at), 'PPP p', { locale: vi })}
              </span>
            </div>

            {/* Modified Date */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Ngày sửa
              </span>
              <span className="text-xs font-medium text-right">
                {format(new Date(file.updated_at), 'PPP p', { locale: vi })}
              </span>
            </div>

            {/* MIME Type */}
            {file.metadata?.mimetype && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  MIME
                </span>
                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  {getMimeType()}
                </span>
              </div>
            )}

            {/* ID */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                ID
              </span>
              <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded max-w-[180px] truncate">
                {file.id}
              </span>
            </div>
          </div>

          {/* Additional Metadata */}
          {file.metadata && Object.keys(file.metadata).length > 1 && (
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs font-medium mb-1.5">Metadata bổ sung:</p>
              <pre className="text-[10px] bg-white dark:bg-gray-800 p-2 rounded overflow-auto max-h-24">
                {JSON.stringify(file.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Hash Action */}
          {file.type === 'file' && onCalculateHash && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onCalculateHash();
                onOpenChange(false);
              }}
            >
              <Hash className="h-3.5 w-3.5 mr-1.5" />
              Tính Hash (MD5, SHA256)
            </Button>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-3 border-t">
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
