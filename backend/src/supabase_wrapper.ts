
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const SupabaseWrapper = {
    _supabase: null as SupabaseClient | null,
    init: () => {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
        }

        console.log('Initializing Supabase client...');
        SupabaseWrapper._supabase = createClient(supabaseUrl, supabaseKey);
    },
    get: () => {
        if (!SupabaseWrapper._supabase) {
            throw new Error('SupabaseWrapper not initialized')
        }
        return SupabaseWrapper._supabase
    },

}