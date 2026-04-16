import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../hooks/useAuthSession';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { role, signOut } = useAuthSession();
  const location = useLocation();
  const path = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const roleLabel = (role || 'user').charAt(0).toUpperCase() + (role || 'user').slice(1);

  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

  const primaryNavItems = [
    { to: '/admin', icon: 'dashboard', label: 'Dashboard', active: path === '/admin' },
    { to: '/admin/products', icon: 'inventory_2', label: 'Products', active: path.includes('/admin/product') || path === '/admin/inventory' },
    { to: '/admin/orders', icon: 'shopping_bag', label: 'Orders', active: path === '/admin/orders' },
    { to: '/admin/categories', icon: 'category', label: 'Categories', active: path === '/admin/categories' },
    { to: '/admin/settings', icon: 'settings', label: 'Settings', active: path === '/admin/settings' }
  ];

  const comingSoonItems = [
    { to: '/admin/support', icon: 'contact_support', label: 'Support', active: path === '/admin/support' },
    { to: '/admin/ai', icon: 'smart_toy', label: 'AI Assistant', active: path === '/admin/ai' }
  ];

  if (role === 'admin') {
    primaryNavItems.push({ to: '/admin/users', icon: 'manage_accounts', label: 'Users', active: path === '/admin/users' });
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen overflow-x-hidden">
      <header className="xl:hidden sticky top-0 z-30 border-b border-outline-variant/20 bg-surface/95 backdrop-blur px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface"
          aria-label="Open admin menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-lg font-black plusJakartaSans">TurtleTots Admin</h1>
        <div className="w-10" aria-hidden="true"></div>
      </header>

      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-30 bg-black/35 transition-opacity xl:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      ></div>

      {/* SideNavBar Component */}
      <aside className={`h-screen w-64 max-w-[82vw] fixed left-0 top-0 border-r border-outline-variant/20 bg-stone-50 dark:bg-stone-950 flex flex-col py-6 z-40 transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0 xl:w-64`}>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="xl:hidden absolute top-4 right-4 w-9 h-9 rounded-lg bg-surface-container-low text-on-surface flex items-center justify-center"
          aria-label="Close admin menu"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="px-8 mb-10">
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight plusJakartaSans">TurtleTots Admin</h1>
          <p className="text-xs text-stone-500 font-medium">Role: {roleLabel}</p>
        </div>

        <nav className="flex-1 flex flex-col overflow-y-auto">
          <div className="space-y-1">
            {primaryNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${item.active ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}
              >
                <span className="material-symbols-outlined mr-3">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-auto">
            <p className="px-8 pt-4 pb-2 text-[10px] font-black uppercase tracking-widest text-stone-400">Coming Soon</p>
            <div className="space-y-1">
              {comingSoonItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${item.active ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}
                >
                  <span className="material-symbols-outlined mr-3">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[9px] font-black uppercase tracking-widest">Soon</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-auto px-4 space-y-1">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center px-4 py-3 text-primary mx-4 mb-1 hover:bg-primary-container/30 rounded-2xl transition-all">
            <span className="material-symbols-outlined mr-3 text-lg">storefront</span>
            <span className="text-sm font-bold">Return to Store</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center px-4 py-3 text-error mx-4 mb-1 hover:bg-error-container/10 rounded-2xl transition-all">
            <span className="material-symbols-outlined mr-3 text-lg">logout</span>
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="w-full min-h-screen bg-surface px-4 py-5 sm:px-5 sm:py-6 md:px-6 xl:ml-64 xl:w-[calc(100%-16rem)] xl:p-12 max-xl:[&_.text-4xl]:text-3xl max-xl:[&_.text-3xl]:text-2xl max-xl:[&_.p-10]:p-6 max-xl:[&_.p-8]:p-5 max-xl:[&_.px-8]:px-5 max-xl:[&_.py-4]:py-3 max-xl:[&_.w-16]:w-14 max-xl:[&_.h-16]:h-14 max-xl:[&_.rounded-2xl]:rounded-xl">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
