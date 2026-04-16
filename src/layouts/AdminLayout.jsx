import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../hooks/useAuthSession';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { role, signOut } = useAuthSession();
  const location = useLocation();
  const path = location.pathname;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex">
      {/* SideNavBar Component */}
      <aside className="h-screen w-64 fixed left-0 border-r border-outline-variant/20 bg-stone-50 dark:bg-stone-950 flex flex-col py-6 z-40 transition-all duration-200 ease-in-out">
        <div className="px-8 mb-10">
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight plusJakartaSans">TurtleTots Admin</h1>
          <p className="text-xs text-stone-500 font-medium">Role: {roleLabel}</p>
        </div>
        <nav className="flex-1 space-y-1">
          <Link 
            to="/admin" 
            className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${path === '/admin' ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}>
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link 
            to="/admin/products" 
            className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${path.includes('/admin/product') ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}>
            <span className="material-symbols-outlined mr-3">inventory_2</span>
            <span className="text-sm">Products</span>
          </Link>
          <Link 
            to="/admin/orders" 
            className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${path === '/admin/orders' ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}>
            <span className="material-symbols-outlined mr-3">shopping_bag</span>
            <span className="text-sm">Orders</span>
          </Link>
          <Link 
            to="/admin/categories" 
            className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${path === '/admin/categories' ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}>
            <span className="material-symbols-outlined mr-3">category</span>
            <span className="text-sm">Categories</span>
          </Link>
          <Link 
            to="/admin/support" 
            className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${path === '/admin/support' ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}>
            <span className="material-symbols-outlined mr-3">contact_support</span>
            <span className="text-sm">Support</span>
          </Link>
          <Link 
            to="/admin/settings" 
            className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${path === '/admin/settings' ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}>
            <span className="material-symbols-outlined mr-3">settings</span>
            <span className="text-sm">Settings</span>
          </Link>
          <Link 
            to="/admin/ai" 
            className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${path === '/admin/ai' ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}>
            <span className="material-symbols-outlined mr-3">smart_toy</span>
            <span className="text-sm">AI Assistant</span>
          </Link>
          {role === 'admin' && (
            <Link
              to="/admin/users"
              className={`flex items-center px-4 py-3 mx-4 mb-1 rounded-2xl transition-all duration-200 ease-in-out ${path === '/admin/users' ? 'bg-secondary-container/50 text-secondary-dim font-bold' : 'text-stone-500 hover:bg-stone-200'}`}
            >
              <span className="material-symbols-outlined mr-3">manage_accounts</span>
              <span className="text-sm">Users</span>
            </Link>
          )}
        </nav>
        <div className="mt-auto px-4 space-y-1">
          <Link to="/" className="w-full flex items-center px-4 py-3 text-primary mx-4 mb-1 hover:bg-primary-container/30 rounded-2xl transition-all">
            <span className="material-symbols-outlined mr-3 text-lg">storefront</span>
            <span className="text-sm font-bold">Return to Store</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-error mx-4 mb-1 hover:bg-error-container/10 rounded-2xl transition-all">
            <span className="material-symbols-outlined mr-3 text-lg">logout</span>
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="ml-64 flex-1 min-h-screen p-8 lg:p-12 w-full bg-surface">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
