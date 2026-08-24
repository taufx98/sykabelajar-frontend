(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getAwards(userId) {
    if (!userId) return [];
    const { data, error } = await client().from('user_achievements').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  async function verify(code) {
    const { data, error } = await client().from('certificate_verifications').select('*').eq('verification_code', code).maybeSingle();
    if (error) throw error;
    return data;
  }
  window.SYKA_AWARD_SERVICE = { getAwards, verify };
})();


