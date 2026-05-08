"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, AlertCircle, LogOut } from "lucide-react";
import {
  hasPin,
  setPin,
  verifyPin,
  isUnlocked,
  markUnlocked,
  lock,
  touchActivity,
  getFailCount,
  clearPin,
  PIN_CONFIG,
} from "@/lib/dashboard-pin";

const PIN_LENGTH = 6;

type Mode = "loading" | "setup" | "confirm" | "locked" | "unlocked";

export function PinGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo state lúc mount
  useEffect(() => {
    if (!hasPin()) {
      setMode("setup");
    } else if (isUnlocked()) {
      setMode("unlocked");
      touchActivity();
    } else {
      setMode("locked");
      setFails(getFailCount());
    }
  }, []);

  // Auto-focus input khi cần nhập
  useEffect(() => {
    if (mode === "setup" || mode === "confirm" || mode === "locked") {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // Activity tracker — đánh dấu hoạt động khi user tương tác
  // Lock lại sau INACTIVITY_MS không hoạt động
  useEffect(() => {
    if (mode !== "unlocked") return;

    let throttleUntil = 0;
    const handler = () => {
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + 1000;
      touchActivity();
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));

    // Check inactivity mỗi 30s
    const interval = setInterval(() => {
      if (!isUnlocked()) {
        setMode("locked");
        setFails(getFailCount());
      }
    }, 30_000);

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
      clearInterval(interval);
    };
  }, [mode]);

  // Re-check khi tab focus lại
  useEffect(() => {
    if (mode !== "unlocked") return;
    const onFocus = () => {
      if (!isUnlocked()) {
        setMode("locked");
        setFails(getFailCount());
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [mode]);

  const handleSetupSubmit = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) {
      setError(`PIN phải đủ ${PIN_LENGTH} chữ số`);
      return;
    }
    setError(null);
    setMode("confirm");
    setConfirmPin("");
  }, [pin]);

  const handleConfirmSubmit = useCallback(async () => {
    if (confirmPin !== pin) {
      setError("Hai lần nhập không khớp. Thử lại.");
      setConfirmPin("");
      setMode("setup");
      setPinValue("");
      return;
    }
    setBusy(true);
    try {
      await setPin(pin);
      setError(null);
      setPinValue("");
      setConfirmPin("");
      setMode("unlocked");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu PIN");
    } finally {
      setBusy(false);
    }
  }, [confirmPin, pin]);

  const handleUnlockSubmit = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) {
      setError(`PIN phải đủ ${PIN_LENGTH} chữ số`);
      return;
    }
    setBusy(true);
    try {
      const ok = await verifyPin(pin);
      if (ok) {
        markUnlocked();
        setPinValue("");
        setError(null);
        setFails(0);
        setMode("unlocked");
      } else {
        const newFails = getFailCount();
        setFails(newFails);
        setPinValue("");
        if (!hasPin()) {
          // Đã bị wipe sau quá nhiều lần sai → quay về setup
          setError(`Sai ${PIN_CONFIG.MAX_FAILS} lần. PIN đã bị xoá, vui lòng thiết lập lại.`);
          setMode("setup");
        } else {
          setError(`PIN sai. Còn ${PIN_CONFIG.MAX_FAILS - newFails} lần thử.`);
        }
      }
    } finally {
      setBusy(false);
    }
  }, [pin]);

  const handleForgotPin = async () => {
    if (!confirm("Quên PIN? Bạn sẽ phải đăng nhập lại bằng email/password.")) return;
    clearPin();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const handleLogout = async () => {
    lock();
    clearPin();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  if (mode === "loading") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0a1a]">
        <div className="text-gray-400 text-sm">Đang kiểm tra...</div>
      </div>
    );
  }

  if (mode === "unlocked") {
    return <>{children}</>;
  }

  // Setup / Confirm / Locked đều dùng cùng UI shell
  const isSetup = mode === "setup";
  const isConfirm = mode === "confirm";
  const isLocked = mode === "locked";

  const title = isSetup
    ? "Thiết lập PIN"
    : isConfirm
    ? "Xác nhận PIN"
    : "Nhập PIN để tiếp tục";

  const subtitle = isSetup
    ? `PIN ${PIN_LENGTH} chữ số dùng để truy cập nhanh dashboard trên thiết bị này`
    : isConfirm
    ? "Nhập lại PIN vừa thiết lập để xác nhận"
    : "Truy cập nhanh không cần email/password";

  const value = isConfirm ? confirmPin : pin;
  const setValue = isConfirm ? setConfirmPin : setPinValue;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (isSetup) handleSetupSubmit();
    else if (isConfirm) handleConfirmSubmit();
    else if (isLocked) handleUnlockSubmit();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0a1a] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-3 ${
                isLocked
                  ? "bg-blue-500/20 text-blue-400"
                  : isConfirm
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {isLocked ? (
                <Lock className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit}>
            {/* Hidden real input — captures keyboard, đặc biệt mobile */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={value}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
                setValue(v);
                setError(null);
              }}
              maxLength={PIN_LENGTH}
              className="absolute opacity-0 -z-10"
              aria-label="PIN"
              autoFocus
            />

            {/* PIN dot display — 6 ô */}
            <div className="flex justify-center gap-2 mb-5">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => inputRef.current?.focus()}
                  className={`h-12 w-10 rounded-lg border flex items-center justify-center text-xl font-mono font-semibold cursor-text transition ${
                    i < value.length
                      ? "border-blue-500/60 bg-blue-500/10 text-white"
                      : "border-white/10 bg-white/5 text-gray-600"
                  } ${
                    i === value.length && document.activeElement === inputRef.current
                      ? "ring-2 ring-blue-500/40"
                      : ""
                  }`}
                >
                  {i < value.length ? "•" : ""}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={busy || value.length !== PIN_LENGTH}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {busy
                ? "Đang xử lý..."
                : isSetup
                ? "Tiếp theo"
                : isConfirm
                ? "Xác nhận"
                : "Mở khoá"}
            </button>
          </form>

          {/* Footer actions */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            {isLocked ? (
              <>
                <button
                  onClick={handleForgotPin}
                  className="text-gray-400 hover:text-white transition"
                >
                  Quên PIN?
                </button>
                {fails > 0 && (
                  <span className="text-amber-400">
                    {fails}/{PIN_CONFIG.MAX_FAILS} lần sai
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-gray-500">Lưu trên thiết bị này</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 text-gray-400 hover:text-red-400 transition"
                >
                  <LogOut className="h-3 w-3" />
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-4">
          PIN được lưu cục bộ (hashed). Tự động khoá sau {Math.round(PIN_CONFIG.INACTIVITY_MS / 60_000)} phút không hoạt động.
        </p>
      </div>
    </div>
  );
}
