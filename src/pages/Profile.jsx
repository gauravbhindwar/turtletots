import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuthSession } from '../hooks/useAuthSession';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, role, refreshProfile } = useAuthSession();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (!profile && user) {
      setForm({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: ''
      });
      return;
    }

    if (!profile) return;

    setForm({
      full_name: profile.full_name || '',
      email: profile.email || user?.email || '',
      phone: profile.phone || user?.phone || '',
      address: profile.address || ''
    });
  }, [profile, user]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim()
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id);

    if (profileError) {
      setError(profileError.message || 'Unable to save your profile.');
      setSaving(false);
      return;
    }

    let emailUpdateNote = '';
    if (form.email.trim() && form.email.trim() !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: form.email.trim(),
        data: { full_name: form.full_name.trim() }
      });

      if (authError) {
        emailUpdateNote = ' Profile saved, but auth email update needs verification.';
      } else {
        emailUpdateNote = ' Verify your new email if prompted by Supabase.';
      }
    } else {
      await supabase.auth.updateUser({
        data: { full_name: form.full_name.trim() }
      });
    }

    await refreshProfile();
    setMessage(`Profile updated successfully.${emailUpdateNote}`);
    setSaving(false);
  };

  const roleBadge = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-10">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-4xl font-black plusJakartaSans tracking-tight text-on-surface">My Profile</h1>
          <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-wider">
            {roleBadge}
          </span>
        </div>
        <p className="text-on-surface-variant font-medium">Manage your personal details used for ordering and account communication.</p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 text-sm font-semibold text-error">
          {error}
        </div>
      )}

      {!error && message && (
        <div className="mb-6 rounded-xl border border-[#128C7E]/30 bg-[#128C7E]/10 px-4 py-3 text-sm font-semibold text-[#128C7E]">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="block">
            <span className="text-sm font-bold text-on-surface-variant ml-1 mb-2 block">Full Name</span>
            <input
              type="text"
              value={form.full_name}
              onChange={(event) => updateField('full_name', event.target.value)}
              className="w-full bg-surface-container-low border-0 rounded-lg py-3.5 px-4 focus:ring-2 focus:ring-primary"
              placeholder="Your full name"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-on-surface-variant ml-1 mb-2 block">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full bg-surface-container-low border-0 rounded-lg py-3.5 px-4 focus:ring-2 focus:ring-primary"
              placeholder="name@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-on-surface-variant ml-1 mb-2 block">Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="w-full bg-surface-container-low border-0 rounded-lg py-3.5 px-4 focus:ring-2 focus:ring-primary"
              placeholder="+91..."
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold text-on-surface-variant ml-1 mb-2 block">Address</span>
            <textarea
              value={form.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="w-full bg-surface-container-low border-0 rounded-lg py-3.5 px-4 focus:ring-2 focus:ring-primary"
              rows="4"
              placeholder="Shipping address"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-full bg-primary-container text-on-primary-container font-bold hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-full bg-surface-container-low text-on-surface-variant font-semibold"
          >
            Back to Shop
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
