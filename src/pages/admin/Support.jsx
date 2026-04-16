import React from 'react';

const AdminSupport = () => {
  return (
    <>
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black plusJakartaSans tracking-tight text-on-surface">Support Center</h2>
          <p className="text-neutral-500 mt-2 font-medium">Manage customer inquiries and ticket resolutions.</p>
        </div>
        <button className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
          <span className="material-symbols-outlined">add_comment</span>
          <span className="text-sm">New Ticket</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 text-center">
          <h3 className="text-3xl font-black plusJakartaSans text-on-surface">12</h3>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Open Tickets</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 text-center">
          <h3 className="text-3xl font-black plusJakartaSans text-secondary">4</h3>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">High Priority</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 text-center">
          <h3 className="text-3xl font-black plusJakartaSans text-primary">2.4h</h3>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Avg Response</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 text-center">
          <h3 className="text-3xl font-black plusJakartaSans text-on-surface">89%</h3>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Resolution Rate</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="p-6 border-b border-surface-container flex gap-4">
          <input className="flex-1 bg-surface-container-low border-none focus:ring-0 text-sm placeholder:text-neutral-400 p-4 rounded-xl outline-none" placeholder="Search customer or ticket ID..." type="text"/>
          <select className="bg-surface-container-low border-none focus:ring-0 text-sm p-4 rounded-xl outline-none">
            <option>All Status</option>
            <option>Open</option>
            <option>Resolved</option>
          </select>
        </div>
        <div className="divide-y divide-surface-container/50">
          <div className="p-6 hover:bg-surface-container-low/30 transition-colors flex justify-between items-center cursor-pointer">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold">SM</div>
              <div>
                <h4 className="font-bold text-on-surface">Broken wooden part upon arrival</h4>
                <p className="text-sm text-neutral-500 mt-1">Order #TY-9021 • <span className="font-semibold text-secondary">Samantha Miller</span></p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-error-container/20 text-error rounded-full text-[10px] font-bold uppercase mb-2">High Priority</span>
              <p className="text-xs text-neutral-400">2 hours ago</p>
            </div>
          </div>

          <div className="p-6 hover:bg-surface-container-low/30 transition-colors flex justify-between items-center cursor-pointer">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold">JD</div>
              <div>
                <h4 className="font-bold text-on-surface">How to assemble the activity cube?</h4>
                <p className="text-sm text-neutral-500 mt-1">Product Inquiry • <span className="font-semibold text-secondary">John Doe</span></p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-surface-variant text-outline rounded-full text-[10px] font-bold uppercase mb-2">Open</span>
              <p className="text-xs text-neutral-400">5 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSupport;
