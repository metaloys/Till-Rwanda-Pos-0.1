import { X, AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode; // The confirmation message
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
  confirmColor = "bg-red-600 hover:bg-red-700", // Default to destructive red
  isProcessing,
}: ConfirmModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" disabled={isProcessing}>
          <X size={20} />
        </button>

        <div className="flex items-start">
          <div className={`mr-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${confirmColor === 'bg-red-600 hover:bg-red-700' ? 'bg-red-100' : 'bg-blue-100'}`}>
            <AlertTriangle className={`h-6 w-6 ${confirmColor === 'bg-red-600 hover:bg-red-700' ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div className="mt-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900" id="modal-title">
              {title}
            </h2>
            <div className="mt-2 text-sm text-slate-600">
              {children}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
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
            className="mt-3 sm:mt-0 w-full sm:w-auto justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}