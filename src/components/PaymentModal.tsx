import { useState, useEffect, FormEvent } from 'react';
import { X, Smartphone, DollarSign, Landmark } from 'lucide-react';
import type { PaymentMethod } from '../appTypes';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, reference: string | null) => void;
  total: number;
  paymentMethod: PaymentMethod | null;
}

const methodDetails: Record<PaymentMethod, { icon: JSX.Element; color: string; prompt: string }> = {
  cash: { icon: <DollarSign />, color: 'text-green-600', prompt: 'No reference needed.' },
  mtn_momo: { icon: <Smartphone />, color: 'text-yellow-600', prompt: 'Enter MTN MoMo Transaction ID (Optional):' },
  airtel_money: { icon: <Smartphone />, color: 'text-red-600', prompt: 'Enter Airtel Money Transaction ID (Optional):' },
  bank_transfer: { icon: <Landmark />, color: 'text-blue-600', prompt: 'Enter Bank Transfer Reference (Optional):' },
  credit: { icon: <X />, color: 'text-gray-500', prompt: 'Credit is handled by the "Pay Later" button.' }, // Should not be used here
};

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  total,
  paymentMethod,
}: PaymentModalProps) {
  const [transactionRef, setTransactionRef] = useState('');
  const [changeAmount, setChangeAmount] = useState(''); // New state for change
  const [amountReceived, setAmountReceived] = useState('');

  useEffect(() => {
    // Reset state when modal opens/changes method
    setTransactionRef('');
    setAmountReceived('');
    setChangeAmount('');
  }, [isOpen, paymentMethod]);

  if (!isOpen || !paymentMethod || paymentMethod === 'credit') return null;

  const currentMethod = methodDetails[paymentMethod];
  const methodLabel = paymentMethod.replace('_', ' ').toUpperCase();

  const handleCashReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const received = parseFloat(e.target.value);
    setAmountReceived(e.target.value);
    if (!isNaN(received) && received >= total) {
      setChangeAmount((received - total).toFixed(2));
    } else {
      setChangeAmount('');
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (paymentMethod === 'cash') {
          const received = parseFloat(amountReceived);
          if (received < total) {
              alert("Amount received cannot be less than the total sale amount.");
              return;
          }
      }
      // Pass the method and reference back to the POS component
      const referenceToPass = transactionRef.trim() || null;
      onConfirm(paymentMethod, referenceToPass);
      // Close modal is handled by onConfirm
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
                    <label htmlFor="received" className="label-style">Amount Received (RWF)</label>
                    <input
                        id="received" type="number" step="0.01" required
                        className="input-field text-xl font-semibold"
                        value={amountReceived} onChange={handleCashReceivedChange}
                        autoFocus
                    />
                </div>
                <div className="flex justify-between rounded-lg bg-gray-100 p-3">
                    <span className="font-medium text-gray-700">Change Due:</span>
                    <span className="text-xl font-bold text-green-600">
                        {changeAmount ? parseFloat(changeAmount).toLocaleString() : '0'} RWF
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
              />
              <p className="mt-1 text-xs text-gray-500">Ensure payment is physically confirmed first.</p>
            </div>
          )}

          <button type="submit" className="w-full rounded-md bg-green-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50" disabled={total === 0}>
            Confirm {methodLabel} Sale
          </button>
        </form>
      </div>
    </div>
  );
}

// Helper class definition (ensure this is in src/index.css or loaded globally)
/*
.label-style { @apply block text-sm font-medium text-gray-700; }
.input-field { @apply mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500; }
*/