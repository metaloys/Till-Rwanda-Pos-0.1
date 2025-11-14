import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent, ReactElement } from 'react';
import { X, Smartphone, DollarSign, Landmark } from 'lucide-react';
import type { PaymentMethod } from '../appTypes';

// Define the structure for method details
interface MethodDetail {
  icon: ReactElement;
  color: string;
  prompt: string;
}

const methodDetails: Record<string, MethodDetail> = {
  cash: { icon: <DollarSign />, color: 'text-success-600', prompt: 'Amount Received (RWF)' },
  mtn_momo: { icon: <Smartphone />, color: 'text-warning-600', prompt: 'Enter MTN MoMo Transaction ID (Optional):' },
  airtel_money: { icon: <Smartphone />, color: 'text-danger-600', prompt: 'Enter Airtel Money Transaction ID (Optional):' },
  bank_transfer: { icon: <Landmark />, color: 'text-brand-600', prompt: 'Enter Bank Transfer Reference (Optional):' },
  credit: { icon: <X />, color: 'text-slate-500', prompt: 'Credit is handled by the "Pay Later" button.' },
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, reference: string | null) => void;
  total: number;
  paymentMethod: PaymentMethod | null;
  isProcessing: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  total,
  paymentMethod,
  isProcessing,
}: PaymentModalProps) {
  const [transactionRef, setTransactionRef] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [changeDue, setChangeDue] = useState('');

  useEffect(() => {
    // Reset state when modal opens or payment method changes
    setTransactionRef('');
    setAmountReceived('');
    setChangeDue('');
    if (isOpen && paymentMethod === 'cash') {
        setTimeout(() => document.getElementById('received')?.focus(), 100);
    }
  }, [isOpen, paymentMethod]);

  if (!isOpen || !paymentMethod || paymentMethod === 'credit') return null;

  const currentMethod = methodDetails[paymentMethod];
  const methodLabel = paymentMethod.replace('_', ' ').toUpperCase();

  const handleCashReceivedChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountReceived(value);
    const received = parseFloat(value);
    if (!isNaN(received) && received >= total) {
      setChangeDue((received - total).toLocaleString());
    } else {
      setChangeDue('');
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      
      if (paymentMethod === 'cash') {
          const received = parseFloat(amountReceived);
          if (isNaN(received) || received < total) {
              alert("Amount received cannot be less than the total sale amount.");
              return;
          }
      }
      
      onConfirm(paymentMethod, transactionRef.trim() || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-elevated animate-scale-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <X size={20} />
        </button>

        <div className="mb-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className={`h-6 w-6 ${currentMethod.color}`}>{currentMethod.icon}</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{methodLabel} PAYMENT</h2>
          </div>
        </div>

        <div className="mb-4 border-b border-slate-200 dark:border-slate-700 pb-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Due:</p>
          <p className="text-3xl font-black text-brand-600 dark:text-brand-400">{total.toLocaleString()} RWF</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          {/* Cash Payment Fields */}
          {paymentMethod === 'cash' && (
            <div className='space-y-4'>
                <div>
                    <label htmlFor="received" className="label-style">{currentMethod.prompt}</label>
                    <input
                        id="received" type="number" step="1" required
                        className="input-field text-xl font-semibold"
                        value={amountReceived} onChange={handleCashReceivedChange}
                    />
                </div>
                <div className="flex justify-between rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 p-3">
                    <span className="font-medium text-success-700 dark:text-success-300">Change Due:</span>
                    <span className="text-xl font-black text-success-600 dark:text-success-400">
                        {changeDue || '0'} RWF
                    </span>
                </div>
            </div>
          )}

          {/* MoMo/Bank Reference Field (Optional) */}
          {paymentMethod !== 'cash' && (
            <div>
              <label htmlFor="reference" className="label-style">{currentMethod.prompt}</label>
              <input
                id="reference" type="text"
                className="input-field"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                autoFocus
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ensure payment is physically confirmed first.</p>
            </div>
          )}

          <button type="submit" className="w-full rounded-lg bg-success-600 px-4 py-3 font-semibold text-white shadow-card hover:shadow-card-hover hover:bg-success-700 transition-all disabled:opacity-50" disabled={total === 0 || isProcessing}>
            {isProcessing ? 'Processing...' : `Confirm ${methodLabel} Sale`}
          </button>
        </form>
      </div>
    </div>
  );
}