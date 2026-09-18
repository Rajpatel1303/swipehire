import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://czrswxwefgiwjhalljui.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cnN3eHdlZmdpd2poYWxsanVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MTMxMTgsImV4cCI6MjEwMjE4OTExOH0.Bo1TfhxJEYQVAChskLm3ejTKIHl3ENcn2f6I8QIvqf8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "swipehired_admin_auth",
  },
});
