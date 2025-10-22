import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer } from '../appTypes';
import { History, RefreshCw } from 'lucide-react'; // Corrected Icon import

// Define a type for our report data
type DebtorInfo = Customer & {
  last_credit_sale_date: string | null; // Add field for the date
};

export default function CreditAgingReport() {
  const [debtorReport, setDebtorReport] = useState<DebtorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch customers with balances and their last credit sale date
  async function fetchCreditReport() {
    setLoading(true);

    // Step 1: Get debtors
    const { data: debtors, error: debtorsError } = await supabase
      .from('customers')
      .select('*')
      .gt('credit_balance', 0)
      .order('name', { ascending: true });

    if (debtorsError) {
      console.error('Error fetching debtors:', debtorsError.message);
      alert(debtorsError.message); setLoading(false); return;
    }
    if (!debtors || debtors.length === 0) {
      setDebtorReport([]); setLoading(false); return;
    }

    // Step 2: Get last credit sale date for each debtor
    const reportData: DebtorInfo[] = [];
    for (const customer of debtors) {
      const { data: lastSaleData, error: lastSaleError } = await supabase
        .from('sales')
        .select('created_at')
        .eq('customer_id', customer.id)
        .eq('payment_method', 'credit')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSaleError && lastSaleError.code !== 'PGRST116') {
        console.error(`Error fetching last sale for customer ${customer.id}:`, lastSaleError.message);
         reportData.push({ ...customer, last_credit_sale_date: null });
      } else {
         reportData.push({ ...customer, last_credit_sale_date: lastSaleData?.created_at ?? null });
      }
    }

     // Step 3: Sort by oldest last_credit_sale_date
     reportData.sort((a, b) => {
       if (a.last_credit_sale_date === null) return 1;
       if (b.last_credit_sale_date === null) return -1;
       return new Date(a.last_credit_sale_date).getTime() - new Date(b.last_credit_sale_date).getTime();
     });

    setDebtorReport(reportData);
    setLoading(false);
  }

  useEffect(() => {
    fetchCreditReport();
  }, []);

  // Helper to calculate days difference
   const calculateDaysAgo = (dateString: string | null): string => { /* ... same as before ... */
       if (!dateString) return 'N/A'; const saleDate = new Date(dateString); const today = new Date(); saleDate.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0); const diffTime = Math.abs(today.getTime() - saleDate.getTime()); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays === 0) return 'Today'; if (diffDays === 1) return 'Yesterday'; return `${diffDays} days ago`;
   };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="flex items-center text-lg font-semibold text-gray-900">
        {/* --- USE CORRECTED ICON --- */}
        <History className="mr-2 h-5 w-5 text-orange-600" />
        {/* --- END ICON CORRECTION --- */}
        Credit Aging Report (Simplified)
      </h2>
       <p className="mt-1 text-sm text-gray-500">
         Lists customers with outstanding balances, ordered by the date of their last credit purchase.
       </p>
      <button onClick={fetchCreditReport} disabled={loading} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">
        {loading ? 'Refreshing...' : 'Refresh Report'}
      </button>
      <div className="mt-4 flow-root">
        {loading && debtorReport.length === 0 ? (<p>Loading...</p>) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="th-style">Customer Name</th>
                <th className="th-style">Phone</th>
                <th className="th-style">Balance (RWF)</th>
                <th className="th-style">Last Credit Sale</th>
                <th className="th-style">Approx. Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {debtorReport.length === 0 ? (
                <tr><td colSpan={5} className="td-style text-center text-gray-500">No outstanding credit found.</td></tr>
              ) : (
                debtorReport.map((customer) => (
                  <tr key={customer.id}>
                    <td className="td-style font-medium text-gray-900">{customer.name}</td>
                    <td className="td-style text-sm text-gray-500">{customer.phone || 'N/A'}</td>
                    <td className="td-style font-semibold text-red-600">{customer.credit_balance.toLocaleString()} RWF</td>
                    <td className="td-style text-sm text-gray-500">{customer.last_credit_sale_date ? new Date(customer.last_credit_sale_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="td-style text-sm text-gray-500">{calculateDaysAgo(customer.last_credit_sale_date)}</td>
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