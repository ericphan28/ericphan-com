'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Share2,
  Copy,
  CalendarIcon,
  Link2,
  Globe,
  Lock,
  Check,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { format, addDays, addHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useFileManagerContext } from '../../FileManagerProvider';
import { useSharedLinks } from '../../hooks/useSharedLinks';
import { FileItem } from '../../types';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem;
  onSuccess?: () => void;
}

/**
 * Dialog chia sẻ file — hoạt động thực tế với Supabase Storage
 *
 * Hai chế độ chia sẻ:
 * 1. Signed URL — link tạm thời có thời hạn, hoạt động với mọi bucket
 * 2. Public URL — link vĩnh viễn (cần bucket public)
 *
 * Lưu ý: Password protection và view limit cần backend API riêng,
 * nên không bao gồm trong phiên bản này.
 */
export function ShareDialog({
  open,
  onOpenChange,
  file,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuccess,
}: ShareDialogProps) {
  const { config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const { addSharedLink } = useSharedLinks();

  // Trạng thái
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<'public' | 'signed'>('signed');
  const [copied, setCopied] = useState(false);

  // Cài đặt signed URL
  const [enableExpiry, setEnableExpiry] = useState(true);
  const [expiryPreset, setExpiryPreset] = useState<string>('7d');
  const [customExpiryDate, setCustomExpiryDate] = useState<Date>();

  // Tính thời gian hết hạn (giây)
  const getExpiresInSeconds = useCallback((): number => {
    if (!enableExpiry) {
      return 365 * 24 * 3600; // 1 năm
    }
    switch (expiryPreset) {
      case '1h': return 3600;
      case '24h': return 24 * 3600;
      case '7d': return 7 * 24 * 3600;
      case '30d': return 30 * 24 * 3600;
      case '90d': return 90 * 24 * 3600;
      case 'custom':
        if (customExpiryDate) {
          const diffMs = customExpiryDate.getTime() - Date.now();
          return Math.max(60, Math.floor(diffMs / 1000));
        }
        return 7 * 24 * 3600;
      default: return 7 * 24 * 3600;
    }
  }, [enableExpiry, expiryPreset, customExpiryDate]);

  // Tính ngày hết hạn để hiển thị
  const getExpiryDisplay = useCallback((): string => {
    if (!enableExpiry) return 'Không giới hạn (tối đa 1 năm)';
    switch (expiryPreset) {
      case '1h': return `Sau 1 giờ (${format(addHours(new Date(), 1), 'HH:mm dd/MM', { locale: vi })})`;
      case '24h': return `Sau 24 giờ (${format(addDays(new Date(), 1), 'HH:mm dd/MM', { locale: vi })})`;
      case '7d': return `Sau 7 ngày (${format(addDays(new Date(), 7), 'dd/MM/yyyy', { locale: vi })})`;
      case '30d': return `Sau 30 ngày (${format(addDays(new Date(), 30), 'dd/MM/yyyy', { locale: vi })})`;
      case '90d': return `Sau 90 ngày (${format(addDays(new Date(), 90), 'dd/MM/yyyy', { locale: vi })})`;
      case 'custom':
        return customExpiryDate
          ? format(customExpiryDate, "'Đến' dd/MM/yyyy", { locale: vi })
          : 'Chọn ngày...';
      default: return '';
    }
  }, [enableExpiry, expiryPreset, customExpiryDate]);

  // Tạo Public URL
  const generatePublicUrl = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = supabase.storage
        .from(config.bucketName)
        .getPublicUrl(file.path);

      if (!data?.publicUrl) {
        throw new Error('Không thể tạo Public URL');
      }

      setGeneratedLink(data.publicUrl);

      // Lưu vào danh sách quản lý
      addSharedLink({
        fileName: file.name,
        filePath: file.path,
        linkType: 'public',
        url: data.publicUrl,
      });

      toast({
        title: '✅ Đã tạo Public URL',
        description: 'Link vĩnh viễn — ai có link đều truy cập được',
      });
    } catch (error) {
      console.error('Lỗi tạo public URL:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo link công khai. Bucket có thể chưa được cấu hình public.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, config.bucketName, file.path, file.name, addSharedLink, toast]);

  // Tạo Signed URL
  const generateSignedUrl = useCallback(async () => {
    setLoading(true);
    try {
      const expiresIn = getExpiresInSeconds();

      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .createSignedUrl(file.path, expiresIn);

      if (error) throw error;

      const expiresAtDate = new Date(Date.now() + expiresIn * 1000);
      setGeneratedLink(data.signedUrl);

      // Lưu vào danh sách quản lý
      addSharedLink({
        fileName: file.name,
        filePath: file.path,
        linkType: 'signed',
        url: data.signedUrl,
        expiresAt: expiresAtDate.toISOString(),
        expiryLabel: getExpiryDisplay(),
      });

      toast({
        title: '✅ Đã tạo Signed URL',
        description: getExpiryDisplay(),
      });
    } catch (error) {
      console.error('Lỗi tạo signed URL:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo link chia sẻ. Kiểm tra file có tồn tại không.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, config.bucketName, file.path, file.name, addSharedLink, getExpiresInSeconds, getExpiryDisplay, toast]);

  // Xử lý tạo link
  const handleGenerate = useCallback(async () => {
    if (linkType === 'public') {
      await generatePublicUrl();
    } else {
      await generateSignedUrl();
    }
  }, [linkType, generatePublicUrl, generateSignedUrl]);

  // Copy link
  const handleCopy = useCallback(async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: '📋 Đã copy link vào clipboard' });
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = generatedLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: '📋 Đã copy' });
    }
  }, [generatedLink, toast]);

  // Mở link trong tab mới
  const handleOpenLink = useCallback(() => {
    if (generatedLink) {
      window.open(generatedLink, '_blank');
    }
  }, [generatedLink]);

  // Reset khi đóng dialog
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setGeneratedLink(null);
      setCopied(false);
      setLoading(false);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  // Kiểm tra feature flag
  if (!config.features.share) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[440px] p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4" />
            Chia Sẻ
          </DialogTitle>
          <DialogDescription className="break-all text-xs">
            {file.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* === Khi đã tạo link === */}
          {generatedLink ? (
            <div className="space-y-3">
              {/* Badge loại link */}
              <div className="flex items-center gap-2">
                {linkType === 'public' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <Globe className="h-3 w-3" />
                    Public URL — Vĩnh viễn
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <Clock className="h-3 w-3" />
                    Signed URL — {getExpiryDisplay()}
                  </span>
                )}
              </div>

              {/* Link input + nút copy/mở */}
              <div className="space-y-1.5">
                <Label className="text-xs">Link chia sẻ</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="flex-1 font-mono text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleOpenLink}
                    title="Mở trong tab mới"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Hướng dẫn */}
              <div className="p-3 bg-muted rounded-lg space-y-1.5 text-sm">
                {linkType === 'public' ? (
                  <>
                    <p className="font-medium">ℹ️ Public URL</p>
                    <p className="text-muted-foreground text-xs">
                      Link này không bao giờ hết hạn. Bất kỳ ai có link đều có thể xem/tải file.
                      Để thu hồi quyền truy cập, bạn cần xóa file hoặc đổi bucket sang private.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">ℹ️ Signed URL</p>
                    <p className="text-muted-foreground text-xs">
                      Link tự động hết hạn sau thời gian đã chọn. Sau khi hết hạn, 
                      link không thể truy cập. Bạn có thể tạo link mới bất cứ lúc nào.
                    </p>
                  </>
                )}
              </div>

              {/* Nút tạo link mới */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setGeneratedLink(null)}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Tạo Link Mới
              </Button>
            </div>
          ) : (
            /* === Chưa tạo link — form cấu hình === */
            <>
              <Tabs value={linkType} onValueChange={(v) => setLinkType(v as 'public' | 'signed')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signed" className="gap-1.5 text-xs">
                    <Lock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Link Tạm Thời</span>
                    <span className="sm:hidden">Tạm Thời</span>
                  </TabsTrigger>
                  <TabsTrigger value="public" className="gap-1.5 text-xs">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Link Công Khai</span>
                    <span className="sm:hidden">Công Khai</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Signed URL */}
                <TabsContent value="signed" className="space-y-3 mt-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      <Lock className="inline h-3 w-3 mr-1" />
                      <strong>Link Tạm Thời</strong> — Tạo link có thời hạn.
                      Sau khi hết hạn, link tự động vô hiệu.
                      Phù hợp chia sẻ file riêng tư.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Đặt thời hạn</Label>
                      <Switch
                        checked={enableExpiry}
                        onCheckedChange={setEnableExpiry}
                      />
                    </div>

                    {enableExpiry && (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: '1h', label: '1 giờ' },
                          { value: '24h', label: '24 giờ' },
                          { value: '7d', label: '7 ngày' },
                          { value: '30d', label: '30 ngày' },
                          { value: '90d', label: '90 ngày' },
                          { value: 'custom', label: 'Tùy chọn' },
                        ].map((preset) => (
                          <Button
                            key={preset.value}
                            variant={expiryPreset === preset.value ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => setExpiryPreset(preset.value)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    {enableExpiry && expiryPreset === 'custom' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customExpiryDate ? (
                              format(customExpiryDate, 'dd/MM/yyyy', { locale: vi })
                            ) : (
                              <span className="text-muted-foreground">Chọn ngày hết hạn...</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customExpiryDate}
                            onSelect={setCustomExpiryDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {enableExpiry && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getExpiryDisplay()}
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Public URL */}
                <TabsContent value="public" className="space-y-3 mt-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-300">
                      <Globe className="inline h-3 w-3 mr-1" />
                      <strong>Link Công Khai</strong> — Link vĩnh viễn, không hết hạn.
                      Ai có link đều truy cập được.
                    </p>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ <strong>Lưu ý:</strong> Public URL chỉ hoạt động khi bucket
                      &quot;{config.bucketName}&quot; được cấu hình <strong>public</strong> trong
                      Supabase Dashboard. Nếu bucket là private, hãy dùng &quot;Link Tạm Thời&quot;.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {generatedLink ? 'Đóng' : 'Hủy'}
          </Button>
          {!generatedLink && (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={loading || (enableExpiry && expiryPreset === 'custom' && !customExpiryDate)}
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {linkType === 'public' ? (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Tạo Public URL
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Tạo Signed URL
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
