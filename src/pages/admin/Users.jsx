import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuthSession } from '../../hooks/useAuthSession';

const ROLE_OPTIONS = ['user', 'manager', 'admin'];
const PAGE_SIZE = 20;

const EMPTY_FORM = { email: '', password: '', full_name: '', role: 'user' };

const Users = () => {
  const { session } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Create-user modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async (page = currentPage) => {
    setLoading(true);
    setError('');

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, address, role, created_at')
      .order('created_at', { ascending: false })
      .range(from, to + 1);

    if (fetchError) {
      setError(fetchError.message || 'Unable to load users.');
      setLoading(false);
      return;
    }

    const rows = data || [];
    setHasNextPage(rows.length > PAGE_SIZE);
    // Stamp _originalRole so saveUser can detect if the role changed.
    setUsers(rows.slice(0, PAGE_SIZE).map((r) => ({ ...r, _originalRole: r.role })));
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const updateUserField = (id, field, value) => {
    setUsers((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  };

  const saveUser = async (row) => {
    setSavingId(row.id);
    setError('');
    setSuccess('');

    const payload = {
      full_name: row.full_name?.trim() || '',
      email: row.email?.trim() || '',
      phone: row.phone?.trim() || '',
      address: row.address?.trim() || '',
      role: row.role
    };

    // Find the original role to detect role changes.
    const originalUser = users.find((u) => u.id === row.id);
    const roleChanged = originalUser && originalUser._originalRole && originalUser._originalRole !== row.role;

    if (roleChanged) {
      // Use the edge function so app_metadata is also updated (JWT sync).
      // Use direct fetch() — supabase.functions.invoke() goes through the
      // auth lock and can fail if autoRefresh is in-flight at the same time.
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession?.access_token) {
        setError('Your session has expired. Please log out and log back in.');
        setSavingId('');
        return;
      }

      let roleRes;
      try {
        roleRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ userId: row.id, role: row.role }),
        });
      } catch (_netErr) {
        setError('Network error — could not reach the server.');
        setSavingId('');
        return;
      }

      if (!roleRes.ok) {
        let errMsg = 'Unable to update role.';
        try { errMsg = (await roleRes.json())?.error || errMsg; } catch { /* ignore */ }
        setError(errMsg);
        setSavingId('');
        return;
      }

      // Update remaining fields via direct table update (excluding role, already handled).
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: payload.full_name, email: payload.email, phone: payload.phone, address: payload.address })
        .eq('id', row.id);

      if (updateError) {
        setError(updateError.message || 'Unable to save user updates.');
        setSavingId('');
        return;
      }
    } else {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', row.id);

      if (updateError) {
        setError(updateError.message || 'Unable to save user updates.');
        setSavingId('');
        return;
      }
    }

    // Stamp the saved role as the new original so the next save detects changes correctly.
    setUsers((prev) =>
      prev.map((u) => (u.id === row.id ? { ...u, _originalRole: row.role } : u))
    );

    setSuccess(`Saved ${payload.email || 'user'} successfully.`);
    setSavingId('');
  };

  const canGoPrev = currentPage > 0;
  const canGoNext = hasNextPage;

  const createUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    const { email, password, full_name, role } = form;

    if (!email.trim() || !password) {
      setFormError('Email and password are required.');
      setCreating(false);
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      setCreating(false);
      return;
    }

    // Always retrieve a fresh token — the session in React state may be stale.
    const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !freshSession?.access_token) {
      setFormError('Your session has expired. Please log out and log back in.');
      setCreating(false);
      return;
    }

    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inviteUser`;
    let fnRes;
    try {
      fnRes = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, full_name: full_name.trim(), role }),
      });
    } catch (_networkErr) {
      setFormError('Network error — could not reach the server. Check your connection.');
      setCreating(false);
      return;
    }

    if (!fnRes.ok) {
      let errMsg = 'Unable to create user.';
      try {
        const errBody = await fnRes.json();
        errMsg = errBody?.error || errMsg;
      } catch { /* ignore parse error */ }
      setFormError(errMsg);
      setCreating(false);
      return;
    }

    setCreating(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSuccess(`User ${email.trim()} created successfully.`);
    fetchUsers(currentPage);
  };

  return (
    <>
      <header className="mb-10 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface plusJakartaSans">Users & Roles</h2>
          <p className="text-on-surface-variant font-medium mt-2">Admin-only area. Manage users, managers, and admins.</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowModal(true); setFormError(''); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-container text-on-primary-container text-sm font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Create User
        </button>
      </header>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container flex items-center justify-between">
              <h3 className="text-lg font-bold plusJakartaSans">Create New User</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={createUser} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="rounded-lg bg-error-container/20 border border-error/30 px-4 py-3 text-sm font-semibold text-error">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface">Email <span className="text-error">*</span></label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm"
                  placeholder="jane@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface">Password <span className="text-error">*</span></label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm font-bold capitalize"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-full bg-primary-container text-on-primary-container text-sm font-bold disabled:opacity-70"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 text-sm font-semibold text-error">
          {error}
        </div>
      )}

      {!error && success && (
        <div className="mb-6 rounded-xl border border-[#128C7E]/30 bg-[#128C7E]/10 px-4 py-3 text-sm font-semibold text-[#128C7E]">
          {success}
        </div>
      )}

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container flex items-center justify-between">
          <h3 className="text-lg font-bold plusJakartaSans">Accounts</h3>
          <button
            type="button"
            onClick={() => fetchUsers(currentPage)}
            className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-bold"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[980px]">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container-low/60">
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Phone</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Address</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-on-surface-variant" colSpan="6">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-on-surface-variant" colSpan="6">No users found.</td>
                </tr>
              ) : (
                users.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/30 transition-colors align-top">
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.full_name || ''}
                        onChange={(event) => updateUserField(row.id, 'full_name', event.target.value)}
                        className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm"
                        placeholder="Full name"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="email"
                        value={row.email || ''}
                        onChange={(event) => updateUserField(row.id, 'email', event.target.value)}
                        className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm"
                        placeholder="Email"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.phone || ''}
                        onChange={(event) => updateUserField(row.id, 'phone', event.target.value)}
                        className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm"
                        placeholder="Phone"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={row.role || 'user'}
                        onChange={(event) => updateUserField(row.id, 'role', event.target.value)}
                        className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm font-bold capitalize"
                      >
                        {ROLE_OPTIONS.map((roleValue) => (
                          <option key={`${row.id}-${roleValue}`} value={roleValue}>
                            {roleValue}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <textarea
                        value={row.address || ''}
                        onChange={(event) => updateUserField(row.id, 'address', event.target.value)}
                        className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm"
                        rows="2"
                        placeholder="Address"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => saveUser(row)}
                        disabled={savingId === row.id}
                        className="px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-sm font-bold disabled:opacity-70"
                      >
                        {savingId === row.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-5 border-t border-surface-container bg-surface-container-low/20">
          <p className="text-xs font-semibold text-on-surface-variant">
            Page {currentPage + 1}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={!canGoPrev}
              className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-bold disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={!canGoNext}
              className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Users;
