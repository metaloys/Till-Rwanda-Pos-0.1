import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Tag, Percent } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ApplyDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (discount: number) => void;
  currentDiscount: number;
  isProcessing: boolean;
}

export default function ApplyDiscountModal({
  isOpen,
  onClose,
  onConfirm,
  currentDiscount,
  isProcessing,
}: ApplyDiscountModalProps) {
  const [discount, setDiscount] = useState(currentDiscount.toString());

  useEffect(() => {
    if (isOpen) {
      setDiscount(currentDiscount.toString());
      setTimeout(() => document.getElementById('discount-percent')?.focus(), 100);
    }
  }, [isOpen, currentDiscount]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast.error('Invalid percentage. Must be 0-100.');
      return;
    }
    onConfirm(discountValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-elevated animate-scale-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <X size={20} />
        </button>

        <h2 className="mb-4 flex items-center text-xl font-black text-slate-900 dark:text-white border-b border-warning-600 pb-3">
          <Tag className="mr-2 h-5 w-5 text-warning-600" />
          Apply Cart Discount
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          <div>
            <label htmlFor="discount-percent" className="label-style">Discount Percentage (%)</label>
            <div className="relative mt-1">
              <input
                id="discount-percent"
                type="number"
                step="1"
                min="0"
                max="100"
                required
                className="input-field pl-10 text-xl font-semibold"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="e.g., 10"
              />
              <Percent className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full rounded-lg bg-warning-600 px-4 py-3 font-semibold text-white shadow-card hover:shadow-card-hover hover:bg-warning-700 transition-all disabled:opacity-50" 
            disabled={isProcessing}
          >
            {isProcessing ? 'Applying...' : 'Apply Discount'}
          </button>
        </form>
      </div>
    </div>
  );
}