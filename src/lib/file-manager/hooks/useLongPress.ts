'use client';

import { useCallback, useRef } from 'react';

interface LongPressPosition {
  clientX: number;
  clientY: number;
}

interface LongPressHandlers<T extends HTMLElement> {
  onTouchStart: (e: React.TouchEvent<T>) => void;
  onTouchMove: (e: React.TouchEvent<T>) => void;
  onTouchEnd: (e: React.TouchEvent<T>) => void;
  onTouchCancel: (e: React.TouchEvent<T>) => void;
  onClickCapture: (e: React.MouseEvent<T>) => void;
}

/**
 * Long-press detection cho mobile — emulate "right-click" trên touch device.
 *
 * - Bắt đầu đếm khi touchstart
 * - Hủy nếu user di chuyển ngón tay > 10px (đang scroll, không phải press)
 * - Hủy nếu user nhấc tay trước thời gian
 * - Khi đủ thời gian: rung nhẹ (haptic feedback) + gọi callback với toạ độ touch
 */
export function useLongPress<T extends HTMLElement>(
  callback: (pos: LongPressPosition) => void,
  delay = 500
): LongPressHandlers<T> {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const justFiredAt = useRef<number>(0);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent<T>) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startPos.current = { x: t.clientX, y: t.clientY };
      const x = t.clientX;
      const y = t.clientY;
      clear();
      timer.current = setTimeout(() => {
        justFiredAt.current = Date.now();
        try { navigator.vibrate?.(15); } catch { /* không hỗ trợ */ }
        callback({ clientX: x, clientY: y });
      }, delay);
    },
    [callback, clear, delay]
  );

  // Sau khi long-press fire, chặn click theo sau (browser tự fire click sau touchend)
  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (Date.now() - justFiredAt.current < 500) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent<T>) => {
      if (!startPos.current) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - startPos.current.x);
      const dy = Math.abs(t.clientY - startPos.current.y);
      if (dx > 10 || dy > 10) clear();
    },
    [clear]
  );

  const onTouchEnd = useCallback(() => {
    clear();
    startPos.current = null;
  }, [clear]);

  const onTouchCancel = useCallback(() => {
    clear();
    startPos.current = null;
  }, [clear]);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onClickCapture };
}
