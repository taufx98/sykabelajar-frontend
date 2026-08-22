(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function getMe(userId){if(!userId)return null;const{data,error}=await c().from('profiles').select('*').eq('id',userId).maybeSingle();if(error)throw error;return data;}
  async function updateProfile(userId,payload){if(!userId)throw new Error('LOGIN_REQUIRED');const{data,error}=await c().from('profiles').update(payload).eq('id',userId).select('*').single();if(error)throw error;return data;}
  async function getRoles(userId){if(!userId)return{roles:[],permissions:[]};const{data,error}=await c().from('user_roles').select('role,is_active').eq('user_id',userId).eq('is_active',true);if(error)throw error;return{roles:(data||[]).map(x=>x.role),permissions:[]};}
  window.SYKA_PROFILE_SERVICE={getMe,updateProfile,getRoles};
})();
