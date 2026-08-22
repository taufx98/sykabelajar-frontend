/* src/core/config.js */
(function () {
  const existing = window.SYKA_CONFIG || {};
  window.SYKA_CONFIG = Object.freeze({
    APP_NAME: 'Sykabelajar.id',
    APP_VERSION: '4.4.0-production-polish',
    ROUTE_MODE: existing.ROUTE_MODE || 'query',
    APP_PAGE: existing.APP_PAGE || '/p/app.html',
    ASSET_BASE_URL: existing.ASSET_BASE_URL || './dist',
    SUPABASE_URL: existing.SUPABASE_URL || 'https://jrfogwueytiddnanetth.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: existing.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_H3zjdAEE-ItQ08YRj8MieQ_kNMcsAHa',
    CLOUDINARY_CLOUD_NAME: existing.CLOUDINARY_CLOUD_NAME || 'sykabelajar',
    CLOUDINARY_UPLOAD_PRESET: existing.CLOUDINARY_UPLOAD_PRESET || 'sykabelajar_preset',
    CLOUDINARY_FOLDER: existing.CLOUDINARY_FOLDER || 'sykabelajar/users/profiles',
    DEFAULT_PAGE_SIZE: 12,
    PROFILE_COLUMNS: {
      avatarUrl: 'avatar_url',
      avatarPublicId: 'avatar_public_id',
      avatarWidth: 'avatar_width',
      avatarHeight: 'avatar_height',
      avatarVersion: 'avatar_version',
      avatarResourceType: 'avatar_resource_type'
    }
  });
})();




/* src/core/state.js */
(function () {
  const listeners = new Set();
  const state = {
    auth: { session: null, user: null, profile: null, roles: [], permissions: [], status: 'booting' },
    route: { name: 'home', params: {}, query: {} },
    ui: { theme: 'dark', sidebar: true, modal: null, toastQueue: [] },
    network: { online: navigator.onLine, lastError: null, requestId: null },
    competition: { current: null, status: 'idle' },
    registration: { current: null, status: 'idle' },
    attempt: { current: null, status: 'idle', saving: 'idle' },
    notifications: { unreadCount: 0 },
    economy: { xp: 0, eduCoins: 0, season: null }
  };

  function getState() { return state; }
  function patch(path, value) {
    const parts = path.split('.');
    let target = state;
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
    target[parts[parts.length - 1]] = value;
    listeners.forEach(fn => { try { fn(state, path); } catch (_) {} });
  }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function resetUserState() {
    state.auth = { session: null, user: null, profile: null, roles: [], permissions: [], status: 'anonymous' };
    state.registration = { current: null, status: 'idle' };
    state.attempt = { current: null, status: 'idle', saving: 'idle' };
    state.notifications = { unreadCount: 0 };
    state.economy = { xp: 0, eduCoins: 0, season: null };
    listeners.forEach(fn => { try { fn(state, 'auth.reset'); } catch (_) {} });
  }
  window.SYKA_STATE = { getState, patch, subscribe, resetUserState };
})();




/* src/core/events.js */
(function () {
  const bus = new EventTarget();
  window.SYKA_EVENTS = {
    on(name, fn) { const h = e => fn(e.detail); bus.addEventListener(name, h); return () => bus.removeEventListener(name, h); },
    emit(name, detail) { bus.dispatchEvent(new CustomEvent(name, { detail })); }
  };
})();




/* src/lib/utils.js */
(function(){
  const APP_PAGE_FALLBACK='/p/app.html';
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function initials(name){return (String(name||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('')||'U').toUpperCase();}
  function formatNumber(value){return Number(value||0).toLocaleString('id-ID');}
  function formatDate(value,opts={}){
    if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';
    return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',...opts}).format(d);
  }
  function formatTime(value){if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';return new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(d);}
  function formatDateTime(value){if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';return `${formatDate(d)} · ${formatTime(d)}`;}
  function toLocalInputValue(value){if(!value)return '';const d=new Date(value);if(Number.isNaN(d.getTime()))return '';const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
  function localInputToISO(value){if(!value)return null;const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
  function debounce(fn,wait){let t=null;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),wait);};}
  function routePath(){
    const url=new URL(window.location.href);const appPage=window.SYKA_CONFIG?.APP_PAGE||APP_PAGE_FALLBACK;
    const explicit=url.searchParams.get('route');if(explicit)return explicit;
    if(window.location.hash?.startsWith('#/'))return window.location.hash.slice(1);
    if(url.pathname===appPage){
      const tab=(url.searchParams.get('tab')||'').toLowerCase();
      const aliases={competitions:'/lomba',competition:'/lomba',lomba:'/lomba',ranking:'/juara',leaderboard:'/juara',juara:'/juara',awards:'/prestasi',achievement:'/prestasi',prestasi:'/prestasi',profile:'/profile',profil:'/profile',orders:'/pesanan',order:'/pesanan',pesanan:'/pesanan',store:'/toko',shop:'/toko',toko:'/toko',organizer:'/organizer',penyelenggara:'/organizer',admin:'/admin'};
      return aliases[tab]||'/';
    }
    return url.pathname||'/';
  }
  function queryParams(){const url=new URL(window.location.href);const p=Object.fromEntries(url.searchParams.entries());delete p.route;return p;}
  function randomId(prefix='req'){return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;}
  function cloudinaryTransform(url,opts={}){if(!url||!url.includes('/upload/'))return url||'';const [base,file]=url.split('/upload/');const t=[];if(opts.width)t.push(`w_${Math.round(opts.width)}`);if(opts.height)t.push(`h_${Math.round(opts.height)}`);if(opts.crop)t.push(`c_${opts.crop}`);if(opts.gravity)t.push(`g_${opts.gravity}`);t.push('q_auto','f_auto');return `${base}/upload/${t.join(',')}/${file}`;}
  function getStoredTheme(){return localStorage.getItem('syka_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}
  function safeJson(value,fallback=null){try{return JSON.parse(value);}catch(_){return fallback;}}
  function statusClass(status){const s=String(status||'').toUpperCase();if(['ACTIVE','APPROVED','PUBLISHED','RESULT_PUBLISHED','COMPLETED','PAID'].includes(s))return 'status-success';if(['PENDING','DRAFT','REGISTRATION_OPEN','GRADING','PROCESSING','REVIEW'].includes(s))return 'status-warning';if(['CANCELLED','REJECTED','REVOKED','SUSPENDED','FAILED'].includes(s))return 'status-danger';return 'status-neutral';}
  window.SYKA_UTILS={escapeHtml,initials,formatNumber,formatDate,formatTime,formatDateTime,toLocalInputValue,localInputToISO,debounce,routePath,queryParams,randomId,cloudinaryTransform,getStoredTheme,safeJson,statusClass};
})();


/* src/lib/supabase.js */
(function () {
  let client = null;

  function getStorage() {
    try {
      return window.localStorage;
    } catch (_) {
      return undefined;
    }
  }

  function init() {
    if (client) return client;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase JS belum dimuat.');
    }

    const cfg = window.SYKA_CONFIG;
    const storage = getStorage();
    const defaultStorageKey = 'sb-jrfogwueytiddnanetth-auth-token';
    const legacyStorageKey = 'sykabelajar-auth-v4_1';
    try {
      if (storage && !storage.getItem(defaultStorageKey)) {
        const legacy = storage.getItem(legacyStorageKey);
        if (legacy) storage.setItem(defaultStorageKey, legacy);
      }
    } catch (_) {}

    client = window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage,
          storageKey: defaultStorageKey,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    );

    return client;
  }

  function get() {
    return client || init();
  }

  window.SYKA_SUPABASE = { init, get };
})();




/* src/lib/cloudinary.js */
(function () {
  let widget = null;
  function createAvatarWidget(onSuccess, onError) {
    const cfg = window.SYKA_CONFIG;
    if (!window.cloudinary || typeof window.cloudinary.createUploadWidget !== 'function') {
      onError?.(new Error('Cloudinary Upload Widget belum dimuat.'));
      return null;
    }
    if (widget) return widget;
    widget = window.cloudinary.createUploadWidget({
      cloudName: cfg.CLOUDINARY_CLOUD_NAME,
      uploadPreset: cfg.CLOUDINARY_UPLOAD_PRESET,
      folder: cfg.CLOUDINARY_FOLDER,
      sources: ['local', 'camera'],
      multiple: false,
      resourceType: 'image',
      cropping: true,
      croppingAspectRatio: 1,
      maxFileSize: 5000000,
      clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
      showAdvancedOptions: false,
      singleUploadAutoClose: false
    }, (error, result) => {
      if (error) { onError?.(error); return; }
      if (result?.event === 'success') onSuccess?.(result.info);
    });
    return widget;
  }
  function openAvatarWidget(onSuccess, onError) { createAvatarWidget(onSuccess, onError)?.open(); }
  window.SYKA_CLOUDINARY = { createAvatarWidget, openAvatarWidget };
})();




/* src/services/auth.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getSession() { const { data, error } = await client().auth.getSession(); if (error) throw error; return data.session; }
  async function signIn({ email, password }) { const { data, error } = await client().auth.signInWithPassword({ email, password }); if (error) throw error; return data; }
  async function signUp({ email, password, fullName, username, grade, birthDate, institution, schoolId, guardianName }) {
    const url = new URL(window.location.href); url.searchParams.delete('route'); url.hash = '';
    const metadata = {
      full_name: fullName || '',
      username: username || '',
      grade: grade || '',
      birth_date: birthDate || null,
      institution: institution || '',
      school_id: schoolId || null,
      guardian_name: guardianName || ''
    };
    const { data, error } = await client().auth.signUp({ email, password, options: { emailRedirectTo: url.toString(), data: metadata } });
    if (error) throw error;
    return data;
  }
  async function signOut() { const { error } = await client().auth.signOut(); if (error) throw error; }
  async function resetPassword(email) { const url = new URL(window.location.href); url.searchParams.set('route', '/profile'); url.searchParams.set('recovery', '1'); url.hash = ''; const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: url.toString() }); if (error) throw error; }
  async function updatePassword(password) { const { data, error } = await client().auth.updateUser({ password }); if (error) throw error; return data; }
  window.SYKA_AUTH_SERVICE = { getSession, signIn, signUp, signOut, resetPassword, updatePassword };
})();


/* src/services/profile.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function getMe(userId){if(!userId)return null;const{data,error}=await c().from('profiles').select('*').eq('id',userId).maybeSingle();if(error)throw error;return data;}
  async function updateProfile(userId,payload){if(!userId)throw new Error('LOGIN_REQUIRED');const{data,error}=await c().from('profiles').update(payload).eq('id',userId).select('*').single();if(error)throw error;return data;}
  async function getRoles(userId){if(!userId)return{roles:[],permissions:[]};const{data,error}=await c().from('user_roles').select('role,is_active').eq('user_id',userId).eq('is_active',true);if(error)throw error;return{roles:(data||[]).map(x=>x.role),permissions:[]};}
  window.SYKA_PROFILE_SERVICE={getMe,updateProfile,getRoles};
})();


/* src/services/competition.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  function normalize(row){return {id:row.id,slug:row.slug||row.id,title:row.title||'Kompetisi',category:row.category||'Kompetisi',status:row.status||'DRAFT',poster:row.poster_url||row.cover_url||row.image_url||'',description:row.short_description||row.description||'',registrationStartsAt:row.registration_starts_at,registrationEndsAt:row.registration_ends_at,startsAt:row.starts_at,endsAt:row.ends_at,announcementAt:row.announcement_at,visibility:row.visibility||'PUBLIC',organizerId:row.organizer_id,data:row};}
  async function list({limit=12,status='PUBLIC_ONLY'}={}){let q=c().from('competitions').select('*').order('created_at',{ascending:false}).limit(limit);if(status==='PUBLIC_ONLY')q=q.eq('visibility','PUBLIC').neq('status','CANCELLED');if(status&&status!=='PUBLIC_ONLY')q=q.eq('status',status);const{data,error}=await q;if(error)throw error;return(data||[]).map(normalize);}
  async function getBySlug(slug){const{data,error}=await c().from('competitions').select('*').eq('slug',slug).maybeSingle();if(error)throw error;return data?normalize(data):null;}
  async function getLevels(id){const{data,error}=await c().from('competition_levels').select('*').eq('competition_id',id).order('created_at');if(error)throw error;return data||[];}
  async function getRules(id){const{data,error}=await c().from('registration_rules').select('*').eq('competition_id',id).maybeSingle();if(error)throw error;return data;}
  async function getRewards(id){const{data,error}=await c().from('competition_rewards').select('*').eq('competition_id',id).order('rank_code');if(error)throw error;return data||[];}
  window.SYKA_COMPETITION_SERVICE={list,getBySlug,getLevels,getRules,getRewards};
})();


/* src/services/registration.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function getStatus(userId,competitionId){if(!userId||!competitionId)return null;const{data,error}=await c().from('registrations').select('*').eq('user_id',userId).eq('competition_id',competitionId).maybeSingle();if(error)throw error;return data;}
  async function register({competitionId,participationKey=null,competitionLevelId=null}){const{data:userData}=await c().auth.getUser();if(!userData.user)throw new Error('LOGIN_REQUIRED');const{data,error}=await c().rpc('register_for_competition',{p_competition_id:competitionId,p_participation_key:participationKey,p_competition_level_id:competitionLevelId});if(error)throw error;return data;}
  async function checkEligibility({competitionId,grade}){if(!competitionId)return{eligible:false,reason:'COMPETITION_REQUIRED'};const{data,error}=await c().rpc('check_registration_eligibility',{p_competition_id:competitionId,p_grade:grade||null});if(error) return {eligible:true,reason:null};return data||{eligible:true,reason:null};}
  window.SYKA_REGISTRATION_SERVICE={getStatus,register,checkEligibility};
})();


/* src/services/attempt.service.js */
(function () {
  async function unavailable() { throw new Error('Attempt service backend belum tersedia. Hubungkan RPC/Edge Function sesuai contract RPD v4.1.'); }
  window.SYKA_ATTEMPT_SERVICE = { start: unavailable, saveAnswer: unavailable, submit: unavailable, getResume: unavailable };
})();




/* src/services/leaderboard.service.js */
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




/* src/services/award.service.js */
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




/* src/services/notification.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function list(userId) { if (!userId) return []; const { data, error } = await client().from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30); if (error) throw error; return data || []; }
  async function markRead(id) { const { error } = await client().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id); if (error) throw error; }
  window.SYKA_NOTIFICATION_SERVICE = { list, markRead };
})();




/* src/services/order.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function list(userId) { if (!userId) return []; const { data, error } = await client().from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) throw error; return data || []; }
  async function create(payload) { const { data, error } = await client().from('orders').insert(payload).select('*').single(); if (error) throw error; return data; }
  window.SYKA_ORDER_SERVICE = { list, create };
})();




/* src/services/store.service.js */
(function(){
  function client(){return window.SYKA_SUPABASE.get();}

  function roleAudience(){
    const roles=window.SYKA_STATE.getState().auth.roles||[];
    if(roles.includes('admin')) return ['student','teacher','organizer'];
    const out=[];
    if(roles.includes('student')) out.push('student');
    if(roles.includes('teacher')) out.push('teacher');
    if(roles.includes('organizer_member')) out.push('organizer');
    return out.length?out:['student'];
  }

  async function listProducts(){
    const {data,error}=await client().from('commerce_products').select('*').eq('is_active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(error)throw error;
    const products=data||[];
    const ids=products.map(p=>p.id);
    if(!ids.length)return[];
    const {data:benefits,error:be}=await client().from('commerce_product_benefits').select('*').in('product_id',ids).order('created_at',{ascending:true});
    if(be)throw be;
    const map={};
    (benefits||[]).forEach(b=>(map[b.product_id]??=[]).push(b));
    const audience=roleAudience();
    return products.filter(p=>p.audiences?.some(a=>audience.includes(a))).map(p=>({...p,benefits:map[p.id]||[]}));
  }

  async function listEntitlements(userId){
    if(!userId)return[];
    const {data,error}=await client().from('user_product_entitlements').select('*').eq('user_id',userId).order('created_at',{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function createProductOrder(productId,quantity=1){
    const {data,error}=await client().rpc('create_product_order',{p_product_id:productId,p_quantity:Math.max(1,Number(quantity)||1)});
    if(error)throw error;
    return data;
  }

  window.SYKA_STORE_SERVICE={listProducts,listEntitlements,createProductOrder};
})();


/* src/services/admin.service.js */
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


/* src/services/controlplane.service.js */
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
  async function listCompetitionsAdmin({search='',status='',organizerId=null,limit=100}={}){let qy=c().from('competitions').select('id,organizer_id,title,slug,category,status,registration_starts_at,registration_ends_at,starts_at,ends_at,announcement_at,poster_url,visibility,created_at').order('created_at',{ascending:false}).limit(limit);if(search.trim())qy=qy.or(`title.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`);if(status)qy=qy.eq('status',status);if(organizerId)qy=qy.eq('organizer_id',organizerId);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function transitionCompetition(id,status,reason){const{data,error}=await c().rpc('transition_competition',{p_competition_id:id,p_to_status:status,p_reason:reason||null});if(error)throw error;return data;}
  async function saveCompetition(payload,id=null){return save('competitions',payload,id);}
  async function listLevels(id){return q('competition_levels','*',qy=>qy.eq('competition_id',id).order('created_at'));}
  async function saveLevel(payload,id=null){return save('competition_levels',payload,id);}
  async function getRegistrationRules(id){const{data,error}=await c().from('registration_rules').select('*').eq('competition_id',id).maybeSingle();if(error)throw error;return data;}
  async function saveRegistrationRules(payload,id){const{data,error}=await c().from('registration_rules').upsert({...payload,competition_id:id},{onConflict:'competition_id'}).select('*').single();if(error)throw error;return data;}
  async function listRewards(id){return q('competition_rewards','*',qy=>qy.eq('competition_id',id).order('rank_code'));}
  async function saveReward(payload,id=null){return save('competition_rewards',payload,id);}
  async function listQuestionBanks({organizerId=null}={}){return q('question_banks','*',qy=>{if(organizerId)qy=qy.eq('organizer_id',organizerId);return qy.order('created_at',{ascending:false});});}
  async function saveQuestionBank(payload,id=null){return save('question_banks',payload,id);}
  async function listQuestions({competitionId=null,bankId=null}={}){return q('questions','id,question_bank_id,competition_id,type,prompt,points,required,display_order,status,config,created_at',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);if(bankId)qy=qy.eq('question_bank_id',bankId);return qy.order('display_order',{ascending:true});});}
  async function saveQuestion(payload,id=null){return save('questions',payload,id);}
  async function listOptions(questionId){return q('question_options','id,question_id,label,value,display_order',qy=>qy.eq('question_id',questionId).order('display_order'));}
  async function replaceOptions(questionId,opts){const{error:delError}=await c().from('question_options').delete().eq('question_id',questionId);if(delError)throw delError;if(opts?.length){const{error}=await c().from('question_options').insert(opts.map((o,i)=>({question_id:questionId,label:o.label,value:o.value,is_correct:!!o.is_correct,display_order:i})));if(error)throw error;}}
  async function listRegistrations({competitionId=null,status=''}={}){let qy=c().from('registrations').select('id,competition_id,user_id,status,twibbon_asset_url,social_proof_url,submitted_at,approved_at,rejected_at,rejection_reason,metadata,profiles:user_id(id,username,full_name,grade,institution,avatar_url),competitions:competition_id(id,title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function reviewRegistration(id,decision,reason){const{data,error}=await c().rpc('review_registration',{p_registration_id:id,p_decision:decision,p_reason:reason||null});if(error)throw error;return data;}
  async function listAttempts({competitionId=null,status=''}={}){let qy=c().from('attempts').select('id,competition_id,participant_id,registration_id,attempt_number,status,started_at,expires_at,submitted_at,finalized_at,score,profiles:participant_id(id,username,full_name,grade,institution),competitions:competition_id(id,title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listGradingItems(attemptId){return q('grading_items','*',qy=>qy.eq('attempt_id',attemptId).order('created_at'));}
  async function saveGrade(payload,id=null){return save('grading_items',payload,id);}
  async function finalizeAttempt(id,score){const{data,error}=await c().from('attempts').update({score:Number(score)||0,status:'FINALIZED',finalized_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listAwards({competitionId=null}={}){return q('awards','id,user_id,competition_id,rank_code,title,points,emblem_url,issued_at,visibility',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);return qy.order('issued_at',{ascending:false});});}
  async function listCertificates({competitionId=null}={}){return q('certificates','id,user_id,competition_id,status,current_revision,created_at,updated_at',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);return qy.order('created_at',{ascending:false});});}
  async function updateCertificate(id,status){const{data,error}=await c().from('certificates').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listOrders({limit=100}={}){return q('orders','*',qy=>qy.order('created_at',{ascending:false}).limit(limit));}
  async function updateOrder(id,status){const{data,error}=await c().from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listTwibbonTemplates({competitionId=null,organizerId=null}={}){return q('twibbon_templates','*',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);if(organizerId)qy=qy.eq('organizer_id',organizerId);return qy.order('created_at',{ascending:false});});}
  async function saveTwibbonTemplate(payload,id=null){return save('twibbon_templates',payload,id);}
  async function listModeration(){const[posts,comments,reports]=await Promise.all([q('posts','id,title,status,created_at,author_user_id',qy=>qy.order('created_at',{ascending:false}).limit(50)),q('comments','id,body,moderation_state,created_at,user_id',qy=>qy.order('created_at',{ascending:false}).limit(50)),q('comment_reports','id,comment_id,reason,status,created_at',qy=>qy.order('created_at',{ascending:false}).limit(50))]);return{posts,comments,reports};}
  async function moderatePost(id,status){return save('posts',{status,updated_at:new Date().toISOString()},id);}
  async function moderateComment(id,moderation_state){return save('comments',{moderation_state,updated_at:new Date().toISOString()},id);}
  async function moderateQuestion(id,status){return save('questions',{status,updated_at:new Date().toISOString()},id);}
  async function listPlans(){return q('organizer_plans','*',qy=>qy.order('created_at',{ascending:false}));}
  async function listPlanCatalog(){return q('plan_catalog','*',qy=>qy.order('sort_order',{ascending:true}));}
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
  async function listSlides({admin=false}={}){let qy=c().from('home_slides').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(!admin){const now=new Date().toISOString();qy=qy.eq('is_active',true).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`);}const{data,error}=await qy;if(error)throw error;return data||[];}
  async function saveSlide(payload,id=null){return save('home_slides',payload,id);}
  async function deleteSlide(id){const{error}=await c().from('home_slides').delete().eq('id',id);if(error)throw error;}
  window.SYKA_CONTROL_SERVICE={platformStats,listUsers,setUserStatus,setUserRole,listOrganizers,listMyOrganizerMemberships,listCompetitionsAdmin,transitionCompetition,saveCompetition,listLevels,saveLevel,getRegistrationRules,saveRegistrationRules,listRewards,saveReward,listQuestionBanks,saveQuestionBank,listQuestions,saveQuestion,listOptions,replaceOptions,listRegistrations,reviewRegistration,listAttempts,listGradingItems,saveGrade,finalizeAttempt,listAwards,listCertificates,updateCertificate,listOrders,updateOrder,listTwibbonTemplates,saveTwibbonTemplate,listModeration,moderatePost,moderateComment,moderateQuestion,listPlans,listPlanCatalog,listEntitlements,saveEntitlement,deleteEntitlement,savePlanBundle,listCommerceProducts,listCommerceBenefits,saveCommerceProduct,deleteCommerceProduct,replaceCommerceBenefits,listFlags,setFlag,listSettings,setSetting,listAudit,listSlides,saveSlide,deleteSlide};
})();


/* src/components/Toast.js */
(function () {
  function ensure() { return document.getElementById('syka-toast-root') || (() => { const el=document.createElement('div'); el.id='syka-toast-root'; document.body.appendChild(el); return el; })(); }
  function show(message, type='info') { const root=ensure(); const el=document.createElement('div'); el.className=`syka-toast syka-toast-${type}`; el.innerHTML=`<span>${window.SYKA_UTILS.escapeHtml(message)}</span><button aria-label="Tutup">×</button>`; el.querySelector('button').onclick=()=>el.remove(); root.appendChild(el); setTimeout(()=>el.remove(),4500); }
  window.SYKA_TOAST = { show };
})();




/* src/components/Modal.js */
(function () {
  function open({ title='', html='', onOpen, onClose, wide=false }={}) {
    close();
    const root=document.createElement('div'); root.id='syka-modal-root'; root.className='syka-modal-backdrop';
    root.innerHTML=`<div class="syka-modal ${wide?'syka-modal-wide':''}" role="dialog" aria-modal="true"><div class="syka-modal-head"><div><h2>${window.SYKA_UTILS.escapeHtml(title)}</h2></div><button class="syka-icon-btn" data-close aria-label="Tutup">×</button></div><div class="syka-modal-body">${html}</div></div>`;
    document.body.appendChild(root); root.addEventListener('click',e=>{ if(e.target===root || e.target.closest('[data-close]')) close(); }); onOpen?.(root.querySelector('.syka-modal-body'), root);
    window._sykaModalClose=()=>{ onClose?.(); root.remove(); window._sykaModalClose=null; };
  }
  function close(){ if(window._sykaModalClose) window._sykaModalClose(); else document.getElementById('syka-modal-root')?.remove(); }
  window.SYKA_MODAL={open,close};
})();




/* src/components/Skeleton.js */
(function(){ function card(){return `<div class="syka-skeleton-card"><div class="skel skel-img"></div><div class="skel skel-line w70"></div><div class="skel skel-line w90"></div><div class="skel skel-line w50"></div></div>`} window.SYKA_SKELETON={card};})();




/* src/components/EmptyState.js */
(function(){ function render({icon='◌',title='Belum ada data',text='Data akan tampil di sini ketika tersedia.',actionHtml='' }={}){return `<div class="syka-empty"><div class="syka-empty-icon">${icon}</div><h3>${window.SYKA_UTILS.escapeHtml(title)}</h3><p>${window.SYKA_UTILS.escapeHtml(text)}</p>${actionHtml}</div>`} window.SYKA_EMPTY={render};})();




/* src/components/CompetitionCard.js */
(function(){
  function render(c){
    const u=window.SYKA_UTILS; const status=(c.status||'').replaceAll('_',' '); const poster=u.cloudinaryTransform(c.poster,{width:720,height:405,crop:'fill'});
    return `<article class="syka-card syka-competition-card"><a class="competition-media" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug))}">${poster?`<img src="${u.escapeHtml(poster)}" alt="${u.escapeHtml(c.title)}" loading="lazy">`:`<div class="media-fallback">Sykabelajar</div>`}</a><div class="card-body"><div class="eyebrow-row"><span class="chip chip-purple">${u.escapeHtml(c.category)}</span><span class="status-dot ${String(c.status).toLowerCase().includes('open')?'success':'muted'}">${u.escapeHtml(status)}</span></div><h3><a href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug))}">${u.escapeHtml(c.title)}</a></h3><p>${u.escapeHtml(c.description || 'Lihat persyaratan, timeline, hadiah, dan mekanisme kompetisi.')}</p><div class="meta-row"><span>Daftar s/d ${u.formatDate(c.registrationEndsAt)}</span><span>Mulai ${u.formatDate(c.startsAt)}</span></div><a class="btn btn-primary btn-block" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug))}">Lihat Detail <span>→</span></a></div></article>`;
  }
  window.SYKA_COMPETITION_CARD={render};
})();




/* src/components/Header.js */
(function(){
  function roleLabel(roles){if(roles.includes('admin'))return 'Admin';if(roles.includes('organizer_member'))return 'Penyelenggara';if(roles.includes('teacher'))return 'Guru';return 'Pelajar';}
  function render(){const auth=window.SYKA_STATE.getState().auth;const u=auth.user,p=auth.profile||{};const name=p.full_name||u?.user_metadata?.full_name||u?.email?.split('@')[0]||'Pengguna';const avatar=p.avatar_url||'';const canAdmin=auth.roles.includes('admin');const canOrganizer=auth.roles.includes('organizer_member')||canAdmin;const icon=auth.status==='authenticated'?'✓':'•';
    const el=document.getElementById('syka-header');if(!el)return;
    el.innerHTML=`<div class="header-inner"><div class="header-mobile-left"><button class="icon-btn mobile-menu" id="mobile-menu-btn" aria-label="Menu">☰</button></div><div class="header-announcement"><span class="announcement-dot">${icon}</span><span>Kompetisi, prestasi, dan pengalaman belajar dalam satu tempat.</span></div><div class="header-actions"><button class="icon-btn" id="theme-btn" title="Ganti tema">${document.documentElement.dataset.theme==='dark'?'☀':'◐'}</button>${u?`<div class="profile-quick"><button class="profile-trigger" id="profile-quick-btn"><span class="profile-avatar-mini">${avatar?`<img src="${window.SYKA_UTILS.escapeHtml(avatar)}" alt="">`:`${window.SYKA_UTILS.initials(name)}`}</span><span class="profile-text"><strong>${window.SYKA_UTILS.escapeHtml(name)}</strong><small>${roleLabel(auth.roles)}</small></span><span class="profile-chevron">⌄</span></button><div class="profile-menu hidden" id="profile-menu">${canAdmin?`<button data-go="/admin">Panel Admin</button>`:''}${canOrganizer?`<button data-go="/organizer">Panel Penyelenggara</button>`:''}<button data-go="/profile">Profil Saya</button><button data-go="/prestasi">Prestasi</button><button data-go="/pesanan">Pesanan</button><button class="danger" id="logout-btn">Keluar</button></div></div>`:`<button class="btn btn-primary btn-sm" id="header-login">Masuk</button>`}</div></div>`;
    document.getElementById('theme-btn')?.addEventListener('click',()=>window.SYKA_APP.toggleTheme());document.getElementById('mobile-menu-btn')?.addEventListener('click',()=>window.SYKA_APP.toggleMobileNav());document.getElementById('header-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login'));
    const trigger=document.getElementById('profile-quick-btn'),menu=document.getElementById('profile-menu');if(trigger&&menu)trigger.onclick=e=>{e.stopPropagation();menu.classList.toggle('hidden');};menu?.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{menu.classList.add('hidden');window.SYKA_ROUTER.navigate(b.dataset.go);});document.getElementById('logout-btn')?.addEventListener('click',()=>window.SYKA_APP.logout());
  }
  window.SYKA_HEADER={render};
})();


