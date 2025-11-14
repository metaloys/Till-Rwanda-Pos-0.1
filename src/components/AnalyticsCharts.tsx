import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Sale, SaleItem } from '../appTypes';

interface Expense {
  id: string;
  amount: number;
  description?: string;
  created_at?: string;
}

interface AnalyticsChartsProps {
  sales: Sale[];
  saleItems: SaleItem[];
  expenses?: Expense[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Analytics Dashboard with Recharts visualizations
 */
export default function AnalyticsCharts({ sales, saleItems, expenses = [] }: AnalyticsChartsProps) {
  // Daily sales trend
  const dailySalesTrend = useMemo(() => {
    const grouped = new Map<string, { date: string; revenue: number; count: number }>();

    sales.forEach((sale) => {
      const date = new Date(sale.created_at || '').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!grouped.has(date)) {
        grouped.set(date, { date, revenue: 0, count: 0 });
      }

      const entry = grouped.get(date)!;
      entry.revenue += sale.total_amount || 0;
      entry.count += 1;
    });

    return Array.from(grouped.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales]);

  // Top products by quantity sold
  const topProducts = useMemo(() => {
    const grouped = new Map<string, { name: string; quantity: number; revenue: number }>();

    saleItems.forEach((item) => {
      const name = `Product ${item.product_id}`;

      if (!grouped.has(name)) {
        grouped.set(name, { name, quantity: 0, revenue: 0 });
      }

      const entry = grouped.get(name)!;
      entry.quantity += item.quantity || 0;
      entry.revenue += (item.price_at_sale || 0) * (item.quantity || 0);
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [saleItems]);

  // Payment method breakdown
  const paymentMethodBreakdown = useMemo(() => {
    const grouped = new Map<string, number>();

    sales.forEach((sale) => {
      const method = sale.payment_method || 'unknown';
      grouped.set(method, (grouped.get(method) || 0) + (sale.total_amount || 0));
    });

    return Array.from(grouped.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [sales]);

  // Revenue vs expenses
  const revenueVsExpenses = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit,
      margin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0,
    };
  }, [sales, expenses]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {revenueVsExpenses.revenue.toLocaleString()} RWF
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {revenueVsExpenses.expenses.toLocaleString()} RWF
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Net Profit</p>
          <p className={`text-2xl font-bold ${revenueVsExpenses.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {revenueVsExpenses.profit.toLocaleString()} RWF
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-l-4 border-amber-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Profit Margin</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {revenueVsExpenses.margin}%
          </p>
        </div>
      </div>

      {/* Daily Sales Trend */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Daily Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailySalesTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              name="Revenue (RWF)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              name="Transactions"
              yAxisId="right"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Products by Quantity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="quantity" fill="#3b82f6" name="Units Sold" />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue (RWF)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Method Breakdown */}
      {paymentMethodBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Revenue by Payment Method
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: Record<string, number | string | undefined>) => {
                    const name = String(props.name || '');
                    const value = Number(props.value || 0);
                    return `${name}: ${value.toLocaleString()} RWF`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Method Table */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment Method Details</h3>
            <div className="space-y-2">
              {paymentMethodBreakdown.map((method, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{method.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {method.value.toLocaleString()} RWF
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
