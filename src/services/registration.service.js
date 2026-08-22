(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function getStatus(userId,competitionId){
    if(!userId||!competitionId)return null;
    const{data,error}=await c().from('registrations').select('*').eq('user_id',userId).eq('competition_id',competitionId).maybeSingle();
    if(error)throw error;
    return data;
  }
  async function register({competitionId,participationKey=null,competitionLevelId=null,socialProofUrl=null,twibbonCompleted=false}){
    const{data:userData}=await c().auth.getUser();
    if(!userData.user)throw new Error('LOGIN_REQUIRED');
    const{data,error}=await c().rpc('register_for_competition',{
      p_competition_id:competitionId,
      p_participation_key:participationKey,
      p_competition_level_id:competitionLevelId,
      p_social_proof_url:socialProofUrl,
      p_twibbon_completed:!!twibbonCompleted
    });
    if(error)throw error;
    return data;
  }
  async function checkEligibility({competitionId,grade}){
    if(!competitionId)return{eligible:false,reason:'COMPETITION_REQUIRED'};
    const{data,error}=await c().rpc('check_registration_eligibility',{p_competition_id:competitionId,p_grade:grade||null});
    if(error)throw error;
    return data||{eligible:true,reason:null};
  }
  window.SYKA_REGISTRATION_SERVICE={getStatus,register,checkEligibility};
})();
