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
  cash: { icon: <DollarSign />, color: 'text-green-600', prompt: 'Amount Received (RWF)' },
  mtn_momo: { icon: <Smartphone />, color: 'text-yellow-600', prompt: 'Enter MTN MoMo Transaction ID (Optional):' },
  airtel_money: { icon: <Smartphone />, color: 'text-red-600', prompt: 'Enter Airtel Money Transaction ID (Optional):' },
  bank_transfer: { icon: <Landmark />, color: 'text-blue-600', prompt: 'Enter Bank Transfer Reference (Optional):' },
  credit: { icon: <X />, color: 'text-gray-500', prompt: 'Credit is handled by the "Pay Later" button.' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="mb-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className={`h-6 w-6 ${currentMethod.color}`}>{currentMethod.icon}</span>
            <h2 className="text-xl font-bold text-gray-800">{methodLabel} PAYMENT</h2>
          </div>
        </div>

        <div className="mb-4 border-b border-gray-200 pb-4 text-center">
          <p className="text-sm text-gray-500">Total Due:</p>
          <p className="text-3xl font-extrabold text-red-600">{total.toLocaleString()} RWF</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex justify-between rounded-lg bg-gray-100 p-3">
                    <span className="font-medium text-gray-700">Change Due:</span>
                    <span className="text-xl font-bold text-green-600">
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
              <p className="mt-1 text-xs text-gray-500">Ensure payment is physically confirmed first.</p>
            </div>
          )}

          <button type="submit" className="w-full rounded-md bg-green-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50" disabled={total === 0 || isProcessing}>
            {isProcessing ? 'Processing...' : `Confirm ${methodLabel} Sale`}
          </button>
        </form>
      </div>
    </div>
  );
}