import { useState } from 'react';
import { supabase } from './supabaseClient';
import type { Profile, UserRole } from './appTypes.ts'; 

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

type Page = 'overview' | 'sales_history' | 'expenses' | 'reports' | 'credit_aging' | 'products' | 'customers' | 'credit' | 'pos' | 'staff_management' | 'admin_dashboard';

interface DashboardProps {
    profile: Profile;
}

export default function Dashboard({ profile }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<Page>(
    profile.is_super_admin ? 'admin_dashboard' : 'overview'
  );

  const userRole: UserRole = profile.role;
  const shopId = profile.shop_id;
  const shopName = profile.shop_name || 'Your Shop';
  const isSuperAdmin = profile.is_super_admin; 

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const renderCurrentPage = () => {
    const pageProps = { 
      profile: profile, 
      shopId: shopId as string,
      userRole: userRole 
    };

    switch (currentPage) {
      case 'admin_dashboard':
        return <SuperAdminDashboard />;
      case 'overview': 
        return <Overview />; 
      case 'sales_history': 
        return <SalesHistory {...pageProps} />;
      case 'expenses': 
        return <ExpenseTracking {...pageProps} />; 
      case 'reports': 
        return <Reports {...pageProps} />; 
      case 'credit_aging': 
        return <CreditAgingReport {...pageProps} />;
      case 'products': 
        return <Products {...pageProps} />; 
      case 'customers': 
        return <Customers {...pageProps} />; 
      case 'credit': 
        return <CreditManagement {...pageProps} />; 
      case 'pos': 
        return <PointOfSale {...pageProps} />; 
      case 'staff_management': 
        return <StaffManagement {...pageProps} />; 
      default: 
        return isSuperAdmin ? <SuperAdminDashboard /> : <Overview />;
    }
  };

  const NavLink = ({ pageName, label, isPrimary = false, isSubItem = false }: { pageName: Page; label: string; isPrimary?: boolean; isSubItem?: boolean; }) => (
    <button onClick={() => setCurrentPage(pageName)} className={` w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${ isPrimary ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500' : currentPage === pageName ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' } ${isSubItem ? 'pl-6' : ''} `} > {label} </button>
  );

  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';
  const isNotCashier = userRole !== 'cashier';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white p-4">
        <div className="mb-4 px-3">
             <h1 className="text-2xl font-black text-blue-800">Till Rwanda</h1>
             <p className="text-xs font-semibold text-gray-500">{shopName}</p>
        </div>
        
        <p className={`mb-4 px-3 text-xs font-semibold capitalize ${isSuperAdmin ? 'text-purple-600' : 'text-blue-600'}`}>
            {isSuperAdmin ? 'PLATFORM ADMIN' : `Role: ${userRole}`} | {profile.full_name}
        </p>

        <nav className="flex-1 space-y-1">
          {/* --- FIX: Use the correct check --- */}
          {!isSuperAdmin && <NavLink pageName="pos" label="New Sale (POS)" isPrimary={true} />}
          
          <hr className="my-2" />

          {isSuperAdmin && (
              <NavLink pageName="admin_dashboard" label="Platform Dashboard" isSubItem={false}/>
          )}

          <NavLink pageName="overview" label="Shop Overview" isSubItem={isSuperAdmin ? true : false}/>

          {/* Reports Section */}
          <div className="pt-2">
            <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider">Reports</h3>
            <div className="mt-1 space-y-1">
              <NavLink pageName="sales_history" label="Sales History" isSubItem={true}/>
              {isOwnerOrManager && (<><NavLink pageName="reports" label="Daily Summary" isSubItem={true}/><NavLink pageName="expenses" label="Expense Tracking" isSubItem={true}/><NavLink pageName="credit_aging" label="Credit Aging" isSubItem={true}/></>)}
            </div>
          </div>
          
          {/* Management Section */}
          <div className="pt-2">
             <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider">Management</h3>
              <div className="mt-1 space-y-1">
                {isNotCashier && (<><NavLink pageName="products" label="Products" isSubItem={true}/><NavLink pageName="customers" label="Customers" isSubItem={true}/><NavLink pageName="credit" label="Credit Payments" isSubItem={true}/></>)}
                {userRole === 'owner' && (<NavLink pageName="staff_management" label="Staff Management" isSubItem={true}/>)}
             </div>
          </div>
        </nav>
        <div className="mt-auto border-t pt-2">
            <p className="px-3 text-xs text-gray-400">Version 0.2 (Multi-Tenant Ready)</p>
            <p className="px-3 text-xs text-gray-400">Developed by Invoza Ltd.</p>
          <button onClick={handleLogout} className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 mt-2" > Log Out </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold capitalize text-gray-900">
              {currentPage === 'admin_dashboard' ? 'Platform Dashboard' :
               [
                  { page: 'pos', title: 'Point of Sale'}, { page: 'overview', title: 'Shop Overview'}, { page: 'sales_history', title: 'Sales History'}, { page: 'expenses', title: 'Expense Tracking'}, { page: 'reports', title: 'Daily Summary Report'}, { page: 'credit_aging', title: 'Credit Aging Report'}, { page: 'products', title: 'Product Management'}, { page: 'customers', title: 'Customer Management'}, { page: 'credit', title: 'Credit Payments'}, { page: 'staff_management', title: 'Staff Management'},
              ].find(p => p.page === currentPage)?.title || currentPage.replace('_', ' ')}
          </h2>
        </header>
        <main className="p-6">{renderCurrentPage()}</main>
      </div>
    </div>
  );
}