import React from 'react';

const AdminOrders = () => {
  return (
    <>
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black plusJakartaSans tracking-tight text-on-surface">Orders Management</h2>
          <p className="text-neutral-500 mt-2 font-medium">Tracking orders across all shipping zones.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-low px-6 py-3 rounded-full flex items-center gap-3 focus-within:bg-surface-container-lowest transition-all ring-1 ring-transparent focus-within:ring-primary/20">
            <span className="material-symbols-outlined text-neutral-400">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-neutral-400 w-64 outline-none" placeholder="Find an order..." type="text"/>
          </div>
          <button className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">filter_list</span>
            <span className="text-sm">Filters</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary-container rounded-2xl text-on-primary-container">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="text-[10px] font-bold text-primary px-3 py-1 bg-primary/10 rounded-full uppercase">Today</span>
          </div>
          <h3 className="text-3xl font-black plusJakartaSans text-on-surface">24</h3>
          <p className="text-neutral-500 text-sm font-medium mt-1">Processing Orders</p>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary-container rounded-2xl text-on-secondary-container">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <span className="text-[10px] font-bold text-secondary px-3 py-1 bg-secondary/10 rounded-full uppercase">+12.5%</span>
          </div>
          <h3 className="text-3xl font-black plusJakartaSans text-on-surface">86</h3>
          <p className="text-neutral-500 text-sm font-medium mt-1">In Transit</p>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-tertiary-container rounded-2xl text-on-tertiary-container">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <span className="text-[10px] font-bold text-tertiary px-3 py-1 bg-tertiary/10 rounded-full uppercase">Total</span>
          </div>
          <h3 className="text-3xl font-black plusJakartaSans text-on-surface">1,204</h3>
          <p className="text-neutral-500 text-sm font-medium mt-1">Delivered Lifetime</p>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/10">
        <div className="p-8 border-b border-surface-container flex justify-between items-center">
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full text-sm font-bold border border-outline-variant/20">All Orders</button>
            <button className="px-6 py-2 text-neutral-500 hover:text-primary transition-colors text-sm font-semibold">In Progress</button>
            <button className="px-6 py-2 text-neutral-500 hover:text-primary transition-colors text-sm font-semibold">Completed</button>
          </div>
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <span className="material-symbols-outlined text-lg">sort</span>
            <span>Sorted by Date</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-neutral-400 text-[11px] uppercase tracking-widest bg-surface-container-low/50">
                <th className="px-8 py-6 font-bold">Order ID</th>
                <th className="px-8 py-6 font-bold">Customer</th>
                <th className="px-8 py-6 font-bold">Items</th>
                <th className="px-8 py-6 font-bold">Total</th>
                <th className="px-8 py-6 font-bold">Status</th>
                <th className="px-8 py-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/30">
              <tr className="hover:bg-surface-container-low/50 transition-colors group">
                <td className="px-8 py-6"><span className="font-bold text-on-surface">#TY-9021</span></td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold">AS</div>
                    <span className="font-semibold text-sm">Alice Sterling</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex -space-x-3 overflow-hidden">
                    <div className="inline-block h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white">T</div>
                    <div className="inline-block h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400 ring-2 ring-white">+2</div>
                  </div>
                </td>
                <td className="px-8 py-6"><span className="font-bold text-on-surface">₹12,450.00</span></td>
                <td className="px-8 py-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Processing
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 hover:bg-surface-container rounded-full transition-all group-hover:shadow-md">
                    <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary">visibility</span>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low/50 transition-colors group">
                <td className="px-8 py-6"><span className="font-bold text-on-surface">#TY-9019</span></td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs font-bold">BW</div>
                    <span className="font-semibold text-sm">Bella Watson</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex -space-x-3 overflow-hidden">
                    <div className="inline-block h-8 w-8 rounded-full bg-tertiary flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white">B</div>
                  </div>
                </td>
                <td className="px-8 py-6"><span className="font-bold text-on-surface">₹4,500.00</span></td>
                <td className="px-8 py-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    Delivered
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 hover:bg-surface-container rounded-full transition-all group-hover:shadow-md">
                    <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary">visibility</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default AdminOrders;
