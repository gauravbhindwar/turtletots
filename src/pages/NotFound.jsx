import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl shadow-xl shadow-yellow-900/5">
        <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="text-2xl font-black text-yellow-700 dark:text-yellow-300 plusJakartaSans font-bold tracking-tight">Toybox</div>
          <div className="hidden md:flex gap-8 items-center">
            <Link className="text-stone-600 dark:text-stone-400 font-medium hover:scale-105 transition-transform duration-200" to="/">Shop</Link>
            <Link className="text-stone-600 dark:text-stone-400 font-medium hover:scale-105 transition-transform duration-200" to="/">Categories</Link>
            <Link className="text-stone-600 dark:text-stone-400 font-medium hover:scale-105 transition-transform duration-200" to="/best-sellers">Sale</Link>
            <Link className="text-stone-600 dark:text-stone-400 font-medium hover:scale-105 transition-transform duration-200" to="/new-arrivals">Gifting</Link>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="material-symbols-outlined text-stone-600 dark:text-stone-400 p-2 hover:scale-105 transition-transform">favorite</button>
            <button type="button" className="material-symbols-outlined text-stone-600 dark:text-stone-400 p-2 hover:scale-105 transition-transform">account_circle</button>
            <button type="button" className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/10 hover:scale-105 transition-transform flex items-center gap-2">
              <span className="material-symbols-outlined">shopping_cart</span>
              Cart
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-4xl w-full text-center">
          <div className="relative mb-12">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-secondary-container/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-tertiary-container/20 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative group">
                <div className="flex justify-center gap-4 mb-8">
                  <div className="w-24 h-24 bg-primary-container rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                    <span className="text-5xl font-black text-on-primary-container plusJakartaSans">4</span>
                  </div>
                  <div className="w-24 h-24 bg-secondary-container rounded-2xl flex items-center justify-center shadow-xl shadow-secondary/10 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <span className="text-5xl font-black text-on-secondary-container plusJakartaSans">0</span>
                  </div>
                  <div className="w-24 h-24 bg-tertiary-container rounded-2xl flex items-center justify-center shadow-xl shadow-tertiary/10 transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                    <span className="text-5xl font-black text-on-tertiary-container plusJakartaSans">4</span>
                  </div>
                </div>

                <div className="relative w-72 h-72 mx-auto mb-8">
                  <img
                    alt="Friendly confused robot"
                    className="w-full h-full object-contain drop-shadow-2xl"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqjfjATnMHZ53hZCfqkeEa2yd1R8LtrY83EY-E54QHH6bPWAhovmxM_U1LJa4JLmXxrkgWmAsM9HQxSvo-R1cDJ32zGQeNmwKguXNuJ-KsSKM8NGXrzEfRyVCHATHo1oChWb13H7yNCT-d6U_OujZDO9aCIG3IuhafRRqpsRSde2avQiBuhXayHwqklhe3BAMjpaz6KVnusp5VAfInGyAi6mA5gZ1AOGW7h5RKKvZSYOeNR_3yArSHJMmnvqCZL520EevVqy_tIIQX"
                  />
                </div>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black text-on-background plusJakartaSans tracking-tight leading-tight">
                  Oops! This toy seems to be lost.
                </h1>
                <p className="text-lg md:text-xl text-on-surface-variant font-medium max-w-lg mx-auto">
                  The page you&apos;re looking for doesn&apos;t exist or has been moved to a different toy box.
                </p>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  className="bg-primary-container text-on-primary-container px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-3"
                  to="/"
                >
                  <span className="material-symbols-outlined">home</span>
                  Back to Home
                </Link>
                <Link
                  className="border-2 border-secondary text-secondary px-10 py-4 rounded-full font-bold text-lg hover:bg-secondary/5 hover:scale-105 transition-transform flex items-center justify-center gap-3"
                  to="/best-sellers"
                >
                  <span className="material-symbols-outlined">shopping_bag</span>
                  Keep Shopping
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-24 text-left">
            <h3 className="text-2xl font-bold plusJakartaSans mb-8 text-center">Maybe you were looking for these?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/best-sellers" className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl shadow-stone-200/50 hover:scale-[1.02] transition-transform cursor-pointer block">
                <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary">smart_toy</span>
                </div>
                <h4 className="font-bold text-xl plusJakartaSans mb-2">Popular Toys</h4>
                <p className="text-on-surface-variant text-sm">Discover what&apos;s trending in our toy box right now.</p>
              </Link>

              <Link to="/" className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl shadow-stone-200/50 hover:scale-[1.02] transition-transform cursor-pointer block">
                <div className="w-12 h-12 bg-secondary-container/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-secondary">category</span>
                </div>
                <h4 className="font-bold text-xl plusJakartaSans mb-2">By Category</h4>
                <p className="text-on-surface-variant text-sm">Browse by age, type, or brand to find the perfect fit.</p>
              </Link>

              <Link to="/new-arrivals" className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl shadow-stone-200/50 hover:scale-[1.02] transition-transform cursor-pointer block">
                <div className="w-12 h-12 bg-tertiary-container/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-tertiary">redeem</span>
                </div>
                <h4 className="font-bold text-xl plusJakartaSans mb-2">Gifting Ideas</h4>
                <p className="text-on-surface-variant text-sm">Need a hand? Our curated gift sets are ready for play.</p>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full rounded-t-[3rem] mt-20 bg-stone-100 dark:bg-stone-950 flex flex-col items-center py-12 px-8 text-center">
        <div className="text-lg font-black text-stone-800 dark:text-stone-200 mb-6 plusJakartaSans">Toybox</div>
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <a className="text-stone-500 dark:text-stone-400 font-medium text-sm hover:text-yellow-600 dark:hover:text-yellow-400" href="#">Privacy Policy</a>
          <a className="text-stone-500 dark:text-stone-400 font-medium text-sm hover:text-yellow-600 dark:hover:text-yellow-400" href="#">Terms of Service</a>
          <a className="text-stone-500 dark:text-stone-400 font-medium text-sm hover:text-yellow-600 dark:hover:text-yellow-400" href="#">Shipping Info</a>
          <a className="text-stone-500 dark:text-stone-400 font-medium text-sm hover:text-yellow-600 dark:hover:text-yellow-400" href="#">Contact Us</a>
        </div>
        <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">© 2024 The Curated Toybox. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default NotFound;
