import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const Admin = () => {
  const [stats, setStats] = useState({ totalProducts: 0, totalInquiries: 0 });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: pData } = await supabase.from('products').select('id, name, price, is_available');
    const { count: iCount } = await supabase.from('inquiries').select('*', { count: 'exact', head: true });
    
    setProducts(pData || []);
    setStats({
      totalProducts: pData ? pData.length : 0,
      totalInquiries: iCount || 0
    });
  };

  const toggleAvailability = async (id, currentStatus) => {
    await supabase.from('products').update({ is_available: !currentStatus }).eq('id', id);
    fetchStats();
  };

  return (
    <div className="px-8 mt-12 mb-24 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="plusJakartaSans text-4xl font-extrabold tracking-tight">Admin Dashboard</h2>
        <button className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <h3 className="font-bold text-lg">Total Products</h3>
          </div>
          <p className="plusJakartaSans font-black text-4xl">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <h3 className="font-bold text-lg">Inquiries</h3>
          </div>
          <p className="plusJakartaSans font-black text-4xl">{stats.totalInquiries}</p>
        </div>
      </div>

      <h3 className="plusJakartaSans font-bold text-2xl mb-6">Product Inventory</h3>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-outline-variant/20">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>
              <th className="p-4 font-bold">Product Name</th>
              <th className="p-4 font-bold">Price</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-surface-container-lowest transition-colors">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">₹{p.price.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.is_available ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => toggleAvailability(p.id, p.is_available)} className="p-2 text-on-surface-variant hover:text-primary transition-colors bg-surface rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">{p.is_available ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button className="p-2 text-on-surface-variant hover:text-secondary transition-colors bg-surface rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
