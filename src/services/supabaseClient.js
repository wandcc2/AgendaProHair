import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ujdaesnmqhkzefqdwygk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PWOqJOgpsoJQT3FNDxB-Tw_5jURYgth';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});
