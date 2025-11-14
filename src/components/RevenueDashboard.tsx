import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageRevenuePerShop: number;
  pendingInvoices: number;
  collectedThisMonth: number;
  trialConversionRate: number;
  churnRate: number;
  activeShopsCount: number;
  chartData: Array<{ date: string; revenue: number }>;
  topShops: Array<{ name: string; revenue: number }>;
}

export default function RevenueDashboard() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueMetrics();
  }, []);

  const fetchRevenueMetrics = async () => {
    try {
      setLoading(true);

      // Fetch all shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, is_active, created_at');

      if (shopsError) throw shopsError;

      if (!shops || shops.length === 0) {
        setMetrics({
          totalRevenue: 0,
          monthlyRevenue: 0,
          averageRevenuePerShop: 0,
          pendingInvoices: 0,
          collectedThisMonth: 0,
          trialConversionRate: 0,
          churnRate: 0,
          activeShopsCount: 0,
          chartData: [],
          topShops: [],
        });
        return;
      }

      // Fetch all sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, total_amount, payment_method, created_at, shop_id');

      if (salesError) throw salesError;

      // Calculate metrics
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Revenue calculations
      const totalRevenue = (sales || []).reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const monthlyRevenue = (sales || [])
        .filter((sale) => new Date(sale.created_at) >= thisMonth)
        .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      const activeShopsCount = (shops || []).filter((s) => s.is_active).length;
      const averageRevenuePerShop = activeShopsCount > 0 ? totalRevenue / activeShopsCount : 0;

      // Trial conversion rate (shops that have been active > 30 days and trial ended)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const oldShops = (shops || []).filter(
        (s) => new Date(s.created_at) <= thirtyDaysAgo
      ).length;
      const trialConversionRate = oldShops > 0 ? ((activeShopsCount / oldShops) * 100) : 0;

      // Churn rate (shops that were active but are now inactive)
      const inactiveShopsCount = (shops || []).filter((s) => !s.is_active).length;
      const churnRate = (shops || []).length > 0 ? ((inactiveShopsCount / (shops || []).length) * 100) : 0;

      // Revenue by day (last 30 days)
      const chartData: { [key: string]: number } = {};
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        chartData[dateStr] = 0;
      }

      (sales || []).forEach((sale) => {
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        if (saleDate in chartData) {
          chartData[saleDate] += sale.total_amount || 0;
        }
      });

      const chartDataArray = Object.entries(chartData).map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(revenue),
      }));

      // Top shops by revenue
      const shopRevenue: { [key: string]: { name: string; revenue: number } } = {};
      (sales || []).forEach((sale) => {
        const shopName = (shops || []).find((s) => s.id === sale.shop_id)?.name || 'Unknown';
        if (!shopRevenue[sale.shop_id]) {
          shopRevenue[sale.shop_id] = { name: shopName, revenue: 0 };
        }
        shopRevenue[sale.shop_id].revenue += sale.total_amount || 0;
      });

      const topShops = Object.values(shopRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setMetrics({
        totalRevenue,
        monthlyRevenue,
        averageRevenuePerShop,
        pendingInvoices: 0, // Placeholder
        collectedThisMonth: monthlyRevenue,
        trialConversionRate: Math.round(trialConversionRate),
        churnRate: Math.round(churnRate),
        activeShopsCount,
        chartData: chartDataArray,
        topShops,
      });
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-center py-12 text-gray-500">No revenue data available</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      <h2 className="flex items-center text-lg font-semibold text-gray-900 border-b pb-3">
        <DollarSign className="mr-2 h-5 w-5" /> Revenue & Billing
      </h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-lg bg-linear-to-br from-blue-50 to-blue-100 p-5 shadow-sm border border-blue-200">
          <p className="text-sm font-medium text-blue-900">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {metrics.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-blue-600">All-time</p>
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-lg bg-linear-to-br from-green-50 to-green-100 p-5 shadow-sm border border-green-200">
          <p className="text-sm font-medium text-green-900">This Month</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {metrics.monthlyRevenue.toLocaleString('en-US', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-green-600">Collected</p>
        </div>

        {/* Avg Revenue per Shop */}
        <div className="rounded-lg bg-linear-to-br from-purple-50 to-purple-100 p-5 shadow-sm border border-purple-200">
          <p className="text-sm font-medium text-purple-900">Avg per Shop</p>
          <p className="mt-2 text-2xl font-bold text-purple-700">
            {metrics.averageRevenuePerShop.toLocaleString('en-US', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-purple-600">{metrics.activeShopsCount} active shops</p>
        </div>

        {/* Trial Conversion Rate */}
        <div className="rounded-lg bg-linear-to-br from-orange-50 to-orange-100 p-5 shadow-sm border border-orange-200">
          <p className="text-sm font-medium text-orange-900">Conversion Rate</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold text-orange-700">{metrics.trialConversionRate}%</p>
            {metrics.trialConversionRate > 50 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
          <p className="mt-1 text-xs text-orange-600">Trial → Paid</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <div className="rounded-lg bg-white p-5 shadow border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                formatter={(value) =>
                  (value as number).toLocaleString('en-US', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 })
                }
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Shops Chart */}
        <div className="rounded-lg bg-white p-5 shadow border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Top 5 Shops by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.topShops}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                formatter={(value) =>
                  (value as number).toLocaleString('en-US', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 })
                }
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="revenue" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-red-50 p-5 shadow-sm border border-red-200">
          <p className="text-sm font-medium text-red-900">Churn Rate</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{metrics.churnRate}%</p>
          <p className="mt-1 text-xs text-red-600">Inactive shops</p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-5 shadow-sm border border-indigo-200">
          <p className="text-sm font-medium text-indigo-900">Pending Invoices</p>
          <p className="mt-2 text-2xl font-bold text-indigo-700">{metrics.pendingInvoices}</p>
          <p className="mt-1 text-xs text-indigo-600">Awaiting payment</p>
        </div>
      </div>

      <button
        onClick={fetchRevenueMetrics}
        className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
      >
        Refresh Metrics
      </button>
    </div>
  );
}
