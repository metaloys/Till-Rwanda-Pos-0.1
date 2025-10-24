import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, DollarSign, Smartphone } from 'lucide-react';
import type { Customer } from '../appTypes';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: string) => void;
  customer: Customer | null;
  isProcessing: boolean;
}

const PAYMENT_METHODS = ['cash', 'mtn_momo', 'airtel_money', 'bank_transfer'];

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  customer,
  isProcessing,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setAmount('');
      setMethod('cash');
      setTimeout(() => document.getElementById('payment-amount')?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      // We'll let the main component handle toast errors
      return; 
    }
    if (paymentAmount > customer.credit_balance) {
      alert(`Payment amount cannot be more than the outstanding balance of ${customer.credit_balance.toLocaleString()} RWF.`);
      return;
    }
    onConfirm(paymentAmount, method);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
        <p className="mt-1 text-sm text-slate-600">
          For: <span className="font-medium text-indigo-600">{customer.name}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Current Balance: <span className="font-medium text-red-600">{customer.credit_balance.toLocaleString()} RWF</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="payment-amount" className="label-style">Payment Amount (RWF)</label>
            <input
              id="payment-amount"
              type="number"
              step="1"
              required
              className="input-field text-xl font-semibold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 5000"
            />
          </div>
          
          <div>
            <label htmlFor="payment-method" className="label-style">Payment Method</label>
            <select
              id="payment-method"
              required
              className="input-field"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m} className="capitalize">
                  {m.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full rounded-md bg-green-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50" 
            disabled={isProcessing}
          >
            {isProcessing ? 'Recording...' : 'Confirm Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}