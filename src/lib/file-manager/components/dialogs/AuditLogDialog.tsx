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
import { FileText, Eye, Download, Edit, Trash, Copy, Share, Clock } from 'lucide-react';
import { FileItem } from '../../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  action: 'view' | 'download' | 'edit' | 'delete' | 'copy' | 'share' | 'rename' | 'move';
  timestamp: Date;
  user: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

interface AuditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  logs: AuditLogEntry[];
  onRefresh?: () => void;
}

/**
 * Audit Log Dialog Component
 * Hiển thị nhật ký truy cập và thao tác với file
 */
export default function AuditLogDialog({
  open,
  onOpenChange,
  file,
  logs,
  onRefresh,
}: AuditLogDialogProps) {
  if (!file) return null;

  const getActionIcon = (action: AuditLogEntry['action']) => {
    const iconMap = {
      view: Eye,
      download: Download,
      edit: Edit,
      delete: Trash,
      copy: Copy,
      share: Share,
      rename: FileText,
      move: FileText,
    };
    const Icon = iconMap[action];
    return <Icon className="h-4 w-4" />;
  };

  const getActionLabel = (action: AuditLogEntry['action']) => {
    const labelMap = {
      view: 'Xem',
      download: 'Tải xuống',
      edit: 'Chỉnh sửa',
      delete: 'Xóa',
      copy: 'Sao chép',
      share: 'Chia sẻ',
      rename: 'Đổi tên',
      move: 'Di chuyển',
    };
    return labelMap[action];
  };

  const getActionColor = (action: AuditLogEntry['action']) => {
    const colorMap = {
      view: 'secondary',
      download: 'default',
      edit: 'default',
      delete: 'destructive',
      copy: 'secondary',
      share: 'default',
      rename: 'secondary',
      move: 'secondary',
    };
    return colorMap[action] as 'default' | 'secondary' | 'destructive';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[520px] p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-blue-600" />
            Nhật Ký Truy Cập
          </DialogTitle>
          <DialogDescription className="text-xs truncate">
            {file.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-[10px] text-gray-600 dark:text-gray-400">Truy cập</p>
              <p className="text-lg font-bold text-blue-600">{logs.length}</p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <p className="text-[10px] text-gray-600 dark:text-gray-400">Người dùng</p>
              <p className="text-lg font-bold text-green-600">
                {new Set(logs.map(l => l.userId)).size}
              </p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <p className="text-[10px] text-gray-600 dark:text-gray-400">Lần cuối</p>
              <p className="text-xs font-semibold text-purple-600 mt-0.5">
                {logs.length > 0
                  ? format(new Date(logs[0].timestamp), 'HH:mm dd/MM', { locale: vi })
                  : 'Chưa có'}
              </p>
            </div>
          </div>

          {/* Logs List */}
          {logs.length > 0 ? (
            <div className="border rounded-lg max-h-[280px] overflow-y-auto divide-y">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 p-2.5 hover:bg-muted/50 transition-colors"
                >
                  <Badge variant={getActionColor(log.action)} className="gap-1 text-[10px] shrink-0">
                    {getActionIcon(log.action)}
                    {getActionLabel(log.action)}
                  </Badge>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate">{log.user}</p>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        {format(new Date(log.timestamp), 'HH:mm dd/MM/yy', { locale: vi })}
                      </span>
                    </div>
                    
                    {log.details && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                        {log.details}
                      </p>
                    )}
                    
                    {log.ipAddress && (
                      <span className="text-[10px] font-mono text-gray-500">
                        IP: {log.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Chưa có nhật ký truy cập nào</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-3 border-t">
            {onRefresh && (
              <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
                Làm mới
              </Button>
            )}
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
