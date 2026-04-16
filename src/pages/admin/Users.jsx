import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

const ROLE_OPTIONS = ['user', 'manager', 'admin'];
const PAGE_SIZE = 20;

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

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
    setUsers(rows.slice(0, PAGE_SIZE));
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

    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', row.id);

    if (updateError) {
      setError(updateError.message || 'Unable to save user updates.');
      setSavingId('');
      return;
    }

    setSuccess(`Saved ${payload.email || 'user'} successfully.`);
    setSavingId('');
  };

  const canGoPrev = currentPage > 0;
  const canGoNext = hasNextPage;

  return (
    <>
      <header className="mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight text-on-surface plusJakartaSans">Users & Roles</h2>
        <p className="text-on-surface-variant font-medium mt-2">Admin-only area. Manage users, managers, and admins.</p>
      </header>

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
