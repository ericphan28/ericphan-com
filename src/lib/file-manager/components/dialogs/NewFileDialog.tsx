'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FilePlus } from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { sanitizeStorageKey } from '../../utils/sanitizeKey';
import { setDisplayName } from '../../services/displayNamesService';

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Các loại file có thể tạo mới
 */
const FILE_TEMPLATES = [
  { value: 'txt', label: 'Text (.txt)', mime: 'text/plain', placeholder: 'Nhập nội dung văn bản...' },
  { value: 'md', label: 'Markdown (.md)', mime: 'text/markdown', placeholder: '# Tiêu đề\n\nNội dung markdown...' },
  { value: 'html', label: 'HTML (.html)', mime: 'text/html', placeholder: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Trang mới</title>\n</head>\n<body>\n  <h1>Xin chào</h1>\n</body>\n</html>' },
  { value: 'css', label: 'CSS (.css)', mime: 'text/css', placeholder: '/* Styles */\nbody {\n  margin: 0;\n  padding: 0;\n}' },
  { value: 'js', label: 'JavaScript (.js)', mime: 'text/javascript', placeholder: '// JavaScript\nconsole.log("Hello World");' },
  { value: 'ts', label: 'TypeScript (.ts)', mime: 'text/typescript', placeholder: '// TypeScript\nconst greeting: string = "Hello World";\nconsole.log(greeting);' },
  { value: 'json', label: 'JSON (.json)', mime: 'application/json', placeholder: '{\n  "key": "value"\n}' },
  { value: 'xml', label: 'XML (.xml)', mime: 'application/xml', placeholder: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>Giá trị</item>\n</root>' },
  { value: 'csv', label: 'CSV (.csv)', mime: 'text/csv', placeholder: 'Cột 1,Cột 2,Cột 3\nGiá trị 1,Giá trị 2,Giá trị 3' },
  { value: 'sql', label: 'SQL (.sql)', mime: 'text/plain', placeholder: '-- SQL Query\nSELECT * FROM table_name\nWHERE condition = true;' },
  { value: 'py', label: 'Python (.py)', mime: 'text/x-python', placeholder: '# Python\nprint("Hello World")' },
  { value: 'sh', label: 'Shell Script (.sh)', mime: 'text/x-shellscript', placeholder: '#!/bin/bash\necho "Hello World"' },
  { value: 'env', label: 'Env File (.env)', mime: 'text/plain', placeholder: '# Environment Variables\nKEY=value\nDATABASE_URL=postgres://...' },
  { value: 'yaml', label: 'YAML (.yaml)', mime: 'text/yaml', placeholder: '# YAML Config\nname: project\nversion: 1.0' },
] as const;

/**
 * Dialog tạo file mới
 *
 * ✅ Chọn loại file (14 loại phổ biến)
 * ✅ Tự động thêm extension
 * ✅ Template mẫu cho từng loại
 * ✅ Textarea nhập nội dung
 * ✅ Upload lên Supabase Storage
 */
export function NewFileDialog({
  open,
  onOpenChange,
  onSuccess,
}: NewFileDialogProps) {
  const { state, config, supabase } = useFileManagerContext();
  const { toast } = useToast();

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('txt');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Lấy template hiện tại
  const currentTemplate = FILE_TEMPLATES.find(t => t.value === fileType) || FILE_TEMPLATES[0];

  // Reset state khi mở dialog
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFileName('');
      setFileType('txt');
      setContent('');
      setLoading(false);
    }
    onOpenChange(isOpen);
  };

  // Khi đổi loại file → cập nhật placeholder
  const handleTypeChange = (value: string) => {
    setFileType(value);
    // Nếu content rỗng hoặc là template cũ → đặt template mới
    const oldTemplate = FILE_TEMPLATES.find(t => t.value === fileType);
    const newTemplate = FILE_TEMPLATES.find(t => t.value === value);
    if (!content || content === oldTemplate?.placeholder) {
      setContent(newTemplate?.placeholder || '');
    }
  };

  // Tạo file
  const handleCreate = async () => {
    const rawName = fileName.trim();
    let name = sanitizeStorageKey(rawName);
    if (!name) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên file hợp lệ',
        variant: 'destructive',
      });
      return;
    }

    // Tự động thêm extension nếu chưa có
    const ext = `.${fileType}`;
    if (!name.endsWith(ext)) {
      name += ext;
    }
    const displayBase = rawName.endsWith(ext) ? rawName : rawName + ext;

    setLoading(true);

    try {
      // Tạo blob từ content
      const blob = new Blob([content], { type: currentTemplate.mime });

      // Tính đường dẫn upload
      const uploadPath = state.currentPath
        ? `${state.currentPath}/${name}`
        : name;

      // Upload lên Supabase
      const { error } = await supabase.storage
        .from(config.bucketName)
        .upload(uploadPath, blob, {
          contentType: currentTemplate.mime,
          upsert: false,
        });

      if (error) {
        if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
          toast({
            title: 'File đã tồn tại',
            description: `"${name}" đã có trong thư mục này`,
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      // Lưu display name nếu user gõ tên có dấu/ký tự đặc biệt
      if (displayBase !== name) {
        await setDisplayName(supabase, config.bucketName, uploadPath, displayBase);
      }

      toast({
        title: 'Tạo file thành công',
        description: displayBase,
      });

      handleOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Lỗi tạo file:', error);
      toast({
        title: 'Lỗi tạo file',
        description: error instanceof Error ? error.message : 'Không thể tạo file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[440px] p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FilePlus className="h-4 w-4 text-green-500" />
            Tạo file mới
          </DialogTitle>
          <DialogDescription className="text-xs">
            Trong {state.currentPath || 'thư mục gốc'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Loại file + Tên file */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fileType" className="text-xs">Loại file</Label>
              <Select value={fileType} onValueChange={handleTypeChange}>
                <SelectTrigger id="fileType" className="h-9">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TEMPLATES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fileName" className="text-xs">Tên file</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={`tên-file.${fileType}`}
                className="h-9"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>

          {/* Nội dung */}
          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-xs">
              Nội dung
              <span className="text-muted-foreground ml-1 font-normal">
                (có thể để trống)
              </span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={currentTemplate.placeholder}
              className="min-h-[140px] font-mono text-xs resize-y"
              disabled={loading}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Sau khi tạo, double-click hoặc chuột phải → &quot;Chỉnh sửa Code&quot; để sửa.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={loading || !fileName.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <FilePlus className="mr-1.5 h-3.5 w-3.5" />
                Tạo file
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
