import { createBrowserClient } from '@supabase/ssr';

// Note: Using generic type to avoid strict type checking until database is connected
// After connecting Supabase, regenerate types with: npx supabase gen types typescript
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
