(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  const q=async(table,select='*',builder)=>{let query=c().from(table).select(select);query=builder?builder(query):query;const{data,error}=await query;if(error)throw error;return data||[];};
  const save=async(table,payload,id)=>{let r=id?await c().from(table).update(payload).eq('id',id).select('*').single():await c().from(table).insert(payload).select('*').single();if(r.error)throw r.error;return r.data;};
  async function platformStats(){const{data,error}=await c().from('platform_stats').select('*').limit(1).maybeSingle();if(error)throw error;return data||{};}
  async function listUsers({search='',limit=100}={}){let qy=c().from('profiles').select('id,username,full_name,grade,institution,avatar_url,status,created_at,updated_at').order('created_at',{ascending:false}).limit(limit);if(search.trim())qy=qy.or(`username.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%,institution.ilike.%${search.trim()}%`);const{data,error}=await qy;if(error)throw error;const ids=(data||[]).map(x=>x.id);if(!ids.length)return[];const{data:roles,error:re}=await c().from('user_roles').select('user_id,role,is_active').in('user_id',ids);if(re)throw re;const map={};(roles||[]).forEach(r=>(map[r.user_id]??=[]).push(r));return(data||[]).map(p=>({...p,roles:map[p.id]||[]}));}
  async function setUserStatus(id,status,reason){const{data,error}=await c().rpc('admin_set_user_status',{p_user_id:id,p_status:status,p_reason:reason||null});if(error)throw error;return data;}
  async function setUserRole(id,role,active=true,reason){const{data,error}=await c().rpc('admin_set_user_role',{p_user_id:id,p_role:role,p_active:active,p_reason:reason||null});if(error)throw error;return data;}
  async function listOrganizers(){return q('organizers','id,name,slug,status,description,logo_asset_url,owner_user_id',qy=>qy.order('name',{ascending:true}).limit(200));}
  async function listMyOrganizerMemberships(userId){if(!userId)return[];return q('organizer_members','organizer_id,user_id,member_role,is_active,organizers(id,name,slug,status)',qy=>qy.eq('user_id',userId).eq('is_active',true));}
  async function checkCompetitionName(title, excludeId=null){
    const normalized=String(title||'').trim();
    if(normalized.length<3) return {available:false,reason:'Nama kompetisi minimal 3 karakter.'};
    let qy=c().from('competitions').select('id,title,slug,status').ilike('title',normalized).limit(1);
    const {data,error}=await qy;
    if(error) throw error;
    const hit=(data||[])[0];
    if(!hit || (excludeId && hit.id===excludeId)) return {available:true,slug:slugify(normalized)};
    return {available:false,reason:'Nama kompetisi sudah digunakan.',existing:hit,slug:hit.slug};
  }
  function slugify(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);}
  async function listCompetitionsAdmin({search='',status='',organizerId=null,limit=100}={}){let qy=c().from('competitions').select('id,organizer_id,title,slug,category,status,registration_starts_at,registration_ends_at,starts_at,ends_at,announcement_at,poster_url,poster_public_id,poster_width,poster_height,poster_version,poster_resource_type,juknis_url,juknis_public_id,kisi_kisi_published,kisi_kisi_content,visibility,short_description,created_at').order('created_at',{ascending:false}).limit(limit);if(search.trim())qy=qy.or(`title.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`);if(status)qy=qy.eq('status',status);if(organizerId)qy=qy.eq('organizer_id',organizerId);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function transitionCompetition(id,status,reason){const{data,error}=await c().rpc('transition_competition',{p_competition_id:id,p_to_status:status,p_reason:reason||null});if(error)throw error;return data;}
  async function saveCompetition(payload,id=null){return save('competitions',payload,id);}
  async function listLevels(id){return q('competition_levels','*',qy=>qy.eq('competition_id',id).order('created_at'));}
  async function saveLevel(payload,id=null){return save('competition_levels',payload,id);}
  async function getRegistrationRules(id){const{data,error}=await c().from('registration_rules').select('*').eq('competition_id',id).maybeSingle();if(error)throw error;return data;}
  async function saveRegistrationRules(payload,id){const{data,error}=await c().from('registration_rules').upsert({...payload,competition_id:id},{onConflict:'competition_id'}).select('*').single();if(error)throw error;return data;}
  async function listRewards(id){return q('competition_rewards','*',qy=>qy.eq('competition_id',id).order('rank_code'));}
  async function saveReward(payload,id=null){return save('competition_rewards',payload,id);}
  async function listQuestionBanks({organizerId=null,gradeCode=null}={}){return q('question_banks','*',qy=>{if(organizerId)qy=qy.eq('organizer_id',organizerId);if(gradeCode)qy=qy.eq('grade_code',gradeCode);return qy.order('created_at',{ascending:false});});}
  async function saveQuestionBank(payload,id=null){return save('question_banks',payload,id);}
  async function listQuestions({competitionId=null,bankId=null}={}){return q('questions','id,question_bank_id,competition_id,type,prompt,points,required,display_order,status,config,created_at',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);if(bankId)qy=qy.eq('question_bank_id',bankId);return qy.order('display_order',{ascending:true});});}
  async function saveQuestion(payload,id=null){return save('questions',payload,id);}
  async function listOptions(questionId){return q('question_options','id,question_id,label,value,is_correct,display_order',qy=>qy.eq('question_id',questionId).order('display_order'));}
  async function replaceOptions(questionId,opts){const{error:delError}=await c().from('question_options').delete().eq('question_id',questionId);if(delError)throw delError;if(opts?.length){const{error}=await c().from('question_options').insert(opts.map((o,i)=>({question_id:questionId,label:o.label,value:o.value,is_correct:!!o.is_correct,display_order:i})));if(error)throw error;}}
  async function listRegistrations({competitionId=null,status=''}={}){let qy=c().from('registrations').select('id,competition_id,user_id,status,twibbon_asset_url,social_proof_url,submitted_at,approved_at,rejected_at,rejection_reason,metadata,profiles:user_id(id,username,full_name,grade,institution,avatar_url),competitions:competition_id(id,title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function reviewRegistration(id,decision,reason){const{data,error}=await c().rpc('review_registration',{p_registration_id:id,p_decision:decision,p_reason:reason||null});if(error)throw error;return data;}
  async function listAttempts({competitionId=null,status=''}={}){let qy=c().from('attempts').select('id,competition_id,participant_id,registration_id,attempt_number,status,started_at,expires_at,submitted_at,finalized_at,score,profiles:participant_id(id,username,full_name,grade,institution),competitions:competition_id(id,title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listGradingItems(attemptId){return q('grading_items','*',qy=>qy.eq('attempt_id',attemptId).order('created_at'));}
  async function saveGrade(payload,id=null){return save('grading_items',payload,id);}
  async function finalizeAttempt(id,score){const{data,error}=await c().rpc('finalize_attempt_manual',{p_attempt_id:id,p_score:Number(score)||0,p_reason:'Manual finalization by organizer/admin'});if(error)throw error;return data;}
  async function listAwards({competitionId=null}={}){return q('awards','id,user_id,competition_id,rank_code,title,points,emblem_url,issued_at,visibility,profiles:user_id(id,username,full_name,avatar_url)',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);return qy.order('issued_at',{ascending:false});});}
  async function listCertificates({competitionId=null}={}){return q('certificates','id,user_id,competition_id,status,current_revision,created_at,updated_at,profiles:user_id(id,username,full_name)',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);return qy.order('created_at',{ascending:false});});}

  async function saveAdminAward(payload,id=null){return save('awards',payload,id);}
  async function updateCertificate(id,status){const{data,error}=await c().from('certificates').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listOrders({limit=100}={}){return q('orders','*,order_items(*),profiles:user_id(id,username,full_name,avatar_url)',qy=>qy.order('created_at',{ascending:false}).limit(limit));}
  async function updateOrder(id,status){const{data,error}=await c().from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listTwibbonTemplates({competitionId=null,organizerId=null}={}){return q('twibbon_templates','*',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);if(organizerId)qy=qy.eq('organizer_id',organizerId);return qy.order('created_at',{ascending:false});});}
  async function saveTwibbonTemplate(payload,id=null){return save('twibbon_templates',payload,id);}
  async function listModeration(){const[posts,comments,reports]=await Promise.all([q('posts','id,title,status,created_at,author_user_id',qy=>qy.order('created_at',{ascending:false}).limit(50)),q('comments','id,body,moderation_state,created_at,user_id',qy=>qy.order('created_at',{ascending:false}).limit(50)),q('comment_reports','id,comment_id,reason,status,created_at',qy=>qy.order('created_at',{ascending:false}).limit(50))]);return{posts,comments,reports};}
  async function moderatePost(id,status){return save('posts',{status,updated_at:new Date().toISOString()},id);}
  async function moderateComment(id,moderation_state){return save('comments',{moderation_state,updated_at:new Date().toISOString()},id);}
  async function moderateQuestion(id,status){return save('questions',{status,updated_at:new Date().toISOString()},id);}
  async function listPlans({organizerId=null}={}){return q('organizer_plans','*',qy=>{if(organizerId)qy=qy.eq('organizer_id',organizerId);return qy.order('created_at',{ascending:false});});}
  async function listActiveOrganizerPlan(organizerId){const rows=await listPlans({organizerId});return rows.find(x=>x.is_active)||null;}
  async function getPendingOrganizerPlanOrder(organizerId){
    const user=window.SYKA_STATE.getState().auth.user;
    if(!user?.id || !organizerId) return null;
    const {data,error}=await c().from('orders').select('*,order_items(*)').eq('user_id',user.id).eq('status','PENDING_PAYMENT').order('created_at',{ascending:false}).limit(20);
    if(error)throw error;
    return (data||[]).find(o=>(o.order_items||[]).some(i=>i.product_type==='PLAN' && i.metadata?.organizer_id===organizerId))||null;
  }
  async function listPlanCatalog(){return q('plan_catalog','*',qy=>qy.eq('is_active',true).order('sort_order',{ascending:true}));}
  async function chooseOrganizerPlan(organizerId,planCode){const{data,error}=await c().rpc('choose_organizer_plan',{p_organizer_id:organizerId,p_plan_code:planCode});if(error)throw error;return data;}
  async function assignOrganizerPlan(organizerId,planCode,startsAt=null,endsAt=null){const{data,error}=await c().rpc('admin_assign_organizer_plan',{p_organizer_id:organizerId,p_plan_code:planCode,p_starts_at:startsAt,p_ends_at:endsAt});if(error)throw error;return data;}

  async function privilegedAssignOrganizerPlan(organizerId,planCode,startsAt,endsAt,reason){
    const{data,error}=await c().rpc('admin_privileged_assign_organizer_plan',{p_organizer_id:organizerId,p_plan_code:planCode,p_starts_at:startsAt,p_ends_at:endsAt,p_reason:reason||null});
    if(error)throw error; return data;
  }
  async function privilegedUpsertPlanCatalog(payload){
    const{data,error}=await c().rpc('admin_privileged_upsert_plan_catalog',{p_plan_code:payload.plan_code,p_name:payload.name,p_badge:payload.badge||null,p_description:payload.description||null,p_monthly_price:Number(payload.monthly_price)||0,p_yearly_price:Number(payload.yearly_price)||0,p_is_active:payload.is_active!==false,p_sort_order:Number(payload.sort_order)||0,p_reason:payload.reason||null});
    if(error)throw error; return data;
  }
  async function privilegedDeactivatePlan(planCode,reason){
    const{data,error}=await c().rpc('admin_privileged_deactivate_plan',{p_plan_code:planCode,p_reason:reason||null});
    if(error)throw error; return data;
  }
  async function createOrganizerPlanOrderV2(payload){
    const{data,error}=await c().rpc('create_organizer_plan_order_v2',{
      p_organizer_id:payload.organizer_id,
      p_plan_code:payload.plan_code,
      p_billing_period:payload.billing_period,
      p_whatsapp:payload.whatsapp,
      p_proof_url:payload.proof_url,
      p_proof_public_id:payload.proof_public_id||null,
      p_proof_width:payload.proof_width||null,
      p_proof_height:payload.proof_height||null,
      p_proof_version:payload.proof_version||null,
      p_proof_resource_type:payload.proof_resource_type||null
    });
    if(error)throw error; return data;
  }
  async function listEntitlements(){return q('plan_entitlements','*',qy=>qy.order('plan_code'));}
  async function saveEntitlement(payload,id=null){return save('plan_entitlements',payload,id);}
  async function deleteEntitlement(planCode,capability){const{error}=await c().from('plan_entitlements').delete().eq('plan_code',planCode).eq('capability',capability);if(error)throw error;}
  async function savePlanBundle(payload){const{data,error}=await c().rpc('admin_save_plan_bundle',{p_plan_code:payload.plan_code,p_name:payload.name,p_description:payload.description||null,p_badge:payload.badge||null,p_monthly_price:Number(payload.monthly_price)||0,p_yearly_price:Number(payload.yearly_price)||0,p_is_active:payload.is_active!==false,p_entitlements:payload.entitlements||[]});if(error)throw error;return data;}
  async function listCommerceProducts({admin=false}={}){let qy=c().from('commerce_products').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(!admin)qy=qy.eq('is_active',true);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listCommerceBenefits(productId){return q('commerce_product_benefits','*',qy=>qy.eq('product_id',productId).order('created_at',{ascending:true}));}
  async function saveCommerceProduct(payload,id=null){return save('commerce_products',payload,id);}
  async function deleteCommerceProduct(id){const{error}=await c().from('commerce_products').delete().eq('id',id);if(error)throw error;}
  async function replaceCommerceBenefits(productId,benefits=[]){const{error:de}=await c().from('commerce_product_benefits').delete().eq('product_id',productId);if(de)throw de;if(benefits.length){const{error}=await c().from('commerce_product_benefits').insert(benefits.map(b=>({...b,product_id:productId})));if(error)throw error;}}
  async function listFlags(){return q('feature_flags','*',qy=>qy.order('key'));}
  async function setFlag(key,enabled,config={}){const{data,error}=await c().from('feature_flags').upsert({key,enabled,config,updated_at:new Date().toISOString()},{onConflict:'key'}).select('*').single();if(error)throw error;return data;}
  async function listSettings(){return q('global_settings','*',qy=>qy.order('key'));}
  async function setSetting(key,value){const{data,error}=await c().from('global_settings').upsert({key,value,updated_at:new Date().toISOString()},{onConflict:'key'}).select('*').single();if(error)throw error;return data;}
  async function listAudit({limit=100,action=''}={}){let qy=c().from('audit_logs').select('*').order('created_at',{ascending:false}).limit(limit);if(action)qy=qy.ilike('action',`%${action}%`);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listTasksAdmin(){const{data,error}=await c().from('daily_tasks').select('id,title,description,task_type,points,exp,sort_order,is_active,requirements,created_at,updated_at').order('sort_order',{ascending:true});if(error)throw error;return data||[];}
  async function saveTask(payload,id=null){return save('daily_tasks',payload,id);}
  async function listAnnouncements({admin=false}={}){
    let qy=c().from('header_announcements').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false}).limit(20);
    if(!admin){
      qy=qy.eq('is_active',true);
      const now=new Date().toISOString();
      qy=qy.or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`);
    }
    const {data,error}=await qy; if(error) throw error; return data||[];
  }
  async function saveAnnouncement(payload,id=null){return save('header_announcements',payload,id);}
  async function deleteAnnouncement(id){const{error}=await c().from('header_announcements').delete().eq('id',id);if(error)throw error;}
  async function listSlides({admin=false}={}){let qy=c().from('home_slides').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(!admin){const now=new Date().toISOString();qy=qy.eq('is_active',true).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`);}const{data,error}=await qy;if(error)throw error;return data||[];}
  async function saveSlide(payload,id=null){return save('home_slides',payload,id);}
  async function deleteSlide(id){const{error}=await c().from('home_slides').delete().eq('id',id);if(error)throw error;}
  window.SYKA_CONTROL_SERVICE={listTasksAdmin,saveTask,checkCompetitionName,listAnnouncements,saveAnnouncement,deleteAnnouncement,privilegedAssignOrganizerPlan,privilegedUpsertPlanCatalog,privilegedDeactivatePlan,createOrganizerPlanOrderV2,platformStats,listUsers,setUserStatus,setUserRole,listOrganizers,listMyOrganizerMemberships,listCompetitionsAdmin,transitionCompetition,saveCompetition,listLevels,saveLevel,getRegistrationRules,saveRegistrationRules,listRewards,saveReward,listQuestionBanks,saveQuestionBank,listQuestions,saveQuestion,listOptions,replaceOptions,listRegistrations,reviewRegistration,listAttempts,listGradingItems,saveGrade,finalizeAttempt,listAwards,listCertificates,saveAdminAward,updateCertificate,listOrders,updateOrder,listTwibbonTemplates,saveTwibbonTemplate,listModeration,moderatePost,moderateComment,moderateQuestion,listPlans,listActiveOrganizerPlan,getPendingOrganizerPlanOrder,chooseOrganizerPlan,assignOrganizerPlan,listPlanCatalog,listEntitlements,saveEntitlement,deleteEntitlement,savePlanBundle,listCommerceProducts,listCommerceBenefits,saveCommerceProduct,deleteCommerceProduct,replaceCommerceBenefits,listFlags,setFlag,listSettings,setSetting,listAudit,listSlides,saveSlide,deleteSlide};
})();
