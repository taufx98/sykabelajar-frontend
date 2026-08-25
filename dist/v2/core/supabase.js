// Supabase client initialization layer
// Replace environment values with your existing project config

export function createSupabaseClient(config) {
  return {
    url: config.url,
    key: config.key
  };
}
