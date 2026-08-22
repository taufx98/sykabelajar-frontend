(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function get({ seasonId, scope = 'global', limit = 50 } = {}) {
    let q = client().from('leaderboard').select('*').limit(limit);
    if (seasonId) q = q.eq('season_id', seasonId);
    if (scope && scope !== 'global') q = q.eq('scope', scope);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }
  window.SYKA_LEADERBOARD_SERVICE = { get };
})();


