import { useState } from 'react';
import { supabase } from './supabaseClient';
import type { Profile, UserRole } from './appTypes.ts'; 
import { Menu, X, Building, ShoppingCart, LayoutDashboard, ListOrdered, ReceiptText, BarChart3, History, Package, UserPlus, CreditCard, Users } from 'lucide-react'; 
import ThemeToggle from './components/ThemeToggle';
import OfflineIndicator from './components/OfflineIndicator';

// Import our pages
import Overview from './pages/Overview';
import Products from './pages/Products';
import PointOfSale from './pages/PointOfSale';
import Customers from './pages/Customers';
import CreditManagement from './pages/CreditManagement';
import SalesHistory from './pages/SalesHistory';
import ExpenseTracking from './pages/ExpenseTracking';
import Reports from './pages/Reports';
import CreditAgingReport from './pages/CreditAgingReport';
import StaffManagement from './pages/StaffManagement';
import SuperAdminDashboard from './pages/SuperAdminDashboard'; 
import SubscriptionExpired from './pages/SubscriptionExpired';

type Page = 'overview' | 'sales_history' | 'expenses' | 'reports' | 'credit_aging' | 'products' | 'customers' | 'credit' | 'pos' | 'staff_management' | 'admin_dashboard';

interface DashboardProps {
    profile: Profile;
    viewAs?: 'admin' | 'user';
    onViewAsChange?: (viewAs: 'admin' | 'user') => void;
}

