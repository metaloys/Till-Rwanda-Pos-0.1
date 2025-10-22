import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Expense } from '../appTypes';
import { BarChart3, CalendarDays, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'; // Icons

export default function Reports() {
  const [dailySalesTotal, setDailySalesTotal] = useState<number>(0);
  const [dailySaleCount, setDailySaleCount] = useState<number>(0);
  const [dailyExpensesTotal, setDailyExpensesTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState(new Date()); // Today's date

  // Function to fetch data for a specific date
  async function fetchReportData(date: Date) {
    setLoading(true);
    setDailySalesTotal(0); // Reset values before fetching
    setDailySaleCount(0);
    setDailyExpensesTotal(0);

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // --- SALES QUERY FIX ---
    const { data: salesData, error: salesError, count: salesCount } = await supabase
      .from('sales')
      .select('total_amount', { count: 'exact' }) // Only select the columns we need
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .neq('is_returned', true); // Only count sales that haven't been returned
    // --- END SALES QUERY FIX ---

    if (salesError) {
      console.error('Error fetching daily sales:', salesError.message);
    } else if (salesData) {
      const total = salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      setDailySalesTotal(total);
      setDailySaleCount(salesCount ?? 0);
    }

    // --- EXPENSES QUERY ---
    const dateString = date.toISOString().split('T')[0];

    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('expense_date', dateString);

    if (expensesError) {
      console.error('Error fetching daily expenses:', expensesError.message);
    } else if (expensesData) {
      const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      setDailyExpensesTotal(total);
    }
    // --- END EXPENSES QUERY ---

    setLoading(false);
  }

  // Fetch summary when the component loads or date changes
  useEffect(() => {
    fetchReportData(reportDate);
  }, [reportDate]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value ? new Date(event.target.value) : new Date();
    const timezoneOffset = newDate.getTimezoneOffset() * 60000;
    setReportDate(new Date(newDate.getTime() + timezoneOffset));
  };

  // --- CALCULATE PROFIT/LOSS ---
  const profitLoss = dailySalesTotal - dailyExpensesTotal;
  const isProfit = profitLoss >= 0;
  // --- END CALCULATION ---

  return (
    <div className="space-y-6">
      {/* Date Selector */}
       <div className="rounded-lg bg-white p-4 shadow mb-6">
         <div className="flex items-center justify-between gap-4">
           <label htmlFor="report-date" className="block text-sm font-medium text-gray-700">
             Report Date:
           </label>
           <div className="flex items-center gap-2">
              <input
                 id="report-date"
                 type="date"
                 value={reportDate.toISOString().split('T')[0]}
                 onChange={handleDateChange}
                 className="input-field py-1 text-sm"
                 disabled={loading}
              />
             <button
               onClick={() => fetchReportData(reportDate)}
               disabled={loading}
               className="action-button rounded-md bg-blue-100 py-1 text-blue-700 hover:bg-blue-200"
               title="Refresh Summary"
             >
               <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
           </div>
         </div>
       </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Sales */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-500 p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Sales</dt>
                  <dd>
                    {loading ? ( <div className="mt-1 h-8 w-24 animate-pulse rounded bg-gray-200"></div> ) : (
                      <div className="text-2xl font-bold text-gray-900">{dailySalesTotal.toLocaleString()} RWF</div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
               {loading ? (<div className="h-4 w-12 animate-pulse rounded bg-gray-200"></div>) : (
                <span className="font-medium text-gray-700">{dailySaleCount}</span>
               )}
              <span className="text-gray-500"> transactions</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
           <div className="p-5">
             <div className="flex items-center">
               <div className="flex-shrink-0 rounded-md bg-red-500 p-3">
                 <TrendingDown className="h-6 w-6 text-white" />
               </div>
               <div className="ml-5 w-0 flex-1">
                 <dl>
                   <dt className="truncate text-sm font-medium text-gray-500">Total Expenses</dt>
                   <dd>
                     {loading ? ( <div className="mt-1 h-8 w-24 animate-pulse rounded bg-gray-200"></div> ) : (
                       <div className="text-2xl font-bold text-gray-900">{dailyExpensesTotal.toLocaleString()} RWF</div>
                     )}
                   </dd>
                 </dl>
               </div>
             </div>
           </div>
         </div>


        {/* Profit / Loss */}
        <div className={`overflow-hidden rounded-lg bg-white shadow ${loading ? '' : isProfit ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
           <div className="p-5">
             <div className="flex items-center">
               <div className={`flex-shrink-0 rounded-md p-3 ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}>
                 <BarChart3 className="h-6 w-6 text-white" />
               </div>
               <div className="ml-5 w-0 flex-1">
                 <dl>
                   <dt className="truncate text-sm font-medium text-gray-500">
                     {isProfit ? 'Net Profit' : 'Net Loss'}
                   </dt>
                   <dd>
                     {loading ? ( <div className="mt-1 h-8 w-24 animate-pulse rounded bg-gray-200"></div> ) : (
                       <div className={`text-2xl font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                         {Math.abs(profitLoss).toLocaleString()} RWF
                       </div>
                     )}
                   </dd>
                 </dl>
               </div>
             </div>
           </div>
           <div className="bg-gray-50 px-5 py-3">
             <div className="text-xs text-gray-500">
               (Total Sales - Total Expenses)
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}