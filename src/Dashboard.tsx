import { useState } from 'react';
import { supabase } from './supabaseClient';
import type { Profile, UserRole } from './appTypes'; // Import Profile and UserRole

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
import StaffManagement from './pages/StaffManagement'; // 1. IMPORT STAFF MANAGEMENT

// Define available pages (excluding owner-only pages from main switch)
type Page = 'overview' | 'sales_history' | 'expenses' | 'reports' | 'credit_aging' | 'products' | 'customers' | 'credit' | 'pos' | 'staff_management';

interface DashboardProps {
    profile: Profile; // 2. RECEIVE THE PROFILE
}

export default function Dashboard({ profile }: DashboardProps) { // 3. USE PROFILE PROP
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const userRole: UserRole = profile.role; // Extract the role

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // This function decides which page component to show
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview': return <Overview />;
      case 'sales_history': return <SalesHistory />;
      case 'expenses': return <ExpenseTracking />;
      case 'reports': return <Reports />;
      case 'credit_aging': return <CreditAgingReport />;
      case 'products': return <Products />;
      case 'customers': return <Customers />;
      case 'credit': return <CreditManagement />;
      case 'pos': return <PointOfSale />;
      // 4. PASS THE USER ROLE TO THE STAFF MANAGEMENT PAGE
      case 'staff_management': return <StaffManagement userRole={userRole} />; 
      default: return <Overview />;
    }
  };

  // Helper component for navigation links
  const NavLink = ({ pageName, label, isPrimary = false, isSubItem = false }: { pageName: Page; label: string; isPrimary?: boolean; isSubItem?: boolean; }) => (
    <button onClick={() => setCurrentPage(pageName)} className={` w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${ isPrimary ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500' : currentPage === pageName ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' } ${isSubItem ? 'pl-6' : ''} `} > {label} </button>
  );

  // Define which roles can see which links (simple check)
  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';
  const isNotCashier = userRole !== 'cashier'; // Cashiers shouldn't see most reports

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white p-4">
        <h1 className="mb-2 px-3 text-xl font-bold text-gray-900">Till Rwanda</h1>
        <p className="mb-4 px-3 text-xs font-semibold text-blue-600 capitalize">Role: {userRole} | {profile.full_name}</p> {/* 5. PERMANENT SIGN */}
        <nav className="flex-1 space-y-1">
          <NavLink pageName="pos" label="New Sale (POS)" isPrimary={true} />

          <hr className="my-2" />
          <NavLink pageName="overview" label="Dashboard Overview" />

          {/* Reports Section (Restricted) */}
          <div className="pt-2">
            <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider">Reports</h3>
            <div className="mt-1 space-y-1">
              <NavLink pageName="sales_history" label="Sales History" isSubItem={true}/>
               {/* Restrict Profit/Expenses/Aging to Owner/Manager */}
              {isOwnerOrManager && (
                  <>
                      <NavLink pageName="reports" label="Daily Summary" isSubItem={true}/>
                      <NavLink pageName="expenses" label="Expense Tracking" isSubItem={true}/>
                      <NavLink pageName="credit_aging" label="Credit Aging" isSubItem={true}/>
                  </>
              )}
            </div>
          </div>
          
          {/* Management Section (Restricted) */}
          <div className="pt-2">
             <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider">Management</h3>
              <div className="mt-1 space-y-1">
                {isNotCashier && ( // Cashiers should not manage products/customers/credit limits
                  <>
                      <NavLink pageName="products" label="Products" isSubItem={true}/>
                      <NavLink pageName="customers" label="Customers" isSubItem={true}/>
                      <NavLink pageName="credit" label="Credit Payments" isSubItem={true}/>
                  </>
                )}
                
                {/* 6. ADD STAFF MANAGEMENT LINK (Owner/Manager Only) */}
                {isOwnerOrManager && (
                    <NavLink pageName="staff_management" label="Staff Management" isSubItem={true}/>
                )}
             </div>
          </div>
        </nav>
        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500" > Log Out </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white p-6 shadow-md">
          {/* Dynamically set title */}
          <h2 className="text-xl font-semibold capitalize text-gray-900">
              {/* ... dynamic title logic (no major change) ... */}
              {[
                  { page: 'pos', title: 'Point of Sale'},
                  { page: 'overview', title: 'Dashboard Overview'},
                  { page: 'sales_history', title: 'Sales History'},
                  { page: 'expenses', title: 'Expense Tracking'},
                  { page: 'reports', title: 'Daily Summary Report'},
                  { page: 'credit_aging', title: 'Credit Aging Report'},
                  { page: 'products', title: 'Product Management'},
                  { page: 'customers', title: 'Customer Management'},
                  { page: 'credit', title: 'Credit Payments'},
                  { page: 'staff_management', title: 'Staff Management'},
              ].find(p => p.page === currentPage)?.title || currentPage.replace('_', ' ')}
          </h2>
        </header>
        <main className="p-6">{renderCurrentPage()}</main>
      </div>
    </div>
  );
}