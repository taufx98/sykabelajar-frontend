(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  function normalize(row){return {id:row.id,slug:row.slug||row.id,title:row.title||'Kompetisi',category:row.category||'Kompetisi',status:row.status||'DRAFT',poster:row.poster_url||row.cover_url||row.image_url||'',description:row.short_description||row.description||'',juknisUrl:row.juknis_url||'',kisiKisiPublished:!!row.kisi_kisi_published,kisiKisiContent:row.kisi_kisi_content||'',registrationStartsAt:row.registration_starts_at,registrationEndsAt:row.registration_ends_at,startsAt:row.starts_at,endsAt:row.ends_at,announcementAt:row.announcement_at,visibility:row.visibility||'PUBLIC',organizerId:row.organizer_id,data:row};}
  async function list({limit=12,status='PUBLIC_ONLY'}={}){let q=c().from('competitions').select('*').order('created_at',{ascending:false}).limit(limit);if(status==='PUBLIC_ONLY')q=q.eq('visibility','PUBLIC').neq('status','CANCELLED');if(status&&status!=='PUBLIC_ONLY')q=q.eq('status',status);const{data,error}=await q;if(error)throw error;return(data||[]).map(normalize);}
  async function getBySlug(slug){const{data,error}=await c().from('competitions').select('*').eq('slug',slug).maybeSingle();if(error)throw error;return data?normalize(data):null;}
  async function getLevels(id){const{data,error}=await c().from('competition_levels').select('*').eq('competition_id',id).order('created_at');if(error)throw error;return data||[];}
  async function getRules(id){const{data,error}=await c().from('registration_rules').select('*').eq('competition_id',id).maybeSingle();if(error)throw error;return data;}
  async function getRewards(id){const{data,error}=await c().from('competition_rewards').select('*').eq('competition_id',id).order('rank_code');if(error)throw error;return data||[];}
  async function getTwibbonTemplate(id){const{data,error}=await c().from('twibbon_templates').select('*').eq('competition_id',id).eq('is_active',true).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;return data;}
  window.SYKA_COMPETITION_SERVICE={list,getBySlug,getLevels,getRules,getRewards,getTwibbonTemplate};
})();
