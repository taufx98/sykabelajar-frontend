(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  function normalize(row) {
    const poster = row.poster || row.poster_url || row.cover_url || row.image_url || row.image || '';
    return {
      id: row.id,
      slug: row.slug || row.id,
      title: row.title || row.name || 'Kompetisi',
      category: row.category || row.level || 'Kompetisi',
      status: row.status || 'PUBLISHED',
      poster,
      description: row.short_description || row.description || '',
      registrationStartsAt: row.registration_starts_at || row.registration_start_at || row.registration_open_at,
      registrationEndsAt: row.registration_ends_at || row.registration_end_at || row.registration_close_at,
      startsAt: row.start_at || row.starts_at || row.competition_start_at,
      endsAt: row.end_at || row.ends_at || row.competition_end_at,
      data: row
    };
  }
  async function list({ limit = window.SYKA_CONFIG.DEFAULT_PAGE_SIZE } = {}) {
    const { data, error } = await client().from('competitions').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(normalize);
  }
  async function getBySlug(slug) {
    const { data, error } = await client().from('competitions').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data ? normalize(data) : null;
  }
  window.SYKA_COMPETITION_SERVICE = { list, getBySlug };
})();


