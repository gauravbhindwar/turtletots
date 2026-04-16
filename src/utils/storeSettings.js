import { supabase } from './supabase';

export const DEFAULT_STORE_SETTINGS = {
  store_name: 'TurtleTots',
  support_email: 'support@turtletots.in',
  whatsapp_order_number: '+91 9006045930',
  store_description: 'Curated wooden toys and educational goods for your little ones.'
};

const SETTINGS_CACHE_TTL_MS = 2 * 60 * 1000;

let settingsCache = null;
let settingsExpiresAt = 0;

const normalizeStoreSettings = (row = {}) => {
  return {
    store_name: row.store_name || DEFAULT_STORE_SETTINGS.store_name,
    support_email: row.support_email || DEFAULT_STORE_SETTINGS.support_email,
    whatsapp_order_number: row.whatsapp_order_number || DEFAULT_STORE_SETTINGS.whatsapp_order_number,
    store_description: row.store_description || DEFAULT_STORE_SETTINGS.store_description
  };
};

export const clearStoreSettingsCache = () => {
  settingsCache = null;
  settingsExpiresAt = 0;
};

export const getStoreSettings = async ({ bypassCache = false } = {}) => {
  if (!bypassCache && settingsCache && settingsExpiresAt > Date.now()) {
    return settingsCache;
  }

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('store_name, support_email, whatsapp_order_number, store_description')
      .eq('id', true)
      .maybeSingle();

    if (error) {
      return settingsCache || DEFAULT_STORE_SETTINGS;
    }

    const normalized = normalizeStoreSettings(data || {});
    settingsCache = normalized;
    settingsExpiresAt = Date.now() + SETTINGS_CACHE_TTL_MS;
    return normalized;
  } catch (_error) {
    return settingsCache || DEFAULT_STORE_SETTINGS;
  }
};
