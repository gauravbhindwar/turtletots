import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';
import { useAuthSession } from '../hooks/useAuthSession';

const ShopLayout = () => {
  const { cartItems } = useCartStore();
  const { favoriteItems } = useFavoritesStore();
  const { isAuthenticated, role } = useAuthSession();
  const location = useLocation();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const favoritesCount = favoriteItems.length;
  const isPrivileged = role === 'admin' || role === 'manager';
  const accountTarget = isAuthenticated ? (isPrivileged ? '/admin' : '/profile') : '/login';

  const activeClass = "text-yellow-700 dark:text-yellow-400 border-b-4 border-yellow-400 rounded-full px-1 hover:scale-105 transition-transform font-bold";
  const inactiveClass = "text-stone-600 dark:text-stone-400 font-medium hover:scale-105 hover:text-yellow-600 transition-transform";

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-4 sm:px-6 lg:px-8 h-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl z-50 shadow-[0_40px_60px_-15px_rgba(109,90,0,0.06)]">
        <div className="flex items-center gap-12">
          <Link to="/" className="inline-flex items-center" aria-label="TurtleTots Home">
            <div className="h-12 sm:h-14 w-[130px] sm:w-[170px] md:w-[190px] rounded-md overflow-hidden">
              <img src="/turtletots.jpeg" alt="TurtleTots" className="w-full h-full object-cover object-top scale-[1.06]" />
            </div>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link className={location.pathname === '/' ? activeClass : inactiveClass} to="/">Shop All</Link>
            <Link className={location.pathname === '/new-arrivals' ? activeClass : inactiveClass} to="/new-arrivals">New Arrivals</Link>
            <Link className={location.pathname === '/best-sellers' ? activeClass : inactiveClass} to="/best-sellers">Best Sellers</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-container-low px-4 py-2 rounded-full border-none">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-48 font-medium" placeholder="Search toys..." type="text" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/favorites" className="w-10 h-10 relative flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-yellow-700" style={{ fontVariationSettings: favoritesCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {favoritesCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="w-10 h-10 relative flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-yellow-700">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <Link to={accountTarget} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-sm">
                <span className="material-symbols-outlined">person</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 rounded-full bg-primary-container text-on-primary-container font-bold text-sm shadow-sm hover:scale-105 transition-transform"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-24">
        <Outlet />
      </main>

      {/* BottomNavBar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 w-full h-20 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md flex justify-around items-center px-6 z-50 rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[{
          to: '/',
          icon: 'home',
          label: 'Home'
        },{
          to: '/new-arrivals',
          icon: 'auto_awesome',
          label: 'New'
        },{
          to: '/best-sellers',
          icon: 'workspace_premium',
          label: 'Best'
        }].map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center rounded-full w-16 h-16 transition-all active:scale-90 ${isActive ? 'bg-yellow-400 text-stone-900 shadow-lg -translate-y-4' : 'text-stone-400 dark:text-stone-500'}`}
              aria-label={item.to === '/best-sellers' ? 'Best Sellers' : item.to === '/new-arrivals' ? 'New Arrivals' : 'Home'}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="plusJakartaSans text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ShopLayout;
