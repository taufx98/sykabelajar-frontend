(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function list(userId) { if (!userId) return []; const { data, error } = await client().from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) throw error; return data || []; }
  async function create(payload) { const { data, error } = await client().from('orders').insert(payload).select('*').single(); if (error) throw error; return data; }
  window.SYKA_ORDER_SERVICE = { list, create };
})();


