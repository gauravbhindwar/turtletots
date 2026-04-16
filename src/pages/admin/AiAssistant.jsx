import React from 'react';

const AdminAi = () => {
  return (
    <>
      <header className="mb-12">
        <h2 className="text-4xl font-black plusJakartaSans tracking-tight text-on-surface">AI Assistant</h2>
        <p className="text-neutral-500 mt-2 font-medium">Generate descriptions, analyze trends, and ask questions about your store.</p>
      </header>

      <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10 min-h-[600px] flex flex-col relative overflow-hidden">
        
        {/* Dynamic Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl -z-10"></div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-xs font-black uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Coming Soon
          </div>

          <div className="w-24 h-24 bg-surface-container rounded-2xl flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-[4rem] text-primary">auto_awesome</span>
          </div>
          <h3 className="text-2xl font-bold plusJakartaSans">How can I help your store today?</h3>
          <p className="text-on-surface-variant font-medium max-w-2xl">
            AI-generated replies are coming soon. You can still use this chat box to draft prompts and prepare your requests.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
            <button className="bg-surface-container-low p-4 rounded-xl text-left border border-outline-variant/10 opacity-80" type="button" disabled>
              <span className="block font-bold text-sm text-on-surface mb-1">Write product descriptions</span>
              <span className="text-xs text-neutral-500">for "Wooden Train Set"</span>
            </button>
            <button className="bg-surface-container-low p-4 rounded-xl text-left border border-outline-variant/10 opacity-80" type="button" disabled>
              <span className="block font-bold text-sm text-on-surface mb-1">Analyze sales trend</span>
              <span className="text-xs text-neutral-500">over the last 30 days</span>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <p className="text-xs font-semibold text-on-surface-variant mb-3 ml-2">
            Chat UI is live. AI responses will be enabled in a future update.
          </p>
          <div className="relative">
            <input className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary py-4 pl-6 pr-16 rounded-full outline-none shadow-sm" placeholder="Ask anything about your inventory or data..." type="text" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center opacity-80" type="button">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAi;
