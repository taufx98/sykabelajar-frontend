(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getMe(userId) {
    if (!userId) return null;
    const { data, error } = await client().from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function updateProfile(userId, payload) {
    if (!userId) throw new Error('User belum login.');
    const { data, error } = await client().from('profiles').update(payload).eq('id', userId).select('*').single();
    if (error) throw error;
    return data;
  }
  async function getRoles(userId) {
    if (!userId) return { roles: [], permissions: [] };
    const { data, error } = await client().from('user_roles').select('*').eq('user_id', userId);
    if (error) return { roles: [], permissions: [] };
    const roles = (data || []).map(x => x.role || x.role_name).filter(Boolean);
    return { roles, permissions: [] };
  }
  window.SYKA_PROFILE_SERVICE = { getMe, updateProfile, getRoles };
})();


