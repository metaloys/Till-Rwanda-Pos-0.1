import React from 'react';
import { LayoutDashboard, Package, BarChart3, LogOut, Settings, DollarSign } from 'lucide-react'; 
// Assuming your App.tsx passes profile and signout logic down through AppLayout props

interface AppLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'cashier';
  // We must define props for the data App.tsx holds:
  onSignOut: () => void;
  profileName: string;
}

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string, active: string, onClick: (path: string) => void }> = ({ to, icon, label, active, onClick }) => (
    <button
        onClick={() => onClick(to)}
        className={`flex w-full items-center space-x-3 rounded-lg p-3 transition-colors duration-200 ${
            active === to 
            ? 'bg-brand-500 text-white shadow-md' 
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

const AppLayout: React.FC<AppLayoutProps> = ({ children, userRole, onSignOut, profileName }) => {
    
    // Define the primary navigation based on role
    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin'] },
        { to: '/pos', label: 'Point of Sale', icon: <DollarSign className="h-5 w-5" />, roles: ['admin', 'cashier'] },
        { to: '/products', label: 'Inventory', icon: <Package className="h-5 w-5" />, roles: ['admin'] },
        { to: '/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, roles: ['admin'] },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar Container */}
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-md p-4 space-y-6">
                
                {/* Logo and User */}
                <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">Till Rwanda</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{profileName || "Admin"}</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{userRole}</p>
                </div>
                
                {/* Navigation Links */}
                <nav className="space-y-2">
                    {navItems
                        .filter(item => item.roles.includes(userRole))
                        .map(item => (
                            <NavItem 
                                key={item.to}
                                to={item.to}
                                label={item.label}
                                icon={item.icon}
                                active=""
                                onClick={() => {/* App.tsx handles navigation via its own state */}}
                            />
                        ))}
                </nav>

                {/* Footer/Logout */}
                <div className="absolute bottom-4 w-56">
                    <button 
                        onClick={onSignOut}
                        className="flex w-full items-center justify-center space-x-3 rounded-lg p-3 text-danger-600 bg-danger-50 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-900 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Log Out</span>
                    </button>
                    <button className="mt-2 text-xs text-slate-500 dark:text-slate-400 block text-center hover:text-brand-600 w-full">
                        <Settings className='h-4 w-4 inline mr-1' /> Settings
                    </button>
                </div>

            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default AppLayout;