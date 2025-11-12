import type { ToastTypeStyles } from '@/types/components';
import React from 'react';
import { useToast } from './ToastProvider';

export interface ToastProps {
  position: string;
  className?: string;
}

export const Toast = ({ position, className }: ToastProps) => {
  const { toasts } = useToast();
  const toastsForPosition = toasts[position] || [];

  if (toastsForPosition.length === 0) {
    return null;
  }

  const typeStyles: ToastTypeStyles = {
    success: 'border-primary',
    error: 'border-red-500',
    info: 'border-primary',
    warning: 'border-yellow-500',
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {toastsForPosition.map((toastData) => (
        <div
          key={toastData.id}
          className={`px-4 py-2 rounded-md border bg-[#E7E5DA] backdrop-blur-sm shadow-md text-dark break-words ${
            typeStyles[toastData.type || 'info']
          }`}
        >
          <span className="text-sm">{toastData.message}</span>
        </div>
      ))}
    </div>
  );
};
