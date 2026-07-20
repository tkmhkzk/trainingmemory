import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// anon keyはブラウザに公開される前提の公開用キー（データはRLSで保護される）。
// 環境変数があればそちらを優先する。
const DEFAULT_URL = "https://nkfzpgjiavggmiqgihqz.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZnpwZ2ppYXZnZ21pcWdpaHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjc2MjYsImV4cCI6MjA5NTgwMzYyNn0.1dYsh9zphTWVHdbb8fkXSedZ3t0QDeajqg5x2scsTB4";

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createSupabaseClient(url, key);
  return client;
}
