(function () {
  let client = null;

  function getStorage() {
    try {
      return window.localStorage;
    } catch (_) {
      return undefined;
    }
  }

  function init() {
    if (client) return client;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase JS belum dimuat.');
    }

    const cfg = window.SYKA_CONFIG;
    const storage = getStorage();
    const defaultStorageKey = 'sb-jrfogwueytiddnanetth-auth-token';
    const legacyStorageKey = 'sykabelajar-auth-v4_1';
    try {
      if (storage && !storage.getItem(defaultStorageKey)) {
        const legacy = storage.getItem(legacyStorageKey);
        if (legacy) storage.setItem(defaultStorageKey, legacy);
      }
    } catch (_) {}

    client = window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage,
          storageKey: defaultStorageKey,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    );

    return client;
  }

  function get() {
    return client || init();
  }

  window.SYKA_SUPABASE = { init, get };
})();


