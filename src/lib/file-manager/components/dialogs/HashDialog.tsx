import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Hash, Copy, Check, Loader2 } from 'lucide-react';
import { FileItem } from '../../types';

interface HashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  onCalculate: (file: FileItem) => Promise<{ md5: string; sha256: string; sha1: string }>;
}

/**
 * Hash Dialog Component
 * Tính và hiển thị hash của file (MD5, SHA256, SHA1)
 */
export default function HashDialog({
  open,
  onOpenChange,
  file,
  onCalculate,
}: HashDialogProps) {
  const [hashes, setHashes] = useState<{ md5: string; sha256: string; sha1: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (open && file) {
      setHashes(null);
      calculateHashes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file]);

  const calculateHashes = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const result = await onCalculate(file);
      setHashes(result);
    } catch (error) {
      console.error('Error calculating hashes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[440px] p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Hash className="h-4 w-4 text-purple-600" />
            Hash Checksum
          </DialogTitle>
          <DialogDescription className="text-xs truncate">
            {file.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
              <p className="text-xs text-gray-600">
                Đang tính hash... (có thể mất vài phút với file lớn)
              </p>
            </div>
          ) : hashes ? (
            <>
              {/* MD5 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-purple-600">MD5</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={hashes.md5}
                    readOnly
                    className="font-mono text-xs h-9 bg-gray-50 dark:bg-gray-800"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => copyToClipboard(hashes.md5, 'md5')}
                  >
                    {copied === 'md5' ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* SHA-1 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-blue-600">SHA-1</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={hashes.sha1}
                    readOnly
                    className="font-mono text-xs h-9 bg-gray-50 dark:bg-gray-800"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => copyToClipboard(hashes.sha1, 'sha1')}
                  >
                    {copied === 'sha1' ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* SHA-256 */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-green-600">SHA-256</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={hashes.sha256}
                    readOnly
                    className="font-mono text-xs h-9 bg-gray-50 dark:bg-gray-800"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => copyToClipboard(hashes.sha256, 'sha256')}
                  >
                    {copied === 'sha256' ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs">
                  <strong>💡 Mẹo:</strong> So sánh hash với nguồn gốc để đảm bảo file không bị thay đổi.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-xs text-gray-500">
              Đã xảy ra lỗi khi tính hash
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-3 border-t">
            {hashes && !loading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={calculateHashes}
              >
                Tính lại
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
