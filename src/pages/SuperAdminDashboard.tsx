import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
// --- FIX: Added Store, CalendarX, CheckCircle to the import ---
import { Store, CalendarX, CheckCircle, Loader2 } from 'lucide-react';
// --- END FIX ---

// Type for the combined shop data
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

    async function fetchPlatformMetrics() {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('shops')
            .select('id, name, is_active, trial_ends_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching shops:", error.message);
            alert(error.message);
        } else if (data) {
            const now = new Date().getTime();

            const shopMetrics: ShopMetric[] = data.map(shop => {
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
    
    // Calculations for summary cards
    const totalShops = shops.length;
    const activeShops = shops.filter(s => s.is_active).length;
    const trialShops = shops.filter(s => s.is_active && s.days_left > 0).length;
    const expiredTrials = shops.filter(s => s.is_active && s.days_left <= 0).length;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-800 border-b pb-3">Platform Super Admin Overview</h1>

            {/* PLATFORM SUMMARY CARDS */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                
                <div className="rounded-lg bg-white p-5 shadow">
                    <p className="text-sm font-medium text-gray-500">Total Shops Onboarded</p>
                    <p className="mt-1 text-3xl font-bold text-blue-700">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalShops}
                    </p>
                </div>

                <div className="rounded-lg bg-white p-5 shadow">
                    <p className="text-sm font-medium text-gray-500">Active Paid Shops</p>
                    <p className="mt-1 text-3xl font-bold text-green-700">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeShops}
                    </p>
                </div>

                <div className="rounded-lg bg-white p-5 shadow">
                    <p className="text-sm font-medium text-gray-500">Shops in Free Trial</p>
                    <p className="mt-1 text-3xl font-bold text-indigo-700">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : trialShops}
                    </p>
                </div>

                <div className={`rounded-lg p-5 shadow ${expiredTrials > 0 ? 'bg-red-100' : 'bg-white'}`}>
                    <p className="text-sm font-medium text-gray-500">Trials Expired</p>
                    <p className="mt-1 text-3xl font-bold text-red-700">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : expiredTrials}
                    </p>
                </div>
            </div>

            {/* SHOP LIST */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="flex items-center text-lg font-semibold text-gray-900 border-b pb-3">
                    <Store className="mr-2 h-5 w-5" /> All Registered Businesses
                </h2>
                
                {loading ? (
                    <p className="py-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 mt-4">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="th-style">Shop Name</th>
                                <th className="th-style">Active</th>
                                <th className="th-style">Trial End Date</th>
                                <th className="th-style">Days Remaining</th>
                                <th className="th-style text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {shops.map(shop => (
                                <tr key={shop.id}>
                                    <td className="td-style font-medium text-gray-900">{shop.name}</td>
                                    <td className="td-style">
                                        {shop.is_active ? 
                                            <CheckCircle className="h-5 w-5 text-green-500" /> : 
                                            <CalendarX className="h-5 w-5 text-red-500" />
                                        }
                                    </td>
                                    <td className="td-style text-sm text-gray-700">
                                        {new Date(shop.trial_ends_at).toLocaleDateString()}
                                    </td>
                                    <td className={`td-style font-semibold ${shop.days_left <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {shop.days_left <= 0 ? 'EXPIRED' : shop.days_left}
                                    </td>
                                    <td className="td-style text-right whitespace-nowrap">
                                        <button className="action-button bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                                            View Data
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}