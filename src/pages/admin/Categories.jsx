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

    let { data, error } = await supabase.rpc('list_categories_with_product_counts');

    if (error) {
      // Backward-compatible fallback if migration has not been applied yet.
      const fallback = await supabase
        .from('categories')
        .select('id, name, slug, icon, products(count)')
        .order('created_at', { ascending: false });

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      setActionError(getErrorMessage(error, 'Unable to load categories right now.'));
      setLoading(false);
      return;
    }

    const normalized = (data || []).map((category) => ({
      ...category,
      product_count: Number(category.product_count ?? (Array.isArray(category.products) ? category.products[0]?.count || 0 : 0))
    }));

    setCategories(normalized);
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
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8 md:mb-12">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface plusJakartaSans">Category Management</h2>
          <p className="text-on-surface-variant font-medium mt-2">Organize and curate your toy collections</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={openCreateCategoryModal}
            className="self-start sm:self-auto bg-primary-container text-on-primary-container px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform text-sm sm:text-base"
          >
            <span className="material-symbols-outlined">add</span>
            Add Category
          </button>

          <div className="hidden sm:flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant/10">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {loading ? (
          <p className="p-4">Loading...</p>
        ) : categories.map((cat, i) => {
          const iconOption = getIconOption(cat.icon || ICON_OPTIONS[i % ICON_OPTIONS.length].value);

          return (
            <div key={cat.id} className="group relative bg-surface-container-lowest rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-outline-variant/10">
              <div className="absolute -top-3 -right-3 w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-secondary-container/10 -z-10 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${iconOption.classes}`}>
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

              <h3 className="text-xl sm:text-2xl font-bold text-on-surface plusJakartaSans capitalize">{cat.name}</h3>
              <p className="text-sm text-on-surface-variant mt-1">Slug: {cat.slug}</p>
              
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-primary">{cat.product_count || 0}</span>
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
          className="group border-4 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center justify-center p-6 sm:p-8 text-center hover:border-primary-container hover:bg-primary-container/10 transition-all min-h-[200px] sm:min-h-[250px]"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:bg-primary-container group-hover:text-on-primary-container transition-all mb-3 sm:mb-4">
            <span className="material-symbols-outlined text-2xl sm:text-3xl">add</span>
          </div>
          <h4 className="text-base sm:text-lg font-bold text-on-surface">New Category</h4>
          <p className="text-sm text-outline mt-1">Expand your toy catalog</p>
        </button>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-3 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={closeCategoryModal}>
          <div
            className="w-full max-w-xl my-4 sm:my-0 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface plusJakartaSans">{modalTitle}</h3>
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

            <form onSubmit={upsertCategory} className="space-y-4 sm:space-y-5">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {ICON_OPTIONS.map((iconOption) => {
                    const isSelected = formValues.icon === iconOption.value;

                    return (
                      <button
                        key={iconOption.value}
                        type="button"
                        onClick={() => setFormValues((previous) => ({ ...previous, icon: iconOption.value }))}
                        className={`border rounded-[1.5rem] sm:rounded-[2rem] px-2.5 sm:px-3 py-3 sm:py-4 h-[104px] sm:h-[122px] flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30 bg-primary-container/10' : 'border-outline-variant/20 hover:bg-surface-container-low'}`}
                      >
                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center ${iconOption.classes}`}>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{iconOption.value}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-on-surface leading-tight">{iconOption.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-surface-container-low text-on-surface-variant font-semibold hover:bg-surface-container-high transition-colors text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-primary-container text-on-primary-container font-bold hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100 text-sm sm:text-base"
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
