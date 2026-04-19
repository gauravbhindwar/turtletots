import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../utils/supabase';

const SEARCH_TIMEOUT_MS = 12000;

const ORDER_STATUS = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', className: 'bg-primary/10 text-primary' },
  shipped: { label: 'Shipped', className: 'bg-secondary-container/40 text-secondary-dim' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-error-container/30 text-error' }
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    try {
      let ordersQuery = supabase
        .from('orders')
        .select('id, order_number, user_id, status, total_amount, created_at, order_items(quantity, unit_price, products(name, slug, image_url))')
        .order('created_at', { ascending: false })
        .limit(250)
        .abortSignal(controller.signal);

      // Apply status filter server-side to avoid fetching irrelevant rows.
      if (statusFilter !== 'all') {
        ordersQuery = ordersQuery.eq('status', statusFilter);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;

      if (ordersError) {
        setError(ordersError.message || 'Unable to load orders right now.');
        setOrders([]);
        setLoading(false);
        return;
      }

      const rawOrders = ordersData || [];
      const userIds = Array.from(new Set(rawOrders.map((order) => order.user_id).filter(Boolean)));

      let profilesById = {};

      if (userIds.length) {
        const { data: profileRows, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (!profilesError) {
          profilesById = (profileRows || []).reduce((accumulator, profile) => {
            accumulator[profile.id] = profile;
            return accumulator;
          }, {});
        }
      }

      const normalized = rawOrders.map((order) => {
        const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
        const productNames = orderItems
          .map((item) => item.products?.name)
          .filter(Boolean);
        const totalItems = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const customer = profilesById[order.user_id] || null;

        return {
          ...order,
          customer_name: customer?.full_name || customer?.email || 'Guest Customer',
          customer_email: customer?.email || '',
          product_names: productNames,
          total_items: totalItems,
          first_image: orderItems.find((item) => item.products?.image_url)?.products?.image_url || ''
        };
      });

      setOrders(normalized);
      setLoading(false);
    } catch (fetchError) {
      const isTimeout = fetchError?.name === 'AbortError';
      setError(isTimeout ? 'Order request timed out.' : 'Unable to load orders right now.');
      setOrders([]);
      setLoading(false);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        order.order_number,
        order.customer_name,
        order.customer_email,
        ...(order.product_names || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orders, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const processing = orders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status)).length;
    const transit = orders.filter((order) => order.status === 'shipped').length;
    const delivered = orders.filter((order) => order.status === 'delivered').length;

    return {
      processing,
      transit,
      delivered
    };
  }, [orders]);

  const getStatusBadge = (status) => {
    return ORDER_STATUS[status] || {
      label: (status || 'Unknown').toString(),
      className: 'bg-surface-container text-on-surface-variant'
    };
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-12">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black plusJakartaSans tracking-tight text-on-surface">Orders Management</h2>
          <p className="text-neutral-500 mt-2 font-medium">Search by order, customer, or product name.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="bg-surface-container-low px-4 sm:px-5 py-2.5 sm:py-3 rounded-full flex items-center gap-3">
            <span className="material-symbols-outlined text-neutral-400">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-neutral-400 w-full sm:w-72 md:w-64 outline-none"
              placeholder="Find order or product..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="bg-secondary-container/50 text-on-secondary-container px-4 sm:px-5 py-2.5 sm:py-3 rounded-full font-bold text-sm outline-none"
          >
            {STATUS_FILTERS.map((filterItem) => (
              <option key={filterItem.value} value={filterItem.value}>
                {filterItem.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8 md:mb-10">
        <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Processing</p>
          <p className="text-2xl sm:text-3xl font-black plusJakartaSans mt-2">{summary.processing}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">In Transit</p>
          <p className="text-2xl sm:text-3xl font-black plusJakartaSans mt-2">{summary.transit}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/10 sm:col-span-2 xl:col-span-1">
          <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Delivered</p>
          <p className="text-2xl sm:text-3xl font-black plusJakartaSans mt-2">{summary.delivered}</p>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        {error && (
          <div className="mx-6 mt-6 rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 text-sm font-semibold text-error">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Order</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Customer</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Products</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Items</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-on-surface-variant">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-on-surface-variant">No matching orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const status = getStatusBadge(order.status);
                  const firstTwoProducts = (order.product_names || []).slice(0, 2);
                  const overflowCount = Math.max(0, (order.product_names || []).length - firstTwoProducts.length);

                  return (
                    <tr key={order.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-on-surface">{order.order_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-on-surface">{order.customer_name}</p>
                        {order.customer_email && <p className="text-xs text-on-surface-variant">{order.customer_email}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface">{firstTwoProducts.join(', ') || 'No products'}</p>
                        {overflowCount > 0 && <p className="text-xs text-on-surface-variant">+{overflowCount} more</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-on-surface">{order.total_items}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-on-surface">₹{Number(order.total_amount || 0).toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant font-semibold">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default AdminOrders;
