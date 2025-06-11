
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const SupabaseWrapper = {
    _supabase: null as SupabaseClient | null,
    init: () => {
        SupabaseWrapper._supabase = createClient('https://cudfotztrynutgoskums.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZGZvdHp0cnludXRnb3NrdW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Njk1ODgsImV4cCI6MjA2NTI0NTU4OH0.oSKQHMMaWQn9Aq50jwyAm2jwunFfLnD3k9qORK-zyec')

    },
    get: () => {
        if (!SupabaseWrapper._supabase) {
            throw new Error('SupabaseWrapper not initialized')
        }
        return SupabaseWrapper._supabase
    },

}