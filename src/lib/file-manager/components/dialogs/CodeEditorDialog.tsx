'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Code, Save, Download } from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { FileItem } from '../../types';
import dynamic from 'next/dynamic';

// Dynamic import Monaco Editor (heavy bundle)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  loading: () => (
    <div className="h-[500px] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
  ssr: false,
});

interface CodeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem;
  onSuccess?: () => void;
}

/**
 * Dialog chỉnh sửa code với Monaco Editor
 * 
 * Features:
 * - Syntax highlighting
 * - Auto-completion
 * - Multi-language support
 * - Dark/light theme
 * - Save to storage
 * - Download edited file
 */
export function CodeEditorDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: CodeEditorDialogProps) {
  const { config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Kiểm tra feature flag
  if (!config.features.edit) {
    return null;
  }

  // Detect language from file extension
  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      html: 'html',
      htm: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      py: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      sql: 'sql',
      md: 'markdown',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      sh: 'shell',
      bash: 'shell',
      txt: 'plaintext',
    };
    return languageMap[ext] || 'plaintext';
  };

  const language = getLanguage(file.name);

  // Load file content
  useEffect(() => {
    if (open && file.path) {
      loadFileContent();
    }
  }, [open, file.path]);

  const loadFileContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .download(file.path);

      if (error) throw error;

      const text = await data.text();
      setContent(text);
      setOriginalContent(text);
      setHasChanges(false);
    } catch (error) {
      console.error('Lỗi khi tải nội dung file:', error);
      config.callbacks?.onError?.(error as Error, 'load_file_content');

      toast({
        title: 'Lỗi',
        description: 'Không thể tải nội dung file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle content change
  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    setHasChanges(newContent !== originalContent);
  };

  // Save file
  const handleSave = async () => {
    setSaving(true);
    try {
      const blob = new Blob([content], {
        type: file.metadata?.mimetype || 'text/plain',
      });

      const { error } = await supabase.storage
        .from(config.bucketName)
        .update(file.path, blob, {
          contentType: file.metadata?.mimetype || 'text/plain',
          upsert: true,
        });

      if (error) throw error;

      setOriginalContent(content);
      setHasChanges(false);

      toast({
        title: 'Thành công',
        description: 'Đã lưu file',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Lỗi khi lưu file:', error);
      config.callbacks?.onError?.(error as Error, 'save_file');

      toast({
        title: 'Lỗi',
        description: 'Không thể lưu file',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Download edited file
  const handleDownload = () => {
    const blob = new Blob([content], {
      type: file.metadata?.mimetype || 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Đang tải xuống',
      description: file.name,
    });
  };

  // Confirm close with unsaved changes
  const handleClose = () => {
    if (hasChanges) {
      if (
        confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?')
      ) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Chỉnh sửa: {file.name}
          </DialogTitle>
          <DialogDescription>
            Ngôn ngữ: {language.toUpperCase()}
            {hasChanges && (
              <span className="ml-3 text-yellow-600 dark:text-yellow-400">
                • Chưa lưu
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden border rounded-md">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Đang tải...</span>
            </div>
          ) : (
            <MonacoEditor
              height="500px"
              language={language}
              value={content}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Tải Xuống
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            {hasChanges ? 'Hủy' : 'Đóng'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || loading}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
