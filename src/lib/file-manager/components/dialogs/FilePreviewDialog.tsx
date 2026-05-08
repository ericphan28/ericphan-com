'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { FileItem } from '../../types';

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem;
  allFiles?: FileItem[];
  onNavigate?: (file: FileItem) => void;
}

type PreviewKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'excel'
  | 'word'
  | 'text'
  | 'other';

const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'log', 'csv', 'tsv',
  'json', 'jsonc', 'xml', 'yaml', 'yml', 'toml', 'ini', 'env',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'php', 'sh', 'bash', 'ps1',
  'c', 'cpp', 'h', 'hpp', 'cs',
  'sql', 'graphql', 'gql', 'proto',
]);

function getFileType(f: FileItem): PreviewKind {
  const mime = f.metadata?.mimetype || '';
  const ext = f.name.split('.').pop()?.toLowerCase() || '';
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico'].includes(ext)) return 'image';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext)) return 'video';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'm4a', 'opus'].includes(ext)) return 'audio';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'tsv', 'ods'].includes(ext)) return 'excel';
  if (['docx'].includes(ext)) return 'word';
  if (TEXT_EXTS.has(ext)) return 'text';
  return 'other';
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface SheetData {
  name: string;
  rows: string[][];
}

export function FilePreviewDialog({ open, onOpenChange, file, allFiles, onNavigate }: FilePreviewDialogProps) {
  const { config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[] | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const fileType = getFileType(file);

  const previewable = useMemo(() => {
    if (!allFiles) return [];
    return allFiles.filter((f) => getFileType(f) !== 'other' && f.metadata);
  }, [allFiles]);

  const idx = useMemo(() => previewable.findIndex((f) => f.name === file.name), [previewable, file]);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < previewable.length - 1;

  const go = useCallback((dir: 'prev' | 'next') => {
    if (!onNavigate) return;
    const next = dir === 'prev' ? idx - 1 : idx + 1;
    if (next >= 0 && next < previewable.length) {
      setZoom(100);
      setRotation(0);
      onNavigate(previewable[next]);
    }
  }, [idx, previewable, onNavigate]);

  useEffect(() => {
    if (!open || !file.path) return;
    setUrl(null);
    setTextContent(null);
    setSheets(null);
    setActiveSheet(0);
    setWordHtml(null);
    setZoom(100);
    setRotation(0);
    let revoke = '';

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage.from(config.bucketName).download(file.path);
        if (error) throw error;

        if (fileType === 'text') {
          const text = await data.text();
          setTextContent(text);
        } else if (fileType === 'excel') {
          const buf = await data.arrayBuffer();
          const XLSX = await import('xlsx');
          const wb = XLSX.read(buf, { type: 'array' });
          const parsed: SheetData[] = wb.SheetNames.map((n) => {
            const ws = wb.Sheets[n];
            const rows = XLSX.utils.sheet_to_json<string[]>(ws, {
              header: 1,
              defval: '',
              raw: false,
            });
            return { name: n, rows };
          });
          setSheets(parsed);
        } else if (fileType === 'word') {
          const buf = await data.arrayBuffer();
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          setWordHtml(result.value);
        } else {
          const u = URL.createObjectURL(data);
          revoke = u;
          setUrl(u);
        }
      } catch (e) {
        console.error('[Preview] Lỗi:', e);
        toast({ title: 'Lỗi', description: 'Không thể tải preview', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (revoke) URL.revokeObjectURL(revoke); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file.path, file.name]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onOpenChange(false); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go('prev'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go('next'); }
      if (fileType === 'image') {
        if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(z => Math.min(z + 25, 500)); }
        if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(z - 25, 25)); }
        if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey) { e.preventDefault(); setRotation(r => (r + 90) % 360); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onOpenChange, go, fileType]);

  const download = async () => {
    try {
      const { data, error } = await supabase.storage.from(config.bucketName).download(file.path);
      if (error) throw error;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(data);
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải file', variant: 'destructive' });
    }
  };

  if (!open || !config.features.preview) return null;

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: '#111',
          borderBottom: '1px solid #333',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
          <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>
            {formatBytes(file.size || file.metadata?.size || 0)}
          </span>
          {previewable.length > 1 && idx >= 0 && (
            <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>
              ({idx + 1}/{previewable.length})
            </span>
          )}
        </div>

        {fileType === 'image' && url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
            <button onClick={() => setZoom(z => Math.max(z - 25, 25))} style={btnStyle} title="Thu nhỏ">
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: 11, color: '#aaa', width: 40, textAlign: 'center' }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 25, 500))} style={btnStyle} title="Phóng to">
              <ZoomIn size={16} />
            </button>
            <button onClick={() => setRotation(r => (r + 90) % 360)} style={btnStyle} title="Xoay">
              <RotateCw size={16} />
            </button>
            {(zoom !== 100 || rotation !== 0) && (
              <button onClick={() => { setZoom(100); setRotation(0); }} style={{ ...btnStyle, fontSize: 11 }}>
                Reset
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button onClick={download} style={btnStyle} title="Tải xuống">
            <Download size={16} />
          </button>
          <button onClick={() => onOpenChange(false)} style={btnStyle} title="Đóng (Esc)">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* SHEET TABS for Excel */}
      {fileType === 'excel' && sheets && sheets.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '6px 16px',
            backgroundColor: '#0d0d0d',
            borderBottom: '1px solid #222',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {sheets.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActiveSheet(i)}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                borderRadius: 4,
                border: '1px solid #333',
                background: activeSheet === i ? '#2563eb' : 'transparent',
                color: activeSheet === i ? '#fff' : '#aaa',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* CONTENT */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: fileType === 'excel' || fileType === 'word' || fileType === 'text' ? 'stretch' : 'center',
          justifyContent: fileType === 'excel' || fileType === 'word' || fileType === 'text' ? 'stretch' : 'center',
          overflow: 'auto',
        }}
        onClick={(e) => {
          if (fileType === 'image' && e.target === e.currentTarget) onOpenChange(false);
        }}
        onWheel={(e) => {
          if (fileType !== 'image') return;
          e.preventDefault();
          setZoom(z => e.deltaY < 0 ? Math.min(z + 10, 500) : Math.max(z - 10, 25));
        }}
      >
        {hasPrev && (
          <button onClick={() => go('prev')} style={{ ...navBtnStyle, left: 8 }} title="Trước (←)">
            <ChevronLeft size={28} />
          </button>
        )}
        {hasNext && (
          <button onClick={() => go('next')} style={{ ...navBtnStyle, right: 8 }} title="Sau (→)">
            <ChevronRight size={28} />
          </button>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', margin: 'auto' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#888', marginTop: 8, fontSize: 14 }}>Đang tải...</p>
          </div>
        ) : fileType === 'image' && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={file.name}
            draggable={false}
            style={{
              maxWidth: zoom <= 100 ? '90%' : 'none',
              maxHeight: zoom <= 100 ? '90%' : 'none',
              objectFit: 'contain',
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease',
              userSelect: 'none',
            }}
          />
        ) : fileType === 'video' && url ? (
          <video src={url} controls style={{ maxWidth: '90%', maxHeight: '90%' }}>
            Không hỗ trợ video.
          </video>
        ) : fileType === 'audio' && url ? (
          <div style={{ textAlign: 'center', margin: 'auto' }}>
            <p style={{ marginBottom: 16, fontSize: 16 }}>{file.name}</p>
            <audio src={url} controls style={{ width: 400, maxWidth: '90vw' }}>
              Không hỗ trợ audio.
            </audio>
          </div>
        ) : fileType === 'pdf' && url ? (
          <iframe src={url} title={file.name} style={{ width: '90%', height: '90%', border: 'none', borderRadius: 8, background: '#fff', margin: 'auto' }} />
        ) : fileType === 'excel' && sheets ? (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#fff', color: '#111' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: 13 }}>
              <tbody>
                {sheets[activeSheet]?.rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri === 0 ? '#f3f4f6' : ri % 2 ? '#fafafa' : '#fff' }}>
                    <td
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        color: '#6b7280',
                        fontSize: 11,
                        textAlign: 'right',
                        position: 'sticky',
                        left: 0,
                        minWidth: 40,
                      }}
                    >
                      {ri + 1}
                    </td>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #e5e7eb',
                          minWidth: 80,
                          maxWidth: 360,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: ri === 0 ? 600 : 400,
                        }}
                        title={String(cell ?? '')}
                      >
                        {String(cell ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : fileType === 'word' && wordHtml !== null ? (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 880,
                background: '#fff',
                color: '#111',
                padding: '48px 64px',
                borderRadius: 4,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                lineHeight: 1.6,
                fontFamily: 'Calibri, "Segoe UI", sans-serif',
              }}
              dangerouslySetInnerHTML={{ __html: wordHtml }}
            />
          </div>
        ) : fileType === 'text' && textContent !== null ? (
          <pre
            style={{
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 16,
              overflow: 'auto',
              background: '#0f172a',
              color: '#e2e8f0',
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", Menlo, Consolas, monospace',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre',
              tabSize: 2,
            }}
          >
            {textContent}
          </pre>
        ) : (
          <div style={{ textAlign: 'center', margin: 'auto' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>Không hỗ trợ preview cho định dạng này</p>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
              Tải về để mở bằng ứng dụng phù hợp
            </p>
            <button onClick={download} style={{ ...btnStyle, padding: '8px 16px', fontSize: 14 }}>
              <Download size={16} style={{ marginRight: 8 }} /> Tải xuống
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        /* mammoth-converted Word styles */
        .word-content table { border-collapse: collapse; }
        .word-content table td, .word-content table th { border: 1px solid #ccc; padding: 4px 8px; }
      `}</style>
    </div>
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(content, document.body);
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  color: '#ccc',
  cursor: 'pointer',
  borderRadius: 6,
  padding: 6,
  transition: 'background 0.15s, color 0.15s',
};

const navBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.6)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  transition: 'background 0.15s',
};
