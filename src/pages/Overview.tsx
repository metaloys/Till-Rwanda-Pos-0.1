import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Profile, ProductVariant } from '../appTypes'; 
import { Package, Users, AlertTriangle } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 5;
type DailyMetrics = { salesTotal: number; expenseTotal: number; profit: number; salesCount: number; };

// Define the props interface
interface OverviewProps {
  profile: Profile;
}

export default function Overview({ profile }: OverviewProps) {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DailyMetrics>({ salesTotal: 0, expenseTotal: 0, profit: 0, salesCount: 0 });
    const [lowStockItems, setLowStockItems] = useState<ProductVariant[]>([]);

    async function fetchDailyMetrics(shopId: string) {
        setLoading(true);

        try {
            if (!shopId) {
                throw new Error("Shop ID not provided.");
            }

            // --- Date setup ---
            const today = new Date();
            const startDate = new Date(today); startDate.setHours(0, 0, 0, 0); 
            const endDate = new Date(today); endDate.setHours(23, 59, 59, 999);
            const startISO = startDate.toISOString(); const endISO = endDate.toISOString();
            const dateString = today.toISOString().split('T')[0];

            // FIX 1: Use shopId from props
            const { data: salesData, error: salesError, count: salesCount } = await supabase
                .from('sales')
                .select('total_amount', { count: 'exact' })
                .eq('shop_id', shopId) 
                .gte('created_at', startISO)
                .lte('created_at', endISO)
                .neq('is_returned', true);
            if (salesError) throw salesError;
            const salesTotal = salesData ? salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) : 0;
            
            // FIX 2: Use shopId from props
            const { data: expensesData, error: expensesError } = await supabase
                .from('expenses')
                .select('amount')
                .eq('shop_id', shopId) 
                .eq('expense_date', dateString);
            if (expensesError) throw expensesError;
            const expenseTotal = expensesData ? expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0) : 0;
            
            // FIX 3: Use shopId from props
            const { data: stockData, error: stockError } = await supabase
                .from('product_variants')
                .select('*, products!inner(name, shop_id)') 
                .eq('products.shop_id', shopId)
                .lte('stock_quantity', LOW_STOCK_THRESHOLD)
                .order('stock_quantity', { ascending: true })
                .limit(5);
            if (stockError) throw stockError;

            // --- Set State ---
            setMetrics({ salesTotal, expenseTotal, profit: salesTotal - expenseTotal, salesCount: salesCount ?? 0, });
            
            if (stockData) { 
                const namedStockData = stockData.map((item: any) => ({
                    ...item,
                    name: `${item.products?.name || 'Product'} - ${item.name || 'Variant'}`
                }));
                setLowStockItems(namedStockData as ProductVariant[]); 
            }

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setLoading(false);
        }
    }

    // This effect now watches for the profile prop
    useEffect(() => {
      if (profile && profile.shop_id) {
        fetchDailyMetrics(profile.shop_id);
      }
    }, [profile]); // It runs when the profile is loaded

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-3">Today's Performance Summary</h1>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* Sales Amount Card */}
                <div className="rounded-lg bg-white dark:bg-slate-800 p-5 shadow-lg">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sales Amount</p>
                    {loading ? (<div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700 mt-1"></div>) : (
                        <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-500">
                            {metrics.salesTotal.toLocaleString()} RWF
                        </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{metrics.salesCount} transactions</p>
                </div>

                {/* Expenses Card */}
                <div className="rounded-lg bg-white dark:bg-slate-800 p-5 shadow-lg">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expenses</p>
                    {loading ? (<div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700 mt-1"></div>) : (
                        <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-500">
                            {metrics.expenseTotal.toLocaleString()} RWF
                        </p>
                    )}
                </div>

                {/* Profit/Loss Card */}
                <div className={`rounded-lg p-5 shadow-lg ${metrics.profit >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metrics.profit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
                    {loading ? (<div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700 mt-1"></div>) : (
                        <p className={`mt-1 text-2xl font-bold ${metrics.profit >= 0 ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                            {Math.abs(metrics.profit).toLocaleString()} RWF
                        </p>
                    )}
                </div>
                
                {/* Staff Card (Static) */}
                <div className="rounded-lg bg-white dark:bg-slate-800 p-5 shadow-lg">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Staff Accounts</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                        <Users className="h-7 w-7 inline mr-2 align-middle" /> 3+
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage Roles in Settings</p>
                </div>
            </div>

            {/* Low Stock Alert Card */}
            <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-lg">
                <h2 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3">
                    <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                    Low Stock Alerts (Top 5)
                </h2>
                {loading ? (<p className="py-4 text-center text-slate-500 dark:text-slate-400">Checking stock...</p>) : lowStockItems.length === 0 ? (
                    <p className="py-4 text-center text-green-600 dark:text-green-500 font-medium">No immediate low stock items (Threshold: {LOW_STOCK_THRESHOLD}).</p>
                ) : (
                    <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
                        {lowStockItems.map(item => (
                            <li key={item.id} className="flex justify-between items-center py-3">
                                <div className="flex items-center space-x-3">
                                    <Package className="h-5 w-5 text-slate-400" />
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-red-600 dark:text-red-500">
                                    {item.stock_quantity} left
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}