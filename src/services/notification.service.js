(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function list(userId) { if (!userId) return []; const { data, error } = await client().from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30); if (error) throw error; return data || []; }
  async function markRead(id) { const { error } = await client().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id); if (error) throw error; }
  window.SYKA_NOTIFICATION_SERVICE = { list, markRead };
})();


