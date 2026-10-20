import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default environment variable names for Supabase in Next.js
const ENV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const STORAGE_KEY_CONFIG = 'ems_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Get current Supabase credentials.
 * Checks environment variables first, then falls back to user-configured localStorage.
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          return {
            url: parsed.url.trim(),
            anonKey: parsed.anonKey.trim(),
          };
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }

  return {
    url: ENV_SUPABASE_URL.trim(),
    anonKey: ENV_SUPABASE_ANON_KEY.trim(),
  };
}

/**
 * Save user-provided Supabase credentials to localStorage
 */
export function setSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEY_CONFIG,
      JSON.stringify({
        url: url.trim(),
        anonKey: anonKey.trim(),
      })
    );
    // Reset client singleton so next call re-instantiates with new credentials
    cachedClient = null;
  }
}

/**
 * Remove stored Supabase credentials
 */
export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_CONFIG);
    cachedClient = null;
  }
}

/**
 * Check if valid Supabase credentials exist
 */
export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(
    config.url &&
    config.anonKey &&
    config.url.startsWith('http') &&
    config.anonKey.length > 20
  );
}

// Cached client instance
let cachedClient: SupabaseClient | null = null;
let lastUsedConfig: SupabaseConfig | null = null;

/**
 * Returns an instantiated Supabase client or null if not yet configured.
 */
export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();

  if (!config.url || !config.anonKey || !config.url.startsWith('http')) {
    return null;
  }

  // Re-instantiate if config changed
  if (
    cachedClient &&
    lastUsedConfig &&
    lastUsedConfig.url === config.url &&
    lastUsedConfig.anonKey === config.anonKey
  ) {
    return cachedClient;
  }

  try {
    // Safety guard for server-side evaluation where global WebSocket may not be defined (Node <22)
    if (typeof window === 'undefined' && typeof WebSocket === 'undefined') {
      (globalThis as any).WebSocket = class DummyWebSocket {};
    }

    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    });
    lastUsedConfig = config;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}