/* src/components/Sidebar.js */
(function(){
  function render(){const auth=window.SYKA_STATE.getState().auth;const path=window.SYKA_UTILS.routePath();const admin=auth.roles.includes('admin');const organizer=auth.roles.includes('organizer_member')||admin;const items=[['/','Beranda','⌂'],['/lomba','Lomba','◈'],['/juara','Juara','♛'],['/prestasi','Prestasi','✦']];if(auth.user)items.push(['/toko','Toko','◇']);if(organizer)items.push(['/organizer','Penyelenggara','▣']);if(admin)items.push(['/admin','Admin','⚙']);const el=document.getElementById('syka-sidebar');if(!el)return;el.innerHTML=`<div class="sidebar-inner"><div class="sidebar-brand"><a href="${window.SYKA_ROUTER.href('/')}" class="brand-link"><span class="brand-logo">S</span><span><strong>Sykabelajar.id</strong><small>Platform kompetensi</small></span></a><button class="sidebar-collapse" id="sidebar-collapse">‹</button></div><nav class="sidebar-nav">${items.map(([href,label,icon])=>`<a href="${window.SYKA_ROUTER.href(href)}" class="side-item ${path===href?'active':''}"><span class="side-icon">${icon}</span><span>${label}</span></a>`).join('')}</nav><div class="sidebar-spacer"></div><div class="sidebar-footer"><button class="side-action" id="side-profile"><span>◎</span>${auth.user?'Profil Saya':'Masuk / Daftar'}</button><button class="side-action" id="side-theme"><span>◐</span>Tema</button></div></div>`;document.getElementById('sidebar-collapse')?.addEventListener('click',()=>window.SYKA_APP.toggleSidebar());document.getElementById('side-theme')?.addEventListener('click',()=>window.SYKA_APP.toggleTheme());document.getElementById('side-profile')?.addEventListener('click',()=>auth.user?window.SYKA_ROUTER.navigate('/profile'):window.SYKA_APP.openAuth('login'));}
  window.SYKA_SIDEBAR={render};
})();


/* src/components/BottomNav.js */
(function(){function render(){const u=window.SYKA_STATE.getState().auth.user;const path=window.SYKA_UTILS.routePath();const el=document.getElementById('syka-bottom-nav');if(!el)return;const items=[['/','⌂','Home'],['/lomba','◈','Lomba'],['/juara','♛','Juara'],[u?'/profile':'/profile','◎',u?'Saya':'Masuk']];el.innerHTML=items.map(([href,icon,label])=>`<a href="${window.SYKA_ROUTER.href(href)}" class="bottom-item ${path===href?'active':''}"><span>${icon}</span><small>${label}</small></a>`).join('');}window.SYKA_BOTTOMNAV={render};})();


/* src/pages/Home.js */
(function(){
  const u=()=>window.SYKA_UTILS,esc=u().escapeHtml,fmt=u().formatNumber;
  async function render(root){
    root.innerHTML=`<section class="hero-v3"><div class="hero-main"><span class="eyebrow">SYKABELAJAR.ID · LEARN → COMPETE → ACHIEVE</span><h1>Belajar. Berkompetisi.<br><em>Berprestasi.</em></h1><p>Temukan kompetisi yang sesuai, ikuti prosesnya dengan nyaman, lalu bangun rekam prestasi yang bisa diverifikasi.</p><div class="hero-actions"><a class="btn btn-primary" href="${window.SYKA_ROUTER.href('/lomba')}">Jelajahi Lomba <span>→</span></a><a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/juara')}">Lihat Juara</a></div><div class="hero-stats" id="hero-stats">${[['total_students','Siswa terdaftar'],['total_schools','Sekolah terdaftar'],['total_award_recipients','Penerima prestasi'],['total_champions','Juara']].map(([,l])=>`<div class="stat-card"><strong>—</strong><span>${l}</span></div>`).join('')}</div></div><div class="hero-side" id="hero-promo"><div class="promo-placeholder"><span class="eyebrow">PROMO</span><h3>Ruang promosi tersedia</h3><p>Admin bisa memasukkan poster acara, campaign, deadline, atau pengumuman penting di sini.</p><span class="promo-hint">Optimized untuk poster landscape / 16:9</span></div></div></section><section class="content-section"><div class="section-title"><div><span class="eyebrow">DISCOVERY</span><h2>Lomba terbaru</h2><p>Kompetisi publik diambil langsung dari Supabase.</p></div><a class="text-link" href="${window.SYKA_ROUTER.href('/lomba')}">Lihat semua →</a></div><div id="home-competitions" class="card-grid"></div></section><section class="feature-strip"><a href="${window.SYKA_ROUTER.href('/juara')}" class="feature-item"><span>♛</span><div><strong>Top 50 juara</strong><small>Layout podium dan pagination sudah siap.</small></div>→</a><a href="${window.SYKA_ROUTER.href('/prestasi')}" class="feature-item"><span>✦</span><div><strong>Prestasi pribadi</strong><small>Awards dan proof of achievement dalam satu tempat.</small></div>→</a><a href="${window.SYKA_ROUTER.href('/verifikasi/demo')}" class="feature-item"><span>✓</span><div><strong>Verifikasi</strong><small>Validasi certificate dengan kode publik.</small></div>→</a></section>`;
    const list=document.getElementById('home-competitions');list.innerHTML=[0,1,2].map(()=>window.SYKA_SKELETON.card()).join('');
    try{const [stats,slides,rows]=await Promise.all([window.SYKA_CONTROL_SERVICE.platformStats(),window.SYKA_CONTROL_SERVICE.listSlides({admin:false}),window.SYKA_COMPETITION_SERVICE.list({limit:6})]);const keys=['total_students','total_schools','total_award_recipients','total_champions'];document.querySelectorAll('#hero-stats .stat-card strong').forEach((el,i)=>el.textContent=fmt(stats[keys[i]]));renderPromo(slides);list.innerHTML=rows.length?rows.map(window.SYKA_COMPETITION_CARD.render).join(''):window.SYKA_EMPTY.render({title:'Belum ada kompetisi publik',text:'Saat organizer menerbitkan kompetisi, kartu lomba akan muncul otomatis.',actionHtml:`<a class="btn btn-secondary btn-sm" href="${window.SYKA_ROUTER.href('/lomba')}">Buka katalog</a>`});}catch(error){document.querySelectorAll('#hero-stats .stat-card strong').forEach(x=>x.textContent='—');list.innerHTML=window.SYKA_EMPTY.render({title:'Data publik belum tersambung',text:error.message||'Coba lagi beberapa saat lagi.',actionHtml:'<button class="btn btn-secondary btn-sm" id="retry-home">Coba lagi</button>'});document.getElementById('retry-home')?.addEventListener('click',()=>window.SYKA_ROUTER.refresh());}
  }
  function renderPromo(slides){const el=document.getElementById('hero-promo');if(!slides.length)return;let index=0;const paint=()=>{const s=slides[index];el.innerHTML=`<div class="promo-frame"><img src="${esc(s.image_url)}" alt="${esc(s.title)}" loading="eager"><div class="promo-shade"></div><div class="promo-copy"><span class="promo-badge">${esc(s.badge||'PROMO')}</span><h3>${esc(s.title)}</h3>${s.subtitle?`<p>${esc(s.subtitle)}</p>`:''}${s.cta_label?`<a class="btn btn-white btn-sm" href="${window.SYKA_ROUTER.href(s.cta_route||'/lomba')}">${esc(s.cta_label)} →</a>`:''}</div><div class="promo-dots">${slides.map((_,i)=>`<button type="button" class="promo-dot ${i===index?'active':''}" data-i="${i}" aria-label="Slide ${i+1}"></button>`).join('')}</div></div>`;el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.i);paint();});};paint();if(slides.length>1)setInterval(()=>{index=(index+1)%slides.length;paint();},5000);}
  window.SYKA_PAGE_HOME={render};
})();


