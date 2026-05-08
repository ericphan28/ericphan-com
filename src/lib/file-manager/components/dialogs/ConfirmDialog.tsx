'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'warning' | 'info';
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * Dialog xác nhận dùng chung
 * Thay thế window.confirm() bằng UI đẹp, style-able
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'destructive',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const Icon = variant === 'destructive' ? Trash2 : variant === 'warning' ? AlertTriangle : Info;

  const iconColorClass =
    variant === 'destructive'
      ? 'text-destructive bg-destructive/10'
      : variant === 'warning'
      ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
      : 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';

  const buttonClass =
    variant === 'destructive'
      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      : variant === 'warning'
      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
      : '';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="!max-w-[380px] p-5">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 rounded-full p-1.5 ${iconColorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5 text-xs">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={buttonClass}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
