import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';

const ShopLayout = () => {
  const { cartItems } = useCartStore();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-8 h-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl z-50 shadow-[0_40px_60px_-15px_rgba(109,90,0,0.06)]">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-black tracking-tighter text-yellow-700 dark:text-yellow-400 plusJakartaSans">TurtleTots</Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link className="text-yellow-700 dark:text-yellow-400 border-b-4 border-yellow-400 rounded-full px-1 hover:scale-105 transition-transform font-bold" to="/">Shop All</Link>
            <Link className="text-stone-600 dark:text-stone-400 font-medium hover:scale-105 hover:text-yellow-600 transition-transform" to="/">New Arrivals</Link>
            <Link className="text-stone-600 dark:text-stone-400 font-medium hover:scale-105 hover:text-yellow-600 transition-transform" to="/">Best Sellers</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-container-low px-4 py-2 rounded-full border-none">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-48 font-medium" placeholder="Search toys..." type="text" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/cart" className="w-10 h-10 relative flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-yellow-700">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to="/admin" className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined">person</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-24">
        <Outlet />
      </main>

      {/* BottomNavBar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 w-full h-20 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md flex justify-around items-center px-6 z-50 rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <Link to="/" className="flex flex-col items-center justify-center bg-yellow-400 text-stone-900 rounded-full w-14 h-14 -translate-y-4 shadow-lg active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="plusJakartaSans text-[10px] font-bold">Home</span>
        </Link>
        <div className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">search</span>
          <span className="plusJakartaSans text-[10px] font-bold">Search</span>
        </div>
        <Link to="/cart" className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 active:scale-90 transition-transform relative">
          <span className="material-symbols-outlined">shopping_basket</span>
          <span className="plusJakartaSans text-[10px] font-bold">Cart</span>
          {cartCount > 0 && <span className="absolute top-0 right-1 w-2 h-2 bg-error rounded-full"></span>}
        </Link>
        <Link to="/admin" className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">person</span>
          <span className="plusJakartaSans text-[10px] font-bold">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default ShopLayout;
