/**
 * Reads the already-established legacy session first. This keeps V2 and the
 * existing UI on one Supabase session rather than creating a second auth flow.
 */
export async function getSession(supabase) {
  const auth = window.SYKA_STATE?.getState?.()?.auth;
  if (auth?.session || auth?.user) {
    return { user: auth.user || auth.session?.user || null, session: auth.session || null };
  }

  const client = supabase || window.SYKA_SUPABASE?.get?.();
  if (!client?.auth?.getSession) return { user: null, session: null };

  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return { user: data?.session?.user || null, session: data?.session || null };
}
