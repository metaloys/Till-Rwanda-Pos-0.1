import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Sale, Profile, UserRole } from '../appTypes';
import { List, Undo2, User, Calendar, Tag } from 'lucide-react';
import SaleDetailsModal from '../components/SaleDetailsModal'; 
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-hot-toast';

interface SalesHistoryProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}

type SaleWithCustomer = Sale & { customers: { name: string } | null; };

export default function SalesHistory({ shopId }: SalesHistoryProps) {
  const [sales, setSales] = useState<SaleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [saleToReturn, setSaleToReturn] = useState<SaleWithCustomer | null>(null);

  async function fetchSalesHistory() {
    setLoading(true);
    const { data, error } = await supabase.from('sales').select('*, customers ( name )').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching sales:', error.message); toast.error(error.message); } 
    else if (data) { setSales(data as SaleWithCustomer[]); }
    setLoading(false);
  }

  useEffect(() => { if (shopId) fetchSalesHistory(); }, [shopId]);

  const handleProcessReturn = async () => {
    if (!saleToReturn || saleToReturn.is_returned || isProcessing) return;
    
    setIsProcessing(true);
    const returnPromise = new Promise(async (resolve, reject) => {
      try {
        const { data: items, error: itemsError } = await supabase.from('sale_items').select('variant_id, quantity').eq('sale_id', saleToReturn.id);
        if (itemsError || !items || items.length === 0) throw new Error(itemsError?.message || 'Could not find sale items.');
        
        const stockReversals = items.map(item => supabase.rpc('update_stock', { variant_id_to_update: item.variant_id as number, quantity_change: item.quantity }));
        await Promise.all(stockReversals);
        
        const { error: saleUpdateError } = await supabase.from('sales').update({ is_returned: true }).eq('id', saleToReturn.id);
        if (saleUpdateError) throw saleUpdateError;
        
        if (saleToReturn.payment_method === 'credit' && saleToReturn.customer_id) {
          const { data: customer, error: fetchCustError } = await supabase.from('customers').select('credit_balance').eq('id', saleToReturn.customer_id).single();
          if (!fetchCustError && customer) {
            const newBalance = customer.credit_balance - saleToReturn.total_amount;
            await supabase.from('customers').update({ credit_balance: newBalance }).eq('id', saleToReturn.customer_id);
          }
        }
        resolve(`Sale ID ${saleToReturn.id} successfully returned!`);
      } catch (error: any) {
        reject(error);
      }
    });

    toast.promise(returnPromise, {
      loading: 'Processing return...',
      success: (message) => {
        fetchSalesHistory();
        setSaleToReturn(null);
        setIsProcessing(false);
        return message as string;
      },
      error: (err) => {
        setSaleToReturn(null);
        setIsProcessing(false);
        return `Return failed: ${err.message}`;
      }
    });
  };

  const formatPaymentMethod = (method: string) => method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const handleViewDetails = (saleId: number) => { setSelectedSaleId(saleId); };

  return (
    <>
      <div className="rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="card-header flex items-center"><List className="mr-2 h-5 w-5" />Sales History</h2>
          <button onClick={fetchSalesHistory} disabled={loading || isProcessing} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh List'}</button>
        </div>
        
        {loading ? ( <p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading...</p> ) : (
          <>
            <div className="mt-4 hidden md:block flow-root overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="th-style">Sale ID</th><th className="th-style">Date</th><th className="th-style">Total</th><th className="th-style">Method</th><th className="th-style">Customer</th><th className="th-style">Status</th><th className="th-style">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {sales.length === 0 ? (<tr><td colSpan={7} className="td-style text-center text-slate-500 dark:text-slate-400">No sales recorded.</td></tr>) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="td-style font-medium"><button onClick={() => handleViewDetails(sale.id as number)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">#{sale.id}</button></td>
                        <td className="td-style text-sm text-slate-500 dark:text-slate-400">{sale.created_at ? new Date(sale.created_at).toLocaleString() : 'N/A'}</td>
                        <td className="td-style font-medium text-slate-900 dark:text-white">{sale.total_amount.toLocaleString()} RWF</td>
                        <td className="td-style text-sm text-slate-500"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sale.payment_method === 'credit' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' : sale.payment_method === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>{formatPaymentMethod(sale.payment_method)}</span></td>
                        <td className="td-style text-sm text-slate-500 dark:text-slate-400">{sale.customers?.name ?? 'Walk-in'}</td>
                        <td className="td-style">{sale.is_returned ? (<span className="font-semibold text-red-600 dark:text-red-500">RETURNED</span>) : (<span className="font-semibold text-green-600 dark:text-green-500">COMPLETED</span>)}</td>
                        <td className="td-style">{!sale.is_returned ? (<button onClick={() => setSaleToReturn(sale)} disabled={isProcessing} className="action-button bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"><Undo2 className="mr-1 h-3 w-3" />{isProcessing && saleToReturn?.id === sale.id ? '...' : 'Return'}</button>) : ('-')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 space-y-4 md:hidden">
              {sales.length === 0 ? (<p className="py-10 text-center text-slate-500 dark:text-slate-400">No sales recorded.</p>) : (
                sales.map((sale) => (
                  <div key={sale.id} className="rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                    <div onClick={() => handleViewDetails(sale.id as number)}>
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div className="font-bold text-slate-900 dark:text-white">Sale #{sale.id}</div>
                        <div className={`text-sm font-bold ${sale.is_returned ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'}`}>{sale.is_returned ? 'RETURNED' : 'COMPLETED'}</div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-lg font-bold">
                          <span className="text-slate-900 dark:text-white">{sale.total_amount.toLocaleString()} RWF</span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sale.payment_method === 'credit' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' : sale.payment_method === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>{formatPaymentMethod(sale.payment_method)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center"><User className="mr-1.5 h-4 w-4" /> {sale.customers?.name ?? 'Walk-in'}</span>
                          <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4" /> {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {sale.transaction_reference && (<div className="flex items-center text-sm text-slate-500"><Tag className="mr-1.5 h-4 w-4" /> Ref: {sale.transaction_reference}</div>)}
                      </div>
                    </div>
                    {!sale.is_returned && (
                      <button onClick={() => setSaleToReturn(sale)} disabled={isProcessing} className="action-button mt-3 w-full justify-center bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                        <Undo2 className="mr-1 h-4 w-4" />
                        {isProcessing && saleToReturn?.id === sale.id ? 'Processing...' : 'Process Full Return'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      
      <SaleDetailsModal 
        isOpen={selectedSaleId !== null}
        onClose={() => setSelectedSaleId(null)}
        saleId={selectedSaleId}
      />
      <ConfirmModal
        isOpen={!!saleToReturn}
        onClose={() => setSaleToReturn(null)}
        onConfirm={handleProcessReturn}
        title="Process Return?"
        isProcessing={isProcessing}
      >
        <p className="dark:text-slate-300">Are you sure you want to return Sale <span className="font-bold">#{saleToReturn?.id}</span> for <span className="font-bold">{saleToReturn?.total_amount.toLocaleString()} RWF</span>?</p>
        <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">This will add all items back to your stock and cannot be undone.</p>
      </ConfirmModal>
    </>
  );
}