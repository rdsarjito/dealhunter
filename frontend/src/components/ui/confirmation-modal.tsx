'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2, Info, Loader2 } from 'lucide-react';

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  icon?: React.ReactNode;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger',
  loading: externalLoading,
  onConfirm,
  icon,
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading ?? internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      const res = onConfirm();
      if (res && typeof res.then === 'function') {
        await res;
      }
      onOpenChange(false);
    } catch (err) {
      console.error('Confirmation action failed:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
          defaultIcon: <AlertTriangle className="h-5 w-5 stroke-[2]" />,
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-500/10 text-[#065FD4] dark:text-[#3EA6FF] border border-blue-500/20',
          defaultIcon: <Info className="h-5 w-5 stroke-[2]" />,
          buttonClass: 'bg-[#065FD4] hover:bg-[#0047AB] text-white',
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20',
          defaultIcon: <Trash2 className="h-5 w-5 stroke-[2]" />,
          buttonClass: 'bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-xs',
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={isLoading ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl border border-[#E5E5E5] dark:border-[#303030] bg-card text-foreground shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${currentVariant.iconBg}`}>
              {icon || currentVariant.defaultIcon}
            </div>
            <DialogTitle className="text-base font-bold text-foreground leading-snug">
              {title}
            </DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-xs text-[#606060] dark:text-[#AAAAAA] leading-relaxed pt-0.5">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2.5 pt-2 border-t border-[#E5E5E5]/60 dark:border-[#303030]/60">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-full border border-[#E5E5E5] dark:border-[#303030] hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className={`h-9 px-5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-60 flex items-center gap-2 ${currentVariant.buttonClass}`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isLoading ? 'Memproses...' : confirmText}</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
