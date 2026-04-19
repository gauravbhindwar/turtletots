import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env and fill in your project credentials.'
  );
}

// Replace the browser Web Locks API with an in-memory FIFO queue.
// The Web Locks API causes getSession() to hang indefinitely when multiple
// browser tabs compete for the same lock, leaving all DB queries stuck and
// the UI frozen at "Loading...".
// An in-memory queue serialises auth operations within this tab correctly.
// NOTE: Edge function calls must use direct fetch() instead of
// supabase.functions.invoke() to avoid going through this lock path.
const _lockQueues = {};
const inMemoryLock = (name, _acquireTimeout, fn) => {
  if (!_lockQueues[name]) _lockQueues[name] = Promise.resolve();
  const result = _lockQueues[name].then(() => fn());
  // Swallow errors on the queue tail so a failed fn() never blocks future callers.
  _lockQueues[name] = result.then(
    () => {},
    () => {}
  );
  return result;
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: inMemoryLock,
  },
});
