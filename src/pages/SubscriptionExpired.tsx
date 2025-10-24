import { AlertTriangle, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SubscriptionExpired() {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Force reload to go to login screen
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-800 p-8 text-center shadow-2xl">
        <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
          Subscription Expired
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Your free trial has ended. To continue using TillRwanda PoS, please contact support to activate your subscription.
        </p>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => alert("Please contact support@invoza.com to upgrade.")} 
            className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
          >
            Contact Support to Upgrade
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Home className="mr-2 h-5 w-5" />
            Log Out
          </button>
        </div>
        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          © 2025 Invoza company Ltd.
        </p>
      </div>
    </div>
  );
}