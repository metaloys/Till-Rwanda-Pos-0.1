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

  const isDestructive = confirmColor.includes('red');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-slate-800 shadow-xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700" disabled={isProcessing}>
          <X size={20} />
        </button>

        <div className="flex items-start p-6">
          <div className={`mr-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isDestructive ? 'bg-red-100 dark:bg-red-900/50' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
            <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
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

        <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 rounded-b-lg">
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isProcessing}
            className={`w-full sm:w-auto justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm disabled:opacity-50 ${confirmColor}`}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            disabled={isProcessing}
            className="mt-3 sm:mt-0 w-full sm:w-auto justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-base font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}