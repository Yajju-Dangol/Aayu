import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Ensure they are set in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const agentClientCache: Record<string, any> = {};

export const createAgentSupabase = (accessToken: string) => {
  const token = accessToken || 'empty';
  if (agentClientCache[token]) return agentClientCache[token];

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `agent-dummy-key-${Math.random()}`,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }
  });

  agentClientCache[token] = client;
  return client;
};
