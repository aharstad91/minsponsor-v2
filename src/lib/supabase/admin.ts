import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Service role client for webhook handlers - bypasses RLS
// Never expose this to the browser!
// Note: Using generic type to avoid strict type checking until database is connected
// After connecting Supabase, regenerate types with: npx supabase gen types typescript

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Return a proxy that throws helpful errors at runtime
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error('Supabase admin client not initialized: Environment variables not set');
      },
    });
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export const supabaseAdmin = createAdminClient();
