import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Profile, UserRole } from '../appTypes';
// --- FIX: Added RefreshCw back to the import list ---
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Star, Warehouse, Archive, DollarSign, Users } from 'lucide-react';

interface ReportsProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}

type TopProduct = { variant_id: number; name: string; parent_product_name: string; total_sold: number; };
type SlowProduct = { variant_id: number; name: string; parent_product_name: string; stock_quantity: number; price: number; };
type StaffSale = { staff_name: string; staff_role: string; total_sales_amount: number; total_transactions: number; };

export default function Reports({ shopId }: ReportsProps) {
  const [dailySalesTotal, setDailySalesTotal] = useState<number>(0);
  const [dailySaleCount, setDailySaleCount] = useState<number>(0);
  const [dailyExpensesTotal, setDailyExpensesTotal] = useState<number>(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [inventoryValue, setInventoryValue] = useState<number>(0);
  const [slowProducts, setSlowProducts] = useState<SlowProduct[]>([]);
  const [staffSales, setStaffSales] = useState<StaffSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState(new Date());

  async function fetchReportData(date: Date) { 
    setLoading(true); 
    setDailySalesTotal(0); setDailySaleCount(0); setDailyExpensesTotal(0); 
    setTopProducts([]); setInventoryValue(0); setSlowProducts([]); setStaffSales([]);

    const startDate = new Date(date); startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date); endDate.setHours(23, 59, 59, 999);
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    const dateString = date.toISOString().split('T')[0];

    const [salesResult, expensesResult, topProductsResult, inventoryResult, slowProductsResult, staffSalesResult] = await Promise.all([
        supabase.from('sales').select('total_amount', { count: 'exact' }).gte('created_at', startISO).lte('created_at', endISO).neq('is_returned', true),
        supabase.from('expenses').select('amount').eq('expense_date', dateString),
        supabase.rpc('get_top_selling_products', { p_shop_id: shopId }),
        supabase.rpc('get_inventory_valuation', { p_shop_id: shopId }),
        supabase.rpc('get_slow_moving_inventory', { p_shop_id: shopId, days_limit: 90 }),
        supabase.rpc('get_sales_by_staff', { p_shop_id: shopId })
    ]);

    if (salesResult.data) { const total = salesResult.data.reduce((sum, sale) => sum + (sale.total_amount || 0), 0); setDailySalesTotal(total); setDailySaleCount(salesResult.count ?? 0); }
    if (expensesResult.data) { const total = expensesResult.data.reduce((sum, expense) => sum + (expense.amount || 0), 0); setDailyExpensesTotal(total); }
    if (topProductsResult.data) { setTopProducts(topProductsResult.data); }
    if (inventoryResult.data) { setInventoryValue(inventoryResult.data); }
    if (slowProductsResult.data) { setSlowProducts(slowProductsResult.data); }
    if (staffSalesResult.data) { setStaffSales(staffSalesResult.data); }
    
    if (salesResult.error || expensesResult.error || topProductsResult.error || inventoryResult.error || slowProductsResult.error || staffSalesResult.error) {
      console.error('Error fetching report data:', salesResult.error?.message, expensesResult.error?.message, topProductsResult.error?.message, inventoryResult.error?.message, slowProductsResult.error?.message, staffSalesResult.error?.message);
    }
    setLoading(false);
  }

  useEffect(() => { if(shopId) fetchReportData(reportDate); }, [reportDate, shopId]);
  
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
    const newDate = event.target.value ? new Date(event.target.value) : new Date(); 
    const timezoneOffset = newDate.getTimezoneOffset() * 60000; 
    setReportDate(new Date(newDate.getTime() + timezoneOffset)); 
  };

  const profitLoss = dailySalesTotal - dailyExpensesTotal;
  const isProfit = profitLoss >= 0;

  return ( 
    <div className="space-y-6">
      <div className="rounded-lg bg-white dark:bg-slate-800 p-4 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <label htmlFor="report-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Daily Report Date:</label>
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
              className="action-button rounded-md bg-indigo-100 dark:bg-slate-700 py-1 px-2 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-slate-600" 
              title="Refresh Summary"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-800 shadow-lg"><div className="p-5"><div className="flex items-center"><div className="flex-shrink-0 rounded-md bg-green-500 p-3"><TrendingUp className="h-6 w-6 text-white" /></div><div className="ml-5 w-0 flex-1"><dl><dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Sales</dt><dd>{loading ? ( <div className="mt-1 h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div> ) : (<div className="text-2xl font-bold text-slate-900 dark:text-white">{dailySalesTotal.toLocaleString()} RWF</div>)}</dd></dl></div></div></div><div className="bg-slate-50 dark:bg-slate-700/50 px-5 py-3"><div className="text-sm">{loading ? (<div className="h-4 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-600"></div>) : (<span className="font-medium text-slate-700 dark:text-slate-300">{dailySaleCount}</span>)}<span className="text-slate-500 dark:text-slate-400"> transactions</span></div></div></div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-800 shadow-lg"><div className="p-5"><div className="flex items-center"><div className="flex-shrink-0 rounded-md bg-red-500 p-3"><TrendingDown className="h-6 w-6 text-white" /></div><div className="ml-5 w-0 flex-1"><dl><dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Expenses</dt><dd>{loading ? ( <div className="mt-1 h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div> ) : (<div className="text-2xl font-bold text-slate-900 dark:text-white">{dailyExpensesTotal.toLocaleString()} RWF</div>)}</dd></dl></div></div></div></div>
        <div className={`overflow-hidden rounded-lg bg-white dark:bg-slate-800 shadow-lg ${loading ? '' : isProfit ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}><div className="p-5"><div className="flex items-center"><div className={`flex-shrink-0 rounded-md p-3 ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}><BarChart3 className="h-6 w-6 text-white" /></div><div className="ml-5 w-0 flex-1"><dl><dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{isProfit ? 'Net Profit' : 'Net Loss'}</dt><dd>{loading ? ( <div className="mt-1 h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div> ) : (<div className={`text-2xl font-bold ${isProfit ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>{Math.abs(profitLoss).toLocaleString()} RWF</div>)}</dd></dl></div></div></div><div className="bg-slate-50 dark:bg-slate-700/50 px-5 py-3"><div className="text-xs text-slate-500 dark:text-slate-400">(Sales - Expenses)</div></div></div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-800 shadow-lg sm:col-span-2 lg:col-span-1"><div className="p-5"><div className="flex items-center"><div className="flex-shrink-0 rounded-md bg-purple-500 p-3"><Warehouse className="h-6 w-6 text-white" /></div><div className="ml-5 w-0 flex-1"><dl><dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Inventory Value</dt><dd>{loading ? ( <div className="mt-1 h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div> ) : (<div className="text-2xl font-bold text-slate-900 dark:text-white">{inventoryValue.toLocaleString()} RWF</div>)}</dd></dl></div></div></div></div>
      </div>
      
      <div className="rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-lg"><h2 className="card-header flex items-center border-b border-slate-200 dark:border-slate-700 pb-3"><Users className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />Sales Performance by Staff (All Time)</h2>
        <div className="mt-4 flow-root overflow-x-auto">
            {loading ? (<p className="py-4 text-center text-slate-500 dark:text-slate-400">Calculating...</p>) : staffSales.length === 0 ? (<p className="py-4 text-center text-slate-500 dark:text-slate-400">No staff sales found.</p>) : (
                <><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 hidden md:table"><thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="th-style">Staff Name</th><th className="th-style">Role</th><th className="th-style">Transactions</th><th className="th-style text-right">Total Sales</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">{staffSales.map((staff, index) => (<tr key={index}><td className="td-style font-medium text-slate-900 dark:text-white">{staff.staff_name}</td><td className="td-style capitalize text-sm text-slate-500 dark:text-slate-400">{staff.staff_role}</td><td className="td-style text-sm text-blue-600 dark:text-blue-400">{staff.total_transactions}</td><td className="td-style text-right font-bold text-green-600 dark:text-green-500">{staff.total_sales_amount.toLocaleString()} RWF</td></tr>))}</tbody></table>
                    <div className="space-y-4 md:hidden">{staffSales.map((staff, index) => (<div key={index} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"><div className="flex items-center justify-between"><div className="font-bold text-slate-900 dark:text-white">{staff.staff_name}</div><div className="rounded-full bg-indigo-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 capitalize">{staff.staff_role}</div></div><div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400"><div className="flex items-center"><TrendingUp className="mr-2 h-4 w-4 text-green-500" /> Sales: {staff.total_sales_amount.toLocaleString()} RWF</div><div className="flex items-center"><Users className="mr-2 h-4 w-4" /> Txns: {staff.total_transactions}</div></div></div>))}</div>
                </>
            )}
        </div>
      </div>

      <div className="rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-lg"><h2 className="card-header flex items-center border-b border-slate-200 dark:border-slate-700 pb-3"><Star className="mr-2 h-5 w-5 text-yellow-500" />Top Selling Products (All Time)</h2>
        <div className="mt-4 flow-root overflow-x-a-uto">
            {loading ? (<p className="py-4 text-center text-slate-500 dark:text-slate-400">Calculating...</p>) : topProducts.length === 0 ? (<p className="py-4 text-center text-slate-500 dark:text-slate-400">No sales data found.</p>) : (
                <><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 hidden md:table"><thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="th-style">Rank</th><th className="th-style">Product</th><th className="th-style">Variant</th><th className="th-style text-right">Units Sold</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">{topProducts.map((product, index) => (<tr key={product.variant_id}><td className="td-style font-bold text-slate-400">{index + 1}</td><td className="td-style font-medium text-slate-900 dark:text-white">{product.parent_product_name}</td><td className="td-style text-sm text-slate-500 dark:text-slate-400">{product.name}</td><td className="td-style text-right font-semibold text-blue-600 dark:text-blue-400">{product.total_sold}</td></tr>))}</tbody></table>
                <div className="mt-4 space-y-4 md:hidden">{topProducts.map((product, index) => (<div key={product.variant_id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center space-x-3"><span className="text-xl font-bold text-slate-400">#{index + 1}</span><div><div className="font-bold text-slate-900 dark:text-white">{product.parent_product_name}</div><div className="text-sm text-slate-600 dark:text-slate-400">{product.name}</div></div></div><div className="text-right"><div className="font-bold text-lg text-blue-600 dark:text-blue-400">{product.total_sold}</div><div className="text-xs text-slate-500 dark:text-slate-400">Units Sold</div></div></div></div>))}</div></>
            )}
        </div>
      </div>
      
      <div className="rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-lg"><h2 className="card-header flex items-center border-b border-slate-200 dark:border-slate-700 pb-3"><Archive className="mr-2 h-5 w-5 text-slate-500" />Slow-Moving Inventory (No Sales in 90 Days)</h2>
        <div className="mt-4 flow-root overflow-x-auto">
            {loading ? (<p className="py-4 text-center text-slate-500 dark:text-slate-400">Checking...</p>) : slowProducts.length === 0 ? (<p className="py-4 text-center text-green-600 dark:text-green-500 font-medium">No slow-moving items found!</p>) : (
                <><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 hidden md:table"><thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="th-style">Product</th><th className="th-style">Variant</th><th className="th-style">In Stock</th><th className="th-style">Value (RWF)</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">{slowProducts.map((product) => (<tr key={product.variant_id}><td className="td-style font-medium text-slate-900 dark:text-white">{product.parent_product_name}</td><td className="td-style text-sm text-slate-500 dark:text-slate-400">{product.name}</td><td className="td-style font-semibold text-red-600 dark:text-red-500">{product.stock_quantity}</td><td className="td-style text-sm text-slate-500 dark:text-slate-400">{(product.stock_quantity * product.price).toLocaleString()}</td></tr>))}</tbody></table>
                <div className="mt-4 space-y-4 md:hidden">{slowProducts.map((product) => (<div key={product.variant_id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"><div className="flex items-center justify-between"><div><div className="font-bold text-slate-900 dark:text-white">{product.parent_product_name}</div><div className="text-sm text-slate-600 dark:text-slate-400">{product.name}</div></div><div className="text-right"><div className="font-bold text-lg text-red-600 dark:text-red-500">{product.stock_quantity}</div><div className="text-xs text-slate-500 dark:text-slate-400">In Stock</div></div></div><div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3 text-sm text-slate-600 dark:text-slate-400"><div className="flex items-center"><DollarSign className="mr-2 h-4 w-4" /> Stock Value: <span className="ml-1 font-medium text-slate-800 dark:text-slate-200">{(product.stock_quantity * product.price).toLocaleString()} RWF</span></div></div></div>))}</div></>
            )}
         </div>
      </div>
    </div>
  );
}