/* src/pages/Lomba.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml,fmt=window.SYKA_UTILS.formatDate;
  async function render(root){root.innerHTML=`<section class="page-title"><span class="eyebrow">DISCOVERY</span><h1>Semua Lomba</h1><p>Temukan kompetisi berdasarkan status, kategori, dan waktu pendaftaran.</p></section><div class="catalog-toolbar"><div class="search-wrap"><span>⌕</span><input id="catalog-search" placeholder="Cari lomba atau kategori…"></div><div class="filter-pills"><button class="filter-pill active" data-status="ALL">Semua</button><button class="filter-pill" data-status="REGISTRATION_OPEN">Pendaftaran dibuka</button><button class="filter-pill" data-status="LIVE">Sedang berjalan</button><button class="filter-pill" data-status="PUBLISHED">Akan datang</button></div></div><div id="lomba-grid" class="card-grid"></div>`;const grid=document.getElementById('lomba-grid');grid.innerHTML=[0,1,2,3].map(()=>window.SYKA_SKELETON.card()).join('');try{const rows=await window.SYKA_COMPETITION_SERVICE.list({limit:60});let status='ALL';const paint=()=>{const q=document.getElementById('catalog-search').value.toLowerCase();const filtered=rows.filter(r=>(status==='ALL'||r.status===status)&&(!q||`${r.title} ${r.category}`.toLowerCase().includes(q)));grid.innerHTML=filtered.length?filtered.map(window.SYKA_COMPETITION_CARD.render).join(''):window.SYKA_EMPTY.render({title:'Tidak ada hasil',text:'Coba kata kunci atau filter lain.'});};document.getElementById('catalog-search').oninput=paint;root.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{root.querySelectorAll('[data-status]').forEach(x=>x.classList.remove('active'));b.classList.add('active');status=b.dataset.status;paint();});paint();}catch(error){grid.innerHTML=window.SYKA_EMPTY.render({title:'Katalog belum tersedia',text:error.message||'Data kompetisi belum dapat dimuat.'});}}
  window.SYKA_PAGE_LOMBA={render};
})();


/* src/pages/Competition.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml,fmt=window.SYKA_UTILS.formatDateTime;
  async function render(root,slug){root.innerHTML='<div class="page-loading"><div class="loading-spinner"></div><span>Memuat detail kompetisi…</span></div>';const c=await window.SYKA_COMPETITION_SERVICE.getBySlug(slug);if(!c){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Slug kompetisi tidak tersedia atau sudah diarsipkan.',actionHtml:`<a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/lomba')}">Kembali ke katalog</a>`});return;}const [levels,rules,rewards]=await Promise.all([window.SYKA_COMPETITION_SERVICE.getLevels(c.id).catch(()=>[]),window.SYKA_COMPETITION_SERVICE.getRules(c.id).catch(()=>null),window.SYKA_COMPETITION_SERVICE.getRewards(c.id).catch(()=>[])]);const auth=window.SYKA_STATE.getState().auth;const reg=auth.user?await window.SYKA_REGISTRATION_SERVICE.getStatus(auth.user.id,c.id).catch(()=>null):null;const poster=c.poster?window.SYKA_UTILS.cloudinaryTransform(c.poster,{width:1200,height:700,crop:'fill'}):'';root.innerHTML=`<section class="competition-hero"><div class="competition-cover">${poster?`<img src="${esc(poster)}" alt="${esc(c.title)}">`:'<div class="cover-placeholder">✦</div>'}</div><div class="competition-intro"><div class="chip-row"><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span><span class="chip">${esc(c.category)}</span></div><h1>${esc(c.title)}</h1><p>${esc(c.description||'Informasi kompetisi dan detail pelaksanaan.')}</p><div class="timeline-mini"><div><small>Pendaftaran</small><b>${fmt(c.registrationStartsAt)}</b><span>→ ${fmt(c.registrationEndsAt)}</span></div><div><small>Kompetisi</small><b>${fmt(c.startsAt)}</b><span>→ ${fmt(c.endsAt)}</span></div><div><small>Pengumuman</small><b>${fmt(c.announcementAt)}</b></div></div><div class="competition-actions">${reg?`<span class="status-pill ${window.SYKA_UTILS.statusClass(reg.status)}">Pendaftaran: ${esc(reg.status)}</span>`:`<a class="btn btn-primary" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(slug)+'/daftar')}">Daftar sekarang →</a>`}<button class="btn btn-secondary" id="share-competition">Bagikan</button></div></div></section><div class="detail-grid"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">ELIGIBILITY</span><h2>Siapa yang bisa ikut?</h2></div></div><div class="detail-list"><div><span>Jenjang / kelas</span><strong>${levels.length?levels.map(x=>esc(x.label)).join(' · '):((rules?.allowed_grades||[]).join(' · ')||'Mengikuti aturan kompetisi')}</strong></div><div><span>Twibbon</span><strong>${rules?.require_twibbon?'Wajib':'Opsional / tidak ditentukan'}</strong></div><div><span>Social proof</span><strong>${rules?.require_social_proof?'Wajib':'Opsional / tidak ditentukan'}</strong></div><div><span>Kuota</span><strong>${rules?.max_participants||'Tanpa batas khusus'}</strong></div></div></section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">REWARD</span><h2>Hadiah & penghargaan</h2></div></div><div class="reward-list">${rewards.length?rewards.map(r=>`<div class="reward-item"><span class="reward-rank">${esc(r.rank_code)}</span><div><strong>${esc(r.title||'Reward')}</strong><small>${r.points} points ${r.emblem_name?'· '+esc(r.emblem_name):''}</small></div></div>`).join(''):window.SYKA_EMPTY.render({title:'Reward belum dipublikasikan',text:'Organizer belum mengisi reward kompetisi.'})}</div></section></div>`;document.getElementById('share-competition').onclick=async()=>{try{await navigator.clipboard.writeText(window.location.href);window.SYKA_TOAST.show('Link kompetisi disalin.','success');}catch(_){window.SYKA_TOAST.show('Salin URL dari address bar.','info');}};}
  window.SYKA_PAGE_COMPETITION={render};
})();


/* src/pages/Registration.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml;const grades=[['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];
  async function render(root,slug){const auth=window.SYKA_STATE.getState().auth;if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Login diperlukan',text:'Kamu perlu login sebelum mendaftar kompetisi.',actionHtml:'<button class="btn btn-primary" id="rlogin">Masuk</button>'});document.getElementById('rlogin').onclick=()=>window.SYKA_APP.openAuth('login',{target:`/lomba/${encodeURIComponent(slug)}/daftar`});return;}const c=await window.SYKA_COMPETITION_SERVICE.getBySlug(slug);if(!c){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Periksa kembali link kompetisi.'});return;}const p=window.SYKA_STATE.getState().auth.profile||{};const existing=await window.SYKA_REGISTRATION_SERVICE.getStatus(auth.user.id,c.id).catch(()=>null);if(existing){root.innerHTML=`<section class="page-title"><span class="eyebrow">REGISTRATION</span><h1>${esc(c.title)}</h1><p>Kamu sudah memiliki registration record untuk kompetisi ini.</p></section><div class="registration-result syka-card"><span class="status-pill ${window.SYKA_UTILS.statusClass(existing.status)}">${esc(existing.status)}</span><h2>Pendaftaran sudah tercatat</h2><p>Status final berasal dari backend. Kamu tidak perlu mengirim formulir berulang.</p><a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(slug))}">Kembali ke detail</a></div>`;return;}
    root.innerHTML=`<section class="page-title"><span class="eyebrow">REGISTRATION</span><h1>Daftar ${esc(c.title)}</h1><p>Lengkapi data peserta. Data profil akan disimpan di akun dan digunakan untuk proses kompetisi.</p></section><div class="registration-layout"><aside class="summary-card syka-card"><span class="summary-label">KOMPETISI</span><h3>${esc(c.title)}</h3><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span><dl><div><dt>Pendaftaran</dt><dd>${window.SYKA_UTILS.formatDateTime(c.registrationStartsAt)} → ${window.SYKA_UTILS.formatDateTime(c.registrationEndsAt)}</dd></div><div><dt>Kompetisi</dt><dd>${window.SYKA_UTILS.formatDateTime(c.startsAt)}</dd></div></dl></aside><form id="registration-form" class="syka-card form-card"><div class="form-section-title"><div><span class="eyebrow">DATA PESERTA</span><h2>Periksa dan lengkapi</h2></div><span class="form-required">* wajib</span></div><div class="form-grid-2"><label>Nama lengkap *<input id="rg-name" required value="${esc(p.full_name||'')}"></label><label>Username *<input id="rg-username" required value="${esc(p.username||'')}"></label></div><div class="form-grid-2"><label>Email *<input id="rg-email" type="email" readonly value="${esc(auth.user.email||'')}"><small class="field-help">Email mengikuti akun Sykabelajar.</small></label><label>Tanggal lahir *<div class="date-control"><span>◷</span><input id="rg-birth" type="date" required value="${esc(p.birth_date||'')}"></div></label></div><div class="form-grid-2"><label>Kelas *<select id="rg-grade" required>${grades.map(([v,l])=>`<option value="${v}" ${p.grade===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Pembina / guru pendamping<input id="rg-guardian" value="${esc(p.guardian_name||'')}"></label></div><label>Sekolah *<input id="rg-school" required value="${esc(p.institution||'')}" placeholder="Mulai ketik nama sekolah"></label><div id="rg-school-suggest" class="suggest-list hidden"></div><div class="form-hint">Nama sekolah akan dinormalisasi menjadi uppercase di database. Pilih rekomendasi bila tersedia.</div><div class="form-actions"><a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(slug))}">Kembali</a><button class="btn btn-primary" type="submit">Kirim pendaftaran</button></div><div id="rg-feedback"></div></form></div>`;
    const school=document.getElementById('rg-school'),suggest=document.getElementById('rg-school-suggest');let selected=p.school_id||null,timer;school.oninput=()=>{selected=null;clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(s=>`<button type="button" data-id="${esc(s.id)}" data-name="${esc(s.name)}"><b>${esc(s.name)}</b><small>${esc([s.city,s.province].filter(Boolean).join(' · '))}</small></button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;selected=b.dataset.id;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},220);};
    document.getElementById('registration-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button[type="submit"]'),feedback=document.getElementById('rg-feedback');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Mengirim…';try{await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,{full_name:f.querySelector('#rg-name').value.trim(),username:f.querySelector('#rg-username').value.trim().toLowerCase(),birth_date:f.querySelector('#rg-birth').value,grade:f.querySelector('#rg-grade').value,institution:f.querySelector('#rg-school').value.trim().toUpperCase(),school_id:selected,guardian_name:f.querySelector('#rg-guardian').value.trim()||null});const reg=await window.SYKA_REGISTRATION_SERVICE.register({competitionId:c.id});window.SYKA_STATE.patch('auth.profile',await window.SYKA_PROFILE_SERVICE.getMe(auth.user.id));feedback.innerHTML=`<div class="success-inline">Pendaftaran berhasil dikirim. Status saat ini: <b>${esc(reg?.status||'PENDING')}</b>.</div>`;btn.disabled=true;window.SYKA_TOAST.show('Pendaftaran berhasil dikirim.','success');}catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Pendaftaran gagal.')}</div>`;btn.disabled=false;btn.textContent='Kirim pendaftaran';}};
  }
  window.SYKA_PAGE_REGISTRATION={render};
})();


/* src/pages/Profile.js */
(function(){
  const esc=v=>window.SYKA_UTILS.escapeHtml(v);
  const grades=[['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];
  async function render(root){const auth=window.SYKA_STATE.getState().auth;if(!auth.user){root.innerHTML=`<div class="auth-gate"><div class="auth-gate-card"><span class="eyebrow">ACCOUNT</span><h1>Profil Saya</h1><p>Masuk untuk mengelola identitas, sekolah, foto profil, dan rekam prestasi.</p><button class="btn btn-primary" id="profile-login">Masuk ke akun</button></div></div>`;document.getElementById('profile-login').onclick=()=>window.SYKA_APP.openAuth('login',{target:'/profile'});return;}
    const p=auth.profile||{};const name=p.full_name||auth.user.email?.split('@')[0]||'Pengguna';const avatar=p.avatar_url||'';const role=auth.roles.includes('admin')?'Admin':auth.roles.includes('organizer_member')?'Penyelenggara':auth.roles.includes('teacher')?'Guru':'Pelajar';
    root.innerHTML=`<div class="page-title profile-page-title"><div><span class="eyebrow">ACCOUNT</span><h1>Profil Saya</h1><p>Data identitas ini menjadi sumber profil untuk pendaftaran dan proof of achievement.</p></div><span class="status-pill status-success">${role}</span></div><div class="profile-grid"><aside class="profile-identity syka-card"><div class="avatar-xl" id="profile-avatar">${avatar?`<img src="${esc(avatar)}" alt="Foto profil">`:`<span>${window.SYKA_UTILS.initials(name)}</span>`}</div><div class="profile-identity-name"><h2>${esc(name)}</h2><p>@${esc(p.username||'user')}</p><span>${esc(auth.user.email||'')}</span></div><button class="btn btn-primary btn-block" id="change-avatar">Ubah foto profil</button><div class="profile-note"><b>Foto profil</b><span>PNG, JPG, JPEG, WebP · maksimal 5 MB</span></div><div class="profile-summary"><div><b>${esc(p.grade||'—')}</b><span>Kelas</span></div><div><b>${esc(p.institution||'—')}</b><span>Sekolah</span></div></div></aside><section class="profile-content"><form id="profile-form" class="syka-card form-card"><div class="form-section-title"><div><span class="eyebrow">IDENTITAS</span><h2>Data pribadi</h2></div><span class="form-required">* wajib</span></div><div class="form-grid-2"><label>Nama lengkap *<input id="pf-name" required value="${esc(p.full_name||'')}"></label><label>Username *<input id="pf-username" required pattern="[A-Za-z0-9._-]{3,30}" value="${esc(p.username||'')}"><small class="field-help">Akan disimpan lowercase.</small></label></div><div class="form-grid-2"><label>Tanggal lahir *<div class="date-control"><span>◷</span><input id="pf-birth" type="date" required value="${esc(p.birth_date||'')}"></div></label><label>Kelas *<select id="pf-grade" required>${grades.map(([v,l])=>`<option value="${v}" ${p.grade===v?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="form-section-title compact"><div><span class="eyebrow">PENDIDIKAN</span><h2>Sekolah & pembina</h2></div></div><div class="form-grid-2"><label>Sekolah *<input id="pf-school" required value="${esc(p.institution||'')}" placeholder="Mulai ketik nama sekolah"></label><label>Pembina / guru pendamping<input id="pf-guardian" value="${esc(p.guardian_name||'')}" placeholder="Opsional"></label></div><div id="school-suggest" class="suggest-list hidden"></div><label>Bio singkat<textarea id="pf-bio" rows="4" placeholder="Ceritakan sedikit tentang dirimu…">${esc(p.bio||'')}</textarea></label><div id="profile-feedback"></div><div class="form-actions"><button class="btn btn-primary" type="submit">Simpan perubahan</button></div></form><section class="profile-support-grid"><article class="syka-card support-card"><span class="support-icon">◈</span><div><strong>Rekam prestasi</strong><p>Awards dan certificate tetap mengikuti state dari backend.</p></div><a href="${window.SYKA_ROUTER.href('/prestasi')}">Lihat →</a></article><article class="syka-card support-card"><span class="support-icon">✓</span><div><strong>Verifikasi</strong><p>Certificate publik dapat diverifikasi dengan kode khusus.</p></div><a href="${window.SYKA_ROUTER.href('/verifikasi/demo')}">Cek →</a></article></section></section></div>`;
    document.getElementById('change-avatar').onclick=()=>window.SYKA_CLOUDINARY.openAvatarWidget(async info=>{try{const updated=await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,{avatar_url:info.secure_url,avatar_public_id:info.public_id,avatar_width:info.width||null,avatar_height:info.height||null,avatar_version:info.version?String(info.version):null,avatar_resource_type:info.resource_type||'image'});window.SYKA_STATE.patch('auth.profile',updated);document.getElementById('profile-avatar').innerHTML=`<img src="${esc(updated.avatar_url)}" alt="Foto profil">`;window.SYKA_TOAST.show('Foto profil berhasil diperbarui.','success');window.SYKA_HEADER.render();window.SYKA_SIDEBAR.render();}catch(error){window.SYKA_TOAST.show(error.message||'Upload foto gagal.','error');}});
    const school=document.getElementById('pf-school'),suggest=document.getElementById('school-suggest');let timer,selectedSchoolId=p.school_id||null;school.addEventListener('input',()=>{selectedSchoolId=null;clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(s=>`<button type="button" data-id="${esc(s.id)}" data-name="${esc(s.name)}"><b>${esc(s.name)}</b><small>${esc([s.city,s.province].filter(Boolean).join(' · '))}</small></button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;selectedSchoolId=b.dataset.id||null;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},220);});
    document.getElementById('profile-form').onsubmit=async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button[type="submit"]'),feedback=document.getElementById('profile-feedback');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Menyimpan…';try{const updated=await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,{full_name:document.getElementById('pf-name').value.trim(),username:document.getElementById('pf-username').value.trim().toLowerCase(),birth_date:document.getElementById('pf-birth').value||null,grade:document.getElementById('pf-grade').value,institution:document.getElementById('pf-school').value.trim().toUpperCase(),school_id:selectedSchoolId,guardian_name:document.getElementById('pf-guardian').value.trim()||null,bio:document.getElementById('pf-bio').value.trim()||null});window.SYKA_STATE.patch('auth.profile',updated);feedback.innerHTML='<div class="success-inline">Profil berhasil diperbarui.</div>';window.SYKA_HEADER.render();window.SYKA_SIDEBAR.render();}catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Profil gagal disimpan.')}</div>`;}finally{btn.disabled=false;btn.textContent='Simpan perubahan';}};
  }
  window.SYKA_PAGE_PROFILE={render};
})();


/* src/pages/Leaderboard.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml,fmt=window.SYKA_UTILS.formatNumber;
  function podium(r,rank,cls){const name=r?.name||r?.full_name||'Belum tersedia';return `<article class="podium-card ${cls}"><span class="podium-rank">${rank===1?'1ST':rank===2?'2ND':'3RD'}</span><div class="podium-avatar">${window.SYKA_UTILS.initials(name)}</div><strong>${esc(name)}</strong><small>${esc(r?.grade||'')}</small><b>${fmt(r?.xp||r?.total_xp||0)} XP</b></article>`;}
  async function render(root){root.innerHTML=`<section class="page-title"><span class="eyebrow">LEADERBOARD</span><h1>Juara & Peringkat</h1><p>Desain leaderboard sudah siap. Read model resmi akan diaktifkan bertahap sesuai season dan scope.</p></section><div class="coming-soon-banner"><div><b>Peringkat segera aktif</b><span>Source of truth tetap XP/competition result di Supabase.</span></div><span class="chip">COMING SOON</span></div><div id="podium" class="podium-grid"></div><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">TOP 4–50</span><h2>Daftar juara</h2></div><span class="chip">10 / halaman</span></div><div id="rank-list"></div><div id="rank-pagination" class="pagination"></div></section>`;try{const rows=await window.SYKA_LEADERBOARD_SERVICE.get({scope:'global',limit:50});if(!rows.length){document.getElementById('podium').innerHTML=[1,2,3].map((r,i)=>podium(null,r,['gold','silver','bronze'][i])).join('');document.getElementById('rank-list').innerHTML=window.SYKA_EMPTY.render({title:'Data leaderboard belum tersedia',text:'Tampilan juara siap digunakan ketika read model leaderboard sudah diaktifkan.'});return;}document.getElementById('podium').innerHTML=[1,2,3].map((r,i)=>podium(rows[i],r,['gold','silver','bronze'][i])).join('');const lower=rows.slice(3);let page=1;const per=10;const list=document.getElementById('rank-list'),pagination=document.getElementById('rank-pagination');const paint=()=>{const start=(page-1)*per;const chunk=lower.slice(start,start+per);list.innerHTML=chunk.map((r,i)=>`<div class="rank-row"><span class="rank-number">${start+i+4}</span><div class="rank-user"><div class="avatar-mini">${esc(window.SYKA_UTILS.initials(r.name||r.full_name||'U'))}</div><div><strong>${esc(r.name||r.full_name||'Peserta')}</strong><small>${esc(r.grade||'')}</small></div></div><b>${fmt(r.xp||r.total_xp||0)} XP</b></div>`).join('');const pages=Math.max(1,Math.ceil(lower.length/per));pagination.innerHTML=`<button class="page-btn" data-page="${page-1}" ${page===1?'disabled':''}>‹</button>${Array.from({length:pages},(_,i)=>`<button class="page-btn ${page===i+1?'active':''}" data-page="${i+1}">${i+1}</button>`).join('')}<button class="page-btn" data-page="${page+1}" ${page===pages?'disabled':''}>›</button>`;pagination.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=Number(b.dataset.page);paint();});};paint();}catch(error){document.getElementById('podium').innerHTML=[1,2,3].map((r,i)=>podium(null,r,['gold','silver','bronze'][i])).join('');document.getElementById('rank-list').innerHTML=window.SYKA_EMPTY.render({title:'Peringkat belum aktif',text:error.message||'Read model leaderboard belum tersedia.'});}}
  window.SYKA_PAGE_LEADERBOARD={render};
})();


/* src/pages/Awards.js */
(function(){async function render(root){const a=window.SYKA_STATE.getState().auth;if(!a.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk untuk melihat prestasi',text:'Awards pribadi bersifat private.',actionHtml:'<button class="btn btn-primary" id="award-login">Masuk</button>'});document.getElementById('award-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/prestasi'}));return;}root.innerHTML=`<section class="page-title"><span class="eyebrow">ACHIEVEMENTS</span><h1>Prestasi Saya</h1><p>Awards dan proof of achievement tersimpan di akunmu.</p></section><div id="awards" class="award-grid"></div>`;try{const rows=await window.SYKA_AWARD_SERVICE.getAwards(a.user.id);document.getElementById('awards').innerHTML=rows.length?rows.map(r=>`<article class="award-card syka-card"><span class="award-medal">✦</span><div><span class="chip">${window.SYKA_UTILS.escapeHtml(r.rank_code||'ACHIEVEMENT')}</span><h3>${window.SYKA_UTILS.escapeHtml(r.title||'Achievement')}</h3><p>${Number(r.points||0).toLocaleString('id-ID')} points · ${window.SYKA_UTILS.formatDate(r.created_at||r.issued_at)}</p></div></article>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada prestasi',text:'Achievement akan muncul setelah result dan reward event difinalisasi backend.'});}catch(error){document.getElementById('awards').innerHTML=window.SYKA_EMPTY.render({title:'Prestasi belum dapat dimuat',text:error.message||'Coba lagi.'});}}
window.SYKA_PAGE_AWARDS={render};})();


/* src/pages/Orders.js */
(function(){async function render(root){const a=window.SYKA_STATE.getState().auth;if(!a.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk untuk melihat pesanan',text:'Riwayat order dan fulfillment terkait akunmu.',actionHtml:'<button class="btn btn-primary" id="order-login">Masuk</button>'});document.getElementById('order-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/pesanan'}));return;}root.innerHTML=`<section class="page-title"><span class="eyebrow">COMMERCE</span><h1>Pesanan Saya</h1><p>Status pembayaran dianggap final setelah webhook provider diverifikasi di backend.</p></section><div id="orders" class="stack-list"></div>`;try{const rows=await window.SYKA_ORDER_SERVICE.list(a.user.id);document.getElementById('orders').innerHTML=rows.length?rows.map(o=>`<article class="order-card syka-card"><div><span class="eyebrow">ORDER</span><h3>#${window.SYKA_UTILS.escapeHtml(String(o.id).slice(0,10))}</h3><small>Dibuat ${window.SYKA_UTILS.formatDateTime(o.created_at)}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(o.status)}">${window.SYKA_UTILS.escapeHtml(o.status||'DRAFT')}</span></article>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada pesanan',text:'Order akan muncul setelah fitur commerce digunakan.'});}catch(error){document.getElementById('orders').innerHTML=window.SYKA_EMPTY.render({title:'Pesanan belum dapat dimuat',text:error.message||'Coba lagi.'});}}
window.SYKA_PAGE_ORDERS={render};})();


