// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Esportazione del client
export { supabase };  // Esportazione nominata
