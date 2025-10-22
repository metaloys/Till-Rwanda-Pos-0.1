import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { ProductVariant, Expense, UserRole } from '../appTypes';
import { ShoppingCart, DollarSign, TrendingUp, TrendingDown, Package, Users, AlertTriangle } from 'lucide-react';

// Define threshold locally for display consistency
const LOW_STOCK_THRESHOLD = 5;

// Define a combined type for reports
type DailyMetrics = {
    salesTotal: number;
    expenseTotal: number;
    profit: number;
    salesCount: number;
};

export default function Overview() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DailyMetrics>({ salesTotal: 0, expenseTotal: 0, profit: 0, salesCount: 0 });
    const [lowStockItems, setLowStockItems] = useState<ProductVariant[]>([]);

    async function fetchDailyMetrics() {
        setLoading(true);

        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0); 
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        const dateString = today.toISOString().split('T')[0];

        // 1. Fetch Sales for Today
        const { data: salesData, error: salesError, count: salesCount } = await supabase
            .from('sales')
            .select('total_amount', { count: 'exact' })
            .gte('created_at', startISO)
            .lte('created_at', endISO)
            .neq('is_returned', true);

        const salesTotal = salesData ? salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) : 0;
        
        // 2. Fetch Expenses for Today
        const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('amount')
            .eq('expense_date', dateString);

        const expenseTotal = expensesData ? expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0) : 0;
        
        // 3. Fetch Low Stock Items (Top 5)
        const { data: stockData, error: stockError } = await supabase
            .from('product_variants')
            .select('*')
            .lte('stock_quantity', LOW_STOCK_THRESHOLD)
            .order('stock_quantity', { ascending: true }) // Show lowest stock first
            .limit(5);

        // 4. Update State
        setMetrics({
            salesTotal,
            expenseTotal,
            profit: salesTotal - expenseTotal,
            salesCount: salesCount ?? 0,
        });

        if (stockData) {
            setLowStockItems(stockData as ProductVariant[]);
        }

        if (salesError || expensesError || stockError) {
            console.error('Error fetching dashboard data:', salesError?.message || expensesError?.message || stockError?.message);
        }

        setLoading(false);
    }

    useEffect(() => {
        fetchDailyMetrics();
    }, []);
    
    const isProfit = metrics.profit >= 0;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-800 border-b pb-3">Today's Performance Summary</h1>

            {/* Daily Metrics Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* 1. Total Sales */}
                <div className="rounded-lg bg-white p-5 shadow">
                    <p className="text-sm font-medium text-gray-500">Sales Amount</p>
                    {loading ? (<div className="h-8 w-24 animate-pulse rounded bg-gray-200 mt-1"></div>) : (
                        <p className="mt-1 text-2xl font-bold text-green-700">
                            {metrics.salesTotal.toLocaleString()} RWF
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{metrics.salesCount} transactions</p>
                </div>

                {/* 2. Total Expenses */}
                <div className="rounded-lg bg-white p-5 shadow">
                    <p className="text-sm font-medium text-gray-500">Expenses</p>
                    {loading ? (<div className="h-8 w-24 animate-pulse rounded bg-gray-200 mt-1"></div>) : (
                        <p className="mt-1 text-2xl font-bold text-red-700">
                            {metrics.expenseTotal.toLocaleString()} RWF
                        </p>
                    )}
                </div>

                {/* 3. Net Profit / Loss */}
                <div className={`rounded-lg p-5 shadow ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-sm font-medium text-gray-500">{isProfit ? 'Net Profit' : 'Net Loss'}</p>
                    {loading ? (<div className="h-8 w-24 animate-pulse rounded bg-gray-200 mt-1"></div>) : (
                        <p className="mt-1 text-2xl font-bold" style={{ color: isProfit ? '#10B981' : '#EF4444' }}>
                            {Math.abs(metrics.profit).toLocaleString()} RWF
                        </p>
                    )}
                </div>
                
                {/* 4. Total Staff (Static Placeholder) */}
                 <div className="rounded-lg bg-white p-5 shadow">
                    <p className="text-sm font-medium text-gray-500">Staff Accounts</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-700">
                        {/* Note: Fetching this would require an admin query, so we use a placeholder */}
                        <Users className="h-7 w-7 inline mr-2 align-middle" /> 3+
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Manage Roles in Settings</p>
                </div>
            </div>

            {/* Low Stock Section */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="flex items-center text-lg font-semibold text-gray-900 border-b pb-3">
                    <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                    Low Stock Alerts (Top 5)
                </h2>
                {loading ? (<p className="py-4 text-center">Checking stock...</p>) : lowStockItems.length === 0 ? (
                    <p className="py-4 text-center text-green-600 font-medium">No immediate low stock items (Threshold: {LOW_STOCK_THRESHOLD}).</p>
                ) : (
                    <ul className="mt-4 divide-y divide-gray-100">
                        {lowStockItems.map(item => (
                            <li key={item.id} className="flex justify-between items-center py-3">
                                <div className="flex items-center space-x-3">
                                    <Package className="h-5 w-5 text-gray-400" />
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-red-600">
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