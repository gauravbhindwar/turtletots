export const toSafeStock = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
};

export const getTotalStockFromVariants = (variants = []) => {
  if (!Array.isArray(variants)) {
    return 0;
  }

  return variants.reduce((sum, variant) => sum + toSafeStock(variant?.stock), 0);
};

export const getInventoryState = (value) => {
  const totalStock = toSafeStock(value);

  if (totalStock <= 0) {
    return {
      totalStock,
      shortLabel: 'Out of stock',
      label: 'Out of Stock',
      dotClass: 'bg-error animate-pulse',
      textClass: 'text-error font-bold',
      chipClass: 'bg-error-container/20 text-error'
    };
  }

  if (totalStock <= 5) {
    return {
      totalStock,
      shortLabel: `Low stock (${totalStock})`,
      label: `Low Stock (${totalStock})`,
      dotClass: 'bg-[#f59e0b] animate-pulse',
      textClass: 'text-[#b45309] font-bold',
      chipClass: 'bg-[#fef3c7] text-[#b45309]'
    };
  }

  return {
    totalStock,
    shortLabel: `In stock (${totalStock})`,
    label: `In Stock (${totalStock})`,
    dotClass: 'bg-green-500',
    textClass: 'text-[#128C7E] font-bold',
    chipClass: 'bg-[#128C7E]/15 text-[#128C7E]'
  };
};
