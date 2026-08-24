(function(){
  function client(){ return window.SYKA_SUPABASE.get(); }
  async function platformStats(){
    const {data,error}=await client().from('platform_stats').select('*').limit(1).maybeSingle();
    if(error) throw error;
    return data || {};
  }
  async function listSlides({admin=false}={}){
    let q=client().from('home_slides').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(!admin){ const now=new Date().toISOString(); q=q.eq('is_active',true).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`); }
    const {data,error}=await q;
    if(error) throw error;
    return data||[];
  }
  async function createSlide(payload){ const {data,error}=await client().from('home_slides').insert(payload).select('*').single(); if(error) throw error; return data; }
  async function updateSlide(id,payload){ const {data,error}=await client().from('home_slides').update(payload).eq('id',id).select('*').single(); if(error) throw error; return data; }
  async function deleteSlide(id){ const {error}=await client().from('home_slides').delete().eq('id',id); if(error) throw error; }
  async function searchSchools(term,limit=8){
    const value=String(term||'').trim();
    if(value.length<2) return [];
    const {data,error}=await client().from('schools').select('id,name,city,province').ilike('name',`%${value}%`).order('name').limit(limit);
    if(error) throw error;
    return data||[];
  }
  async function listCompetitions({organizerId=null,limit=50}={}){
    let q=client().from('competitions').select('*').order('created_at',{ascending:false}).limit(limit);
    if(organizerId) q=q.eq('organizer_id',organizerId);
    const {data,error}=await q; if(error) throw error; return data||[];
  }
  async function createCompetition(payload){ const {data,error}=await client().from('competitions').insert(payload).select('*').single(); if(error) throw error; return data; }
  async function updateCompetition(id,payload){ const {data,error}=await client().from('competitions').update(payload).eq('id',id).select('*').single(); if(error) throw error; return data; }
  async function listMyOrganizerMemberships(userId){
    if(!userId) return [];
    const {data,error}=await client().from('organizer_members').select('organizer_id,user_id,member_role,is_active,organizers(id,name,slug,status)').eq('user_id',userId).eq('is_active',true);
    if(error) throw error;
    return data||[];
  }
  window.SYKA_ADMIN_SERVICE={platformStats,listSlides,createSlide,updateSlide,deleteSlide,searchSchools,listCompetitions,createCompetition,updateCompetition,listMyOrganizerMemberships};
})();
