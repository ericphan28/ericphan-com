'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';

const PIN_LENGTH = 6;

export function UnlockForm({ next }: { next: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(codeToSubmit: string) {
    if (busy || codeToSubmit.length !== PIN_LENGTH) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/file-manager/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToSubmit }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Mã không đúng');
        setCode('');
        inputRef.current?.focus();
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError('Lỗi mạng. Thử lại.');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  function onChange(value: string) {
    // Chỉ nhận số, max 6 ký tự
    const cleaned = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setCode(cleaned);
    setError(null);
    // Auto submit khi đủ 6 số
    if (cleaned.length === PIN_LENGTH) {
      submit(cleaned);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-gray-100 flex items-center justify-center px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(code);
        }}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="rounded-full bg-blue-500/15 p-3">
            <Lock className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-lg font-semibold">Eric Phan · Bảng điều khiển</h1>
          <p className="text-xs text-gray-400">Nhập mã 6 số để mở khoá</p>
        </div>

        {/* PIN dots — visual feedback */}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="w-full flex items-center justify-center gap-3 py-2"
          aria-label="Nhập mã PIN"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < code.length;
            const current = i === code.length;
            return (
              <span
                key={i}
                className={`h-3.5 w-3.5 rounded-full border transition-all ${
                  filled
                    ? 'bg-blue-400 border-blue-400 scale-110'
                    : current && !busy
                    ? 'border-blue-400/60 bg-blue-400/10'
                    : 'border-white/20 bg-transparent'
                }`}
              />
            );
          })}
        </button>

        {/* Hidden real input để bật bàn phím số trên mobile */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="\d*"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          maxLength={PIN_LENGTH}
          disabled={busy}
          className="sr-only"
          aria-label="Mã PIN 6 số"
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 flex-none mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {busy && (
          <p className="text-center text-xs text-blue-400">Đang kiểm tra...</p>
        )}

        <p className="text-center text-[11px] text-gray-500">
          Giới hạn 5 lần thử / 15 phút
        </p>
      </form>
    </div>
  );
}
