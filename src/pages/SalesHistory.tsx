import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Sale, Profile, UserRole } from '../appTypes'; // Import Profile and UserRole
import { List, Undo2 } from 'lucide-react';

// --- NEW: Define props ---
interface SalesHistoryProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}
// --- END NEW ---

type SaleWithCustomer = Sale & { customers: { name: string } | null; };

export default function SalesHistory({ shopId }: SalesHistoryProps) { // Receive props
  const [sales, setSales] = useState<SaleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  async function fetchSalesHistory() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers ( name )')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales history:', error.message);
      alert(error.message);
    } else if (data) {
      setSales(data as SaleWithCustomer[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (shopId) fetchSalesHistory();
  }, [shopId]); // Depend on shopId

  const handleProcessReturn = async (sale: SaleWithCustomer) => {
    if (sale.is_returned || isProcessing) return;
    if (!confirm(`Confirm return for Sale ID ${sale.id}?\nTotal Refund: ${sale.total_amount.toLocaleString()} RWF`)) {
      return;
    }
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
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="flex items-center text-lg font-semibold text-gray-900"><List className="mr-2 h-5 w-5" />Sales History</h2>
      <button onClick={fetchSalesHistory} disabled={loading || isProcessing} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh List'}</button>
      <div className="mt-4 flow-root overflow-x-auto">
        {loading ? (<p>Loading...</p>) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="th-style">Sale ID</th>
                <th className="th-style">Date / Time</th>
                <th className="th-style">Total Amount</th>
                <th className="th-style">Payment Method</th>
                <th className="th-style">Customer</th>
                <th className="th-style">Status</th>
                <th className="th-style">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sales.length === 0 ? (
                <tr><td colSpan={7} className="td-style text-center text-gray-500">No sales recorded yet.</td></tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="td-style font-medium text-gray-900">#{sale.id}</td>
                    <td className="td-style text-sm text-gray-500">{sale.created_at ? new Date(sale.created_at).toLocaleString() : 'N/A'}</td>
                    <td className="td-style font-medium text-gray-900">{sale.total_amount.toLocaleString()} RWF</td>
                    <td className="td-style text-sm text-gray-500"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sale.payment_method === 'credit' ? 'bg-orange-100 text-orange-800' : sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{formatPaymentMethod(sale.payment_method)}</span></td>
                    <td className="td-style text-sm text-gray-500">{sale.customers?.name ?? 'Walk-in'}</td>
                    <td className="td-style">{sale.is_returned ? (<span className="font-semibold text-red-600">RETURNED</span>) : (<span className="font-semibold text-green-600">COMPLETED</span>)}</td>
                    <td className="td-style">{!sale.is_returned ? (<button onClick={() => handleProcessReturn(sale)} disabled={isProcessing === sale.id} className="action-button bg-red-100 text-red-700 hover:bg-red-200"><Undo2 className="mr-1 h-3 w-3" />{isProcessing === sale.id ? 'Processing...' : 'Process Return'}</button>) : ('Refund Complete')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}