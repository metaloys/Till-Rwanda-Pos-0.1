import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, PlusCircle } from 'lucide-react';
import type { ProductVariant } from '../appTypes';
import { toast } from 'react-hot-toast';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  variant: ProductVariant | null;
  isProcessing: boolean;
}

export default function RestockModal({
  isOpen,
  onClose,
  onConfirm,
  variant,
  isProcessing,
}: RestockModalProps) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setTimeout(() => document.getElementById('restock-amount')?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen || !variant) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const restockAmount = parseInt(amount, 10);
    if (isNaN(restockAmount) || restockAmount <= 0) {
      toast.error('Invalid quantity. Please enter a positive number.');
      return;
    }
    onConfirm(restockAmount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h2 className="mb-4 flex items-center text-xl font-bold text-slate-900">
          <PlusCircle className="mr-2 h-5 w-5 text-green-600" />
          Restock Variant
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Product: <span className="font-medium text-indigo-600">{variant.name}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Current Stock: <span className="font-medium text-slate-900">{variant.stock_quantity}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="restock-amount" className="label-style">Quantity to ADD</label>
            <input
              id="restock-amount"
              type="number"
              step="1"
              min="1"
              required
              className="input-field text-xl font-semibold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 50"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full rounded-md bg-green-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50" 
            disabled={isProcessing}
          >
            {isProcessing ? 'Adding Stock...' : 'Confirm Restock'}
          </button>
        </form>
      </div>
    </div>
  );
}