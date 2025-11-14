import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Store, CalendarX, CheckCircle, Loader2, TrendingUp, Calendar, Plus as PlusIcon } from 'lucide-react';
import OnboardShopModal from '../components/OnboardShopModal';
import RevenueDashboard from '../components/RevenueDashboard';
import ShopActionsModal from '../components/ShopActionsModal';

type ShopMetric = {
  id: string;
  name: string;
  is_active: boolean;
  trial_ends_at: string;
  days_left: number;
};

export default function SuperAdminDashboard() {
  const [shops, setShops] = useState<ShopMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<ShopMetric | null>(null);
  const [shopActionsModalOpen, setShopActionsModalOpen] = useState(false);

  async function fetchPlatformMetrics() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, is_active, trial_ends_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shops:', error.message);
    } else if (data) {
      const now = new Date().getTime();
      const shopMetrics: ShopMetric[] = data.map((shop) => {
        const trialEnd = new Date(shop.trial_ends_at).getTime();
        const diffTime = trialEnd - now;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...shop,
          days_left: daysLeft,
        } as ShopMetric;
      });
      setShops(shopMetrics);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPlatformMetrics();
  }, []);

  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.is_active).length;
  const trialShops = shops.filter((s) => s.is_active && s.days_left > 0).length;
  const expiredTrials = shops.filter((s) => s.is_active && s.days_left <= 0).length;

  const handleShopAction = (shop: ShopMetric) => {
    setSelectedShop(shop);
    setShopActionsModalOpen(true);
  };

  const handleRefresh = () => {
    fetchPlatformMetrics();
  };

  return (
    <div className="space-y-8">
      {/* Header with Action Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Platform Admin Dashboard</h1>
        <button
          onClick={() => setOnboardModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Onboard New Shop
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-linear-to-br from-blue-50 to-blue-100 p-5 shadow border border-blue-200">
          <p className="text-sm font-medium text-blue-900">Total Shops</p>
          <p className="mt-1 text-3xl font-bold text-blue-700">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalShops}
          </p>
          <p className="mt-1 text-xs text-blue-600">Onboarded</p>
        </div>

        <div className="rounded-lg bg-linear-to-br from-green-50 to-green-100 p-5 shadow border border-green-200">
          <p className="text-sm font-medium text-green-900">Active Shops</p>
          <p className="mt-1 text-3xl font-bold text-green-700">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeShops}
          </p>
          <p className="mt-1 text-xs text-green-600">Paid subscriptions</p>
        </div>

        <div className="rounded-lg bg-linear-to-br from-indigo-50 to-indigo-100 p-5 shadow border border-indigo-200">
          <p className="text-sm font-medium text-indigo-900">Free Trial</p>
          <p className="mt-1 text-3xl font-bold text-indigo-700">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : trialShops}
          </p>
          <p className="mt-1 text-xs text-indigo-600">Active trials</p>
        </div>

        <div className={`rounded-lg p-5 shadow border ${expiredTrials > 0 ? 'bg-red-100 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className="text-sm font-medium text-gray-700">Expired Trials</p>
          <p className={`mt-1 text-3xl font-bold ${expiredTrials > 0 ? 'text-red-700' : 'text-gray-700'}`}>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : expiredTrials}
          </p>
          <p className="mt-1 text-xs text-gray-600">Need conversion</p>
        </div>
      </div>

      {/* Revenue Dashboard */}
      <RevenueDashboard />

      {/* Shops Table */}
      <div className="rounded-lg bg-white p-4 md:p-6 shadow border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center text-lg font-semibold text-gray-900">
            <Store className="mr-2 h-5 w-5" /> All Registered Shops
          </h2>
          <button
            onClick={handleRefresh}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">Loading...</p>
        ) : shops.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No shops onboarded yet</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Shop Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Trial End
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Days Left
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shop.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {shop.is_active ? (
                          <span className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-4 w-4" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-700">
                            <CalendarX className="h-4 w-4" /> Paused
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(shop.trial_ends_at).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        shop.days_left <= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {shop.days_left <= 0 ? 'EXPIRED' : `${shop.days_left} days`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleShopAction(shop)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {shops.map((shop) => (
                <div key={shop.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">{shop.name}</p>
                    {shop.is_active ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckCircle className="h-4 w-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                        <CalendarX className="h-4 w-4" /> Paused
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" /> Trial Ends: {new Date(shop.trial_ends_at).toLocaleDateString()}
                    </div>
                    <div className={`flex items-center font-medium ${shop.days_left <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <TrendingUp className="mr-2 h-4 w-4" /> {shop.days_left <= 0 ? 'EXPIRED' : `${shop.days_left} days left`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleShopAction(shop)}
                    className="w-full rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                  >
                    Manage Shop
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <OnboardShopModal
        isOpen={onboardModalOpen}
        onClose={() => setOnboardModalOpen(false)}
        onSuccess={handleRefresh}
      />
      
      <ShopActionsModal
        isOpen={shopActionsModalOpen}
        onClose={() => setShopActionsModalOpen(false)}
        shop={selectedShop}
        onSuccess={handleRefresh}
      />
    </div>
  );
}