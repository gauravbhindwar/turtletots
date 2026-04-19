import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { getInventoryState, toSafeStock } from '../../utils/inventory';

const FALLBACK_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXOGZdz9c8D6FEXVlEW3oqYeShLr1ZHOjoOALBaSuudQH4_VRB442YX-REBIpxY9WuPnRbrwdQaUy_5MppIOFoybEPdlgiTe2vajyygUAXWhQm4wDdMQfJET643K2qLnevYPs3HCap8clAoRlGJ2PsBtli14Zi81Edpeh0-7Wi3SDn8EusLfOal7uLOdiv5KNEF1esYTXe1pBus9YogQ7P0GhYFJDKHxwNIL5lVm5UKpoN076GlN7lCHJGvvnEVhJDD65xfzi4k6-i';

const SAMPLE_ROWS = [
  {
    id: 'sample-1',
    name: 'Robo-Pal X1',
    sku: 'TOY-0092',
    category: 'STEM',
    stockLabel: 'In Stock (42)',
    stockClass: 'text-on-surface',
    dotClass: 'bg-green-500',
    updated: '2 mins ago',
    categoryClass: 'bg-secondary-container text-on-secondary-container',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGMZH6BT9OqojWHxnKd0o5BOLpaGze1tpi1UZ8JKgDrRbFXVTK-1nehLOmlgcAMDeTleWymGI1QAS5TS6FReKDNs2VltJUEG35GQGAkhUoMIOBjDHfyzkw0h_rNdOcobWrumWN8W691kRl88bzTBEYoCzqF9Js1KcehcLnE3zB5qsLrVJ1_O-fnXuYLNBmRZOYMuyJk7R63OtJYBvNqT_tP-rnsNgLHykPUn_I8Pm62XpszH3YoTvnsEN_tF74sEB-CyeAxQJUHROl'
  },
  {
    id: 'sample-2',
    name: 'Classic Block Set',
    sku: 'TOY-0421',
    category: 'Wooden',
    stockLabel: 'Low Stock (2)',
    stockClass: 'text-error font-bold',
    dotClass: 'bg-error animate-pulse',
    updated: '45 mins ago',
    categoryClass: 'bg-tertiary-container/20 text-tertiary',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfZs1cLEfUCZicJRHZcJED6bO2BGZDgx8EB4F0Kd3oeTfRg8dvEGAOwQVcT5g2kQqmYTA86WJBk-lT3P2nrbHHfMKlfbXv2gYUou6iskFnXYkuoWjIHuzwkLLbxH_-Ydgxn_6685vsdlQhYqzlBpDw98FEwYpXU8Hm7rybt_uWKH5aguMh9D8iANE_auj5HLulnokLdccQYIXgOfi0b3Og8F3nWkQ6jr9fVd6sygHft6vrzCuRWvzvm-h6q-0_cKLFRIKXfLOHhKF4'
  },
  {
    id: 'sample-3',
    name: 'Buddy Bear Plush',
    sku: 'TOY-0883',
    category: 'Plushies',
    stockLabel: 'In Stock (128)',
    stockClass: 'text-on-surface',
    dotClass: 'bg-green-500',
    updated: '3 hours ago',
    categoryClass: 'bg-primary-container text-on-primary-container',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXOGZdz9c8D6FEXVlEW3oqYeShLr1ZHOjoOALBaSuudQH4_VRB442YX-REBIpxY9WuPnRbrwdQaUy_5MppIOFoybEPdlgiTe2vajyygUAXWhQm4wDdMQfJET643K2qLnevYPs3HCap8clAoRlGJ2PsBtli14Zi81Edpeh0-7Wi3SDn8EusLfOal7uLOdiv5KNEF1esYTXe1pBus9YogQ7P0GhYFJDKHxwNIL5lVm5UKpoN076GlN7lCHJGvvnEVhJDD65xfzi4k6-i'
  }
];

