import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Sale, Customer } from '../appTypes';
import { List, RefreshCw, Undo2 } from 'lucide-react'; // Added Undo2 icon

// Define a type that combines Sale with optional Customer details
type SaleWithCustomer = Sale & {
  customers: { name: string } | null;
};

export default function SalesHistory() {
  const [sales, setSales] = useState<SaleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null); // To track which sale is being returned

  // Fetch sales data, joining with customers table to get names
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

  // Fetch sales when the component loads
  useEffect(() => {
    fetchSalesHistory();
  }, []);

  // --- NEW FUNCTION: Process Refund and Stock Reversal ---
  const handleProcessReturn = async (sale: SaleWithCustomer) => {
    if (sale.is_returned || isProcessing) return;

    if (!confirm(`Confirm return for Sale ID ${sale.id}?\n\nThis will RESTOCK all items and mark the sale as returned.\nTotal Refund: ${sale.total_amount.toLocaleString()} RWF`)) {
      return;
    }

    setIsProcessing(sale.id as number);
    
    try {
      // 1. Get all items sold in this transaction
      const { data: items, error: itemsError } = await supabase
        .from('sale_items')
        .select('variant_id, quantity')
        .eq('sale_id', sale.id);

      if (itemsError || !items || items.length === 0) {
        throw new Error(itemsError?.message || 'Could not find sale items to restock.');
      }

      // 2. Perform Stock Reversal
      const stockReversalPromises = items.map(item => {
        // Quantity change is POSITIVE because we are adding the stock back
        return supabase.rpc('update_stock', {
          variant_id_to_update: item.variant_id as number,
          quantity_change: item.quantity,
        });
      });

      // Wait for all stock updates to complete
      const stockResults = await Promise.all(stockReversalPromises);
      stockResults.forEach(res => {
         if (res.error) console.error("Stock Reversal Error:", res.error.message);
      });

      // 3. Mark the original sale as returned
      const { error: saleUpdateError } = await supabase
        .from('sales')
        .update({ is_returned: true })
        .eq('id', sale.id);

      if (saleUpdateError) {
        throw new Error(`Failed to mark sale as returned: ${saleUpdateError.message}`);
      }
      
      // 4. Handle Credit Balance Reversal (if applicable)
      if (sale.payment_method === 'credit' && sale.customer_id) {
          const { data: customer, error: fetchCustError } = await supabase
             .from('customers')
             .select('credit_balance')
             .eq('id', sale.customer_id)
             .single();
          
          if (!fetchCustError && customer) {
              const newBalance = customer.credit_balance - sale.total_amount;
              const { error: balanceError } = await supabase
                  .from('customers')
                  .update({ credit_balance: newBalance })
                  .eq('id', sale.customer_id);

              if (balanceError) console.error("Balance Reversal Error:", balanceError.message);
              // A real system would insert a negative 'credit_payment' transaction here
          }
      }

      // Success
      alert(`Sale ID ${sale.id} successfully returned!\nStock reversed and customer balance (if credit) reduced.`);
      fetchSalesHistory(); // Refresh the list to show the 'Returned' status

    } catch (error: any) {
      alert(`Return failed: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };
  // --- END NEW FUNCTION ---

  // Helper to format payment method names
  const formatPaymentMethod = (method: string) => {
    return method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="flex items-center text-lg font-semibold text-gray-900">
        <List className="mr-2 h-5 w-5" />
        Sales History
      </h2>
      <button
        onClick={fetchSalesHistory}
        disabled={loading}
        className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : 'Refresh List'}
      </button>
      <div className="mt-4 flow-root">
        {loading && sales.length === 0 ? (
          <p>Loading sales history...</p>
        ) : (
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
                <tr>
                  <td colSpan={7} className="td-style text-center text-gray-500">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="td-style font-medium text-gray-900">#{sale.id}</td>
                    <td className="td-style text-sm text-gray-500">
                      {sale.created_at ? new Date(sale.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="td-style font-medium text-gray-900">
                      {sale.total_amount.toLocaleString()} RWF
                    </td>
                    <td className="td-style text-sm text-gray-500">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sale.payment_method === 'credit' ? 'bg-orange-100 text-orange-800' : sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {formatPaymentMethod(sale.payment_method)}
                      </span>
                    </td>
                    <td className="td-style text-sm text-gray-500">
                      {sale.customers?.name ?? 'Walk-in'}
                    </td>
                    <td className="td-style">
                       {sale.is_returned ? (
                           <span className="font-semibold text-red-600">RETURNED</span>
                       ) : (
                           <span className="font-semibold text-green-600">COMPLETED</span>
                       )}
                    </td>
                    {/* --- ADD ACTIONS BUTTON --- */}
                    <td className="td-style">
                        {!sale.is_returned ? (
                             <button
                                 onClick={() => handleProcessReturn(sale)}
                                 disabled={isProcessing === sale.id}
                                 className="action-button bg-red-100 text-red-700 hover:bg-red-200"
                             >
                                 <Undo2 className="mr-1 h-3 w-3" />
                                 {isProcessing === sale.id ? 'Processing...' : 'Process Return'}
                             </button>
                        ) : (
                            'Refund Complete'
                        )}
                    </td>
                    {/* --- END ACTIONS BUTTON --- */}
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