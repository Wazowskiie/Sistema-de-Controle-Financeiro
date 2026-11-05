import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qgedoanyxlaojmhhpjgl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wMdtbEoxjg63-AG1Hhml7g_2JawzysO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);