import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { ProductVariant, UserRole, Profile } from '../appTypes';
import { Package, Users, AlertTriangle } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 5;
type DailyMetrics = { salesTotal: number; expenseTotal: number; profit: number; salesCount: number; };

interface StockItem extends ProductVariant {
  products?: { name: string; shop_id: string };
}

interface OverviewProps {
  shopId: string;
  userRole: UserRole;
  profile: Profile;
}

export default function Overview({ shopId }: OverviewProps) {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DailyMetrics>({ salesTotal: 0, expenseTotal: 0, profit: 0, salesCount: 0 });
    const [lowStockItems, setLowStockItems] = useState<ProductVariant[]>([]);

    const fetchDailyMetrics = useCallback(async () => {
        setLoading(true);
        const today = new Date();
        const startDate = new Date(today); startDate.setHours(0, 0, 0, 0); 
        const endDate = new Date(today); endDate.setHours(23, 59, 59, 999);
        const startISO = startDate.toISOString(); const endISO = endDate.toISOString();
        
        // Use local date string for expense_date comparison (not UTC)
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        console.log('📊 Fetching metrics for:', dateString, 'Sales ISO:', startISO, 'to', endISO);

        const { data: salesData, error: salesError, count: salesCount } = await supabase.from('sales').select('total_amount', { count: 'exact' }).eq('shop_id', shopId).gte('created_at', startISO).lte('created_at', endISO).neq('is_returned', true);
        const salesTotal = salesData ? salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) : 0;
        
        const { data: expensesData, error: expensesError } = await supabase.from('expenses').select('amount').eq('shop_id', shopId).eq('expense_date', dateString);
        console.log('💰 Expenses for', dateString, ':', expensesData);
        const expenseTotal = expensesData ? expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0) : 0;
        
        // Get low stock items - properly filtered by shop_id through products table
        const { data: stockData, error: stockError } = await supabase
          .from('product_variants')
          .select('*, products(name, shop_id)')
          .lte('stock_quantity', LOW_STOCK_THRESHOLD)
          .order('stock_quantity', { ascending: true })
          .limit(5);

        setMetrics({ salesTotal, expenseTotal, profit: salesTotal - expenseTotal, salesCount: salesCount ?? 0, });
        
        if (stockData) { 
          // Filter by shop_id and safe mapping for variant names
          const filteredStockData = (stockData as StockItem[]).filter(item => item.products?.shop_id === shopId);
          const namedStockData = filteredStockData.map((item) => ({
            ...item,
            name: `${item.products?.name || 'Product'} - ${item.name || 'Variant'}`
          }));
          setLowStockItems(namedStockData as ProductVariant[]); 
        }
        if (salesError || expensesError || stockError) { console.error('Error fetching dashboard data:', salesError?.message || expensesError?.message || stockError?.message); }
        setLoading(false);
    }, [shopId]);
    
    useEffect(() => { 
        if (shopId) fetchDailyMetrics(); 
    }, [shopId, fetchDailyMetrics]);
    
    const isProfit = metrics.profit >= 0;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 border-b-2 border-brand-600 pb-4">Today's Performance Summary</h1>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                
                <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-card hover:shadow-card-hover transition-all transform hover:scale-105 duration-200">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sales Amount</p>
                    {loading ? (<div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 mt-2 animate-shimmer"></div>) : (
                        <p className="mt-3 text-3xl font-black text-success-600 dark:text-success-500 animate-fade-in">
                            {metrics.salesTotal.toLocaleString()} RWF
                        </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{metrics.salesCount} transactions</p>
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-card hover:shadow-card-hover transition-all transform hover:scale-105 duration-200">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Expenses</p>
                    {loading ? (<div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 mt-2 animate-shimmer"></div>) : (
                        <p className="mt-3 text-3xl font-black text-danger-600 dark:text-danger-500 animate-fade-in">
                            {metrics.expenseTotal.toLocaleString()} RWF
                        </p>
                    )}
                </div>

                <div className={`rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all ${isProfit ? 'bg-success-50 dark:bg-success-900/30' : 'bg-danger-50 dark:bg-danger-900/30'}`}>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{isProfit ? 'Net Profit' : 'Net Loss'}</p>
                    {loading ? (<div className="h-8 w-24 animate-shimmer rounded bg-slate-200 dark:bg-slate-700 mt-1"></div>) : (
                        <p className={`mt-1 text-3xl font-black ${isProfit ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500'}`}>
                            {Math.abs(metrics.profit).toLocaleString()} RWF
                        </p>
                    )}
                </div>
                
                 <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-card hover:shadow-card-hover transition-all">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Staff Accounts</p>
                    <p className="mt-1 text-3xl font-black text-brand-600 dark:text-brand-400">
                        <Users className="h-7 w-7 inline mr-2 align-middle" /> 3+
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage Roles in Settings</p>
                </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-card hover:shadow-card-hover transition-all">
                <h2 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white border-b border-brand-600 dark:border-brand-500 pb-3">
                    <AlertTriangle className="mr-2 h-5 w-5 text-danger-500" />
                    Low Stock Alerts (Top 5)
                </h2>
                {loading ? (<p className="py-4 text-center text-slate-500 dark:text-slate-400">Checking stock...</p>) : lowStockItems.length === 0 ? (
                    <p className="py-4 text-center text-success-600 dark:text-success-500 font-medium">No immediate low stock items (Threshold: {LOW_STOCK_THRESHOLD}).</p>
                ) : (
                    <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
                        {lowStockItems.map(item => (
                            <li key={item.id} className="flex justify-between items-center py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-2 rounded-lg transition-colors">
                                <div className="flex items-center space-x-3">
                                    <Package className="h-5 w-5 text-brand-400" />
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-danger-600 dark:text-danger-500">
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