import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Hash, ShoppingBag } from 'lucide-react';
import type { ProductVariant } from '../appTypes';
import { toast } from 'react-hot-toast';

interface QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  variant: ProductVariant | null;
  isProcessing: boolean;
}

export default function QuantityModal({
  isOpen,
  onClose,
  onConfirm,
  variant,
  isProcessing,
}: QuantityModalProps) {
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (isOpen) {
      setQuantity('1'); // Default to 1 every time it opens
      setTimeout(() => {
        const input = document.getElementById('item-quantity') as HTMLInputElement;
        input?.focus();
        input?.select();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !variant) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numQuantity = parseFloat(quantity); // Use parseFloat for kg/liters

    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast.error('Invalid quantity. Please enter a positive number.');
      return;
    }
    if (numQuantity > variant.stock_quantity) {
      toast.error(`Not enough stock. Only ${variant.stock_quantity} available.`);
      return;
    }
    
    onConfirm(numQuantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-elevated animate-scale-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <X size={20} />
        </button>

        <h2 className="mb-4 flex items-center text-xl font-black text-slate-900 dark:text-white border-b border-brand-600 pb-3">
          <ShoppingBag className="mr-2 h-5 w-5 text-brand-600" />
          Enter Quantity
        </h2>
        <div className="mb-4">
          <p className="font-medium text-slate-800 dark:text-slate-200">{variant.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {variant.stock_quantity} in stock • {variant.price.toLocaleString()} RWF / unit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          <div>
            <label htmlFor="item-quantity" className="label-style">Quantity (e.g., 1, 1.5, 50)</label>
            <div className="relative mt-1">
              <input
                id="item-quantity"
                type="number"
                step="any" // Allows decimals for kg/liters
                min="0"
                required
                className="input-field pl-10 text-xl font-semibold"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 50"
              />
              <Hash className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white shadow-card hover:shadow-card-hover hover:bg-brand-700 transition-all disabled:opacity-50" 
            disabled={isProcessing}
          >
            {isProcessing ? 'Adding...' : 'Add to Cart'}
          </button>
        </form>
      </div>
    </div>
  );
}