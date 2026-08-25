function legacyAuth() {
  const service = window.SYKA_AUTH_SERVICE;
  if (!service) throw new Error("Sykabelajar authentication service is not ready.");
  return service;
}

/** Phase 14 adapter: delegate all writes to the proven legacy auth service. */
export async function login(_supabase, email, password) {
  return legacyAuth().signIn({ email, password });
}

export async function logout(_supabase) {
  return legacyAuth().signOut();
}

export async function register(_supabase, payload) {
  return legacyAuth().signUp(payload);
}
