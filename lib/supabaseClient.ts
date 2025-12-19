
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsrqyisoilashfylvtbs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcnF5aXNvaWxhc2hmeWx2dGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjEyMDQsImV4cCI6MjA4MTY5NzIwNH0.fOu4u0-Zbm6Sb1DlvjRtRJJgjxmyfjtTM5VnAVq5FXo';

// We explicitly enable auth persistence here. 
// This ensures the user stays logged in even after refreshing the page.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // Stores credentials in browser LocalStorage
  },
});
