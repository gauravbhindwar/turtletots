import React from 'react';

const AdminSupport = () => {
  return (
    <>
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black plusJakartaSans tracking-tight text-on-surface">Support Center</h2>
          <p className="text-neutral-500 mt-2 font-medium">Manage customer inquiries and ticket resolutions.</p>
        </div>
        <button className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-bold flex items-center gap-2 opacity-75 cursor-not-allowed" disabled>
          <span className="material-symbols-outlined">add_comment</span>
          <span className="text-sm">New Ticket</span>
        </button>
      </header>

      <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-8 md:p-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-xs font-black uppercase tracking-widest mb-6">
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          Coming Soon
        </div>

        <h3 className="text-2xl plusJakartaSans font-black text-on-surface mb-3">Support workflows are under development</h3>
        <p className="text-on-surface-variant font-medium max-w-2xl">
          Ticket routing, SLA tracking, and status management will be available in the next release.
          You can still receive customer requests through WhatsApp and inquiries.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-outline">Ticket Queue</p>
            <p className="text-sm font-semibold text-on-surface mt-2">Coming soon</p>
          </div>
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-outline">Priority Rules</p>
            <p className="text-sm font-semibold text-on-surface mt-2">Coming soon</p>
          </div>
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-outline">Resolution Analytics</p>
            <p className="text-sm font-semibold text-on-surface mt-2">Coming soon</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminSupport;
