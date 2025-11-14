import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer } from '../appTypes'; // FIX: Removed Sale, CreditPayment
import { X, History, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

type HistoryItem = { id: number; type: 'sale' | 'payment'; date: Date; amount: number; method: string; description: string; };

export default function CustomerHistoryModal({
  isOpen,
  onClose,
  customer,
}: CustomerHistoryModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      fetchHistory(customer.id, customer.shop_id);
    } else {
      setHistory([]);
    }
  }, [isOpen, customer]);

  async function fetchHistory(customerId: number, shopId: string) {
    setLoading(true);
    const { data: salesData, error: salesError } = await supabase.from('sales').select('id, created_at, total_amount, payment_method').eq('customer_id', customerId).eq('shop_id', shopId).eq('payment_method', 'credit');
    const { data: paymentsData, error: paymentsError } = await supabase.from('credit_payments').select('id, created_at, amount, payment_method').eq('shop_id', shopId);
    if (salesError) console.error('Error fetching sales:', salesError.message);
    if (paymentsError) console.error('Error fetching payments:', paymentsError.message);
    let combinedHistory: HistoryItem[] = [];
    if (salesData) {
      const sales = salesData.map(sale => ({ id: sale.id, type: 'sale' as const, date: new Date(sale.created_at), amount: sale.total_amount, method: sale.payment_method, description: `Credit Sale`, }));
      combinedHistory.push(...sales);
    }
    if (paymentsData) {
      const payments = paymentsData.map(payment => ({ id: payment.id, type: 'payment' as const, date: new Date(payment.created_at), amount: payment.amount, method: payment.payment_method, description: `Payment Received`, }));
      combinedHistory.push(...payments);
    }
    combinedHistory.sort((a, b) => b.date.getTime() - a.date.getTime());
    setHistory(combinedHistory);
    setLoading(false);
  }

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-elevated animate-scale-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={20} /></button>
        <h2 className="mb-4 flex items-center text-xl font-black text-slate-900 dark:text-white border-b border-brand-600 pb-3"><History className="mr-2 h-5 w-5 text-brand-600" /> Credit History for {customer.name}</h2>
        <div className="mb-4 text-center border-b border-slate-200 dark:border-slate-700 pb-4"><p className="text-sm text-slate-600 dark:text-slate-400">Current Balance:</p><p className="text-3xl font-black text-danger-600 dark:text-danger-400">{customer.credit_balance.toLocaleString()} RWF</p><p className="text-xs text-slate-500 dark:text-slate-400">Credit Limit: {customer.credit_limit > 0 ? customer.credit_limit.toLocaleString() + ' RWF' : 'No Limit'}</p></div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
          ) : history.length === 0 ? (
            <p className="py-10 text-center text-slate-500 dark:text-slate-400">No credit activity found.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {history.map((item) => (
                <li key={`${item.type}-${item.id}`} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                   <div className="flex items-center space-x-3">
                       {item.type === 'sale' ? (
                           <ArrowUpCircle className="h-5 w-5 text-danger-500 flex-shrink-0" aria-label="Credit Taken" />
                       ) : (
                           <ArrowDownCircle className="h-5 w-5 text-success-500 flex-shrink-0" aria-label="Payment Made" />
                       )}
                       <div>
                           <p className={`font-medium ${item.type === 'sale' ? 'text-danger-700 dark:text-danger-400' : 'text-success-700 dark:text-success-400'}`}>{item.type === 'sale' ? 'Credit Sale' : 'Payment'}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                   </div>
                   <div className="text-right">
                        <span className={`font-bold ${item.type === 'sale' ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>{item.type === 'sale' ? '+' : '-'} {item.amount.toLocaleString()} RWF</span>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{item.method}</p>
                   </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-6 text-right"><button onClick={onClose} className="rounded-lg bg-slate-200 dark:bg-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-card hover:shadow-sm hover:bg-slate-300 dark:hover:bg-slate-500 transition-all">Close</button></div>
      </div>
    </div>
  );
}