/* src/pages/Store.js */
(function(){
  const esc=v=>window.SYKA_UTILS.escapeHtml(v);
  const money=(v,currency='IDR')=>new Intl.NumberFormat('id-ID',{style:'currency',currency,maximumFractionDigits:0}).format(Number(v)||0);
  const typeLabel={EDU_COIN_TOPUP:'Koin Edu',FEATURE_UNLOCK:'Fitur akun',DIGITAL_ITEM:'Item digital',DONATION:'Dukungan',PLAN:'Paket'};
  const audienceLabel={student:'Pelajar',teacher:'Guru',organizer:'Penyelenggara'};

  function currentAudience(){
    const roles=window.SYKA_STATE.getState().auth.roles||[];
    if(roles.includes('admin'))return 'Semua';
    if(roles.includes('organizer_member'))return 'Penyelenggara';
    if(roles.includes('teacher'))return 'Guru';
    return 'Pelajar';
  }

  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk untuk membuka Toko',text:'Beli Koin Edu, buka fitur khusus, dukung Sykabelajar, dan kelola pembelianmu dalam satu tempat.',actionHtml:'<button class="btn btn-primary" id="store-login">Masuk</button>'});
      document.getElementById('store-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/toko'}));
      return;
    }

    root.innerHTML=`
      <section class="store-hero">
        <div>
          <span class="eyebrow">SYKABELAJAR STORE</span>
          <h1>Fitur, Koin Edu, &amp; Dukungan</h1>
          <p>Semua pembelian dirancang modular agar bisa dipakai pelajar, guru, dan penyelenggara sesuai kebutuhan.</p>
        </div>
        <div class="store-audience"><span class="store-audience-dot"></span><strong>${esc(currentAudience())}</strong><small>katalog yang relevan untuk akunmu</small></div>
      </section>
      <div class="store-notice"><span class="support-icon">◈</span><div><strong>Belum ada pembayaran langsung di browser</strong><p>Pesanan dibuat sebagai draft dan baru dianggap lunas setelah provider payment terverifikasi melalui webhook backend.</p></div></div>
      <section class="store-section"><div class="section-head"><div><span class="eyebrow">CATALOG</span><h2>Yang bisa kamu gunakan</h2></div><a class="btn btn-ghost btn-sm" href="${window.SYKA_ROUTER.href('/pesanan')}">Pesanan saya →</a></div><div id="store-grid" class="store-grid"></div></section>
    `;

    try{
      const products=await window.SYKA_STORE_SERVICE.listProducts();
      const grid=document.getElementById('store-grid');
      grid.innerHTML=products.map(productCard).join('')||window.SYKA_EMPTY.render({title:'Belum ada produk',text:'Katalog sedang disiapkan oleh Sykabelajar.'});
      grid.querySelectorAll('[data-buy]').forEach(btn=>btn.addEventListener('click',()=>openBuy(products.find(p=>p.id===btn.dataset.buy))));
    }catch(error){
      document.getElementById('store-grid').innerHTML=window.SYKA_EMPTY.render({title:'Katalog belum dapat dimuat',text:error.message||'Coba lagi beberapa saat.'});
    }
  }

  function productCard(p){
    const benefit=(p.benefits||[])[0];
    const benefits=(p.benefits||[]).map(b=>{
      if(b.benefit_type==='EDU_COIN') return `<span>+${Number(b.quantity||0).toLocaleString('id-ID')} Koin Edu</span>`;
      if(b.benefit_type==='FEATURE') return `<span>${esc(b.benefit_key||'Fitur khusus')}${b.duration_days?` · ${b.duration_days} hari`:''}</span>`;
      if(b.benefit_type==='PLAN') return `<span>Paket ${esc(b.benefit_key||'')}</span>`;
      return `<span>Benefit khusus</span>`;
    }).join('');
    const donation=p.product_type==='DONATION';
    return `<article class="store-card ${p.is_featured?'featured':''}">
      <div class="store-card-top"><span class="store-icon">${donation?'♥':p.product_type==='EDU_COIN_TOPUP'?'✦':p.product_type==='FEATURE_UNLOCK'?'◈':'◆'}</span><span class="chip">${esc(typeLabel[p.product_type]||p.product_type)}</span></div>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.short_description||p.description||'')}</p>
      <div class="store-benefits">${benefits||'<span>Produk digital Sykabelajar</span>'}</div>
      <div class="store-card-bottom"><div><small>${donation?'Dukungan':'Mulai dari'}</small><strong>${money(p.price,p.currency)}</strong></div><button type="button" class="btn btn-primary" data-buy="${esc(p.id)}">${donation?'Dukung':'Beli'}</button></div>
    </article>`;
  }

  function openBuy(product){
    if(!product)return;
    const donation=product.product_type==='DONATION';
    window.SYKA_MODAL.open({title:donation?'Dukung Sykabelajar':'Konfirmasi pesanan',html:`<div class="purchase-modal"><div class="purchase-summary"><div class="store-icon">${donation?'♥':'✦'}</div><div><span class="eyebrow">${esc(typeLabel[product.product_type]||'PRODUK')}</span><h3>${esc(product.name)}</h3><p>${esc(product.short_description||'')}</p></div></div><div class="purchase-price"><span>Total</span><strong id="purchase-total">${money(product.price,product.currency)}</strong></div><label class="quantity-label">Jumlah<input id="purchase-qty" type="number" min="1" max="20" value="1"></label><div class="form-hint">Pesanan dibuat sebagai DRAFT. Pembayaran baru dianggap berhasil setelah provider memvalidasi webhook di backend.</div><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batalkan</button><button type="button" class="btn btn-primary" id="purchase-confirm">${donation?'Buat dukungan':'Buat pesanan'}</button></div></div>`,onOpen:body=>{
      body.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
      const qty=body.querySelector('#purchase-qty');const total=body.querySelector('#purchase-total');
      const recalc=()=>total.textContent=money((Number(qty.value)||1)*Number(product.price||0),product.currency);
      qty.addEventListener('input',recalc);
      body.querySelector('#purchase-confirm').onclick=async()=>{const btn=body.querySelector('#purchase-confirm');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Membuat…';try{const order=await window.SYKA_STORE_SERVICE.createProductOrder(product.id,Math.max(1,Math.min(20,Number(qty.value)||1)));window.SYKA_MODAL.close();window.SYKA_TOAST.show(`Pesanan #${String(order.id).slice(0,8)} dibuat.`, 'success');setTimeout(()=>window.SYKA_ROUTER.navigate('/pesanan'),250);}catch(error){btn.disabled=false;btn.textContent=donation?'Buat dukungan':'Buat pesanan';body.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message||'Pesanan gagal dibuat.')}</div>`);}};
    }});
  }

  window.SYKA_PAGE_STORE={render};
})();


/* src/pages/Verify.js */
(function(){
  async function render(root,code){
    root.innerHTML=`<section class="page-title"><span class="eyebrow">VERIFICATION</span><h1>Verifikasi Certificate</h1><p>Masukkan kode publik untuk memeriksa proof of achievement.</p></section><form id="verify-form" class="verify-search"><input id="verify-code" value="${window.SYKA_UTILS.escapeHtml(code||'')}" placeholder="Masukkan kode verifikasi"><button class="btn btn-primary">Verifikasi</button></form><div id="verify-result"></div>`;
    document.getElementById('verify-form').onsubmit=e=>{e.preventDefault();const value=document.getElementById('verify-code').value.trim();if(value)window.SYKA_ROUTER.navigate('/verifikasi/'+encodeURIComponent(value));};
    if(!code){document.getElementById('verify-result').innerHTML=window.SYKA_EMPTY.render({title:'Masukkan kode verifikasi',text:'Kode dapat diperoleh dari QR/halaman certificate publik.'});return;}
    try{const row=await window.SYKA_AWARD_SERVICE.verify(code);document.getElementById('verify-result').innerHTML=row?`<section class="verification-card syka-card"><div class="verification-icon">✓</div><span class="status-pill status-success">TERVERIFIKASI</span><h2>${window.SYKA_UTILS.escapeHtml(row.public_name||'Certificate')}</h2><p>Status ${window.SYKA_UTILS.escapeHtml(row.status||'PUBLISHED')} · kode ${window.SYKA_UTILS.escapeHtml(row.verification_code||code)}</p><small>Data private certificate tidak dibuka oleh public verification view.</small></section>`:window.SYKA_EMPTY.render({title:'Kode tidak ditemukan',text:'Periksa kembali kode verifikasi dan pastikan certificate sudah dipublikasikan.'});}
    catch(error){document.getElementById('verify-result').innerHTML=window.SYKA_EMPTY.render({title:'Verifikasi belum tersedia',text:error.message||'Read model verification belum dapat diakses.'});}
  }
  window.SYKA_PAGE_VERIFY={render};
})();