export default function Dashboard({ profile, viewAs = 'admin', onViewAsChange }: DashboardProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // NEW: Create effective profile based on viewAs toggle
  const effectiveProfile = viewAs === 'user' && profile.is_super_admin
    ? { ...profile, is_super_admin: false }
    : profile;

  // --- FIX: This variable must be available to all sub-components ---
  const isSubscriptionActive = effectiveProfile.is_super_admin || effectiveProfile.is_active;

  const [currentPage, setCurrentPage] = useState<Page>(
    effectiveProfile.is_super_admin ? 'admin_dashboard' : 'overview'
  );

  const userRole: UserRole = effectiveProfile.role;
  const shopId = effectiveProfile.shop_id;
  const shopName = effectiveProfile.shop_name || 'Your Shop';
  const isSuperAdmin = effectiveProfile.is_super_admin; 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  const renderCurrentPage = () => {
    const pageProps = { 
      profile: effectiveProfile, 
      shopId: shopId as string,
      userRole: userRole 
    };

    if (!isSubscriptionActive) {
        return <SubscriptionExpired />;
    }

    switch (currentPage) {
      case 'admin_dashboard': return <SuperAdminDashboard />;
      case 'overview': return <Overview {...pageProps} />; 
      case 'sales_history': return <SalesHistory {...pageProps} />;
      case 'expenses': return <ExpenseTracking {...pageProps} />; 
      case 'reports': return <Reports {...pageProps} />; 
      case 'credit_aging': return <CreditAgingReport {...pageProps} />;
      case 'products': return <Products {...pageProps} />; 
      case 'customers': return <Customers {...pageProps} />; 
      case 'credit': return <CreditManagement {...pageProps} />; 
      case 'pos': return <PointOfSale {...pageProps} />; 
      case 'staff_management': return <StaffManagement {...pageProps} />; 
      default: return isSuperAdmin ? <SuperAdminDashboard /> : <Overview {...pageProps} />;
    }
  };

  const handlePageSelect = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  const NavLink = ({ pageName, label, icon: Icon, isPrimary = false, isSubItem = false }: { 
    pageName: Page; 
    label: string; 
    icon: React.ElementType;
    isPrimary?: boolean; 
    isSubItem?: boolean; 
  }) => (
    <button 
      onClick={() => handlePageSelect(pageName)} 
      className={`
        w-full flex items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200
        ${isSubItem ? 'pl-6' : ''}
        ${isPrimary 
          ? 'text-white shadow-card bg-linear-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 hover:shadow-card-hover dark:from-brand-500 dark:to-brand-400 dark:hover:from-brand-600 dark:hover:to-brand-500 animate-fade-in' 
          : currentPage === pageName 
          ? 'bg-brand-100 text-brand-700 dark:bg-slate-700 dark:text-white shadow-sm' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
        }
      `}
    >
      <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
      {label}
    </button>
  );

  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';
  const isNotCashier = userRole !== 'cashier';

  const SidebarContent = () => (
    <>
      <div className="mb-4 px-3">
           <h1 className="text-2xl font-black text-slate-900 dark:text-white">TillRwanda PoS</h1>
           <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{shopName}</p>
      </div>
      
      <p className={`mb-4 px-3 text-xs font-semibold capitalize ${isSuperAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
          {isSuperAdmin ? 'PLATFORM ADMIN' : `Role: ${userRole}`} | {profile.full_name}
      </p>

      {/* NEW: Super Admin Role Toggle Button */}
      {profile.is_super_admin && (
        <div className="px-3 mb-4">
          <button
            onClick={() => onViewAsChange?.(viewAs === 'admin' ? 'user' : 'admin')}
            className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewAs === 'admin'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {viewAs === 'admin' ? '👤 Switch to User View' : '🔐 Switch to Admin View'}
          </button>
        </div>
      )}

      {isSubscriptionActive ? (
        <nav className="flex-1 space-y-1">
          {!isSuperAdmin && <NavLink pageName="pos" label="New Sale (POS)" icon={ShoppingCart} isPrimary={true} />}
          
          <hr className="my-2 border-slate-200 dark:border-slate-700" />

          {isSuperAdmin && (
              <NavLink pageName="admin_dashboard" label="Platform Dashboard" icon={Building} isSubItem={false}/>
          )}

          <NavLink pageName="overview" label="Shop Overview" icon={LayoutDashboard} isSubItem={isSuperAdmin ? true : false}/>

          <div className="pt-2">
            <h3 className="px-3 text-xs font-semibold uppercase text-slate-500 tracking-wider">Reports</h3>
            <div className="mt-1 space-y-1">
              <NavLink pageName="sales_history" label="Sales History" icon={ListOrdered} isSubItem={true}/>
              {isOwnerOrManager && (<><NavLink pageName="reports" label="Daily Summary" icon={BarChart3} isSubItem={true}/><NavLink pageName="expenses" label="Expense Tracking" icon={ReceiptText} isSubItem={true}/><NavLink pageName="credit_aging" label="Credit Aging" icon={History} isSubItem={true}/></>)}
            </div>
          </div>
          
          <div className="pt-2">
           <h3 className="px-3 text-xs font-semibold uppercase text-slate-500 tracking-wider">Management</h3>
            <div className="mt-1 space-y-1">
              {isNotCashier && (<><NavLink pageName="products" label="Products" icon={Package} isSubItem={true}/><NavLink pageName="customers" label="Customers" icon={UserPlus} isSubItem={true}/><NavLink pageName="credit" label="Credit Payments" icon={CreditCard} isSubItem={true}/></>)}
              {userRole === 'owner' && (<NavLink pageName="staff_management" label="Staff Management" icon={Users} isSubItem={true}/>)}
           </div>
          </div>
        </nav>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Your subscription is inactive. Please upgrade to restore access.</p>
        </div>
      )}

      <div className="mt-auto border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
          <div className="px-3">
            <ThemeToggle />
          </div>
          <p className="px-3 text-xs text-slate-400 dark:text-slate-500">Version 0.2</p>
          <p className="px-3 text-xs text-slate-400 dark:text-slate-500">© 2025 Invoza company Ltd.</p>
        <button onClick={handleLogout} className="w-full rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:shadow-card-hover hover:bg-danger-700 transition-all mt-2 animate-fade-in" > Log Out </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Offline Indicator */}
      {shopId && <OfflineIndicator shopId={shopId} />}

      <div className={`fixed inset-0 z-40 flex md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="relative flex w-64 max-w-[80vw] flex-col border-r border-slate-200 bg-white p-4 dark:bg-slate-800 dark:border-slate-700">
            <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-2 right-2 p-2 text-slate-500 dark:text-slate-400 md:hidden"
                aria-label="Close menu"
            >
                <X className="h-6 w-6" />
            </button>
            <SidebarContent />
        </div>
        <div onClick={() => setIsMobileMenuOpen(false)} className="flex-1 bg-black/50 dark:bg-black/70"></div>
      </div>

      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white p-4 dark:bg-slate-800 dark:border-slate-700">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white p-4 shadow-sm md:p-6 dark:bg-slate-800 dark:border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold capitalize text-slate-900 dark:text-slate-100">
                {currentPage === 'admin_dashboard' ? 'Platform Dashboard' :
                 [
                    { page: 'pos', title: 'Point of Sale'}, { page: 'overview', title: 'Shop Overview'}, { page: 'sales_history', title: 'Sales History'}, { page: 'expenses', title: 'Expense Tracking'}, { page: 'reports', title: 'Daily Summary Report'}, { page: 'credit_aging', title: 'Credit Aging Report'}, { page: 'products', title: 'Product Management'}, { page: 'customers', title: 'Customer Management'}, { page: 'credit', title: 'Credit Payments'}, { page: 'staff_management', title: 'Staff Management'},
                ].find(p => p.page === currentPage)?.title || currentPage.replace('_', ' ')}
            </h2>
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-600 dark:text-slate-400 md:hidden"
                aria-label="Open menu"
            >
                <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>
        
        <main className="p-4 md:p-6">{renderCurrentPage()}</main>
      </div>
    </div>
  );
}