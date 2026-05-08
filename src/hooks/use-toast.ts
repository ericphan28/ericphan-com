'use client';

import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<ToastMessage, 'id'>) => {
    const id = (++toastId).toString();
    const newToast: ToastMessage = { id, title, description, variant };
    
    setToasts(prev => [...prev, newToast]);
    
    // Simple console implementation for now
    if (variant === 'destructive') {
      console.error(`❌ ${title}`, description);
    } else {
      console.log(`✅ ${title}`, description);
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
    
    return { id };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toast, dismiss, toasts };
}
