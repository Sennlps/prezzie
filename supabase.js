import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqheuinyrpgzwrnjwmmf.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaGV1aW55cnBnendybmp3bW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjY4OTcsImV4cCI6MjA5MDcwMjg5N30.HGYG5700lBRP0dXSP6ZPfQAzq4q1kLJB4pR_E2EejLk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
