import { X, AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  confirmColor?: string;
  isProcessing: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Confirm",
  confirmColor = "bg-red-600 hover:bg-red-700", // Destructive red
  isProcessing,
}: ConfirmModalProps) {
  
  if (!isOpen) return null;

  const isDestructive = confirmColor.includes('danger') || confirmColor.includes('red');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-elevated animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" disabled={isProcessing}>
          <X size={20} />
        </button>

        <div className="flex items-start p-6">
          <div className={`mr-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isDestructive ? 'bg-danger-100 dark:bg-danger-900/50' : 'bg-brand-100 dark:bg-brand-900/50'}`}>
            <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-danger-600 dark:text-danger-400' : 'text-brand-600 dark:text-brand-400'}`} />
          </div>
          <div className="mt-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white" id="modal-title">
              {title}
            </h2>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {children}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isProcessing}
            className={`w-full sm:w-auto justify-center rounded-lg border border-transparent px-4 py-2 text-base font-medium text-white shadow-card hover:shadow-card-hover disabled:opacity-50 transition-all ${confirmColor.replace('bg-red', 'bg-danger').replace('hover:bg-red', 'hover:bg-danger')}`}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            disabled={isProcessing}
            className="mt-3 sm:mt-0 w-full sm:w-auto justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-base font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}