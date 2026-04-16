import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useToast } from '../../components/ToastProvider';
import { useAuthSession } from '../../hooks/useAuthSession';
import { clearStoreSettingsCache, DEFAULT_STORE_SETTINGS } from '../../utils/storeSettings';

const SECTION_ITEMS = [
  { id: 'general', label: 'General' },
  { id: 'shipping', label: 'Shipping Zones' },
  { id: 'payments', label: 'Payments' },
  { id: 'taxes', label: 'Taxes & Duties' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'danger', label: 'Danger Zone' }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminSettings = () => {
  const { user } = useAuthSession();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(DEFAULT_STORE_SETTINGS);

  const activeSectionMeta = useMemo(() => {
    return SECTION_ITEMS.find((section) => section.id === activeSection) || SECTION_ITEMS[0];
  }, [activeSection]);

  const loadGeneralSettings = async () => {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase
      .from('store_settings')
      .select('store_name, support_email, whatsapp_order_number, store_description')
      .eq('id', true)
      .maybeSingle();

    if (loadError) {
      setError(loadError.message || 'Unable to load store settings.');
      setLoading(false);
      return;
    }

    if (data) {
      setForm({
        store_name: data.store_name || DEFAULT_STORE_SETTINGS.store_name,
        support_email: data.support_email || DEFAULT_STORE_SETTINGS.support_email,
        whatsapp_order_number: data.whatsapp_order_number || DEFAULT_STORE_SETTINGS.whatsapp_order_number,
        store_description: data.store_description || DEFAULT_STORE_SETTINGS.store_description
      });
      setLoading(false);
      return;
    }

    const payload = {
      id: true,
      ...DEFAULT_STORE_SETTINGS,
      ...(user?.id ? { updated_by: user.id } : {})
    };

    const { data: inserted, error: insertError } = await supabase
      .from('store_settings')
      .upsert([payload], { onConflict: 'id' })
      .select('store_name, support_email, whatsapp_order_number, store_description')
      .single();

    if (insertError) {
      setError(insertError.message || 'Unable to initialize store settings.');
      setLoading(false);
      return;
    }

    setForm({
      store_name: inserted.store_name || DEFAULT_STORE_SETTINGS.store_name,
      support_email: inserted.support_email || DEFAULT_STORE_SETTINGS.support_email,
      whatsapp_order_number: inserted.whatsapp_order_number || DEFAULT_STORE_SETTINGS.whatsapp_order_number,
      store_description: inserted.store_description || DEFAULT_STORE_SETTINGS.store_description
    });
    setLoading(false);
  };

  useEffect(() => {
    loadGeneralSettings();
  }, []);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleSaveGeneral = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedStoreName = form.store_name.trim();
    const trimmedSupportEmail = form.support_email.trim();
    const trimmedWhatsApp = form.whatsapp_order_number.trim();
    const trimmedDescription = form.store_description.trim();

    if (!trimmedStoreName) {
      setError('Store name is required.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedSupportEmail)) {
      setError('Please enter a valid support email.');
      return;
    }

    if (!trimmedWhatsApp) {
      setError('WhatsApp order number is required.');
      return;
    }

    setSaving(true);

    const payload = {
      id: true,
      store_name: trimmedStoreName,
      support_email: trimmedSupportEmail,
      whatsapp_order_number: trimmedWhatsApp,
      store_description: trimmedDescription,
      updated_by: user?.id || null
    };

    const { error: saveError } = await supabase
      .from('store_settings')
      .upsert([payload], { onConflict: 'id' });

    if (saveError) {
      setError(saveError.message || 'Unable to save settings right now.');
      showToast('Unable to save settings.', { type: 'error' });
      setSaving(false);
      return;
    }

    setForm({
      store_name: trimmedStoreName,
      support_email: trimmedSupportEmail,
      whatsapp_order_number: trimmedWhatsApp,
      store_description: trimmedDescription
    });
    clearStoreSettingsCache();
    setSuccess('Settings saved successfully.');
    showToast('Store settings saved.', { type: 'success' });
    setSaving(false);
  };

  const renderGeneralSection = () => {
    return (
      <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
        <h3 className="text-xl font-bold plusJakartaSans mb-6">Basic Information</h3>

        {error && (
          <div className="mb-4 rounded-lg border border-error/30 bg-error-container/10 px-4 py-3 text-sm font-semibold text-error">
            {error}
          </div>
        )}

        {!error && success && (
          <div className="mb-4 rounded-lg border border-[#128C7E]/30 bg-[#128C7E]/10 px-4 py-3 text-sm font-semibold text-[#128C7E]">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
            Loading settings...
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSaveGeneral}>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Store Name</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none"
                value={form.store_name}
                onChange={(event) => updateField('store_name', event.target.value)}
                type="text"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Support Email</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none"
                  value={form.support_email}
                  onChange={(event) => updateField('support_email', event.target.value)}
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">WhatsApp Order Number</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none"
                  value={form.whatsapp_order_number}
                  onChange={(event) => updateField('whatsapp_order_number', event.target.value)}
                  type="text"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Store Description</label>
              <textarea
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary outline-none h-32"
                value={form.store_description}
                onChange={(event) => updateField('store_description', event.target.value)}
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-container text-on-primary-container font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </section>
    );
  };

  const renderComingSoonSection = () => {
    return (
      <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
        <h3 className={`text-xl font-bold plusJakartaSans mb-4 ${activeSectionMeta.id === 'danger' ? 'text-error' : 'text-on-surface'}`}>
          {activeSectionMeta.label}
        </h3>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 flex items-start gap-4">
          <span className={`material-symbols-outlined text-2xl ${activeSectionMeta.id === 'danger' ? 'text-error' : 'text-primary'}`}>construction</span>
          <div>
            <p className="text-base font-bold text-on-surface">Coming soon</p>
            <p className="text-sm text-on-surface-variant mt-1">
              This section is under development and will be available in the next update.
            </p>
          </div>
        </div>
      </section>
    );
  };

  return (
    <>
      <header className="mb-12">
        <h2 className="text-4xl font-black plusJakartaSans tracking-tight text-on-surface">Store Settings</h2>
        <p className="text-neutral-500 mt-2 font-medium">Configure operations, policies, and integrations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 border-r border-surface-container/50 pr-8">
          <nav className="space-y-2">
            {SECTION_ITEMS.map((section) => {
              const isActive = activeSection === section.id;
              const isDanger = section.id === 'danger';

              const buttonClass = isActive
                ? isDanger
                  ? 'bg-error-container/25 text-error font-bold'
                  : 'bg-primary-container text-on-primary-container font-bold'
                : isDanger
                  ? 'text-error hover:bg-error/10 font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container font-medium';

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id);
                    setSuccess('');
                    setError('');
                  }}
                  className={`block w-full text-left py-3 px-4 rounded-xl transition-colors ${buttonClass} ${isDanger ? 'mt-8 text-sm' : ''}`}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {activeSection === 'general' ? renderGeneralSection() : renderComingSoonSection()}
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
