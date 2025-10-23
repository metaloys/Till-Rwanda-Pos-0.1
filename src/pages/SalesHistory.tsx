import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Sale, Profile, UserRole } from '../appTypes';
import { List, Undo2, User, Calendar, Tag } from 'lucide-react'; // FIX: Removed unused

interface SalesHistoryProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}

type SaleWithCustomer = Sale & { customers: { name: string } | null; };

export default function SalesHistory({ shopId }: SalesHistoryProps) {
  const [sales, setSales] = useState<SaleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  async function fetchSalesHistory() {
    setLoading(true);
    const { data, error } = await supabase.from('sales').select('*, customers ( name )').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching sales history:', error.message); alert(error.message); } 
    else if (data) { setSales(data as SaleWithCustomer[]); }
    setLoading(false);
  }

  useEffect(() => { if (shopId) fetchSalesHistory(); }, [shopId]);

  const handleProcessReturn = async (sale: SaleWithCustomer) => {
    if (sale.is_returned || isProcessing) return;
    if (!confirm(`Confirm return for Sale ID ${sale.id}?\nTotal Refund: ${sale.total_amount.toLocaleString()} RWF`)) { return; }
    setIsProcessing(sale.id as number);
    try {
      const { data: items, error: itemsError } = await supabase.from('sale_items').select('variant_id, quantity').eq('sale_id', sale.id);
      if (itemsError || !items || items.length === 0) { throw new Error(itemsError?.message || 'Could not find sale items.'); }
      const stockReversalPromises = items.map(item => supabase.rpc('update_stock', { variant_id_to_update: item.variant_id as number, quantity_change: item.quantity, }));
      await Promise.all(stockReversalPromises);
      const { error: saleUpdateError } = await supabase.from('sales').update({ is_returned: true }).eq('id', sale.id);
      if (saleUpdateError) { throw new Error(`Failed to mark sale as returned: ${saleUpdateError.message}`); }
      if (sale.payment_method === 'credit' && sale.customer_id) {
        const { data: customer, error: fetchCustError } = await supabase.from('customers').select('credit_balance').eq('id', sale.customer_id).single();
        if (!fetchCustError && customer) {
          const newBalance = customer.credit_balance - sale.total_amount;
          await supabase.from('customers').update({ credit_balance: newBalance }).eq('id', sale.customer_id);
        }
      }
      alert(`Sale ID ${sale.id} successfully returned!`);
      fetchSalesHistory();
    } catch (error: any) {
      alert(`Return failed: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const formatPaymentMethod = (method: string) => method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="rounded-lg bg-white p-4 md:p-6 shadow">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center text-lg font-semibold text-gray-900"><List className="mr-2 h-5 w-5" />Sales History</h2>
        <button onClick={fetchSalesHistory} disabled={loading || isProcessing !== null} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh List'}</button>
      </div>
      {loading ? ( <p className="py-10 text-center text-gray-500">Loading...</p> ) : (
        <>
          <div className="mt-4 hidden md:block flow-root overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="th-style">Sale ID</th><th className="th-style">Date / Time</th><th className="th-style">Total</th><th className="th-style">Method</th><th className="th-style">Customer</th><th className="th-style">Status</th><th className="th-style">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sales.length === 0 ? (<tr><td colSpan={7} className="td-style text-center text-gray-500">No sales recorded.</td></tr>) : (
                  sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="td-style font-medium text-gray-900">#{sale.id}</td>
                      <td className="td-style text-sm text-gray-500">{sale.created_at ? new Date(sale.created_at).toLocaleString() : 'N/A'}</td>
                      <td className="td-style font-medium text-gray-900">{sale.total_amount.toLocaleString()} RWF</td>
                      <td className="td-style text-sm text-gray-500"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sale.payment_method === 'credit' ? 'bg-orange-100 text-orange-800' : sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{formatPaymentMethod(sale.payment_method)}</span></td>
                      <td className="td-style text-sm text-gray-500">{sale.customers?.name ?? 'Walk-in'}</td>
                      <td className="td-style">{sale.is_returned ? (<span className="font-semibold text-red-600">RETURNED</span>) : (<span className="font-semibold text-green-600">COMPLETED</span>)}</td>
                      {/* --- FIX: Corrected boolean logic --- */}
                      <td className="td-style">{!sale.is_returned ? (<button onClick={() => handleProcessReturn(sale)} disabled={isProcessing !== null} className="action-button bg-red-100 text-red-700 hover:bg-red-200"><Undo2 className="mr-1 h-3 w-3" />{isProcessing === sale.id ? 'Processing...' : 'Return'}</button>) : ('-')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-4 md:hidden">
            {sales.length === 0 ? (<p className="py-10 text-center text-gray-500">No sales recorded.</p>) : (
              sales.map((sale) => (
                <div key={sale.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="font-bold text-gray-900">Sale #{sale.id}</div>
                    <div className={`text-sm font-bold ${sale.is_returned ? 'text-red-600' : 'text-green-600'}`}>{sale.is_returned ? 'RETURNED' : 'COMPLETED'}</div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-gray-900">{sale.total_amount.toLocaleString()} RWF</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sale.payment_method === 'credit' ? 'bg-orange-100 text-orange-800' : sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{formatPaymentMethod(sale.payment_method)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center"><User className="mr-1.5 h-4 w-4" /> {sale.customers?.name ?? 'Walk-in'}</span>
                      {/* --- FIX: Added check for created_at --- */}
                      <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4" /> {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {sale.transaction_reference && (<div className="flex items-center text-sm text-gray-500"><Tag className="mr-1.5 h-4 w-4" /> Ref: {sale.transaction_reference}</div>)}
                  </div>
                  {!sale.is_returned && (
                    <button onClick={() => handleProcessReturn(sale)} disabled={isProcessing !== null} className="action-button mt-3 w-full justify-center bg-red-100 text-red-700 hover:bg-red-200">
                      <Undo2 className="mr-1 h-4 w-4" />
                      {isProcessing === sale.id ? 'Processing...' : 'Process Full Return'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}