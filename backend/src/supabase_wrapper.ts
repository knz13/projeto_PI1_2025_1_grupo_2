
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const SupabaseWrapper = {
    _supabase: null as SupabaseClient | null,
    init: () => {
        SupabaseWrapper._supabase = createClient('https://vivcqtkfrbnkpmxjraim.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdmNxdGtmcmJua3BteGpyYWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzMwNjQ1OCwiZXhwIjoyMDMyODgyNDU4fQ.vyPT9prMTa6kYa9CpGjNRsN0GVqFiOzYccc4KX3yGcA')

    },
    get: () => {
        if (!SupabaseWrapper._supabase) {
            throw new Error('SupabaseWrapper not initialized')
        }
        return SupabaseWrapper._supabase
    },

}