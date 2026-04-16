import React from 'react';

const AdminSettings = () => {
  return (
    <>
      <header className="mb-12">
        <h2 className="text-4xl font-black plusJakartaSans tracking-tight text-on-surface">Store Settings</h2>
        <p className="text-neutral-500 mt-2 font-medium">Configure operations, policies, and integrations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 border-r border-surface-container/50 pr-8">
          <nav className="space-y-2">
            <a href="#" className="block py-3 px-4 rounded-xl bg-primary-container text-primary-fixed-dim font-bold transition-colors">General</a>
            <a href="#" className="block py-3 px-4 rounded-xl text-neutral-500 hover:bg-surface-container transition-colors font-medium">Shipping Zones</a>
            <a href="#" className="block py-3 px-4 rounded-xl text-neutral-500 hover:bg-surface-container transition-colors font-medium">Payments</a>
            <a href="#" className="block py-3 px-4 rounded-xl text-neutral-500 hover:bg-surface-container transition-colors font-medium">Taxes & Duties</a>
            <a href="#" className="block py-3 px-4 rounded-xl text-neutral-500 hover:bg-surface-container transition-colors font-medium">Notifications</a>
            <a href="#" className="block py-3 px-4 rounded-xl text-error hover:bg-error/10 transition-colors font-medium mt-8 text-sm">Danger Zone</a>
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-bold plusJakartaSans mb-6">Basic Information</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Store Name</label>
                <input className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none" defaultValue="TurtleTots" type="text" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Support Email</label>
                  <input className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none" defaultValue="support@turtletots.in" type="email" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">WhatsApp Order Number</label>
                  <input className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none" defaultValue="+91 98765 43210" type="text" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Store Description</label>
                <textarea className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none h-32" defaultValue="Curated wooden toys and educational goods for your little ones."></textarea>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button className="bg-primary-container text-on-primary-container font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform">Save Changes</button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
