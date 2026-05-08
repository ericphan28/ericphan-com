'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';

export function UnlockGate() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/file-manager/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Mã không đúng');
        setCode('');
        inputRef.current?.focus();
        return;
      }
      router.refresh();
    } catch {
      setError('Lỗi mạng. Thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-gray-100 flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="rounded-full bg-blue-500/15 p-3">
            <Lock className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-lg font-semibold">File Manager</h1>
          <p className="text-xs text-gray-400">Nhập mã truy cập để tiếp tục</p>
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="text"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mã truy cập"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-center text-sm tracking-widest outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
          disabled={busy}
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 flex-none mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Đang kiểm tra...' : 'Mở khoá'}
        </button>

        <p className="text-center text-[11px] text-gray-500">
          Giới hạn 5 lần thử / 15 phút
        </p>
      </form>
    </div>
  );
}