/* src/pages/Admin.js */
(function(){
  const svc=()=>window.SYKA_CONTROL_SERVICE;const esc=window.SYKA_UTILS.escapeHtml;const fmt=window.SYKA_UTILS.formatDateTime;const fn=window.SYKA_UTILS.formatNumber;
  const tabs=[['dashboard','Dashboard'],['users','Pengguna'],['competitions','Kompetisi'],['questions','Soal'],['twibbon','Twibbon'],['results','Hasil'],['certificates','Sertifikat'],['orders','Pesanan'],['moderation','Moderasi'],['plans','Paket'],['monetization','Monetisasi'],['settings','Pengaturan'],['audit','Audit']];
  const transitions={DRAFT:['PUBLISHED','SUSPENDED','CANCELLED'],PUBLISHED:['REGISTRATION_OPEN','SUSPENDED','CANCELLED'],REGISTRATION_OPEN:['REGISTRATION_CLOSED','SUSPENDED','CANCELLED'],REGISTRATION_CLOSED:['LIVE','SUSPENDED','CANCELLED'],LIVE:['SUBMISSION_CLOSED','SUSPENDED','CANCELLED'],SUBMISSION_CLOSED:['GRADING','SUSPENDED','CANCELLED'],GRADING:['RESULT_PUBLISHED','SUSPENDED'],RESULT_PUBLISHED:['ARCHIVED','SUSPENDED'],SUSPENDED:['DRAFT','PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','CANCELLED']};
  function shell(tab,title,subtitle){return `<div class="control-head"><div><span class="eyebrow">ADMIN CONTROL PLANE</span><h1>${title}</h1><p>${subtitle}</p></div><div class="control-head-meta"><span class="security-badge">RLS · server authoritative</span></div></div><div class="control-tabs">${tabs.map(([k,l])=>`<button type="button" class="control-tab ${k===tab?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div><div id="control-content"></div>`;}
  async function render(root){const auth=window.SYKA_STATE.getState().auth;if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Panel admin hanya dapat diakses oleh administrator.',actionHtml:'<button class="btn btn-primary" id="admin-login">Masuk</button>'});document.getElementById('admin-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/admin'}));return;}if(!auth.roles.includes('admin')){root.innerHTML=window.SYKA_EMPTY.render({title:'Akses ditolak',text:'Akun ini belum memiliki role admin.',icon:'⊘'});return;}const q=window.SYKA_STATE.getState().route.query;const tab=tabs.some(([k])=>k===q.tab)?q.tab:'dashboard';root.innerHTML=shell(tab,'Panel Admin','Kelola platform, moderasi, kompetisi, transaksi, feature flags, dan audit dari satu control plane.');root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/admin',{tab:b.dataset.tab}));try{await renderTab(document.getElementById('control-content'),tab);}catch(error){document.getElementById('control-content').innerHTML=window.SYKA_EMPTY.render({title:'Modul gagal dimuat',text:error.message||'Periksa migration/RLS dan coba lagi.',actionHtml:'<button class="btn btn-ghost" id="cp-retry">Coba lagi</button>'});document.getElementById('cp-retry')?.addEventListener('click',()=>render(root));}}
  async function renderTab(root,tab){const map={dashboard,users,competitions,questions,twibbon,results,certificates,orders,moderation,plans,monetization,settings,audit};return map[tab]?.(root);}
  async function dashboard(root){const [stats,comps,users,audit,slides]=await Promise.all([svc().platformStats(),svc().listCompetitionsAdmin({limit:200}),svc().listUsers({limit:300}),svc().listAudit({limit:8}),svc().listSlides({admin:true})]);root.innerHTML=`<div class="kpi-grid"><div class="kpi-card"><span>Siswa</span><strong>${fn(stats.total_students)}</strong><small>akun aktif</small></div><div class="kpi-card"><span>Sekolah</span><strong>${fn(stats.total_schools)}</strong><small>institusi terdaftar</small></div><div class="kpi-card"><span>Penerima prestasi</span><strong>${fn(stats.total_award_recipients)}</strong><small>awards publik</small></div><div class="kpi-card"><span>Juara</span><strong>${fn(stats.total_champions)}</strong><small>peraih posisi 1</small></div></div><div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">PLATFORM</span><h2>Ringkasan operasional</h2></div><span class="live-dot">LIVE</span></div><div class="metric-grid"><div><b>${comps.length}</b><span>Kompetisi</span></div><div><b>${users.length}</b><span>Pengguna</span></div><div><b>${slides.length}</b><span>Promo slide</span></div><div><b>${audit.length}</b><span>Audit terbaru</span></div></div></section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">AUDIT</span><h2>Aktivitas terakhir</h2></div></div>${audit.length?audit.map(a=>`<div class="activity-row"><div class="activity-icon">↗</div><div><strong>${esc(a.action)}</strong><small>${esc(a.entity_type)} · ${esc(a.entity_id||'')}</small></div><time>${fmt(a.created_at)}</time></div>`).join(''):window.SYKA_EMPTY.render({title:'Audit masih kosong',text:'Mutation privileged akan muncul di sini.'})}</section></div><section class="panel-card admin-section"><div class="panel-head"><div><span class="eyebrow">HOME PROMO</span><h2>Hero slides</h2></div><button class="btn btn-primary btn-sm" id="quick-slide">+ Tambah slide</button></div><div class="mini-list">${slides.slice(0,5).map(s=>`<div class="mini-list-row"><div class="media-thumb">${s.image_url?`<img src="${esc(s.image_url)}" alt="">`:'✦'}</div><div><strong>${esc(s.title)}</strong><small>${esc(s.subtitle||'—')}</small></div><span class="status-pill ${s.is_active?'status-success':'status-neutral'}">${s.is_active?'Aktif':'Draft'}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada slide',text:'Tambahkan banner promosi dari menu Kompetisi/Settings.'})}</div></section>`;document.getElementById('quick-slide').onclick=()=>slideModal();}
  async function users(root){const rows=await svc().listUsers({limit:250});root.innerHTML=`<div class="toolbar"><div><h2>Pengguna</h2><p>${rows.length} akun ditemukan.</p></div><input class="control-search" id="user-search" placeholder="Cari nama, username, sekolah…"></div><div class="data-table" id="user-table">${rows.map(u=>`<div class="data-row"><div class="row-main"><div class="avatar-mini">${u.avatar_url?`<img src="${esc(u.avatar_url)}" alt="">`:esc(window.SYKA_UTILS.initials(u.full_name))}</div><div><strong>${esc(u.full_name||u.username||'Tanpa nama')}</strong><small>@${esc(u.username||'—')} · ${esc(u.institution||'—')} · ${esc(u.grade||'—')}</small><div class="chip-row">${u.roles.map(r=>`<span class="chip">${esc(r.role)}</span>`).join('')}<span class="status-pill ${window.SYKA_UTILS.statusClass(u.status)}">${esc(u.status)}</span></div></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-user-status="${u.id}" data-status="${u.status==='ACTIVE'?'SUSPENDED':'ACTIVE'}">${u.status==='ACTIVE'?'Suspend':'Aktifkan'}</button><button class="btn btn-secondary btn-sm" data-user-role="${u.id}">Role</button></div></div>`).join('')}</div>`;document.getElementById('user-search').oninput=e=>{const q=e.target.value.toLowerCase();root.querySelectorAll('.data-row').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'flex':'none');};root.querySelectorAll('[data-user-status]').forEach(b=>b.onclick=async()=>{try{await svc().setUserStatus(b.dataset.userStatus,b.dataset.status,'Perubahan admin');window.SYKA_TOAST.show('Status pengguna diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});root.querySelectorAll('[data-user-role]').forEach(b=>roleModal(b.dataset.userRole));}
  function roleModal(userId){window.SYKA_MODAL.open({title:'Kelola role pengguna',html:`<form id="role-form" class="form-card"><label>Role<select id="role"><option value="student">Pelajar</option><option value="teacher">Guru</option><option value="organizer_member">Penyelenggara</option><option value="admin">Admin</option></select></label><label class="checkline"><input id="active" type="checkbox" checked> Role aktif</label><label>Alasan<textarea id="reason" rows="3" placeholder="Alasan perubahan role"></textarea></label><button class="btn btn-primary">Simpan</button><div id="role-feedback"></div></form>`,onOpen:body=>body.querySelector('#role-form').onsubmit=async e=>{e.preventDefault();try{await svc().setUserRole(userId,body.querySelector('#role').value,body.querySelector('#active').checked,body.querySelector('#reason').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Role diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(error){body.querySelector('#role-feedback').innerHTML=`<div class="inline-error">${esc(error.message)}</div>`;}}});}
  async function competitions(root){const rows=await svc().listCompetitionsAdmin({limit:250});root.innerHTML=`<div class="toolbar"><div><h2>Kompetisi</h2><p>CRUD dan state machine server-authoritative.</p></div><button class="btn btn-primary" id="new-comp">+ Kompetisi</button></div><div class="filter-line"><input class="control-search" id="comp-search" placeholder="Cari kompetisi…"><select class="compact-select" id="comp-status"><option value="">Semua status</option>${['DRAFT','PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','ARCHIVED','SUSPENDED','CANCELLED'].map(s=>`<option>${s}</option>`).join('')}</select></div><div class="data-table" id="comp-table">${rows.map(c=>competitionRow(c)).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama untuk mulai menggunakan control plane.'})}</div>`;document.getElementById('new-comp').onclick=()=>competitionModal();const filter=()=>{const q=document.getElementById('comp-search').value.toLowerCase();const s=document.getElementById('comp-status').value;root.querySelectorAll('.data-row[data-comp-row]').forEach(r=>r.style.display=(!q||r.innerText.toLowerCase().includes(q))&&(!s||r.dataset.status===s)?'flex':'none');};document.getElementById('comp-search').oninput=filter;document.getElementById('comp-status').onchange=filter;bindCompetitionRows(root,rows);}
  function competitionRow(c){return `<div class="data-row" data-comp-row data-status="${esc(c.status)}"><div><div class="row-title"><strong>${esc(c.title)}</strong><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span></div><small>${esc(c.category)} · ${esc(c.slug)} · ${esc(c.visibility)}</small><div class="chip-row"><span class="chip">Registrasi ${fmt(c.registration_starts_at)} → ${fmt(c.registration_ends_at)}</span><span class="chip">Live ${fmt(c.starts_at)}</span></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button><button class="btn btn-secondary btn-sm" data-config="${c.id}">Config</button><button class="btn btn-primary btn-sm" data-transition="${c.id}">Transisi</button></div></div>`;}
  function bindCompetitionRows(root,rows){root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>competitionModal(rows.find(x=>x.id===b.dataset.edit)));root.querySelectorAll('[data-config]').forEach(b=>b.onclick=()=>competitionConfigModal(rows.find(x=>x.id===b.dataset.config)));root.querySelectorAll('[data-transition]').forEach(b=>b.onclick=()=>transitionModal(rows.find(x=>x.id===b.dataset.transition)));}
  function dateField(id,label,value,required=false){return `<label>${label}${required?' *':''}<div class="date-control"><span>◷</span><input id="${id}" type="datetime-local" ${required?'required':''} value="${window.SYKA_UTILS.escapeHtml(window.SYKA_UTILS.toLocalInputValue(value))}"></div></label>`;}
  async function competitionModal(current=null){const organizers=await svc().listOrganizers().catch(()=>[]);const p=current||{};window.SYKA_MODAL.open({title:current?'Edit kompetisi':'Buat kompetisi baru',wide:true,html:`<form id="comp-form" class="form-card"><div class="form-section-title"><div><span class="eyebrow">BASIC INFO</span><h2>${current?'Edit':'Buat'} kompetisi</h2></div><span class="form-required">* wajib</span></div><div class="form-grid-2"><label>Judul *<input id="title" required value="${esc(p.title||'')}"></label><label>Slug *<input id="slug" required value="${esc(p.slug||'')}"><small class="field-help">Contoh: olimpiade-sains-2026</small></label></div><div class="form-grid-2"><label>Kategori<input id="category" value="${esc(p.category||'Kompetisi')}"></label><label>Visibility<select id="visibility"><option ${p.visibility==='PUBLIC'?'selected':''}>PUBLIC</option><option ${p.visibility==='UNLISTED'?'selected':''}>UNLISTED</option><option ${p.visibility==='PRIVATE'?'selected':''}>PRIVATE</option></select></label></div><label>Deskripsi singkat<textarea id="short" rows="3">${esc(p.short_description||'')}</textarea></label><label>Poster URL<input id="poster" type="url" value="${esc(p.poster_url||'')}" placeholder="https://res.cloudinary.com/…"></label>${!current?`<label>Organizer *<select id="organizer_id" required>${organizers.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></label>`:''}<div class="form-section-title compact"><div><span class="eyebrow">TIMELINE</span><h2>Tanggal & jam</h2></div></div><div class="form-grid-2">${dateField('registration_start','Pendaftaran mulai',p.registration_starts_at,true)}${dateField('registration_end','Pendaftaran berakhir',p.registration_ends_at,true)}</div><div class="form-grid-2">${dateField('start_at','Kompetisi mulai',p.starts_at,true)}${dateField('end_at','Kompetisi berakhir',p.ends_at,true)}</div>${dateField('announcement_at','Pengumuman hasil',p.announcement_at,false)}<div id="comp-feedback"></div><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">${current?'Simpan perubahan':'Buat kompetisi'}</button></div></form>`,onOpen:body=>{body.querySelector('#comp-form').onsubmit=async e=>{e.preventDefault();const feedback=body.querySelector('#comp-feedback');const payload={title:body.querySelector('#title').value.trim(),slug:body.querySelector('#slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,''),category:body.querySelector('#category').value.trim()||'Kompetisi',short_description:body.querySelector('#short').value.trim()||null,visibility:body.querySelector('#visibility').value,poster_url:body.querySelector('#poster').value.trim()||null,registration_starts_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#registration_start').value),registration_ends_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#registration_end').value),starts_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#start_at').value),ends_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#end_at').value),announcement_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#announcement_at').value)};if(!current)payload.organizer_id=body.querySelector('#organizer_id')?.value||null;try{await svc().saveCompetition(payload,current?.id||null);window.SYKA_MODAL.close();window.SYKA_TOAST.show(current?'Kompetisi diperbarui.':'Kompetisi dibuat sebagai DRAFT.','success');window.SYKA_ROUTER.refresh();}catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Gagal menyimpan kompetisi.')}</div>`;}};}});}
  function competitionConfigModal(c){window.SYKA_MODAL.open({title:'Konfigurasi kompetisi',wide:true,html:`<div class="config-grid"><button class="config-card" id="cfg-level"><span>◫</span><strong>Jenjang & kelas</strong><small>Atur level, allowed grades, points.</small></button><button class="config-card" id="cfg-rules"><span>◌</span><strong>Aturan pendaftaran</strong><small>Twibbon, social proof, quota.</small></button><button class="config-card" id="cfg-reward"><span>✦</span><strong>Reward</strong><small>Juara, poin, emblem, sertifikat.</small></button></div>`,onOpen:body=>{body.querySelector('#cfg-level').onclick=()=>levelModal(c.id);body.querySelector('#cfg-rules').onclick=()=>rulesModal(c.id);body.querySelector('#cfg-reward').onclick=()=>rewardModal(c.id);}});}
  async function levelModal(compId){const rows=await svc().listLevels(compId);window.SYKA_MODAL.open({title:'Jenjang kompetisi',wide:true,html:`<div class="modal-toolbar"><button class="btn btn-primary btn-sm" id="new-level">+ Level</button></div><div class="stack-list">${rows.map(r=>`<div class="list-card"><strong>${esc(r.label)}</strong><small>${esc(r.code)} · ${esc((r.allowed_grades||[]).join(', '))}</small><span>${r.points} pts</span></div>`).join('')||'<div class="empty-inline">Belum ada level.</div>'}</div>`,onOpen:body=>body.querySelector('#new-level').onclick=()=>{window.SYKA_MODAL.open({title:'Tambah level',html:`<form id="lf" class="form-card"><label>Kode<input id="code" required placeholder="SD6"></label><label>Label<input id="label" required placeholder="Kelas 6 SD"></label><label>Allowed grades<textarea id="grades">SD6</textarea></label><label>Points<input id="points" type="number" value="0"></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#lf').onsubmit=async e=>{e.preventDefault();try{await svc().saveLevel({competition_id:compId,code:b.querySelector('#code').value.trim(),label:b.querySelector('#label').value.trim(),allowed_grades:b.querySelector('#grades').value.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean),points:Number(b.querySelector('#points').value||0),config:{} });window.SYKA_MODAL.close();window.SYKA_TOAST.show('Level tersimpan.','success');levelModal(compId);}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}});}
  async function rulesModal(compId){const r=await svc().getRegistrationRules(compId)||{};window.SYKA_MODAL.open({title:'Aturan pendaftaran',wide:false,html:`<form id="rf" class="form-card"><label>Allowed grades<textarea id="grades">${esc((r.allowed_grades||[]).join('\n'))}</textarea></label><label class="checkline"><input id="twibbon" type="checkbox" ${r.require_twibbon?'checked':''}> Wajib twibbon</label><label class="checkline"><input id="social" type="checkbox" ${r.require_social_proof?'checked':''}> Wajib social proof</label><label>Maximum peserta<input id="max" type="number" min="1" value="${r.max_participants||''}"></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#rf').onsubmit=async e=>{e.preventDefault();try{await svc().saveRegistrationRules({allowed_grades:b.querySelector('#grades').value.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean),require_twibbon:b.querySelector('#twibbon').checked,require_social_proof:b.querySelector('#social').checked,max_participants:b.querySelector('#max').value?Number(b.querySelector('#max').value):null,config:{}},compId);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Aturan tersimpan.','success');}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  async function rewardModal(compId){
    const rows=await svc().listRewards(compId);
    const listHtml=rows.length?rows.map(r=>`<div class="list-card"><strong>${esc(r.rank_code)}</strong><small>${esc(r.title||'Reward')}</small><span>${r.points} pts</span></div>`).join(''):'<div class="empty-inline">Belum ada reward.</div>';
    window.SYKA_MODAL.open({
      title:'Reward kompetisi',
      wide:true,
      html:`<div class="modal-toolbar"><button class="btn btn-primary btn-sm" id="new-reward">+ Reward</button></div><div class="stack-list">${listHtml}</div>`,
      onOpen:body=>{
        body.querySelector('#new-reward').onclick=()=>{
          window.SYKA_MODAL.open({
            title:'Tambah reward',
            html:`<form id="rewf" class="form-card"><label>Rank code<input id="rank" required placeholder="1ST"></label><label>Title<input id="title" required placeholder="Juara 1"></label><label>Points<input id="points" type="number" value="0"></label><label>Emblem name<input id="emblem"></label><label class="checkline"><input id="cert" type="checkbox" checked> Certificate</label><button class="btn btn-primary">Simpan</button></form>`,
            onOpen:b=>{
              b.querySelector('#rewf').onsubmit=async e=>{
                e.preventDefault();
                try{
                  await svc().saveReward({
                    competition_id:compId,
                    rank_code:b.querySelector('#rank').value.trim(),
                    title:b.querySelector('#title').value.trim(),
                    points:Number(b.querySelector('#points').value||0),
                    emblem_name:b.querySelector('#emblem').value.trim()||null,
                    certificate_enabled:b.querySelector('#cert').checked,
                    config:{}
                  });
                  window.SYKA_MODAL.close();
                  window.SYKA_TOAST.show('Reward tersimpan.','success');
                  rewardModal(compId);
                }catch(error){
                  b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);
                }
              };
            }
          });
        };
      }
    });
  }
  async function questions(root){const banks=await svc().listQuestionBanks();root.innerHTML=`<div class="toolbar"><div><h2>Question Builder</h2><p>Bank soal, moderation, answer key—tetap dibatasi RLS.</p></div><button class="btn btn-primary" id="new-bank">+ Bank soal</button></div><div class="data-table">${banks.map(b=>`<div class="data-row"><div><strong>${esc(b.name)}</strong><small>${esc(b.description||'—')}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(b.status||'DRAFT')}">${esc(b.status||'DRAFT')}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada bank soal',text:'Buat bank soal untuk mulai menyusun question set.'})}</div>`;document.getElementById('new-bank').onclick=()=>window.SYKA_MODAL.open({title:'Bank soal baru',html:`<form id="bf" class="form-card"><label>Nama bank soal<input id="name" required></label><label>Deskripsi<textarea id="desc"></textarea></label><label>Status<select id="status"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#bf').onsubmit=async e=>{e.preventDefault();try{await svc().saveQuestionBank({name:b.querySelector('#name').value.trim(),description:b.querySelector('#desc').value.trim()||null,status:b.querySelector('#status').value,config:{}});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Bank soal dibuat.','success');window.SYKA_ROUTER.refresh();}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  async function twibbon(root){const rows=await svc().listTwibbonTemplates();root.innerHTML=`<div class="toolbar"><div><h2>Twibbon</h2><p>Template promosi yang dipakai kompetisi.</p></div><button class="btn btn-primary" id="new-tw">+ Template</button></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.name)}</strong><small>${esc(r.competition_id||'Global')} · ${r.image_url?'Asset tersedia':'Belum ada asset'}</small></div><div class="chip-row"><span class="chip">${r.is_required?'Wajib':'Opsional'}</span><span class="chip">${r.is_active?'Aktif':'Nonaktif'}</span></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada template',text:'Tambahkan template twibbon dari sini.'})}</div>`;document.getElementById('new-tw').onclick=()=>slideOrTwibbonModal();}
  function slideOrTwibbonModal(){window.SYKA_MODAL.open({title:'Twibbon template',html:`<form id="twf" class="form-card"><label>Organizer ID<input id="oid" placeholder="UUID organizer"></label><label>Competition ID<input id="cid" placeholder="UUID competition"></label><label>Nama template<input id="name" required></label><label>Image URL<input id="url" type="url"></label><label>Public ID<input id="pid"></label><label class="checkline"><input id="req" type="checkbox"> Wajib</label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#twf').onsubmit=async e=>{e.preventDefault();try{await svc().saveTwibbonTemplate({organizer_id:b.querySelector('#oid').value.trim()||null,competition_id:b.querySelector('#cid').value.trim()||null,name:b.querySelector('#name').value.trim(),image_url:b.querySelector('#url').value.trim()||null,public_id:b.querySelector('#pid').value.trim()||null,is_required:b.querySelector('#req').checked,is_active:true,config:{}});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Template disimpan.','success');window.SYKA_ROUTER.refresh();}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  async function results(root){const rows=await svc().listAttempts({status:'FINALIZED'});root.innerHTML=`<div class="toolbar"><div><h2>Hasil</h2><p>Attempt final siap ditinjau dan dipakai untuk award event.</p></div></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.profiles?.full_name||r.participant_id)}</strong><small>${esc(r.competitions?.title||'')} · ${fmt(r.finalized_at)}</small></div><strong>${Number(r.score||0).toLocaleString('id-ID')} pts</strong></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada hasil final',text:'Finalized attempts akan muncul di sini.'})}</div>`;}
  async function certificates(root){const rows=await svc().listCertificates();root.innerHTML=`<div class="toolbar"><div><h2>Sertifikat</h2><p>Lifecycle: Generated → Review → Approved → Published → Revoked.</p></div></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.user_id)}</strong><small>${esc(r.competition_id||'')} · revisi ${r.current_revision}</small></div><div class="row-actions">${['GENERATED','REVIEW','APPROVED','PUBLISHED','REVOKED'].map(s=>`<button class="btn btn-ghost btn-xs" data-cert="${r.id}" data-status="${s}">${s}</button>`).join('')}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada sertifikat',text:'Sertifikat akan muncul setelah award/hasil diproses.'})}</div>`;root.querySelectorAll('[data-cert]').forEach(b=>b.onclick=async()=>{try{await svc().updateCertificate(b.dataset.cert,b.dataset.status);window.SYKA_TOAST.show('Status sertifikat diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});}
  async function orders(root){const rows=await svc().listOrders({});root.innerHTML=`<div class="toolbar"><div><h2>Pesanan</h2><p>Payment status dianggap final setelah webhook provider.</p></div></div><div class="data-table">${rows.map(o=>`<div class="data-row"><div><strong>#${esc(String(o.id).slice(0,8))}</strong><small>${esc(o.user_id)} · ${fmt(o.created_at)}</small></div><div class="row-actions"><span class="status-pill ${window.SYKA_UTILS.statusClass(o.status)}">${esc(o.status||'DRAFT')}</span><select class="compact-select" data-order="${o.id}">${['DRAFT','PENDING_PAYMENT','PAID','PROCESSING','SHIPPED','COMPLETED','REFUNDED','CANCELLED'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada order',text:'Order peserta akan masuk di sini saat commerce aktif.'})}</div>`;root.querySelectorAll('[data-order]').forEach(s=>s.onchange=async()=>{try{await svc().updateOrder(s.dataset.order,s.value);window.SYKA_TOAST.show('Pesanan diperbarui.','success');}catch(error){window.SYKA_TOAST.show(error.message,'error');}});}
  async function moderation(root){const m=await svc().listModeration();root.innerHTML=`<div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">POSTS</span><h2>Moderasi posting</h2></div></div>${m.posts.map(p=>`<div class="data-row compact"><div><strong>${esc(p.title||'Untitled')}</strong><small>${fmt(p.created_at)}</small></div><select class="compact-select" data-post="${p.id}">${['PUBLISHED','HIDDEN','ARCHIVED'].map(s=>`<option ${s===p.status?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||'<p class="muted">Tidak ada post.</p>'}</section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">COMMENTS</span><h2>Moderasi komentar</h2></div></div>${m.comments.map(c=>`<div class="data-row compact"><div><strong>${esc(c.body).slice(0,90)}</strong><small>${fmt(c.created_at)}</small></div><select class="compact-select" data-comment="${c.id}">${['PUBLISHED','HIDDEN','QUARANTINED'].map(s=>`<option ${s===c.moderation_state?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||'<p class="muted">Tidak ada komentar.</p>'}</section></div>`;root.querySelectorAll('[data-post]').forEach(s=>s.onchange=async()=>{try{await svc().moderatePost(s.dataset.post,s.value);window.SYKA_TOAST.show('Post dimoderasi.','success');}catch(error){window.SYKA_TOAST.show(error.message,'error');}});root.querySelectorAll('[data-comment]').forEach(s=>s.onchange=async()=>{try{await svc().moderateComment(s.dataset.comment,s.value);window.SYKA_TOAST.show('Komentar dimoderasi.','success');}catch(error){window.SYKA_TOAST.show(error.message,'error');}});}
  const PLAN_FEATURES=[
    {key:'competition_create',label:'Buat kompetisi',help:'Jumlah kompetisi yang dapat dibuat',kind:'limit',defaultLimit:1},
    {key:'participant_limit',label:'Batas peserta',help:'Maksimum peserta per kompetisi',kind:'limit',defaultLimit:50},
    {key:'question_bank',label:'Bank soal',help:'Jumlah bank soal yang dapat dikelola',kind:'limit',defaultLimit:1},
    {key:'question_limit',label:'Batas soal',help:'Maksimum soal yang tersedia',kind:'limit',defaultLimit:100},
    {key:'manual_grading',label:'Penilaian manual',help:'Essay / file dapat dinilai manual',kind:'toggle'},
    {key:'certificate',label:'Sertifikat',help:'Generate dan publish certificate',kind:'toggle'},
    {key:'twibbon',label:'Twibbon',help:'Template dan review twibbon',kind:'toggle'},
    {key:'analytics',label:'Analytics',help:'Insight kompetisi dan peserta',kind:'toggle'},
    {key:'advanced_reports',label:'Laporan lanjutan',help:'Export dan laporan operasional lebih lengkap',kind:'toggle'},
    {key:'bulk_notification',label:'Notifikasi massal',help:'Kirim pengumuman ke banyak peserta',kind:'toggle'},
    {key:'custom_branding',label:'Branding khusus',help:'Logo, warna, dan identitas organizer',kind:'toggle'},
    {key:'priority_support',label:'Priority support',help:'Dukungan prioritas',kind:'toggle'}
  ];
  async function plans(root){
    const [catalog,ents]=await Promise.all([svc().listPlanCatalog(),svc().listEntitlements()]);
    const fallback={FREE:{name:'Free',badge:'Mulai',description:'Untuk penyelenggara yang baru mulai.',monthly_price:0,yearly_price:0,is_active:true},PREMIUM:{name:'Premium',badge:'Populer',description:'Untuk penyelenggara aktif.',monthly_price:149000,yearly_price:1490000,is_active:true},PRO:{name:'Pro',badge:'Paling lengkap',description:'Untuk organizer skala besar.',monthly_price:349000,yearly_price:3490000,is_active:true}};
    const byCode=Object.fromEntries((catalog||[]).map(p=>[p.plan_code,p]));
    const entitlementByPlan={};(ents||[]).forEach(e=>((entitlementByPlan[e.plan_code]??=[]).push(e)));
    let selected='PREMIUM';
    const planCard=(code)=>{const p=byCode[code]||{plan_code:code,...fallback[code]};const count=(entitlementByPlan[code]||[]).length;return `<button type="button" class="plan-preset-card ${selected===code?'selected':''}" data-plan-preset="${code}"><div class="plan-preset-top"><span class="plan-badge ${code.toLowerCase()}">${esc(p.badge||code)}</span><span class="chip">${p.is_active?'AKTIF':'NONAKTIF'}</span></div><h3>${esc(p.name||code)}</h3><p>${esc(p.description||'')}</p><strong>${p.monthly_price?money(p.monthly_price)+'/bulan':'Gratis'}</strong><small>${count} capability aktif</small></button>`;};
    const renderEditor=()=>{const p=byCode[selected]||{plan_code:selected,...fallback[selected]};const current=Object.fromEntries((entitlementByPlan[selected]||[]).map(e=>[e.capability,e]));const cards=PLAN_FEATURES.map(f=>{const e=current[f.key];const checked=!!e;return `<label class="plan-feature-row"><span class="check-wrap"><input type="checkbox" data-cap="${f.key}" ${checked?'checked':''}></span><span class="plan-feature-copy"><strong>${esc(f.label)}</strong><small>${esc(f.help)}</small></span>${f.kind==='limit'?`<span class="plan-limit"><input type="number" min="0" step="1" data-limit="${f.key}" value="${e?.limit_value??f.defaultLimit??''}" ${checked?'':'disabled'} placeholder="∞"></span>`:`<span class="plan-enabled-dot">${checked?'ON':'OFF'}</span>`}</label>`}).join('');const editor=document.getElementById('plan-editor');editor.innerHTML=`<div class="plan-editor-head"><div><span class="eyebrow">PLAN BUILDER</span><h2>${esc(p.name||selected)}</h2><p>Pilih kemampuan dengan checkbox. Limit hanya perlu diisi pada fitur kuota.</p></div><div class="plan-editor-price"><label>Harga / bulan<input id="plan-monthly" type="number" min="0" value="${Number(p.monthly_price)||0}"></label><label>Harga / tahun<input id="plan-yearly" type="number" min="0" value="${Number(p.yearly_price)||0}"></label></div></div><div class="form-grid-2 plan-meta-grid"><label>Nama paket<input id="plan-name" value="${esc(p.name||selected)}"></label><label>Badge<input id="plan-badge" value="${esc(p.badge||'')}"></label><label class="span-2">Deskripsi<textarea id="plan-description" rows="2">${esc(p.description||'')}</textarea></label></div><div class="plan-feature-list">${cards}</div><div class="plan-editor-actions"><label class="switch-line"><input id="plan-active" type="checkbox" ${p.is_active!==false?'checked':''}><span>Plan aktif dan boleh dipakai</span></label><button class="btn btn-primary" id="save-plan-bundle">Simpan paket ${esc(selected)}</button></div>`;editor.querySelectorAll('[data-cap]').forEach(cb=>cb.onchange=()=>{const limit=editor.querySelector(`[data-limit="${cb.dataset.cap}"]`);if(limit)limit.disabled=!cb.checked;});editor.querySelector('#save-plan-bundle').onclick=async()=>{const ent=PLAN_FEATURES.flatMap(f=>{const cb=editor.querySelector(`[data-cap="${f.key}"]`);if(!cb?.checked)return[];const limitEl=editor.querySelector(`[data-limit="${f.key}"]`);return[{capability:f.key,limit_value:f.kind==='limit'?(limitEl.value===''?null:Number(limitEl.value)):1,config:{}}];});const btn=editor.querySelector('#save-plan-bundle');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Menyimpan…';try{await svc().savePlanBundle({plan_code:selected,name:editor.querySelector('#plan-name').value.trim(),badge:editor.querySelector('#plan-badge').value.trim(),description:editor.querySelector('#plan-description').value.trim(),monthly_price:editor.querySelector('#plan-monthly').value,yearly_price:editor.querySelector('#plan-yearly').value,is_active:editor.querySelector('#plan-active').checked,entitlements:ent});window.SYKA_TOAST.show(`Paket ${selected} berhasil diperbarui.`,'success');window.SYKA_ROUTER.refresh();}catch(error){window.SYKA_TOAST.show(error.message||'Paket gagal disimpan.','error');btn.disabled=false;btn.textContent=`Simpan paket ${selected}`;}};};
    root.innerHTML=`<div class="plans-page"><div class="toolbar"><div><h2>Paket Penyelenggara</h2><p>Kelola Free, Premium, dan Pro tanpa mengetik capability satu per satu.</p></div></div><div class="plan-preset-grid">${['FREE','PREMIUM','PRO'].map(planCard).join('')}</div><section class="panel-card plan-builder-card" id="plan-editor"></section><section class="panel-card plan-guide"><div class="panel-head"><div><span class="eyebrow">CARA KERJA</span><h3>Capability yang mudah dipahami</h3></div></div><div class="guide-grid">${PLAN_FEATURES.map(f=>`<div><strong>${esc(f.label)}</strong><small>${esc(f.help)}</small></div>`).join('')}</div></section></div>`;
    root.querySelectorAll('[data-plan-preset]').forEach(b=>b.onclick=()=>{selected=b.dataset.planPreset;root.querySelectorAll('[data-plan-preset]').forEach(x=>x.classList.toggle('selected',x===b));renderEditor();});
    renderEditor();
  }
  function money(v){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);}
  async function monetization(root){
    const products=await svc().listCommerceProducts({admin:true});
    const benefits={};
    await Promise.all(products.map(async p=>{benefits[p.id]=await svc().listCommerceBenefits(p.id);}));
    const audienceLabels={student:'Pelajar',teacher:'Guru',organizer:'Penyelenggara'};
    const typeLabels={EDU_COIN_TOPUP:'Koin Edu',FEATURE_UNLOCK:'Fitur',DIGITAL_ITEM:'Item digital',DONATION:'Donasi',PLAN:'Paket'};
    root.innerHTML=`<div class="toolbar"><div><h2>Monetisasi &amp; Katalog</h2><p>Atur apa yang boleh tampil untuk Pelajar, Guru, dan Penyelenggara. Semua item pembayaran tetap menunggu verifikasi webhook backend.</p></div><button class="btn btn-primary" id="new-product">+ Produk baru</button></div><div class="catalog-notice"><strong>Arsitektur siap untuk 3 audience</strong><span>Pelajar · Guru · Penyelenggara</span><small>Gunakan katalog ini untuk Koin Edu, fitur khusus, item digital, donasi, dan paket.</small></div><div class="data-table catalog-table">${products.map(p=>`<div class="data-row product-admin-row"><div class="product-admin-info"><div class="store-icon">${p.product_type==='DONATION'?'♥':p.product_type==='EDU_COIN_TOPUP'?'✦':'◆'}</div><div><strong>${esc(p.name)}</strong><small>${esc(p.code)} · ${esc(typeLabels[p.product_type]||p.product_type)}</small><div class="audience-chips">${(p.audiences||[]).map(a=>`<span class="chip">${audienceLabels[a]||a}</span>`).join('')}</div></div></div><div class="product-admin-meta"><span class="status-pill ${p.is_active?'status-success':'status-muted'}">${p.is_active?'ACTIVE':'DRAFT'}</span><strong>${money(p.price)}</strong><div class="row-actions"><button class="btn btn-ghost btn-xs" data-edit-product="${p.id}">Edit</button><button class="btn btn-ghost btn-xs" data-toggle-product="${p.id}" data-active="${p.is_active?'false':'true'}">${p.is_active?'Nonaktifkan':'Aktifkan'}</button></div></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Katalog masih kosong',text:'Buat produk pertama untuk mulai mengatur monetisasi.'})}</div>`;
    document.getElementById('new-product').onclick=()=>openProductModal();
    root.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>openProductModal(products.find(p=>p.id===b.dataset.editProduct),benefits[b.dataset.editProduct]||[]));
    root.querySelectorAll('[data-toggle-product]').forEach(b=>b.onclick=async()=>{const product=products.find(p=>p.id===b.dataset.toggleProduct);try{await svc().saveCommerceProduct({...product,is_active:b.dataset.active==='true'},product.id);window.SYKA_TOAST.show('Status produk diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});

    function openProductModal(product=null,existingBenefits=[]){
      const isEdit=!!product;const audiences=product?.audiences||[];const benefit=existingBenefits[0]||{};
      window.SYKA_MODAL.open({title:isEdit?'Edit produk':'Produk baru',wide:true,html:`<form id="product-form" class="form-card"><div class="form-grid-2"><label>Nama produk *<input id="pr-name" required value="${esc(product?.name||'')}"></label><label>Kode *<input id="pr-code" required value="${esc(product?.code||'')}" ${isEdit?'readonly':''}></label></div><div class="form-grid-2"><label>Slug *<input id="pr-slug" required value="${esc(product?.slug||'')}"></label><label>Tipe *<select id="pr-type">${Object.entries(typeLabels).map(([v,l])=>`<option value="${v}" ${product?.product_type===v?'selected':''}>${l}</option>`).join('')}</select></label></div><label>Deskripsi singkat<textarea id="pr-short" rows="2">${esc(product?.short_description||'')}</textarea></label><label>Deskripsi lengkap<textarea id="pr-desc" rows="4">${esc(product?.description||'')}</textarea></label><div class="form-grid-2"><label>Harga (IDR) *<input id="pr-price" type="number" min="0" step="1000" required value="${Number(product?.price)||0}"></label><label>Urutan tampil<input id="pr-order" type="number" min="0" value="${Number(product?.sort_order)||0}"></label></div><fieldset class="check-group"><legend>Tampilkan untuk</legend>${[['student','Pelajar'],['teacher','Guru'],['organizer','Penyelenggara']].map(([v,l])=>`<label class="check-option"><input type="checkbox" data-audience="${v}" ${audiences.includes(v)?'checked':''}><span>${l}</span></label>`).join('')}</fieldset><fieldset class="check-group"><legend>Benefit produk</legend><div class="form-grid-2"><label>Benefit type<select id="pr-benefit-type"><option value="EDU_COIN" ${benefit.benefit_type==='EDU_COIN'?'selected':''}>Koin Edu</option><option value="FEATURE" ${benefit.benefit_type==='FEATURE'?'selected':''}>Feature unlock</option><option value="ITEM" ${benefit.benefit_type==='ITEM'?'selected':''}>Item digital</option><option value="PLAN" ${benefit.benefit_type==='PLAN'?'selected':''}>Plan</option></select></label><label>Benefit key<input id="pr-benefit-key" value="${esc(benefit.benefit_key||product?.metadata?.feature||'')}"></label><label>Jumlah<input id="pr-benefit-qty" type="number" min="0" value="${benefit.quantity??product?.metadata?.coin_amount??''}"></label><label>Durasi (hari)<input id="pr-benefit-days" type="number" min="0" value="${benefit.duration_days??product?.metadata?.duration_days??''}"></label></div></fieldset><div class="form-grid-2"><label>Image URL<input id="pr-image" type="url" value="${esc(product?.image_url||'')}"></label><label>Cloudinary public ID<input id="pr-public-id" value="${esc(product?.public_id||'')}"></label></div><label class="switch-line"><input id="pr-featured" type="checkbox" ${product?.is_featured?'checked':''}><span>Tampilkan sebagai produk unggulan</span></label><label class="switch-line"><input id="pr-active" type="checkbox" ${product?.is_active?'checked':''}><span>Produk aktif dan tampil di katalog</span></label><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batalkan</button><button class="btn btn-primary" type="submit">${isEdit?'Simpan perubahan':'Buat produk'}</button></div></form>`,onOpen:b=>{b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();b.querySelector('#product-form').onsubmit=async e=>{e.preventDefault();const audiences=[...b.querySelectorAll('[data-audience]:checked')].map(x=>x.dataset.audience);if(!audiences.length){window.SYKA_TOAST.show('Pilih minimal satu audience.','error');return;}const payload={code:b.querySelector('#pr-code').value.trim().toUpperCase(),slug:b.querySelector('#pr-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-'),name:b.querySelector('#pr-name').value.trim(),short_description:b.querySelector('#pr-short').value.trim()||null,description:b.querySelector('#pr-desc').value.trim()||null,product_type:b.querySelector('#pr-type').value,audiences,price:Number(b.querySelector('#pr-price').value)||0,currency:'IDR',image_url:b.querySelector('#pr-image').value.trim()||null,public_id:b.querySelector('#pr-public-id').value.trim()||null,is_active:b.querySelector('#pr-active').checked,is_featured:b.querySelector('#pr-featured').checked,sort_order:Number(b.querySelector('#pr-order').value)||0,metadata:{}};try{const saved=await svc().saveCommerceProduct(payload,product?.id||null);const benefits=[];const btype=b.querySelector('#pr-benefit-type').value;const bkey=b.querySelector('#pr-benefit-key').value.trim()||null;const qty=b.querySelector('#pr-benefit-qty').value===''?null:Number(b.querySelector('#pr-benefit-qty').value);const days=b.querySelector('#pr-benefit-days').value===''?null:Number(b.querySelector('#pr-benefit-days').value);if(btype)benefits.push({benefit_type:btype,benefit_key:bkey,quantity:qty,duration_days:days,config:{}});await svc().replaceCommerceBenefits(saved.id,benefits);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Produk tersimpan.','success');render(root);}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message||'Produk gagal disimpan.')}</div>`);}};}});
    }
  }
  async function settings(root){const[flags,settings]=await Promise.all([svc().listFlags(),svc().listSettings()]);root.innerHTML=`<div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">FLAGS</span><h2>Feature flags</h2></div></div>${flags.map(f=>`<div class="data-row"><div><strong>${esc(f.key)}</strong><small>${f.enabled?'Enabled':'Disabled'}</small></div><button class="btn btn-ghost btn-sm" data-flag="${esc(f.key)}" data-enabled="${!f.enabled}">${f.enabled?'Matikan':'Nyalakan'}</button></div>`).join('')||'<p class="muted">Belum ada flag.</p>'}</section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">GLOBAL SETTINGS</span><h2>Pengaturan</h2></div></div>${settings.map(s=>`<div class="data-row"><div><strong>${esc(s.key)}</strong><small>${esc(JSON.stringify(s.value))}</small></div><button class="btn btn-ghost btn-sm" data-setting="${esc(s.key)}">Edit</button></div>`).join('')||'<p class="muted">Belum ada setting.</p>'}</section></div>`;root.querySelectorAll('[data-flag]').forEach(b=>b.onclick=async()=>{try{await svc().setFlag(b.dataset.flag,b.dataset.enabled==='true',{});window.SYKA_TOAST.show('Feature flag diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});root.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>settingModal(b.dataset.setting));}
  function settingModal(key){window.SYKA_MODAL.open({title:'Global setting',html:`<form id="sf" class="form-card"><label>Key<input id="key" value="${esc(key)}" required></label><label>Value JSON<textarea id="value">{}</textarea></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#sf').onsubmit=async e=>{e.preventDefault();try{await svc().setSetting(b.querySelector('#key').value.trim(),JSON.parse(b.querySelector('#value').value||'{}'));window.SYKA_MODAL.close();window.SYKA_TOAST.show('Setting tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  async function audit(root){const rows=await svc().listAudit({limit:200});root.innerHTML=`<div class="toolbar"><div><h2>Audit Log</h2><p>Catatan mutation privileged dan perubahan state.</p></div><input id="audit-search" class="control-search" placeholder="Cari action, entity…"></div><div class="data-table" id="audit-table">${rows.map(a=>`<div class="data-row compact"><div><strong>${esc(a.action)}</strong><small>${esc(a.entity_type)} · ${esc(a.entity_id||'')} · ${esc(a.reason||'')}</small></div><time>${fmt(a.created_at)}</time></div>`).join('')||window.SYKA_EMPTY.render({title:'Audit kosong',text:'Belum ada mutation privileged.'})}</div>`;document.getElementById('audit-search').oninput=e=>{const q=e.target.value.toLowerCase();root.querySelectorAll('.data-row').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'flex':'none');};}
  function slideModal(){window.SYKA_MODAL.open({title:'Promo slide',wide:true,html:`<form id="sf" class="form-card"><div class="form-grid-2"><label>Judul *<input id="title" required></label><label>Badge<input id="badge" value="PROMO"></label></div><label>Subtitle<textarea id="subtitle" rows="3"></textarea></label><label>Image URL *<input id="url" type="url" required placeholder="Cloudinary secure_url"></label><div class="form-grid-2"><label>CTA label<input id="cta"></label><label>CTA route<input id="route" value="/lomba"></label></div><div class="form-grid-2">${dateField('start','Mulai tayang',null,false)}${dateField('end','Berakhir',null,false)}</div><button class="btn btn-primary">Simpan slide</button></form>`,onOpen:b=>b.querySelector('#sf').onsubmit=async e=>{e.preventDefault();try{await svc().saveSlide({title:b.querySelector('#title').value.trim(),subtitle:b.querySelector('#subtitle').value.trim()||null,badge:b.querySelector('#badge').value.trim()||'PROMO',image_url:b.querySelector('#url').value.trim(),cta_label:b.querySelector('#cta').value.trim()||null,cta_route:b.querySelector('#route').value.trim()||'/lomba',starts_at:window.SYKA_UTILS.localInputToISO(b.querySelector('#start').value),ends_at:window.SYKA_UTILS.localInputToISO(b.querySelector('#end').value),is_active:true,sort_order:0});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Promo slide tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  window.SYKA_PAGE_ADMIN={render};
})();


/* src/pages/Organizer.js */
(function() {
    const svc = () => window.SYKA_CONTROL_SERVICE;
    const esc = window.SYKA_UTILS.escapeHtml;
    const fmt = window.SYKA_UTILS.formatDateTime;
    const tabs = [
        ['dashboard', 'Dashboard'],
        ['competitions', 'Kompetisi'],
        ['participants', 'Peserta'],
        ['questions', 'Soal'],
        ['grading', 'Grading'],
        ['results', 'Hasil'],
        ['awards', 'Awards'],
        ['certificates', 'Sertifikat'],
        ['twibbon', 'Twibbon'],
        ['notifications', 'Notifikasi'],
        ['plan', 'Plan & Usage']
    ];
    const transitions = {
        DRAFT: ['PUBLISHED', 'SUSPENDED', 'CANCELLED'],
        PUBLISHED: ['REGISTRATION_OPEN', 'SUSPENDED', 'CANCELLED'],
        REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'SUSPENDED', 'CANCELLED'],
        REGISTRATION_CLOSED: ['LIVE', 'SUSPENDED', 'CANCELLED'],
        LIVE: ['SUBMISSION_CLOSED', 'SUSPENDED', 'CANCELLED'],
        SUBMISSION_CLOSED: ['GRADING', 'SUSPENDED', 'CANCELLED'],
        GRADING: ['RESULT_PUBLISHED', 'SUSPENDED'],
        RESULT_PUBLISHED: ['ARCHIVED', 'SUSPENDED'],
        SUSPENDED: ['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE', 'SUBMISSION_CLOSED', 'GRADING', 'RESULT_PUBLISHED', 'CANCELLED']
    };
    async function membership() {
        const a = window.SYKA_STATE.getState().auth;
        const list = await svc().listMyOrganizerMemberships(a.user?.id).catch(() => []);
        return list[0]?.organizer_id || null;
    }

    function shell(tab) {
        return `<div class="control-head"><div><span class="eyebrow">ORGANIZER CONTROL PLANE</span><h1>Panel Penyelenggara</h1><p>Kelola kompetisi, peserta, soal, hasil, awards, certificate, twibbon, dan entitlement dari satu workspace.</p></div><div class="control-head-meta"><span class="security-badge">Plan & permission server-side</span></div></div><div class="control-tabs">${tabs.map(([k,l])=>`<button type="button" class="control-tab ${tab===k?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div><div id="organizer-content"></div>`;
    }
    async function render(root) {
        const auth = window.SYKA_STATE.getState().auth;
        if (!auth.user) {
            root.innerHTML = window.SYKA_EMPTY.render({
                title: 'Masuk diperlukan',
                text: 'Panel penyelenggara hanya untuk organizer yang aktif.',
                actionHtml: '<button class="btn btn-primary" id="org-login">Masuk</button>'
            });
            document.getElementById('org-login')?.addEventListener('click', () => window.SYKA_APP.openAuth('login', {
                target: '/organizer'
            }));
            return;
        }
        if (!auth.roles.includes('organizer_member') && !auth.roles.includes('admin')) {
            root.innerHTML = window.SYKA_EMPTY.render({
                title: 'Akses belum tersedia',
                text: 'Akun ini belum menjadi anggota organizer aktif. Minta admin menambahkan membership organizer.'
            });
            return;
        }
        const q = window.SYKA_STATE.getState().route.query;
        const tab = tabs.some(([k]) => k === q.tab) ? q.tab : 'dashboard';
        root.innerHTML = shell(tab);
        root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => window.SYKA_ROUTER.navigate('/organizer', {
            tab: b.dataset.tab
        }));
        try {
            let orgId = null;
let organizers = [];

if (auth.roles.includes('admin')) {
  organizers = await svc().listOrganizers();

  orgId =
    q.organizer ||
    organizers[0]?.id ||
    null;
} else {
  orgId = await membership();
}
            if (!orgId) {
                document.getElementById('organizer-content').innerHTML = window.SYKA_EMPTY.render({
                    title: 'Belum ada organizer',
                    text: 'Akun sudah memiliki role organizer, tetapi belum memiliki membership ke organisasi tertentu.'
                });
                return;
            }
            await renderTab(document.getElementById('organizer-content'), tab, orgId);
        } catch (error) {
            document.getElementById('organizer-content').innerHTML = window.SYKA_EMPTY.render({
                title: 'Modul gagal dimuat',
                text: error.message || 'Periksa organizer_members/RLS.'
            });
        }
    }
    async function renderTab(root, tab, orgId) {
        const map = {
            dashboard,
            competitions,
            participants,
            questions,
            grading,
            results,
            awards,
            certificates,
            twibbon,
            notifications,
            plan
        };
        return map[tab]?.(root, orgId);
    }
    async function dashboard(root, orgId) {
        const comps = await svc().listCompetitionsAdmin({
            organizerId: orgId,
            limit: 200
        });
        const regs = await svc().listRegistrations({});
        const mineRegs = regs.filter(r => comps.some(c => c.id === r.competition_id));
        const attempts = await svc().listAttempts({});
        const mineAttempts = attempts.filter(a => comps.some(c => c.id === a.competition_id));
        root.innerHTML = `<div class="kpi-grid"><div class="kpi-card"><span>Kompetisi</span><strong>${comps.length}</strong><small>milik organizer</small></div><div class="kpi-card"><span>Pending peserta</span><strong>${mineRegs.filter(r=>r.status==='PENDING').length}</strong><small>perlu review</small></div><div class="kpi-card"><span>Attempt submitted</span><strong>${mineAttempts.filter(a=>a.status==='SUBMITTED').length}</strong><small>siap grading</small></div><div class="kpi-card"><span>Live</span><strong>${comps.filter(c=>c.status==='LIVE').length}</strong><small>kompetisi berjalan</small></div></div><section class="panel-card admin-section"><div class="panel-head"><div><span class="eyebrow">WORKSPACE</span><h2>Kompetisi aktif</h2></div><button class="btn btn-primary btn-sm" id="org-new-comp">+ Kompetisi</button></div><div class="mini-list">${comps.slice(0,8).map(c=>`<div class="mini-list-row"><div><strong>${esc(c.title)}</strong><small>${esc(c.category)} · ${esc(c.status)} · mulai ${fmt(c.starts_at)}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama untuk organizer ini.'})}</div></section>`;
        document.getElementById('org-new-comp').onclick = () => competitionModal(orgId);
    }
    async function competitions(root, orgId) {
        const rows = await svc().listCompetitionsAdmin({
            organizerId: orgId,
            limit: 200
        });
        root.innerHTML = `<div class="toolbar"><div><h2>Kompetisi</h2><p>Lifecycle dan konfigurasi kompetisi.</p></div><button class="btn btn-primary" id="new-org-comp">+ Buat kompetisi</button></div><div class="data-table">${rows.map(c=>`<div class="data-row"><div><div class="row-title"><strong>${esc(c.title)}</strong><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span></div><small>${esc(c.category)} · registrasi ${fmt(c.registration_starts_at)} → ${fmt(c.registration_ends_at)} · live ${fmt(c.starts_at)}</small></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button><button class="btn btn-secondary btn-sm" data-config="${c.id}">Config</button><button class="btn btn-primary btn-sm" data-transition="${c.id}">Transisi</button></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi dari tombol di atas.'})}</div>`;
        document.getElementById('new-org-comp').onclick = () => competitionModal(orgId);
        root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => competitionModal(orgId, rows.find(c => c.id === b.dataset.edit)));
        root.querySelectorAll('[data-config]').forEach(b => b.onclick = () => configModal(rows.find(c => c.id === b.dataset.config)));
        root.querySelectorAll('[data-transition]').forEach(b => b.onclick = () => transitionModal(rows.find(c => c.id === b.dataset.transition)));
    }

    function dateField(id, label, value, required = false) {
        return `<label>${label}${required?' *':''}<div class="date-control"><span>◷</span><input id="${id}" type="datetime-local" ${required?'required':''} value="${window.SYKA_UTILS.escapeHtml(window.SYKA_UTILS.toLocalInputValue(value))}"></div></label>`;
    }
    async function competitionModal(orgId, current = null) {
        const p = current || {};
        window.SYKA_MODAL.open({
            title: current ? 'Edit kompetisi' : 'Buat kompetisi baru',
            wide: true,
            html: `<form id="ocf" class="form-card"><div class="form-grid-2"><label>Judul *<input id="title" required value="${esc(p.title||'')}"></label><label>Slug *<input id="slug" required value="${esc(p.slug||'')}"></label></div><div class="form-grid-2"><label>Kategori<input id="category" value="${esc(p.category||'Kompetisi')}"></label><label>Visibility<select id="visibility"><option ${p.visibility==='PUBLIC'||!p.visibility?'selected':''}>PUBLIC</option><option ${p.visibility==='UNLISTED'?'selected':''}>UNLISTED</option><option ${p.visibility==='PRIVATE'?'selected':''}>PRIVATE</option></select></label></div><label>Deskripsi singkat<textarea id="short">${esc(p.short_description||'')}</textarea></label><label>Poster URL<input id="poster" type="url" value="${esc(p.poster_url||'')}" placeholder="Cloudinary secure_url"></label><div class="form-section-title compact"><div><span class="eyebrow">TIMELINE</span><h2>Tanggal & jam</h2></div></div><div class="form-grid-2">${dateField('rs','Pendaftaran mulai',p.registration_starts_at,true)}${dateField('re','Pendaftaran berakhir',p.registration_ends_at,true)}</div><div class="form-grid-2">${dateField('start','Kompetisi mulai',p.starts_at,true)}${dateField('end','Kompetisi berakhir',p.ends_at,true)}</div>${dateField('ann','Pengumuman',p.announcement_at,false)}<div id="oc-feedback"></div><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">${current?'Simpan perubahan':'Buat sebagai DRAFT'}</button></div></form>`,
            onOpen: b => b.querySelector('#ocf').onsubmit = async e => {
                e.preventDefault();
                try {
                    const payload = {
                        organizer_id: orgId,
                        title: b.querySelector('#title').value.trim(),
                        slug: b.querySelector('#slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''),
                        category: b.querySelector('#category').value.trim() || 'Kompetisi',
                        short_description: b.querySelector('#short').value.trim() || null,
                        visibility: b.querySelector('#visibility').value,
                        poster_url: b.querySelector('#poster').value.trim() || null,
                        registration_starts_at: window.SYKA_UTILS.localInputToISO(b.querySelector('#rs').value),
                        registration_ends_at: window.SYKA_UTILS.localInputToISO(b.querySelector('#re').value),
                        starts_at: window.SYKA_UTILS.localInputToISO(b.querySelector('#start').value),
                        ends_at: window.SYKA_UTILS.localInputToISO(b.querySelector('#end').value),
                        announcement_at: window.SYKA_UTILS.localInputToISO(b.querySelector('#ann').value)
                    };
                    await svc().saveCompetition(payload, current?.id || null);
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show(current ? 'Kompetisi diperbarui.' : 'Kompetisi dibuat sebagai DRAFT.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (error) {
                    b.querySelector('#oc-feedback').innerHTML = `<div class="inline-error">${esc(error.message)}</div>`;
                }
            }
        });
    }

    function transitionModal(c) {
        const choices = transitions[c.status] || [];
        if (!choices.length) {
            window.SYKA_TOAST.show(`Tidak ada transisi valid dari ${c.status}.`, 'warning');
            return;
        }
        window.SYKA_MODAL.open({
            title: 'Ubah status kompetisi',
            html: `<div class="transition-current"><span>STATUS SAAT INI</span><strong>${esc(c.status)}</strong></div><form id="otf" class="form-card"><label>Status tujuan<select id="target">${choices.map(s=>`<option>${s}</option>`).join('')}</select></label><label>Alasan<textarea id="reason" placeholder="Mengapa status ini diubah?"></textarea></label><button class="btn btn-primary btn-block">Terapkan</button><div class="form-hint">Backend akan memvalidasi lifecycle dan mencatat audit.</div></form>`,
            onOpen: b => b.querySelector('#otf').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().transitionCompetition(c.id, b.querySelector('#target').value, b.querySelector('#reason').value.trim() || null);
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Status kompetisi diperbarui.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (error) {
                    b.insertAdjacentHTML('beforeend', `<div class="inline-error">${esc(error.message)}</div>`);
                }
            }
        });
    }

    function configModal(c) {
        window.SYKA_MODAL.open({
            title: `Config · ${c.title}`,
            html: `<div class="config-grid"><button class="config-card" id="lvl"><span>◫</span><strong>Jenjang</strong><small>Grade, points, level kompetisi.</small></button><button class="config-card" id="rules"><span>◌</span><strong>Registrasi</strong><small>Eligibility, twibbon, quota.</small></button><button class="config-card" id="reward"><span>✦</span><strong>Reward</strong><small>Juara, poin, emblem.</small></button></div>`,
            onOpen: b => {
                b.querySelector('#lvl').onclick = () => levelModal(c.id);
                b.querySelector('#rules').onclick = () => rulesModal(c.id);
                b.querySelector('#reward').onclick = () => rewardModal(c.id);
            }
        });
    }
    async function levelModal(id) {
        const rows = await svc().listLevels(id);
        const html = rows.length ? rows.map(r => `<div class="list-card"><strong>${esc(r.label)}</strong><small>${esc(r.code)} · ${(r.allowed_grades||[]).join(', ')}</small><span>${r.points} pts</span></div>`).join('') : '<div class="empty-inline">Belum ada level.</div>';
        window.SYKA_MODAL.open({
            title: 'Jenjang kompetisi',
            html: `<div class="modal-toolbar"><button class="btn btn-primary btn-sm" id="new-level">+ Level</button></div><div class="stack-list">${html}</div>`,
            onOpen: b => {
                b.querySelector('#new-level').onclick = () => window.SYKA_MODAL.open({
                    title: 'Tambah level',
                    html: `<form id="lf" class="form-card"><label>Kode<input id="code" required></label><label>Label<input id="label" required></label><label>Allowed grades<textarea id="grades">SD6</textarea></label><label>Points<input id="points" type="number" value="0"></label><button class="btn btn-primary">Simpan</button></form>`,
                    onOpen: x => {
                        x.querySelector('#lf').onsubmit = async e => {
                            e.preventDefault();
                            try {
                                await svc().saveLevel({
                                    competition_id: id,
                                    code: x.querySelector('#code').value.trim(),
                                    label: x.querySelector('#label').value.trim(),
                                    allowed_grades: x.querySelector('#grades').value.split(/[,\n]+/).map(v => v.trim()).filter(Boolean),
                                    points: Number(x.querySelector('#points').value || 0),
                                    config: {}
                                });
                                window.SYKA_MODAL.close();
                                window.SYKA_TOAST.show('Level tersimpan.', 'success');
                                levelModal(id);
                            } catch (error) {
                                x.insertAdjacentHTML('beforeend', `<div class="inline-error">${esc(error.message)}</div>`);
                            }
                        };
                    }
                });
            }
        });
    }
    async function rulesModal(id) {
        const r = await svc().getRegistrationRules(id) || {};
        window.SYKA_MODAL.open({
            title: 'Aturan pendaftaran',
            html: `<form id="rf" class="form-card"><label>Allowed grades<textarea id="grades">${esc((r.allowed_grades||[]).join('\n'))}</textarea></label><label class="checkline"><input id="twibbon" type="checkbox" ${r.require_twibbon?'checked':''}> Wajib twibbon</label><label class="checkline"><input id="social" type="checkbox" ${r.require_social_proof?'checked':''}> Wajib social proof</label><label>Maximum peserta<input id="max" type="number" min="1" value="${r.max_participants||''}"></label><button class="btn btn-primary">Simpan</button></form>`,
            onOpen: b => {
                b.querySelector('#rf').onsubmit = async e => {
                    e.preventDefault();
                    try {
                        await svc().saveRegistrationRules({
                            allowed_grades: b.querySelector('#grades').value.split(/[,\n]+/).map(v => v.trim()).filter(Boolean),
                            require_twibbon: b.querySelector('#twibbon').checked,
                            require_social_proof: b.querySelector('#social').checked,
                            max_participants: b.querySelector('#max').value ? Number(b.querySelector('#max').value) : null,
                            config: {}
                        }, id);
                        window.SYKA_MODAL.close();
                        window.SYKA_TOAST.show('Aturan tersimpan.', 'success');
                    } catch (error) {
                        b.insertAdjacentHTML('beforeend', `<div class="inline-error">${esc(error.message)}</div>`);
                    }
                };
            }
        });
    }
    async function rewardModal(id) {
        const rows = await svc().listRewards(id);
        const html = rows.length ? rows.map(r => `<div class="list-card"><strong>${esc(r.rank_code)}</strong><small>${esc(r.title||'Reward')}</small><span>${r.points} pts</span></div>`).join('') : '<div class="empty-inline">Belum ada reward.</div>';
        window.SYKA_MODAL.open({
            title: 'Reward kompetisi',
            html: `<div class="modal-toolbar"><button class="btn btn-primary btn-sm" id="new-reward">+ Reward</button></div><div class="stack-list">${html}</div>`,
            onOpen: b => {
                b.querySelector('#new-reward').onclick = () => window.SYKA_MODAL.open({
                    title: 'Tambah reward',
                    html: `<form id="rew" class="form-card"><label>Rank code<input id="rank" required></label><label>Title<input id="title" required></label><label>Points<input id="points" type="number" value="0"></label><label>Emblem<input id="emblem"></label><label class="checkline"><input id="cert" type="checkbox" checked> Certificate enabled</label><button class="btn btn-primary">Simpan</button></form>`,
                    onOpen: x => {
                        x.querySelector('#rew').onsubmit = async e => {
                            e.preventDefault();
                            try {
                                await svc().saveReward({
                                    competition_id: id,
                                    rank_code: x.querySelector('#rank').value.trim(),
                                    title: x.querySelector('#title').value.trim(),
                                    points: Number(x.querySelector('#points').value || 0),
                                    emblem_name: x.querySelector('#emblem').value.trim() || null,
                                    certificate_enabled: x.querySelector('#cert').checked,
                                    config: {}
                                });
                                window.SYKA_MODAL.close();
                                window.SYKA_TOAST.show('Reward tersimpan.', 'success');
                                rewardModal(id);
                            } catch (error) {
                                x.insertAdjacentHTML('beforeend', `<div class="inline-error">${esc(error.message)}</div>`);
                            }
                        };
                    }
                });
            }
        });
    }
    async function participants(root, orgId) {
        const comps = await svc().listCompetitionsAdmin({
            organizerId: orgId,
            limit: 200
        });
        let rows = [];
        for (const c of comps) {
            const list = await svc().listRegistrations({
                competitionId: c.id
            });
            rows.push(...list);
        }
        root.innerHTML = `<div class="toolbar"><div><h2>Peserta</h2><p>Review registration sebelum status ACTIVE.</p></div><div class="filter-line"><select id="reg-status" class="compact-select"><option value="">Semua</option><option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>ACTIVE</option></select></div></div><div class="data-table" id="participants-table">${rows.map(r=>`<div class="data-row" data-status="${esc(r.status)}"><div class="row-main"><div class="avatar-mini">${r.profiles?.avatar_url?`<img src="${esc(r.profiles.avatar_url)}" alt="">`:esc(window.SYKA_UTILS.initials(r.profiles?.full_name||r.user_id))}</div><div><strong>${esc(r.profiles?.full_name||r.user_id)}</strong><small>${esc(r.profiles?.username||'')} · ${esc(r.profiles?.institution||'')} · ${esc(r.competitions?.title||'')}</small><div class="chip-row"><span class="status-pill ${window.SYKA_UTILS.statusClass(r.status)}">${esc(r.status)}</span></div></div></div><div class="row-actions">${r.status==='PENDING'?`<button class="btn btn-primary btn-sm" data-approve="${r.id}">Approve</button><button class="btn btn-danger-outline btn-sm" data-reject="${r.id}">Reject</button>`:''}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada peserta',text:'Registration akan masuk saat peserta mendaftar.'})}</div>`;
        document.getElementById('reg-status').onchange = e => root.querySelectorAll('#participants-table .data-row').forEach(r => r.style.display = !e.target.value || r.dataset.status === e.target.value ? 'flex' : 'none');
        root.querySelectorAll('[data-approve]').forEach(b => b.onclick = async () => review(b.dataset.approve, 'APPROVED'));
        root.querySelectorAll('[data-reject]').forEach(b => b.onclick = () => rejectModal(b.dataset.reject));
    }
    async function review(id, decision, reason = null) {
        try {
            await svc().reviewRegistration(id, decision, reason);
            window.SYKA_TOAST.show('Status peserta diperbarui.', 'success');
            window.SYKA_ROUTER.refresh();
        } catch (error) {
            window.SYKA_TOAST.show(error.message, 'error');
        }
    }

    function rejectModal(id) {
        window.SYKA_MODAL.open({
            title: 'Reject peserta',
            html: `<form id="rej" class="form-card"><label>Alasan penolakan *<textarea id="reason" required></textarea></label><button class="btn btn-danger">Tolak peserta</button></form>`,
            onOpen: b => b.querySelector('#rej').onsubmit = async e => {
                e.preventDefault();
                await review(id, 'REJECTED', b.querySelector('#reason').value.trim());
                window.SYKA_MODAL.close();
            }
        });
    }
    async function questions(root, orgId) {
        const banks = await svc().listQuestionBanks({
            organizerId: orgId
        });
        root.innerHTML = `<div class="toolbar"><div><h2>Question Builder</h2><p>Bank soal organizer dan moderation status.</p></div><button class="btn btn-primary" id="new-bank">+ Bank soal</button></div><div class="data-table">${banks.map(b=>`<div class="data-row"><div><strong>${esc(b.name)}</strong><small>${esc(b.description||'—')} · ${esc(b.status||'DRAFT')}</small></div><span class="chip">Bank</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada bank soal',text:'Buat bank soal untuk menyusun soal kompetisi.'})}</div>`;
        document.getElementById('new-bank').onclick = () => window.SYKA_MODAL.open({
            title: 'Bank soal baru',
            html: `<form id="bf" class="form-card"><label>Nama bank<input id="name" required></label><label>Deskripsi<textarea id="desc"></textarea></label><label>Status<select id="status"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label><button class="btn btn-primary">Simpan</button></form>`,
            onOpen: b => b.querySelector('#bf').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().saveQuestionBank({
                        organizer_id: orgId,
                        name: b.querySelector('#name').value.trim(),
                        description: b.querySelector('#desc').value.trim() || null,
                        status: b.querySelector('#status').value,
                        config: {}
                    });
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Bank soal dibuat.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (error) {
                    b.insertAdjacentHTML('beforeend', `<div class="inline-error">${esc(error.message)}</div>`);
                }
            }
        });
    }
    async function grading(root, orgId) {
        const comps = await svc().listCompetitionsAdmin({
            organizerId: orgId,
            limit: 200
        });
        let rows = [];
        for (const c of comps) rows.push(...await svc().listAttempts({
            competitionId: c.id
        }));
        root.innerHTML = `<div class="toolbar"><div><h2>Grading</h2><p>Auto/manual grading dan finalize score.</p></div><select class="compact-select" id="grading-filter"><option value="">Semua status</option><option>SUBMITTED</option><option>GRADING</option><option>FINALIZED</option></select></div><div class="data-table" id="grading-table">${rows.map(a=>`<div class="data-row" data-status="${esc(a.status)}"><div><strong>${esc(a.profiles?.full_name||a.participant_id)}</strong><small>${esc(a.competitions?.title||'')} · ${esc(a.status)} · Score ${a.score??0}</small></div><div class="row-actions">${a.status!=='FINALIZED'?`<button class="btn btn-ghost btn-sm" data-grade="${a.id}">Grade</button><button class="btn btn-primary btn-sm" data-final="${a.id}">Finalize</button>`:'<span class="status-pill status-success">FINALIZED</span>'}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada attempt',text:'Submission peserta akan muncul ketika attempt engine aktif.'})}</div>`;
        document.getElementById('grading-filter').onchange = e => root.querySelectorAll('[data-status]').forEach(r => r.style.display = !e.target.value || r.dataset.status === e.target.value ? 'flex' : 'none');
        root.querySelectorAll('[data-grade]').forEach(b => gradeModal(b.dataset.grade));
        root.querySelectorAll('[data-final]').forEach(b => finalizeModal(b.dataset.final));
    }
    async function gradeModal(id) {
        const items = await svc().listGradingItems(id);
        window.SYKA_MODAL.open({
            title: 'Grading attempt',
            wide: true,
            html: `<form id="gf" class="form-card">${items.map((i,n)=>`<div class="grade-item"><div><strong>Item ${n+1}</strong><small>Question ${esc(i.question_id||'')}</small></div><div class="form-grid-2"><label>Score<input type="number" step="0.01" data-score="${i.id}" value="${i.score??0}"></label><label>Feedback<input data-feedback="${i.id}" value="${esc(i.feedback||'')}"></label></div></div>`).join('')||'<div class="empty-inline">Belum ada manual grading item.</div>'}<button class="btn btn-primary">Simpan grading</button></form>`,
            onOpen: b => b.querySelector('#gf').onsubmit = async e => {
                e.preventDefault();
                try {
                    for (const i of items) {
                        await svc().saveGrade({
                            attempt_id: id,
                            question_id: i.question_id,
                            grader_id: window.SYKA_STATE.getState().auth.user.id,
                            score: Number(b.querySelector(`[data-score="${i.id}"]`).value || 0),
                            feedback: b.querySelector(`[data-feedback="${i.id}"]`).value || null
                        }, i.id);
                    }
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Grading tersimpan.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (error) {
                    b.insertAdjacentHTML('beforeend', `<div class="inline-error">${esc(error.message)}</div>`);
                }
            }
        });
    }

    function finalizeModal(id) {
        window.SYKA_MODAL.open({
            title: 'Finalize result',
            html: `<form id="ff" class="form-card"><label>Score final *<input id="score" type="number" step="0.01" min="0" required></label><div class="form-hint">Finalization adalah langkah one-way pada core flow dan harus diaudit.</div><button class="btn btn-primary">Finalize result</button></form>`,
            onOpen: b => b.querySelector('#ff').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().finalizeAttempt(id, Number(b.querySelector('#score').value || 0));
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Result finalized.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (error) {
                    b.insertAdjacentHTML('beforeend', `<div class="inline-error">${esc(error.message)}</div>`);
                }
            }
        });
    }
    async function results(root, orgId) {
        const comps = await svc().listCompetitionsAdmin({
            organizerId: orgId,
            limit: 200
        });
        let rows = [];
        for (const c of comps) rows.push(...await svc().listAttempts({
            competitionId: c.id,
            status: 'FINALIZED'
        }));
        root.innerHTML = `<div class="toolbar"><div><h2>Hasil</h2><p>Hasil final dari semua kompetisi organizer.</p></div></div><div class="data-table">${rows.map(a=>`<div class="data-row"><div><strong>${esc(a.profiles?.full_name||a.participant_id)}</strong><small>${esc(a.competitions?.title||'')} · ${fmt(a.finalized_at)}</small></div><strong>${Number(a.score||0).toLocaleString('id-ID')} pts</strong></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada hasil',text:'Finalize attempt dari tab Grading untuk mengisi hasil.'})}</div>`;
    }
    async function awards(root, orgId) {
        const comps = await svc().listCompetitionsAdmin({
            organizerId: orgId,
            limit: 200
        });
        let rows = [];
        for (const c of comps) rows.push(...await svc().listAwards({
            competitionId: c.id
        }));
        root.innerHTML = `<div class="toolbar"><div><h2>Awards</h2><p>Achievement, emblem, dan points dari result event.</p></div></div><div class="data-table">${rows.map(a=>`<div class="data-row"><div><strong>${esc(a.title)}</strong><small>${esc(a.rank_code||'PARTICIPANT')} · ${esc(a.competition_id||'')}</small></div><span class="chip">${Number(a.points||0)} pts</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada awards',text:'Award event akan muncul setelah result publication backend.'})}</div>`;
    }
    async function certificates(root, orgId) {
        const comps = await svc().listCompetitionsAdmin({
            organizerId: orgId,
            limit: 200
        });
        let rows = [];
        for (const c of comps) rows.push(...await svc().listCertificates({
            competitionId: c.id
        }));
        root.innerHTML = `<div class="toolbar"><div><h2>Sertifikat</h2><p>DRAFT → GENERATED → REVIEW → APPROVED → PUBLISHED → REVOKED.</p></div></div><div class="data-table">${rows.map(c=>`<div class="data-row"><div><strong>${esc(c.user_id)}</strong><small>${esc(c.competition_id||'')} · revisi ${c.current_revision}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada certificate',text:'Certificate akan dibuat setelah award event.'})}</div>`;
    }
    async function twibbon(root, orgId) {
        const rows = await svc().listTwibbonTemplates({
            organizerId: orgId
        });
        root.innerHTML = `<div class="toolbar"><div><h2>Twibbon</h2><p>Template twibbon untuk kompetisi organizer.</p></div><button class="btn btn-primary" id="new-tw">+ Template</button></div><div class="data-table">${rows.map(t=>`<div class="data-row"><div><strong>${esc(t.name)}</strong><small>${esc(t.competition_id||'')} · ${t.is_required?'Wajib':'Opsional'}</small></div><span class="chip">${t.is_active?'Aktif':'Nonaktif'}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada template',text:'Tambahkan template twibbon untuk competition.'})}</div>`;
        document.getElementById('new-tw').onclick = () => window.SYKA_MODAL.open({
            title: 'Twibbon template',
            wide: true,
            html: `<form id="twf" class="form-card"><label>Competition ID<input id="cid"></label><label>Nama template<input id="name" required></label><label>Image URL<input id="url" type="url"></label><label>Public ID<input id="pid"></label><label class="checkline"><input id="req" type="checkbox"> Wajib</label><button class="btn btn-primary">Simpan</button></form>`,
            onOpen: b => b.querySelector('#twf').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().saveTwibbonTemplate({
                        organizer_id: orgId,
                        competition_id: b.querySelector('#cid').value.trim() || null,
                        name: b.querySelector('#name').value.trim(),
                        image_url: b.querySelector('#url').value.trim() || null,
                        public_id: b.querySelector('#pid').value.trim() || null,
                        is_required: b.querySelector('#req').checked,
                        is_active: true,
                        config: {}
                    });
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Template tersimpan.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (error) {
                    b.insertAdjacentHTML('beforeend', `<div class="inline-error">${esc(error.message)}</div>`);
                }
            }
        });
    }
    async function notifications(root) {
        const a = window.SYKA_STATE.getState().auth;
        const rows = await window.SYKA_NOTIFICATION_SERVICE.list(a.user.id);
        root.innerHTML = `<div class="toolbar"><div><h2>Notifikasi</h2><p>Event dan update yang dikirim ke user organizer.</p></div></div><div class="data-table">${rows.map(n=>`<div class="data-row"><div><strong>${esc(n.title||'Notifikasi')}</strong><small>${esc(n.body||'')} · ${fmt(n.created_at)}</small></div><span class="status-pill ${n.read_at?'status-neutral':'status-success'}">${n.read_at?'Sudah dibaca':'Baru'}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada notifikasi',text:'Event backend akan masuk di sini.'})}</div>`;
    }
    async function plan(root, orgId) {
        const [plans, ents] = await Promise.all([svc().listPlans(), svc().listEntitlements()]);
        const mine = plans.find(p => p.organizer_id === orgId && p.is_active);
        const planCode = mine?.plan_code || 'FREE';
        root.innerHTML = `<div class="control-grid-2"><section class="panel-card"><span class="eyebrow">CURRENT PLAN</span><h2>${planCode}</h2><p>${mine?`Aktif sejak ${fmt(mine.starts_at)}${mine.ends_at?` sampai ${fmt(mine.ends_at)}`:''}`:'Belum ada plan aktif. Fallback FREE.'}</p></section><section class="panel-card"><span class="eyebrow">ENTITLEMENTS</span>${ents.filter(e=>e.plan_code===planCode).map(e=>`<div class="data-row compact"><div><strong>${esc(e.capability)}</strong><small>Limit ${e.limit_value??'—'}</small></div></div>`).join('')||'<p class="muted">Belum ada entitlement untuk plan ini.</p>'}</section></div>`;
    }
    window.SYKA_PAGE_ORGANIZER = {
        render
    };
})();


/* src/pages/Placeholder.js */
(function(){function render(root,title,desc){root.innerHTML=`<div class="placeholder-page"><span class="eyebrow">APPLICATION SURFACE</span><h1>${window.SYKA_UTILS.escapeHtml(title)}</h1><p>${window.SYKA_UTILS.escapeHtml(desc)}</p><div class="syka-card placeholder-box"><b>Shell frontend sudah siap.</b><small>Modul domain berikutnya tinggal menghubungkan service contract ke Supabase RPC / Edge Functions sesuai RPD v4.1.</small></div></div>`;} window.SYKA_PAGE_PLACEHOLDER={render};})();




/* src/core/router.js */
(function(){
  const routes=[
    {name:'home',match:p=>p==='/'||p==='/home'},
    {name:'lomba',match:p=>p==='/lomba'},
    {name:'competition',match:p=>/^\/lomba\/[^/]+$/.test(p)},
    {name:'registration',match:p=>/^\/lomba\/[^/]+\/daftar$/.test(p)},
    {name:'attempt',match:p=>/^\/ujian\/[^/]+$/.test(p)},
    {name:'leaderboard',match:p=>p==='/juara'},
    {name:'awards',match:p=>p==='/prestasi'},
    {name:'profile',match:p=>p==='/profile'},
    {name:'orders',match:p=>p==='/pesanan'},
    {name:'store',match:p=>p==='/toko'||p==='/shop'},
    {name:'organizer',match:p=>p==='/organizer'},
    {name:'admin',match:p=>p==='/admin'},
    {name:'verify',match:p=>/^\/verifikasi\/[^/]+$/.test(p)},
  ];
  function parse(path){
    const clean=decodeURIComponent((path||'/').split('?')[0].replace(/\/+$/,'')||'/');
    const found=routes.find(r=>r.match(clean));
    if(!found)return {name:'not_found',params:{},query:window.SYKA_UTILS.queryParams()};
    const seg=clean.split('/').filter(Boolean);const params={};
    if(found.name==='competition'||found.name==='registration')params.slug=seg[1];
    if(found.name==='attempt')params.attemptId=seg[1];
    if(found.name==='verify')params.code=seg[1];
    return {name:found.name,params,query:window.SYKA_UTILS.queryParams()};
  }
  function href(path,query={}){const cfg=window.SYKA_CONFIG;const u=new URL(window.location.href);u.pathname=cfg.APP_PAGE;u.search='';u.hash='';u.searchParams.set('route',path);Object.entries(query||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')u.searchParams.set(k,String(v));});return u.pathname+u.search;}
  function navigate(path,query={}){history.pushState({},'',href(path,query));return render();}
  async function render(){
    const parsed=parse(window.SYKA_UTILS.routePath());window.SYKA_STATE.patch('route',parsed);
    window.SYKA_SIDEBAR?.render?.();window.SYKA_HEADER?.render?.();window.SYKA_BOTTOMNAV?.render?.();
    const fallback=document.getElementById('blogger-content');if(fallback)fallback.style.display=parsed.name==='not_found'?'block':'none';
    const root=document.getElementById('page-root');if(!root)return;root.innerHTML='<div class="page-loading"><div class="loading-spinner"></div><span>Memuat halaman…</span></div>';
    try{
      if(parsed.name==='home')return await window.SYKA_PAGE_HOME.render(root);
      if(parsed.name==='lomba')return await window.SYKA_PAGE_LOMBA.render(root);
      if(parsed.name==='competition')return await window.SYKA_PAGE_COMPETITION.render(root,parsed.params.slug);
      if(parsed.name==='registration')return await window.SYKA_PAGE_REGISTRATION.render(root,parsed.params.slug);
      if(parsed.name==='profile')return await window.SYKA_PAGE_PROFILE.render(root);
      if(parsed.name==='leaderboard')return await window.SYKA_PAGE_LEADERBOARD.render(root);
      if(parsed.name==='awards')return await window.SYKA_PAGE_AWARDS.render(root);
      if(parsed.name==='orders')return await window.SYKA_PAGE_ORDERS.render(root);
      if(parsed.name==='store')return await window.SYKA_PAGE_STORE.render(root);
      if(parsed.name==='verify')return await window.SYKA_PAGE_VERIFY.render(root,parsed.params.code);
      if(parsed.name==='organizer')return await window.SYKA_PAGE_ORGANIZER.render(root);
      if(parsed.name==='admin')return await window.SYKA_PAGE_ADMIN.render(root);
      return window.SYKA_PAGE_PLACEHOLDER.render(root,'Halaman tidak ditemukan','Route aplikasi tidak dikenali. Gunakan navigasi Sykabelajar untuk kembali ke halaman yang tersedia.');
    }catch(error){console.error('[Sykabelajar] route render failed',error);root.innerHTML=window.SYKA_EMPTY.render({title:'Halaman gagal dimuat',text:error.message||'Terjadi kesalahan saat memuat halaman.',actionHtml:'<button class="btn btn-primary" id="route-retry">Coba lagi</button>'});document.getElementById('route-retry')?.addEventListener('click',()=>render());}
  }
  function refresh(){return render();}
  window.addEventListener('popstate',render);window.addEventListener('hashchange',render);window.SYKA_ROUTER={parse,href,navigate,render,refresh};
})();


/* src/core/app.js */
(function(){
  let authSubscription=null;let authBootstrapped=false;
  async function bootstrapAuth(){
    if(authBootstrapped)return;authBootstrapped=true;const client=window.SYKA_SUPABASE.get();
    const result=client.auth.onAuthStateChange((event,session)=>{if(event==='INITIAL_SESSION'&&!session)return;setTimeout(()=>hydrate(session,event),0);});
    authSubscription=result?.data?.subscription||null;
    try{const session=await window.SYKA_AUTH_SERVICE.getSession();if(session)await hydrate(session,'SESSION_RESTORED');else{window.SYKA_STATE.patch('auth.status','anonymous');refreshAuthChrome();}}
    catch(error){console.warn('[Sykabelajar] session bootstrap',error);const current=window.SYKA_STATE.getState();if(!current.auth.user){window.SYKA_STATE.patch('auth.status','anonymous');refreshAuthChrome();}}
  }
  function refreshAuthChrome(){window.SYKA_SIDEBAR?.render?.();window.SYKA_HEADER?.render?.();window.SYKA_BOTTOMNAV?.render?.();}
  async function hydrate(session,event){const current=window.SYKA_STATE.getState();
    if(session?.user){
      window.SYKA_STATE.patch('auth.session',session);window.SYKA_STATE.patch('auth.user',session.user);window.SYKA_STATE.patch('auth.status','authenticated');
      try{const [profile,roles]=await Promise.all([window.SYKA_PROFILE_SERVICE.getMe(session.user.id),window.SYKA_PROFILE_SERVICE.getRoles(session.user.id)]);window.SYKA_STATE.patch('auth.profile',profile);window.SYKA_STATE.patch('auth.roles',roles.roles||[]);window.SYKA_STATE.patch('auth.permissions',roles.permissions||[]);}catch(error){console.warn('[Sykabelajar] profile hydration',error);}
      refreshAuthChrome();if(event==='PASSWORD_RECOVERY')window.SYKA_APP.openPasswordRecovery?.();return;
    }
    if(event==='SIGNED_OUT'){window.SYKA_STATE.resetUserState();refreshAuthChrome();}
    else if(!current.auth.user){window.SYKA_STATE.patch('auth.status','anonymous');refreshAuthChrome();}
  }
  function openAuth(mode='login',opts={}){const target=opts.target||window.SYKA_UTILS.routePath();const isRegister=mode==='register';const classes=[['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];const gradeOptions=classes.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    window.SYKA_MODAL.open({title:isRegister?'Buat akun Sykabelajar':'Masuk ke Sykabelajar',wide:true,html:`<div class="auth-tabs"><button type="button" class="auth-tab ${!isRegister?'active':''}" data-mode="login">Masuk</button><button type="button" class="auth-tab ${isRegister?'active':''}" data-mode="register">Daftar</button></div><form id="auth-form" class="form-card auth-form">${isRegister?`<div class="form-grid-2"><label>Nama lengkap *<input id="auth-name" required autocomplete="name"></label><label>Username *<input id="auth-username" required autocomplete="username" pattern="[A-Za-z0-9._-]{3,30}"><small class="field-help">3–30 karakter, tanpa spasi.</small></label></div><div class="form-grid-2"><label>Email *<input id="auth-email" type="email" required autocomplete="email"></label><label>Password *<div class="password-field"><input id="auth-password" type="password" required minlength="6" autocomplete="new-password"><button type="button" class="password-toggle" data-target="auth-password">Lihat</button></div></label></div><div class="form-grid-2"><label>Tanggal lahir *<div class="date-control"><input id="auth-birth" type="date" required></div></label><label>Kelas *<select id="auth-grade" required>${gradeOptions}</select></label></div><div class="form-grid-2"><label>Sekolah *<input id="auth-school" required placeholder="Ketik nama sekolah"></label><label>Pembina / guru pendamping<input id="auth-guardian" placeholder="Opsional"></label></div><div id="auth-school-suggest" class="suggest-list hidden"></div><div class="form-hint">Sekolah akan dinormalisasi menjadi huruf kapital di database. Pilih rekomendasi bila tersedia agar data lebih rapi.</div>`:`<div class="form-grid-2"><label>Email *<input id="auth-email" type="email" required autocomplete="email"></label><label>Password *<div class="password-field"><input id="auth-password" type="password" required minlength="6" autocomplete="current-password"><button type="button" class="password-toggle" data-target="auth-password">Lihat</button></div></label></div><button type="button" class="link-button" id="forgot-password">Lupa password?</button>`}<button class="btn btn-primary btn-block" type="submit">${isRegister?'Daftar':'Masuk'}</button><div id="auth-feedback"></div></form>`,onOpen:body=>{
      body.querySelectorAll('.auth-tab').forEach(btn=>btn.onclick=()=>openAuth(btn.dataset.mode,opts));body.querySelectorAll('.password-toggle').forEach(btn=>btn.onclick=()=>{const input=body.querySelector('#'+btn.dataset.target);input.type=input.type==='password'?'text':'password';btn.textContent=input.type==='password'?'Lihat':'Sembunyikan';});
      if(isRegister){const school=body.querySelector('#auth-school');const suggest=body.querySelector('#auth-school-suggest');let timer;school.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(r=>`<button type="button" data-id="${r.id}" data-name="${window.SYKA_UTILS.escapeHtml(r.name)}"><b>${window.SYKA_UTILS.escapeHtml(r.name)}</b><small>${window.SYKA_UTILS.escapeHtml([r.city,r.province].filter(Boolean).join(' · '))}</small></button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},220);});}
      body.querySelector('#auth-form').onsubmit=async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button[type="submit"]');const feedback=body.querySelector('#auth-feedback');button.disabled=true;button.innerHTML='<span class="spinner"></span> Memproses…';try{if(!isRegister){await window.SYKA_AUTH_SERVICE.signIn({email:body.querySelector('#auth-email').value.trim(),password:body.querySelector('#auth-password').value});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Login berhasil.','success');setTimeout(()=>window.SYKA_ROUTER.navigate(target||'/profile'),0);}else{const authResult=await window.SYKA_AUTH_SERVICE.signUp({email:body.querySelector('#auth-email').value.trim(),password:body.querySelector('#auth-password').value,fullName:body.querySelector('#auth-name').value.trim(),username:body.querySelector('#auth-username').value.trim().toLowerCase(),grade:body.querySelector('#auth-grade').value,birthDate:body.querySelector('#auth-birth').value||null,institution:body.querySelector('#auth-school').value.trim().toUpperCase(),guardianName:body.querySelector('#auth-guardian').value.trim()||null});window.SYKA_MODAL.close();if(authResult.session){window.SYKA_TOAST.show('Akun berhasil dibuat.','success');window.SYKA_ROUTER.navigate(target||'/profile');}else{window.SYKA_MODAL.open({title:'Cek email',html:'<div class="success-panel"><div class="success-icon">✉</div><h3>Konfirmasi email</h3><p>Supabase meminta verifikasi email sebelum session dibuat. Cek inbox kamu lalu buka tautan konfirmasi.</p></div>'});}}}catch(error){button.disabled=false;button.textContent=isRegister?'Daftar':'Masuk';feedback.innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(error.message||'Terjadi kesalahan.')}</div>`;}};
      body.querySelector('#forgot-password')?.addEventListener('click',openForgotPassword);
    }});
  }
  function openForgotPassword(){window.SYKA_MODAL.open({title:'Reset password',html:`<form id="forgot-form" class="form-card"><label>Email<input id="forgot-email" type="email" required placeholder="nama@email.com"></label><button class="btn btn-primary btn-block">Kirim link reset</button><div id="forgot-feedback"></div></form>`,onOpen:body=>body.querySelector('#forgot-form').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_AUTH_SERVICE.resetPassword(body.querySelector('#forgot-email').value.trim());window.SYKA_MODAL.close();window.SYKA_TOAST.show('Link reset password dikirim jika email terdaftar.','success');}catch(error){body.querySelector('#forgot-feedback').innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(error.message)}</div>`;}}});}
  function openPasswordRecovery(){window.SYKA_MODAL.open({title:'Buat password baru',html:`<form id="recovery-form" class="form-card"><label>Password baru<div class="password-field"><input id="new-password" type="password" minlength="6" required><button class="password-toggle" type="button" data-target="new-password">Lihat</button></div></label><button class="btn btn-primary btn-block">Simpan password</button><div id="recovery-feedback"></div></form>`,onOpen:body=>{body.querySelector('.password-toggle').onclick=()=>{const i=body.querySelector('#new-password');i.type=i.type==='password'?'text':'password';body.querySelector('.password-toggle').textContent=i.type==='password'?'Lihat':'Sembunyikan';};body.querySelector('#recovery-form').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_AUTH_SERVICE.updatePassword(body.querySelector('#new-password').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Password berhasil diperbarui.','success');}catch(error){body.querySelector('#recovery-feedback').innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(error.message)}</div>`;}};}});}
  async function logout(){try{await window.SYKA_AUTH_SERVICE.signOut();window.SYKA_ROUTER.navigate('/');}catch(error){window.SYKA_TOAST.show(error.message||'Logout gagal.','error');}}
  function toggleTheme(){const current=document.documentElement.dataset.theme==='dark'?'dark':'light';const next=current==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('syka_theme',next);window.SYKA_STATE.patch('ui.theme',next);}
  function setTheme(theme){const t=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=t;window.SYKA_STATE.patch('ui.theme',t);}
  function toggleSidebar(){document.body.classList.toggle('sidebar-collapsed');localStorage.setItem('syka_sidebar',document.body.classList.contains('sidebar-collapsed')?'0':'1');}
  function toggleMobileNav(){document.body.classList.toggle('mobile-nav-open');}
  function bindInternalNavigation(){if(window.__SYKA_INTERNAL_NAV_BOUND)return;window.__SYKA_INTERNAL_NAV_BOUND=true;document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const raw=a.getAttribute('href');if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:'))return;try{const u=new URL(raw,window.location.href);if(u.origin!==window.location.origin)return;if(u.pathname===(window.SYKA_CONFIG?.APP_PAGE||'/p/app.html')){e.preventDefault();const route=u.searchParams.get('route')||window.SYKA_UTILS.routePath();const query={};u.searchParams.forEach((value,key)=>{if(key!=='route')query[key]=value;});window.SYKA_ROUTER.navigate(route||'/',query);}}catch(_){}});}
  function init(){if(window.__SYKA_APP_INITIALIZED)return;window.__SYKA_APP_INITIALIZED=true;bindInternalNavigation();setTheme(window.SYKA_UTILS.getStoredTheme());if(localStorage.getItem('syka_sidebar')==='0')document.body.classList.add('sidebar-collapsed');window.SYKA_SIDEBAR.render();window.SYKA_HEADER.render();window.SYKA_BOTTOMNAV.render();window.__SYKA_AUTH_UI_UNSUB=window.SYKA_STATE.subscribe((state,path)=>{if(path?.startsWith('auth.'))refreshAuthChrome();});document.getElementById('mobile-nav-overlay')?.addEventListener('click',toggleMobileNav);window.addEventListener('online',()=>window.SYKA_STATE.patch('network.online',true));window.addEventListener('offline',()=>{window.SYKA_STATE.patch('network.online',false);window.SYKA_TOAST.show('Koneksi internet terputus.','warning');});bootstrapAuth().finally(()=>window.SYKA_ROUTER.render());}
  window.SYKA_APP={init,openAuth,openForgotPassword,openPasswordRecovery,logout,toggleTheme,toggleSidebar,toggleMobileNav,disposeAuth:()=>authSubscription?.unsubscribe?.()};
})();
