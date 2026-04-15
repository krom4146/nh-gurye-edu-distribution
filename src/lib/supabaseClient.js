import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing! Check .env file.');
}

const isUrlValid = (url) => url && (url.startsWith('http://') || url.startsWith('https://'));

if (!isUrlValid(supabaseUrl)) {
    console.warn('Invalid Supabase URL! Check .env file.');
}

export const supabase = (isUrlValid(supabaseUrl) && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