const DEFAULT_CATEGORY_DISTRIBUTION = [
  { name: 'Educational', percent: 45, colorClass: 'bg-primary' },
  { name: 'Plushies', percent: 30, colorClass: 'bg-secondary' },
  { name: 'Wooden Toys', percent: 15, colorClass: 'bg-tertiary' },
  { name: 'Others', percent: 10, colorClass: 'bg-outline-variant' }
];

const CATEGORY_DISTRIBUTION_COLORS = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-outline-variant'];

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildCategoryDistribution = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_CATEGORY_DISTRIBUTION;
  }

  const normalized = items
    .map((item) => ({
      name: item?.name || 'Others',
      count: toSafeNumber(item?.count ?? item?.product_count)
    }))
    .filter((item) => item.count >= 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const total = normalized.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    return DEFAULT_CATEGORY_DISTRIBUTION;
  }

  return normalized.map((item, index) => ({
    name: item.name,
    percent: Math.max(1, Math.round((item.count / total) * 100)),
    colorClass: CATEGORY_DISTRIBUTION_COLORS[index] || 'bg-outline-variant'
  }));
};

const formatCompactNumber = (value) => {
  if (!value) return '0';
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

const getTimeAgo = (isoString) => {
  if (!isoString) return 'Just now';

  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = Math.max(0, now - then);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} mins ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`;
  return `${Math.floor(diffMs / day)} days ago`;
};

const getCategoryChipClass = (categoryName) => {
  const label = (categoryName || '').toLowerCase();

  if (label.includes('stem') || label.includes('action')) {
    return 'bg-secondary-container text-on-secondary-container';
  }

  if (label.includes('wood') || label.includes('lego') || label.includes('block')) {
    return 'bg-tertiary-container/20 text-tertiary';
  }

  if (label.includes('plush') || label.includes('soft')) {
    return 'bg-primary-container text-on-primary-container';
  }

  return 'bg-surface-container text-on-surface-variant';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalViews: 0,
    lowStockAlerts: 0,
    recentProducts: [],
    categoryDistribution: DEFAULT_CATEGORY_DISTRIBUTION
  });

  const enrichRecentProductsWithStock = useCallback(async (rows = []) => {
    const productIds = rows.map((row) => row?.id).filter(Boolean);

    if (!productIds.length) {
      return [];
    }

    const { data: variantRows, error: variantsError } = await supabase
      .from('product_variants')
      .select('product_id, stock')
      .in('product_id', productIds);

    if (variantsError) {
      return rows.map((row) => ({
        ...row,
        total_stock: toSafeStock(row?.total_stock)
      }));
    }

    const stockByProduct = {};

    (variantRows || []).forEach((variant) => {
      if (!variant?.product_id) return;
      stockByProduct[variant.product_id] = (stockByProduct[variant.product_id] || 0) + toSafeStock(variant.stock);
    });

    return rows.map((row) => ({
      ...row,
      total_stock: toSafeStock(stockByProduct[row.id] ?? row?.total_stock)
    }));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      const { data: snapshotData, error: snapshotError } = await supabase.rpc('get_admin_dashboard_snapshot');

      if (!snapshotError && snapshotData) {
        const snapshotRow = Array.isArray(snapshotData) ? snapshotData[0] : snapshotData;
        const snapshot = snapshotRow?.get_admin_dashboard_snapshot || snapshotRow;

        if (snapshot && typeof snapshot === 'object') {
          const recentProductsWithStock = await enrichRecentProductsWithStock(Array.isArray(snapshot.recentProducts) ? snapshot.recentProducts : []);

          setDashboardData({
            totalProducts: toSafeNumber(snapshot.totalProducts),
            totalCategories: toSafeNumber(snapshot.totalCategories),
            totalViews: toSafeNumber(snapshot.totalViews),
            lowStockAlerts: toSafeNumber(snapshot.lowStockAlerts),
            recentProducts: recentProductsWithStock,
            categoryDistribution: buildCategoryDistribution(snapshot.categoryDistribution)
          });
          return;
        }
      }

      const [
        productCountRes,
        categoryCountRes,
        viewsRes,
        recentRes,
        lowStockRes,
        categoryDistRes
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('views_count'),
        supabase
          .from('products')
          .select('id, name, slug, image_url, is_available, created_at, category_id, categories(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('product_variants')
          .select('id', { count: 'exact', head: true })
          .lte('stock', 5),
        supabase.rpc('list_categories_with_product_counts')
      ]);

      const totalViews = (viewsRes.data || []).reduce((sum, item) => sum + toSafeNumber(item.views_count), 0);

      const lowStockFromVariants = lowStockRes.count || 0;
      const lowStockFallback = (recentRes.data || []).filter((item) => !item.is_available).length;
      const dynamicDistribution = buildCategoryDistribution(categoryDistRes.data);
      const recentProductsWithStock = await enrichRecentProductsWithStock(recentRes.data || []);

      setDashboardData({
        totalProducts: productCountRes.count || 0,
        totalCategories: categoryCountRes.count || 0,
        totalViews,
        lowStockAlerts: lowStockFromVariants || lowStockFallback,
        recentProducts: recentProductsWithStock,
        categoryDistribution: dynamicDistribution
      });
    } catch (_err) {
      // Unexpected throw — data stays at defaults, loading clears below.
    } finally {
      setLoading(false);
    }
  }, [enrichRecentProductsWithStock]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const chartBars = useMemo(() => {
    const base = [40, 65, 50, 85, 55, 75];
    if (!dashboardData.totalViews) return base;

    const scale = Math.min(1.15, Math.max(0.85, dashboardData.totalViews / 12000));
    return base.map((value) => Math.max(26, Math.min(90, Math.round(value * scale))));
  }, [dashboardData.totalViews]);

  const recentRows = useMemo(() => {
    if (!dashboardData.recentProducts.length) return SAMPLE_ROWS;

    return dashboardData.recentProducts.map((product) => {
      const totalStock = toSafeStock(product.total_stock);
      const inventoryState = product.is_available === false
        ? {
            label: 'Not for Sale',
            textClass: 'text-outline font-bold',
            dotClass: 'bg-outline'
          }
        : getInventoryState(totalStock);
      const categoryName = product.category_name || product.categories?.name || 'Uncategorized';

      return {
        id: product.id,
        name: product.name,
        sku: `SKU: ${((product.slug || product.id || 'toy').slice(0, 8)).toUpperCase()}`,
        category: categoryName,
        categoryClass: getCategoryChipClass(categoryName),
        stockLabel: inventoryState.label,
        stockClass: inventoryState.textClass,
        dotClass: inventoryState.dotClass,
        updated: getTimeAgo(product.created_at),
        imageUrl: product.image_url || FALLBACK_IMAGE
      };
    });
  }, [dashboardData.recentProducts]);

  const barClasses = [
    'bg-primary-container/20',
    'bg-primary-container/40',
    'bg-primary-container/60',
    'bg-primary',
    'bg-primary-container/60',
    'bg-primary-container/40'
  ];

  return (
    <>
      <header className="mb-8 md:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight plusJakartaSans">Overview Dashboard</h2>
          <p className="text-on-surface-variant font-medium">Welcome back! Here's what's happening today.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8 md:mb-10">
        <div className="bg-surface-container-lowest p-5 sm:p-6 lg:p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary-container rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>inventory</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">+4%</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Total Products</p>
            <h3 className="text-3xl sm:text-4xl font-black text-on-surface">{dashboardData.totalProducts}</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 sm:p-6 lg:p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-tertiary-container/20 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-stone-100 text-stone-500 rounded-lg">Steady</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Categories</p>
            <h3 className="text-3xl sm:text-4xl font-black text-on-surface">{dashboardData.totalCategories}</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 sm:p-6 lg:p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-container rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">+12.4%</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Total Views</p>
            <h3 className="text-3xl sm:text-4xl font-black text-on-surface">{formatCompactNumber(dashboardData.totalViews)}</h3>
          </div>
        </div>

        <div className="bg-error-container text-on-error-container p-5 sm:p-6 lg:p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/30 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-error-container" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <span className="text-xs font-black px-2 py-1 bg-white/40 text-on-error-container rounded-lg">Action!</span>
          </div>
          <div>
            <p className="text-on-error-container/80 text-sm font-bold uppercase tracking-widest mb-1">Low Stock Alerts</p>
            <h3 className="text-3xl sm:text-4xl font-black">{dashboardData.lowStockAlerts}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest p-5 sm:p-6 lg:p-10 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h4 className="text-xl font-black mb-1 plusJakartaSans">Product Views</h4>
              <p className="text-on-surface-variant text-sm font-medium">Monthly engagement performance</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-surface-container text-xs font-bold rounded-full">Week</button>
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-on-primary rounded-full text-xs font-bold">Month</button>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="border-b border-on-surface"></div>
              <div className="border-b border-on-surface"></div>
              <div className="border-b border-on-surface"></div>
              <div className="border-b border-on-surface"></div>
            </div>

            {chartBars.map((bar, index) => (
              <div key={`bar-${index}`} className={`flex-1 rounded-t-lg relative group ${barClasses[index]}`} style={{ height: `${bar}%` }}>
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-surface text-[10px] px-2 py-1 rounded">
                  {formatCompactNumber(Math.round((dashboardData.totalViews || 12400) * ((index + 2) / 20)))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-outline uppercase tracking-wider">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 sm:p-6 lg:p-10 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
          <h4 className="text-xl font-black mb-1 plusJakartaSans">Category Distribution</h4>
          <p className="text-on-surface-variant text-sm font-medium mb-6 sm:mb-10">Inventory by toy type</p>

          <div className="flex justify-center mb-6 sm:mb-10">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-[14px] sm:border-[16px] border-surface-container flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[16px] border-secondary border-t-transparent border-r-transparent transform rotate-45"></div>
              <div className="absolute inset-0 rounded-full border-[16px] border-primary border-b-transparent border-l-transparent transform -rotate-12"></div>
              <div className="text-center">
                <span className="text-2xl font-black text-on-surface">{dashboardData.totalCategories}</span>
                <p className="text-[10px] uppercase font-bold text-outline">Active</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {dashboardData.categoryDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.colorClass}`}></div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-10 bg-surface-container-lowest rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-8 border-b border-surface-container flex justify-between items-center gap-4">
          <h4 className="text-xl font-black plusJakartaSans">Recent Inventory Updates</h4>
          <button
            type="button"
            onClick={() => navigate('/admin/inventory')}
            className="text-secondary text-xs sm:text-sm font-bold flex items-center gap-1 hover:underline whitespace-nowrap"
          >
            View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[760px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-widest text-outline font-black">
              <th className="px-10 py-6">Product</th>
              <th className="px-6 py-6">Category</th>
              <th className="px-6 py-6">Stock Status</th>
              <th className="px-6 py-6 text-right">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {recentRows.map((row) => (
              <tr key={row.id} className="hover:bg-surface-container-low transition-colors group">
                <td className="px-10 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden">
                      <img className="w-full h-full object-cover" src={row.imageUrl} alt={row.name} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{row.name}</p>
                      <p className="text-[10px] text-outline font-medium">{row.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${row.categoryClass}`}>{row.category}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${row.dotClass}`}></div>
                    <span className={`text-sm font-medium ${row.stockClass}`}>{row.stockLabel}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right text-xs font-medium text-on-surface-variant">{row.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-surface-container-high px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant shadow-sm">
          Syncing dashboard data...
        </div>
      )}
    </>
  );
};

export default Dashboard;
