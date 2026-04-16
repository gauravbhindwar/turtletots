import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

const ICON_OPTIONS = [
  {
    value: 'pets',
    label: 'Plush',
    classes: 'bg-secondary-container text-on-secondary-container'
  },
  {
    value: 'stadia_controller',
    label: 'Action',
    classes: 'bg-tertiary-container text-on-tertiary-container'
  },
  {
    value: 'castle',
    label: 'Blocks',
    classes: 'bg-primary-container text-on-primary-container'
  },
  {
    value: 'palette',
    label: 'Creative',
    classes: 'bg-blue-100 text-blue-800'
  },
  {
    value: 'rocket_launch',
    label: 'STEM',
    classes: 'bg-emerald-100 text-emerald-800'
  },
  {
    value: 'menu_book',
    label: 'Learning',
    classes: 'bg-purple-100 text-purple-800'
  }
];

const getIconOption = (iconValue) => {
  return ICON_OPTIONS.find((option) => option.value === iconValue) || ICON_OPTIONS[0];
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    slug: '',
    icon: ICON_OPTIONS[0].value
  });
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const toSlug = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const getErrorMessage = (error, fallback) => {
    if (!error) return fallback;
    if (error.code === '42501') {
      return 'Permission denied. Please login with an admin account before managing categories.';
    }
    if (error.code === '23505') {
      return 'A category with this slug already exists. Please choose a different slug.';
    }
    return error.message || fallback;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setActionError('');
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, icon, products(count)')
      .order('created_at', { ascending: false });

    if (error) {
      setActionError(getErrorMessage(error, 'Unable to load categories right now.'));
      setLoading(false);
      return;
    }

    setCategories(data || []);
    setLoading(false);
  };

  const deleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setActionError('');
      setActionSuccess('');
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) {
        setActionError(getErrorMessage(error, 'Unable to delete category.'));
        return;
      }

      setActionSuccess('Category deleted successfully.');
      fetchCategories();
    }
  };

  const openCreateCategoryModal = () => {
    setActionError('');
    setActionSuccess('');
    setFormMode('create');
    setEditingCategoryId(null);
    setFormValues({
      name: '',
      slug: '',
      icon: ICON_OPTIONS[0].value
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category) => {
    setActionError('');
    setActionSuccess('');
    setFormMode('edit');
    setEditingCategoryId(category.id);
    setFormValues({
      name: category.name || '',
      slug: category.slug || '',
      icon: getIconOption(category.icon).value
    });
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    if (submitting) return;
    setIsCategoryModalOpen(false);
  };

  const upsertCategory = async (event) => {
    event.preventDefault();
    const name = formValues.name.trim();
    const slug = toSlug(formValues.slug || name);
    const icon = getIconOption(formValues.icon).value;

    if (!name) {
      setActionError('Category name is required.');
      return;
    }

    if (!slug) {
      setActionError('Please provide a valid category slug.');
      return;
    }

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    let response;

    if (formMode === 'create') {
      response = await supabase
        .from('categories')
        .insert([{ name, slug, icon }]);
    } else {
      response = await supabase
        .from('categories')
        .update({ name, slug, icon })
        .eq('id', editingCategoryId);
    }

    setSubmitting(false);

    const { error } = response;

    if (error) {
      setActionError(getErrorMessage(error, `Unable to ${formMode === 'create' ? 'create' : 'update'} category.`));
      return;
    }

    setIsCategoryModalOpen(false);
    setFormValues({
      name: '',
      slug: '',
      icon: ICON_OPTIONS[0].value
    });
    setActionSuccess(`Category ${formMode === 'create' ? 'created' : 'updated'} successfully.`);
    fetchCategories();
  };

  const modalTitle = formMode === 'create' ? 'Create Category' : 'Edit Category';
  const submitLabel = formMode === 'create'
    ? (submitting ? 'Creating...' : 'Create Category')
    : (submitting ? 'Saving...' : 'Save Changes');

  return (
    <>
      <header className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface plusJakartaSans">Category Management</h2>
          <p className="text-on-surface-variant font-medium mt-2">Organize and curate your toy collections</p>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={openCreateCategoryModal}
            className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            Add Category
          </button>

          <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant/10">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary font-bold text-xs">AM</div>
            <span className="text-sm font-semibold text-on-surface">Admin Mode</span>
          </div>
        </div>
      </header>

      {actionError && (
        <div className="mb-8 rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 text-sm font-semibold text-error">
          {actionError}
        </div>
      )}

      {!actionError && actionSuccess && (
        <div className="mb-8 rounded-xl border border-[#128C7E]/20 bg-[#128C7E]/10 px-4 py-3 text-sm font-semibold text-[#128C7E]">
          {actionSuccess}
        </div>
      )}

      {/* Categories Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <p className="p-4">Loading...</p>
        ) : categories.map((cat, i) => {
          const iconOption = getIconOption(cat.icon || ICON_OPTIONS[i % ICON_OPTIONS.length].value);

          return (
            <div key={cat.id} className="group relative bg-surface-container-lowest rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-outline-variant/10">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-secondary-container/10 -z-10 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${iconOption.classes}`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{iconOption.value}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditCategoryModal(cat)}
                    className="p-2 hover:bg-surface-container rounded-lg text-outline transition-colors"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-2 hover:bg-error-container/10 rounded-lg text-error transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-on-surface plusJakartaSans capitalize">{cat.name}</h3>
              <p className="text-sm text-on-surface-variant mt-1">Slug: {cat.slug}</p>
              
              <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-primary">{Array.isArray(cat.products) ? (cat.products[0]?.count || 0) : 0}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-outline">Items</span>
                </div>
                <span className="px-3 py-1 bg-success/20 text-[#128C7E] text-[10px] font-bold rounded-full">ACTIVE</span>
              </div>
            </div>
          );
        })}

        {/* Add Category Empty State / Action Card */}
        <button
          type="button"
          onClick={openCreateCategoryModal}
          className="group border-4 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center justify-center p-8 text-center hover:border-primary-container hover:bg-primary-container/10 transition-all min-h-[250px]"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:bg-primary-container group-hover:text-on-primary-container transition-all mb-4">
            <span className="material-symbols-outlined text-3xl">add</span>
          </div>
          <h4 className="text-lg font-bold text-on-surface">New Category</h4>
          <p className="text-sm text-outline mt-1">Expand your toy catalog</p>
        </button>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 flex items-center justify-center" onClick={closeCategoryModal}>
          <div
            className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-on-surface plusJakartaSans">{modalTitle}</h3>
                <p className="text-sm text-on-surface-variant mt-1">Choose a name, slug, and icon for this category.</p>
              </div>
              <button
                type="button"
                onClick={closeCategoryModal}
                className="p-2 rounded-lg hover:bg-surface-container-low text-outline transition-colors"
                aria-label="Close category modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={upsertCategory} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-outline block mb-2">Category Name</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setFormValues((previous) => ({
                      ...previous,
                      name: nextName,
                      slug: previous.slug ? previous.slug : toSlug(nextName)
                    }));
                  }}
                  className="w-full bg-surface-container-low border-none rounded-md px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g. Wooden Puzzles"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-outline block mb-2">Slug</label>
                <input
                  type="text"
                  value={formValues.slug}
                  onChange={(event) => setFormValues((previous) => ({ ...previous, slug: toSlug(event.target.value) }))}
                  className="w-full bg-surface-container-low border-none rounded-md px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all"
                  placeholder="wooden-puzzles"
                />
                <p className="text-xs text-outline mt-2">Slug defaults to the category name if left empty.</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-outline block mb-2">Icon</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ICON_OPTIONS.map((iconOption) => {
                    const isSelected = formValues.icon === iconOption.value;

                    return (
                      <button
                        key={iconOption.value}
                        type="button"
                        onClick={() => setFormValues((previous) => ({ ...previous, icon: iconOption.value }))}
                        className={`border rounded-[2rem] px-3 py-4 h-[122px] flex flex-col items-center justify-center gap-2 text-center transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30 bg-primary-container/10' : 'border-outline-variant/20 hover:bg-surface-container-low'}`}
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${iconOption.classes}`}>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{iconOption.value}</span>
                        </div>
                        <span className="text-sm font-bold text-on-surface leading-tight">{iconOption.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant font-semibold hover:bg-surface-container-high transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-bold hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100"
                  disabled={submitting}
                >
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Categories;
