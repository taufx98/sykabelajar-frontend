(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getStatus(userId, competitionId) {
    if (!userId || !competitionId) return null;
    const { data, error } = await client().from('registrations').select('*').eq('user_id', userId).eq('competition_id', competitionId).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function register({ competitionId, participationKey = null }) {
    const c = client();
    const { data: userData } = await c.auth.getUser();
    if (!userData.user) throw new Error('LOGIN_REQUIRED');
    const { data, error } = await c.from('registrations').insert({ competition_id: competitionId, user_id: userData.user.id, participation_key: participationKey }).select('*').single();
    if (error) throw error;
    return data;
  }
  window.SYKA_REGISTRATION_SERVICE = { getStatus, register };
})();


