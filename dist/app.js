/* src/core/config.js */
(function () {
  const existing = window.SYKA_CONFIG || {};
  window.SYKA_CONFIG = Object.freeze({
    APP_NAME: 'Sykabelajar.id',
    APP_VERSION: '4.2.0-frontend-dashboard-registration',
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
(function () {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  }
  function initials(name) { return (String(name || 'U').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('') || 'U').toUpperCase(); }
  function debounce(fn, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }

  function routePath() {
    const url = new URL(window.location.href);
    const configuredAppPage = window.SYKA_CONFIG?.APP_PAGE || '/p/app.html';

    // Application routes are carried by ?route=...
    const route = url.searchParams.get('route');
    if (route) return route;

    // Hash routing compatibility.
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      return window.location.hash.slice(1);
    }

    // IMPORTANT: the Blogger application page itself is the home surface
    // when there is no explicit ?route=. Without this, /p/app.html
    // becomes an unknown route and the app shows "Halaman tidak ditemukan".
    if (url.pathname === configuredAppPage) {
      return '/';
    }

    return url.pathname || '/';
  }

  function queryParams() {
    const url = new URL(window.location.href);
    const params = Object.fromEntries(url.searchParams.entries());
    if (params.route) delete params.route;
    return params;
  }
  function randomId(prefix = 'req') { return prefix + '_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function cloudinaryTransform(url, opts = {}) {
    if (!url || !url.includes('/upload/')) return url || '';
    const parts = url.split('/upload/');
    const trans = [];
    if (opts.width) trans.push(`w_${Math.round(opts.width)}`);
    if (opts.height) trans.push(`h_${Math.round(opts.height)}`);
    if (opts.crop) trans.push(`c_${opts.crop}`);
    if (opts.gravity) trans.push(`g_${opts.gravity}`);
    trans.push('q_auto', 'f_auto');
    return parts[0] + '/upload/' + trans.join(',') + '/' + parts[1];
  }
  function getStoredTheme() { return localStorage.getItem('syka_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function safeJson(value, fallback = null) { try { return JSON.parse(value); } catch (_) { return fallback; } }
  window.SYKA_UTILS = { escapeHtml, formatDate, initials, debounce, routePath, queryParams, randomId, cloudinaryTransform, getStoredTheme, safeJson };
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
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getMe(userId) {
    if (!userId) return null;
    const { data, error } = await client().from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function updateProfile(userId, payload) {
    if (!userId) throw new Error('User belum login.');
    const { data, error } = await client().from('profiles').update(payload).eq('id', userId).select('*').single();
    if (error) throw error;
    return data;
  }
  async function getRoles(userId) {
    if (!userId) return { roles: [], permissions: [] };
    const { data, error } = await client().from('user_roles').select('*').eq('user_id', userId);
    if (error) return { roles: [], permissions: [] };
    const roles = (data || []).map(x => x.role || x.role_name).filter(Boolean);
    return { roles, permissions: [] };
  }
  window.SYKA_PROFILE_SERVICE = { getMe, updateProfile, getRoles };
})();




/* src/services/competition.service.js */
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




/* src/services/registration.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getStatus(userId, competitionId) {
    if (!userId || !competitionId) return null;
    const { data, error } = await client().from('registrations').select('*').eq('user_id', userId).eq('competition_id', competitionId).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function register({ competitionId, participationKey = null }) {
    const c = client();
    const { data: userData } = await c.auth.getUser();
    if (!userData.user) throw new Error('LOGIN_REQUIRED');
    const { data, error } = await c.from('registrations').insert({ competition_id: competitionId, user_id: userData.user.id, participation_key: participationKey }).select('*').single();
    if (error) throw error;
    return data;
  }
  window.SYKA_REGISTRATION_SERVICE = { getStatus, register };
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
  const q=async(table,select='*',opts={})=>{let query=c().from(table).select(select);if(opts.eq)Object.entries(opts.eq).forEach(([k,v])=>query=query.eq(k,v));if(opts.order)query=query.order(opts.order,{ascending:opts.ascending!==false});if(opts.limit)query=query.limit(opts.limit);const{data,error}=await query;if(error)throw error;return data||[];};
  async function listUsers({search='',limit=100}={}){let query=c().from('profiles').select('id,username,full_name,grade,institution,avatar_url,status,created_at,updated_at').order('created_at',{ascending:false}).limit(limit);if(search.trim())query=query.or(`username.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%,institution.ilike.%${search.trim()}%`);const{data,error}=await query;if(error)throw error;if(!data?.length)return[];const ids=data.map(x=>x.id);const{data:roles,error:re}=await c().from('user_roles').select('user_id,role,is_active').in('user_id',ids);if(re)throw re;const map={};(roles||[]).forEach(r=>(map[r.user_id]??=[]).push(r));return data.map(p=>({...p,roles:map[p.id]||[]}));}
  async function setUserStatus(id,status,reason){const{data,error}=await c().rpc('admin_set_user_status',{p_user_id:id,p_status:status,p_reason:reason||null});if(error)throw error;return data;}
  async function setUserRole(id,role,active=true,reason){const{data,error}=await c().rpc('admin_set_user_role',{p_user_id:id,p_role:role,p_active:active,p_reason:reason||null});if(error)throw error;return data;}
  async function listCompetitionsAdmin({search='',status='',limit=100}={}){let qy=c().from('competitions').select('id,organizer_id,title,slug,category,status,registration_starts_at,registration_ends_at,starts_at,ends_at,announcement_at,poster_url,visibility,created_at').order('created_at',{ascending:false}).limit(limit);if(search.trim())qy=qy.or(`title.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function transitionCompetition(id,status,reason){const{data,error}=await c().rpc('transition_competition',{p_competition_id:id,p_to_status:status,p_reason:reason||null});if(error)throw error;return data;}
  async function saveCompetition(payload,id=null){const r=id?await c().from('competitions').update(payload).eq('id',id).select('*').single():await c().from('competitions').insert(payload).select('*').single();if(r.error)throw r.error;return r.data;}
  async function listQuestionBanks({organizerId=null}={}){let qy=c().from('question_banks').select('*').order('created_at',{ascending:false});if(organizerId)qy=qy.eq('organizer_id',organizerId);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function saveQuestionBank(payload,id=null){const r=id?await c().from('question_banks').update(payload).eq('id',id).select('*').single():await c().from('question_banks').insert(payload).select('*').single();if(r.error)throw r.error;return r.data;}
  async function listQuestions({competitionId=null,bankId=null}={}){let qy=c().from('questions').select('id,question_bank_id,competition_id,type,prompt,points,required,display_order,status,config,created_at').order('display_order',{ascending:true});if(competitionId)qy=qy.eq('competition_id',competitionId);if(bankId)qy=qy.eq('question_bank_id',bankId);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function saveQuestion(payload,id=null){const r=id?await c().from('questions').update(payload).eq('id',id).select('*').single():await c().from('questions').insert(payload).select('*').single();if(r.error)throw r.error;return r.data;}
  async function listOptions(questionId){return q('question_options','*',{eq:{question_id:questionId},order:'display_order'});}
  async function replaceOptions(questionId,opts){const{error:de}=await c().from('question_options').delete().eq('question_id',questionId);if(de)throw de;if(opts?.length){const{error}=await c().from('question_options').insert(opts.map((o,i)=>({question_id:questionId,label:o.label,value:o.value,is_correct:!!o.is_correct,display_order:i})));if(error)throw error;}}
  async function listRegistrations({competitionId=null,status=''}={}){let qy=c().from('registrations').select('id,competition_id,user_id,status,twibbon_asset_url,social_proof_url,submitted_at,approved_at,rejected_at,rejection_reason,metadata,profiles:user_id(id,username,full_name,grade,institution,avatar_url),competitions:competition_id(id,title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function reviewRegistration(id,decision,reason){const{data,error}=await c().rpc('review_registration',{p_registration_id:id,p_decision:decision,p_reason:reason||null});if(error)throw error;return data;}
  async function listAttempts({competitionId=null,status=''}={}){let qy=c().from('attempts').select('id,competition_id,participant_id,registration_id,attempt_number,status,started_at,expires_at,submitted_at,finalized_at,score,profiles:participant_id(id,username,full_name,grade,institution),competitions:competition_id(id,title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listGradingItems(attemptId){return q('grading_items','*',{eq:{attempt_id:attemptId},order:'created_at'});}
  async function saveGrade(payload,id=null){const r=id?await c().from('grading_items').update(payload).eq('id',id).select('*').single():await c().from('grading_items').insert(payload).select('*').single();if(r.error)throw r.error;return r.data;}
  async function finalizeAttempt(attemptId,score){const{data,error}=await c().from('attempts').update({score:Number(score)||0,status:'FINALIZED',finalized_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',attemptId).select('*').single();if(error)throw error;return data;}
  async function listAwards({competitionId=null}={}){let qy=c().from('awards').select('id,user_id,competition_id,rank_code,title,points,emblem_url,issued_at,visibility,profiles:user_id(full_name,username),competitions:competition_id(title)').order('issued_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listCertificates({competitionId=null,status=''}={}){let qy=c().from('certificates').select('id,user_id,competition_id,status,current_revision,created_at,updated_at,profiles:user_id(full_name,username),competitions:competition_id(title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function updateCertificate(id,status){const{data,error}=await c().from('certificates').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listOrders({status=''}={}){let qy=c().from('orders').select('id,user_id,status,subtotal,discount,shipping_cost,total,currency,created_at,updated_at,profiles:user_id(full_name,username)').order('created_at',{ascending:false});if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function updateOrder(id,status){const{data,error}=await c().from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}

  async function listLevels(competitionId){return q('competition_levels','*',{eq:{competition_id:competitionId},order:'created_at'});}
  async function saveLevel(payload,id=null){const r=id?await c().from('competition_levels').update(payload).eq('id',id).select('*').single():await c().from('competition_levels').insert(payload).select('*').single();if(r.error)throw r.error;return r.data;}
  async function getRegistrationRules(competitionId){const{data,error}=await c().from('registration_rules').select('*').eq('competition_id',competitionId).maybeSingle();if(error)throw error;return data;}
  async function saveRegistrationRules(payload,competitionId){const r=await c().from('registration_rules').upsert({...payload,competition_id:competitionId},{onConflict:'competition_id'}).select('*').single();if(r.error)throw r.error;return r.data;}
  async function listRewards(competitionId){return q('competition_rewards','*',{eq:{competition_id:competitionId},order:'created_at'});}
  async function saveReward(payload,id=null){const r=id?await c().from('competition_rewards').update(payload).eq('id',id).select('*').single():await c().from('competition_rewards').insert(payload).select('*').single();if(r.error)throw r.error;return r.data;}
  async function createCertificate(payload){const{data,error}=await c().from('certificates').insert(payload).select('*').single();if(error)throw error;return data;}
  async function moderateQuestion(id,status){const{data,error}=await c().from('questions').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listTwibbonTemplates({competitionId=null,organizerId=null}={}){let qy=c().from('twibbon_templates').select('*').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(organizerId)qy=qy.eq('organizer_id',organizerId);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function saveTwibbonTemplate(payload,id=null){const r=id?await c().from('twibbon_templates').update(payload).eq('id',id).select('*').single():await c().from('twibbon_templates').insert(payload).select('*').single();if(r.error)throw r.error;return r.data;}
  async function listModeration(){const[{data:posts,error:pe},{data:comments,error:ce},{data:reports,error:re}]=await Promise.all([c().from('posts').select('id,title,status,created_at,author_user_id').order('created_at',{ascending:false}).limit(50),c().from('comments').select('id,body,moderation_state,created_at,user_id').order('created_at',{ascending:false}).limit(50),c().from('comment_reports').select('id,comment_id,reason,status,created_at').order('created_at',{ascending:false}).limit(50)]);if(pe)throw pe;if(ce)throw ce;if(re)throw re;return{posts:posts||[],comments:comments||[],reports:reports||[]};}
  async function moderatePost(id,status){const{data,error}=await c().from('posts').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function moderateComment(id,state){const{data,error}=await c().from('comments').update({moderation_state:state,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listPlans(){return q('organizer_plans','*',{order:'created_at',ascending:false});}
  async function listEntitlements(){return q('plan_entitlements','*',{order:'plan_code'});}
  async function saveEntitlement(payload,id=null){const r=id?await c().from('plan_entitlements').update(payload).eq('id',id).select('*').single():await c().from('plan_entitlements').insert(payload).select('*').single();if(r.error)throw r.error;return r.data;}
  async function listFlags(){return q('feature_flags','*',{order:'key'});}
  async function setFlag(key,enabled,config={}){const{data,error}=await c().from('feature_flags').upsert({key,enabled,config,updated_at:new Date().toISOString()},{onConflict:'key'}).select('*').single();if(error)throw error;return data;}
  async function listSettings(){return q('global_settings','*',{order:'key'});}
  async function setSetting(key,value){const{data,error}=await c().from('global_settings').upsert({key,value,updated_at:new Date().toISOString()},{onConflict:'key'}).select('*').single();if(error)throw error;return data;}
  async function listAudit({limit=100,action=''}={}){let qy=c().from('audit_logs').select('*').order('created_at',{ascending:false}).limit(limit);if(action)qy=qy.ilike('action',`%${action}%`);const{data,error}=await qy;if(error)throw error;return data||[];}
  window.SYKA_CONTROL_SERVICE={q,listUsers,setUserStatus,setUserRole,listCompetitionsAdmin,transitionCompetition,saveCompetition,listLevels,saveLevel,getRegistrationRules,saveRegistrationRules,listRewards,saveReward,createCertificate,listQuestionBanks,saveQuestionBank,listQuestions,saveQuestion,listOptions,replaceOptions,listRegistrations,reviewRegistration,listAttempts,listGradingItems,saveGrade,finalizeAttempt,listAwards,listCertificates,updateCertificate,listOrders,updateOrder,listTwibbonTemplates,saveTwibbonTemplate,listModeration,moderatePost,moderateComment,moderateQuestion,listPlans,listEntitlements,saveEntitlement,listFlags,setFlag,listSettings,setSetting,listAudit};
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
  function render(){
    const auth=window.SYKA_STATE.getState().auth;
    const u=auth.user; const p=auth.profile||{};
    const name=p.full_name||p.name||u?.user_metadata?.full_name||u?.email?.split('@')[0]||'Pengguna';
    const avatar=p.avatar_url||u?.user_metadata?.avatar_url||''; const initial=window.SYKA_UTILS.initials(name);
    const isAdmin=auth.roles.includes('admin'); const isOrganizer=auth.roles.includes('organizer_member');
    document.getElementById('syka-header').innerHTML=`<div class="header-left"><button class="mobile-menu" id="mobile-menu-btn" aria-label="Menu">☰</button></div><div class="header-center"><div class="announcement"><span class="announcement-icon">◉</span><span>Kompetisi, prestasi, dan pengalaman belajar dalam satu tempat.</span></div></div><div class="header-right"><button class="theme-btn" id="theme-btn" title="Ganti tema">◐</button>${u?`<div class="profile-quick"><button id="profile-quick-btn" class="profile-trigger">${avatar?`<img src="${window.SYKA_UTILS.escapeHtml(avatar)}" alt="">`:`<span>${initial}</span>`}<span class="profile-name-role"><b>${window.SYKA_UTILS.escapeHtml(name)}</b><small>${window.SYKA_UTILS.escapeHtml(auth.roles[0]||'Pelajar')}</small></span></button><div id="profile-menu" class="profile-menu hidden">${isAdmin?`<a href="${window.SYKA_ROUTER.href('/admin')}">Panel Admin</a>`:''}${isOrganizer||isAdmin?`<a href="${window.SYKA_ROUTER.href('/organizer')}">Panel Penyelenggara</a>`:''}<a href="${window.SYKA_ROUTER.href('/profile')}">Profil Saya</a><a href="${window.SYKA_ROUTER.href('/prestasi')}">Prestasi</a><a href="${window.SYKA_ROUTER.href('/pesanan')}">Pesanan</a><button id="logout-btn">Keluar</button></div></div>`:`<button class="btn btn-primary btn-sm" id="header-login">Masuk</button>`}</div>`; bind(); }
  function bind(){ document.getElementById('theme-btn')?.addEventListener('click',()=>window.SYKA_APP.toggleTheme()); document.getElementById('mobile-menu-btn')?.addEventListener('click',()=>window.SYKA_APP.toggleMobileNav()); document.getElementById('header-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login')); const t=document.getElementById('profile-quick-btn'); const m=document.getElementById('profile-menu'); if(t&&m){t.onclick=e=>{e.stopPropagation();m.classList.toggle('hidden');}; if(!window.__SYKA_PROFILE_MENU_BOUND){window.__SYKA_PROFILE_MENU_BOUND=true;document.addEventListener('click',e=>{if(!e.target.closest('.profile-quick'))document.getElementById('profile-menu')?.classList.add('hidden');});}} document.getElementById('logout-btn')?.addEventListener('click',()=>window.SYKA_APP.logout()); }
  window.SYKA_HEADER={render};
})();


/* src/components/Sidebar.js */
(function(){
  function render(){
    const auth=window.SYKA_STATE.getState().auth; const path=window.SYKA_UTILS.routePath(); const isAdmin=auth.roles.includes('admin'); const isOrganizer=auth.roles.includes('organizer_member');
    const items=[['/','Beranda','⌂'],['/lomba','Lomba','◈'],['/juara','Juara','♛'],['/prestasi','Prestasi','✦']]; if(isOrganizer||isAdmin) items.push(['/organizer','Penyelenggara','▣']); if(isAdmin) items.push(['/admin','Admin','⚙']);
    const el=document.getElementById('syka-sidebar'); el.innerHTML=`<div class="sidebar-top"><a class="brand" href="${window.SYKA_ROUTER.href('/') }" aria-label="Sykabelajar"><span class="brand-logo">S</span><div><strong>Sykabelajar.id</strong><small>Platform kompetensi</small></div></a><button id="sidebar-collapse" class="sidebar-collapse">‹</button></div><nav>${items.map(([href,label,icon])=>`<a class="side-item ${href===path?'active':''}" href="${window.SYKA_ROUTER.href(href)}"><span>${icon}</span><b>${label}</b></a>`).join('')}</nav><div class="sidebar-bottom"><button id="side-profile">${auth.user?'◎ Profil Saya':'◉ Masuk / Daftar'}</button><button id="side-theme">◐ Tema</button></div>`; document.getElementById('sidebar-collapse').onclick=()=>window.SYKA_APP.toggleSidebar(); document.getElementById('side-theme').onclick=()=>window.SYKA_APP.toggleTheme(); document.getElementById('side-profile').onclick=()=>auth.user?window.SYKA_ROUTER.navigate('/profile'):window.SYKA_APP.openAuth('login'); }
  window.SYKA_SIDEBAR={render};
})();


/* src/components/BottomNav.js */
(function(){ function render(){const u=window.SYKA_STATE.getState().auth.user; const el=document.getElementById('syka-bottom-nav'); el.innerHTML=`<a href="${window.SYKA_ROUTER.href('/')}" class="bottom-item">⌂<small>Home</small></a><a href="${window.SYKA_ROUTER.href('/lomba')}" class="bottom-item">◈<small>Lomba</small></a><a href="${window.SYKA_ROUTER.href('/juara')}" class="bottom-item">♛<small>Juara</small></a><a href="${window.SYKA_ROUTER.href(u?'/profile':'/profile')}" class="bottom-item">◎<small>${u?'Saya':'Masuk'}</small></a>`;} window.SYKA_BOTTOMNAV={render};})();




/* src/pages/Home.js */
(function(){
  function formatNumber(v){ return Number(v||0).toLocaleString('id-ID'); }
  function slideImage(url){ return window.SYKA_UTILS.cloudinaryTransform(url,{width:1100,height:560,crop:'fill'}); }
  async function render(root){
    root.innerHTML=`
      <section class="hero hero-v2">
        <div class="hero-copy">
          <span class="eyebrow">SYKABELAJAR.ID 4.1</span>
          <h1>Belajar. Berkompetisi. <em>Berprestasi.</em></h1>
          <p>Temukan kompetisi yang sesuai, ikuti prosesnya, dan bangun rekam prestasi yang bisa diverifikasi.</p>
          <div class="hero-actions"><a class="btn btn-primary" href="${window.SYKA_ROUTER.href('/lomba')}">Jelajahi Lomba →</a><a class="btn btn-ghost" href="${window.SYKA_ROUTER.href('/juara')}">Lihat Juara</a></div>
          <div class="hero-stats" id="hero-stats">
            ${['Siswa terdaftar','Sekolah terdaftar','Penerima prestasi','Juara'].map(label=>`<div class="hero-stat-card"><strong>—</strong><span>${label}</span></div>`).join('')}
          </div>
        </div>
        <div class="hero-promo" id="hero-promo"><div class="promo-placeholder"><span class="eyebrow">PROMO</span><strong>Belum ada slide promosi</strong><small>Admin dapat menambahkan banner promosi dari Panel Admin.</small></div></div>
      </section>
      <section class="section"><div class="section-head"><div><span class="eyebrow">DISCOVERY</span><h2>Lomba terbaru</h2><p>Kompetisi publik dibaca langsung dari Supabase.</p></div><a class="link-more" href="${window.SYKA_ROUTER.href('/lomba')}">Lihat semua →</a></div><div id="home-competitions" class="card-grid"></div></section>
      <section class="quick-grid"><a class="quick-card" href="${window.SYKA_ROUTER.href('/juara')}"><span>♛</span><div><b>Juara</b><small>Lihat peraih juara dari posisi 1 sampai 50.</small></div></a><a class="quick-card" href="${window.SYKA_ROUTER.href('/prestasi')}"><span>✦</span><div><b>Prestasi</b><small>Kumpulkan awards dan proof of achievement.</small></div></a><a class="quick-card" href="${window.SYKA_ROUTER.href('/verifikasi/demo')}"><span>✓</span><div><b>Verifikasi</b><small>Validasi certificate menggunakan kode publik.</small></div></a></section>`;
    const list=document.getElementById('home-competitions'); list.innerHTML=[0,1,2].map(()=>window.SYKA_SKELETON.card()).join('');
    try{ const [stats,slides,rows]=await Promise.all([
      window.SYKA_ADMIN_SERVICE.platformStats(), window.SYKA_ADMIN_SERVICE.listSlides(), window.SYKA_COMPETITION_SERVICE.list({limit:6})
    ]);
      const values=[stats.total_students,stats.total_schools,stats.total_award_recipients,stats.total_champions];
      document.querySelectorAll('#hero-stats .hero-stat-card strong').forEach((el,i)=>el.textContent=formatNumber(values[i]));
      const promo=document.getElementById('hero-promo');
      if(slides.length){
        let index=0;
        const paint=()=>{const s=slides[index%slides.length]; const img=slideImage(s.image_url); promo.innerHTML=`<div class="promo-slide"><img src="${window.SYKA_UTILS.escapeHtml(img||s.image_url||'')}" alt="${window.SYKA_UTILS.escapeHtml(s.title||'Promo')}" loading="eager"><div class="promo-overlay"><span class="eyebrow">${window.SYKA_UTILS.escapeHtml(s.badge||'INFO')}</span><strong>${window.SYKA_UTILS.escapeHtml(s.title||'Sykabelajar')}</strong>${s.subtitle?`<small>${window.SYKA_UTILS.escapeHtml(s.subtitle)}</small>`:''}${s.cta_label?`<a class="btn btn-primary btn-sm" href="${window.SYKA_UTILS.escapeHtml(s.cta_route||'/lomba')}">${window.SYKA_UTILS.escapeHtml(s.cta_label)}</a>`:''}</div><div class="promo-dots">${slides.map((_,i)=>`<button class="promo-dot ${i===index?'active':''}" data-index="${i}" aria-label="Slide ${i+1}"></button>`).join('')}</div></div>`; promo.querySelectorAll('.promo-dot').forEach(d=>d.onclick=()=>{index=Number(d.dataset.index);paint();});};
        paint(); if(slides.length>1) setInterval(()=>{index=(index+1)%slides.length;paint();},5000);
      }
      list.innerHTML=rows.length?rows.map(window.SYKA_COMPETITION_CARD.render).join(''):window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Tambahkan kompetisi publik dari panel organizer/admin.',actionHtml:`<a class="btn btn-ghost btn-sm" href="${window.SYKA_ROUTER.href('/lomba')}">Buka katalog</a>`});
    }catch(e){
      document.querySelectorAll('#hero-stats .hero-stat-card strong').forEach(el=>el.textContent='—');
      document.getElementById('home-competitions').innerHTML=window.SYKA_EMPTY.render({title:'Katalog belum tersambung',text:'Statistik dan kompetisi akan muncul otomatis setelah view publik Supabase siap.',actionHtml:'<button class="btn btn-ghost btn-sm" id="retry-home">Coba lagi</button>'});
      document.getElementById('retry-home')?.addEventListener('click',()=>window.SYKA_ROUTER.refresh());
    }
  }
  window.SYKA_PAGE_HOME={render};
})();


/* src/pages/Lomba.js */
(function(){ async function render(root){root.innerHTML=`<div class="section-head page-title"><div><span class="eyebrow">COMPETITION DISCOVERY</span><h1>Semua Lomba</h1><p>Filter dan status akan mengikuti read model Supabase.</p></div></div><div class="filter-row"><button class="filter-chip active">Semua</button><button class="filter-chip">SD</button><button class="filter-chip">SMP</button><button class="filter-chip">SMA</button></div><div id="competition-list" class="card-grid"></div>`;const list=document.getElementById('competition-list');list.innerHTML=[0,1,2,3].map(()=>window.SYKA_SKELETON.card()).join('');try{const rows=await window.SYKA_COMPETITION_SERVICE.list({limit:20});list.innerHTML=rows.length?rows.map(window.SYKA_COMPETITION_CARD.render).join(''):window.SYKA_EMPTY.render({title:'Belum ada lomba publik',text:'Tambahkan data competitions dan RLS public-read untuk mengisi katalog.'});}catch(e){list.innerHTML=window.SYKA_EMPTY.render({title:'Belum terhubung ke katalog',text:'Frontend sudah aktif tetapi query competitions belum berhasil.',actionHtml:'<button class="btn btn-ghost btn-sm" id="retry-lomba">Coba lagi</button>'});document.getElementById('retry-lomba')?.addEventListener('click',()=>window.SYKA_ROUTER.refresh());}}
window.SYKA_PAGE_LOMBA={render};})();




/* src/pages/Competition.js */
(function(){
 async function render(root, slug){ root.innerHTML=`<div id="competition-detail" class="page-loading"></div>`; try{ const c=await window.SYKA_COMPETITION_SERVICE.getBySlug(slug); if(!c){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Slug yang kamu buka tidak memiliki data publik di Supabase.',actionHtml:`<a class="btn btn-primary btn-sm" href="${window.SYKA_ROUTER.href('/lomba')}">Kembali ke Lomba</a>`});return;} window.SYKA_STATE.patch('competition.current',c); const u=window.SYKA_UTILS; const poster=u.cloudinaryTransform(c.poster,{width:1200,crop:'fill'}); const auth=window.SYKA_STATE.getState().auth; let registration=null; if(auth.user){try{registration=await window.SYKA_REGISTRATION_SERVICE.getStatus(auth.user.id,c.id);}catch(_){}} const regLabel=registration?.status==='APPROVED'||registration?.status==='ACTIVE'?'Sudah Terdaftar':registration?.status==='PENDING'?'Menunggu Persetujuan':'Daftar Sekarang'; root.innerHTML=`<section class="detail-hero"><div class="detail-cover">${poster?`<img src="${u.escapeHtml(poster)}" alt="">`:`<div class="media-fallback tall">Sykabelajar</div>`}</div><div class="detail-main"><span class="chip chip-purple">${u.escapeHtml(c.category)}</span><h1>${u.escapeHtml(c.title)}</h1><p>${u.escapeHtml(c.description||'Informasi lengkap kompetisi, timeline, eligibility, reward, dan mekanisme pendaftaran.')}</p><div class="detail-actions"><a class="btn btn-primary" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug)+'/daftar')}">${regLabel}</a><button class="btn btn-ghost" id="juknis-btn">Lihat Juknis</button></div><div class="detail-stats"><div><small>Pendaftaran</small><b>${u.formatDate(c.registrationEndsAt)}</b></div><div><small>Mulai</small><b>${u.formatDate(c.startsAt)}</b></div><div><small>Status</small><b>${u.escapeHtml(String(c.status).replaceAll('_',' '))}</b></div></div></div></section><section class="detail-grid"><div class="syka-card prose-card"><h2>Timeline & ketentuan</h2><div class="timeline"><div><span>01</span><b>Pendaftaran</b><small>${u.formatDate(c.registrationStartsAt)} — ${u.formatDate(c.registrationEndsAt)}</small></div><div><span>02</span><b>Pelaksanaan</b><small>${u.formatDate(c.startsAt)} — ${u.formatDate(c.endsAt)}</small></div><div><span>03</span><b>Pengumuman</b><small>Mengikuti konfigurasi kompetisi di backend.</small></div></div></div><aside class="syka-card prose-card"><h2>Reward</h2><p>Reward, emblem, points, dan certificate berasal dari konfigurasi competition backend; frontend tidak hard-code nilai final.</p><a class="btn btn-primary btn-block" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug)+'/daftar')}">Lanjutkan</a></aside></section>`; document.getElementById('juknis-btn').onclick=()=>window.SYKA_MODAL.open({title:'Juknis',html:'<div class="document-placeholder"><b>PDF viewer siap dipasang.</b><p>URL asset Juknis diambil dari Supabase/Cloudinary ketika kolom asset sudah tersedia di backend.</p></div>'}); }catch(e){root.innerHTML=window.SYKA_EMPTY.render({title:'Gagal memuat kompetisi',text:e.message,actionHtml:'<button class="btn btn-ghost btn-sm" id="retry-c">Coba lagi</button>'});document.getElementById('retry-c')?.addEventListener('click',()=>window.SYKA_ROUTER.refresh());}}
 window.SYKA_PAGE_COMPETITION={render};
})();




/* src/pages/Registration.js */
(function(){
  const classes=[['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];
  function options(selected){return classes.map(([v,l])=>`<option value="${v}" ${selected===v?'selected':''}>${l}</option>`).join('');}
  async function render(root,slug){
    const c=await window.SYKA_COMPETITION_SERVICE.getBySlug(slug); if(!c){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Periksa kembali slug kompetisi.'});return;}
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){root.innerHTML=`<div class="auth-gate"><div><h1>Daftar kompetisi</h1><p>Kamu perlu memiliki akun Sykabelajar sebelum mendaftar.</p><button class="btn btn-primary" id="reg-login">Masuk / Daftar</button></div></div>`;document.getElementById('reg-login').onclick=()=>window.SYKA_APP.openAuth('register',{target:window.SYKA_UTILS.routePath()});return;}
    const p=auth.profile||{};
    root.innerHTML=`<div class="form-page"><div class="form-intro"><span class="eyebrow">REGISTRATION</span><h1>Daftar ${window.SYKA_UTILS.escapeHtml(c.title)}</h1><p>Lengkapi data peserta. Data akun utama digunakan untuk seluruh proses kompetisi dan rekam prestasi.</p></div><form id="competition-registration-form" class="syka-card form-card"><div class="form-grid-2"><label>Nama lengkap *<input id="rg-name" required value="${window.SYKA_UTILS.escapeHtml(p.full_name||'')}"></label><label>Username *<input id="rg-username" required value="${window.SYKA_UTILS.escapeHtml(p.username||'')}"></label></div><div class="form-grid-2"><label>Email *<input id="rg-email" type="email" required value="${window.SYKA_UTILS.escapeHtml(auth.user.email||'')}" readonly></label><div class="state-banner">Password dikelola melalui akun Sykabelajar dan tidak perlu dimasukkan ulang saat mendaftar lomba.</div></div><div class="form-grid-2"><label>Tanggal lahir *<input id="rg-birth" type="date" required value="${window.SYKA_UTILS.escapeHtml(p.birth_date||'')}"></label><label>Kelas *<select id="rg-grade" required>${options(p.grade||'')}</select></label></div><div class="form-grid-2"><label>Sekolah *<input id="rg-school" required value="${window.SYKA_UTILS.escapeHtml(p.institution||'')}" placeholder="Mulai ketik nama sekolah"></label><label>Pembina / guru pendamping <input id="rg-guardian" value="${window.SYKA_UTILS.escapeHtml(p.guardian_name||'')}"></label></div><div id="rg-school-suggest" class="suggest-list hidden"></div><div class="state-banner">Nama sekolah akan disimpan dalam format kapital/uppercase. Jika ditemukan sekolah yang mirip, pilih rekomendasi agar data sekolah lebih konsisten.</div><div class="form-actions"><a class="btn btn-ghost" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(slug))}">Kembali</a><button class="btn btn-primary">Daftar sekarang</button></div><div id="rg-feedback"></div></form></div>`;
    const school=document.getElementById('rg-school'),suggest=document.getElementById('rg-school-suggest'); let timer; let selectedSchoolId=p.school_id||null;school.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(s=>`<button type="button" data-id="${window.SYKA_UTILS.escapeHtml(s.id)}" data-name="${window.SYKA_UTILS.escapeHtml(s.name)}">${window.SYKA_UTILS.escapeHtml(s.name)}${s.city?`<small>${window.SYKA_UTILS.escapeHtml(s.city)}</small>`:''}</button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;selectedSchoolId=b.dataset.id||null;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},250);});
    document.getElementById('competition-registration-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,feedback=document.getElementById('rg-feedback');const payload={full_name:f.querySelector('#rg-name').value.trim(),username:f.querySelector('#rg-username').value.trim().toLowerCase(),birth_date:f.querySelector('#rg-birth').value||null,grade:f.querySelector('#rg-grade').value,institution:f.querySelector('#rg-school').value.trim().toUpperCase(),school_id:selectedSchoolId,guardian_name:f.querySelector('#rg-guardian').value.trim()||null};try{const updated=await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,payload);window.SYKA_STATE.patch('auth.profile',updated);const reg=await window.SYKA_REGISTRATION_SERVICE.register({competitionId:c.id});feedback.innerHTML='<div class="state-banner success">Data peserta tersimpan dan pendaftaran berhasil dikirim.</div>';f.querySelector('button.btn-primary').disabled=true;window.SYKA_TOAST.show('Pendaftaran berhasil dikirim.','success');return reg;}catch(err){feedback.innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(err.message||'Pendaftaran gagal.')}</div>`;}};
  }
  window.SYKA_PAGE_REGISTRATION={render};
})();


/* src/pages/Profile.js */
(function(){
  function escape(v){return window.SYKA_UTILS.escapeHtml(v);}
  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){root.innerHTML=`<div class="auth-gate"><div><h1>Profil Saya</h1><p>Masuk untuk mengelola profil dan rekam prestasi.</p><button class="btn btn-primary" id="profile-login">Masuk</button></div></div>`;document.getElementById('profile-login').onclick=()=>window.SYKA_APP.openAuth('login',{target:'/profile'});return;}
    const p=auth.profile||{};const name=p.full_name||auth.user.email?.split('@')[0]||'Pengguna';const avatar=p.avatar_url||'';
    root.innerHTML=`<div class="section-head page-title"><div><span class="eyebrow">ACCOUNT</span><h1>Profil Saya</h1><p>Kelola data identitas, sekolah, dan foto profil.</p></div></div><div class="profile-layout"><aside class="syka-card profile-card"><div class="profile-avatar" id="profile-avatar">${avatar?`<img src="${escape(avatar)}" alt="">`:escape(window.SYKA_UTILS.initials(name))}</div><h1>${escape(name)}</h1><p>${escape(p.username?`@${p.username}`:auth.user.email||'')}</p><button class="btn btn-primary btn-block" id="change-avatar">Ubah foto profil</button><small class="profile-help">Maks. 5 MB · JPG/PNG/WebP</small></aside><section class="profile-main"><form id="profile-form" class="syka-card form-card"><div class="form-grid-2"><label>Nama lengkap<input id="pf-name" required value="${escape(p.full_name||'')}"></label><label>Username<input id="pf-username" required value="${escape(p.username||'')}"></label></div><div class="form-grid-2"><label>Tanggal lahir<input id="pf-birth" type="date" required value="${escape(p.birth_date||'')}"></label><label>Kelas<select id="pf-grade" required></select></label></div><div class="form-grid-2"><label>Sekolah<input id="pf-school" required value="${escape(p.institution||'')}" placeholder="Mulai ketik nama sekolah"></label><label>Pembina / guru pendamping<input id="pf-guardian" value="${escape(p.guardian_name||'')}"></label></div><div id="school-suggest" class="suggest-list hidden"></div><label>Bio<textarea id="pf-bio">${escape(p.bio||'')}</textarea></label><div class="form-actions"><button class="btn btn-primary">Simpan perubahan</button></div><div id="profile-feedback"></div></form></section></div>`;
    const grade=document.getElementById('pf-grade'); grade.innerHTML=['SD6','SMP1','SMP2','SMP3','SMA1','SMA2','SMA3'].map(x=>`<option value="${x}">${x.replace('SD','Kelas ').replace('SMP','Kelas ').replace('SMA','Kelas ')}</option>`).join(''); grade.value=p.grade||'SD6';
    document.getElementById('change-avatar').onclick=()=>window.SYKA_CLOUDINARY.openAvatarWidget(async info=>{try{const payload={avatar_url:info.secure_url,avatar_public_id:info.public_id,avatar_width:info.width||null,avatar_height:info.height||null,avatar_version:info.version?String(info.version):null,avatar_resource_type:info.resource_type||'image'};const updated=await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,payload);window.SYKA_STATE.patch('auth.profile',updated);window.SYKA_HEADER.render();window.SYKA_SIDEBAR.render();document.getElementById('profile-avatar').innerHTML=`<img src="${escape(updated.avatar_url)}" alt="">`;window.SYKA_TOAST.show('Foto profil berhasil diperbarui.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Upload foto gagal.','error');}},e=>window.SYKA_TOAST.show(e.message||'Upload foto gagal.','error'));
    const schoolInput=document.getElementById('pf-school'),suggest=document.getElementById('school-suggest');let timer;let selectedSchoolId=p.school_id||null; schoolInput.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{const q=schoolInput.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(s=>`<button type="button" data-id="${escape(s.id)}" data-name="${escape(s.name)}">${escape(s.name)}${s.city?`<small>${escape(s.city)}</small>`:''}</button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{schoolInput.value=b.dataset.name;selectedSchoolId=b.dataset.id||null;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},250);});
    document.getElementById('profile-form').onsubmit=async e=>{e.preventDefault();const feedback=document.getElementById('profile-feedback');const payload={full_name:document.getElementById('pf-name').value.trim(),username:document.getElementById('pf-username').value.trim().toLowerCase(),birth_date:document.getElementById('pf-birth').value||null,grade:document.getElementById('pf-grade').value,institution:document.getElementById('pf-school').value.trim(),school_id:selectedSchoolId,guardian_name:document.getElementById('pf-guardian').value.trim()||null,bio:document.getElementById('pf-bio').value.trim()||null};try{const updated=await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,payload);window.SYKA_STATE.patch('auth.profile',updated);window.SYKA_HEADER.render();feedback.innerHTML='<div class="state-banner success">Profil berhasil disimpan.</div>';}catch(err){feedback.innerHTML=`<div class="inline-error">${escape(err.message||'Gagal menyimpan profil.')}</div>`;}};
  }
  window.SYKA_PAGE_PROFILE={render};
})();


/* src/pages/Leaderboard.js */
(function(){
  function rankLabel(n){return `#${n}`;}
  function card(r,rank,cls){const u=window.SYKA_UTILS;return `<div class="podium-card ${cls}"><div class="podium-rank">${rankLabel(rank)}</div><div class="podium-avatar">${u.escapeHtml(u.initials(r?.name||r?.full_name||'Juara'))}</div><strong>${u.escapeHtml(r?.name||r?.full_name||'Belum tersedia')}</strong><small>${u.escapeHtml(r?.grade||'')}</small><b>${Number(r?.xp||r?.total_xp||0).toLocaleString('id-ID')} XP</b></div>`;}
  async function render(root){
    root.innerHTML=`<div class="section-head page-title"><div><span class="eyebrow">JUARA</span><h1>Top 50 Juara</h1><p>Peringkat lengkap akan diaktifkan setelah read model leaderboard stabil.</p></div></div><div class="coming-soon-banner"><b>Peringkat akan hadir bertahap</b><span>Tampilan juara sudah disiapkan. Data resmi akan ditampilkan ketika leaderboard backend diaktifkan.</span></div><section class="podium-grid"><div id="podium-1">${card(null,1,'gold')}</div><div id="podium-2">${card(null,2,'silver')}</div><div id="podium-3">${card(null,3,'bronze')}</div></section><section class="syka-card rank-table-card"><div class="rank-table-head"><strong>Juara 4–50</strong><span>10 per halaman</span></div><div id="rank-list"></div><div id="rank-pagination" class="pagination"></div></section>`;
    const list=document.getElementById('rank-list'); const paging=document.getElementById('rank-pagination');
    try{
      const rows=await window.SYKA_LEADERBOARD_SERVICE.get({scope:'global',limit:50});
      const top=rows.slice(0,3); [1,2,3].forEach((r,i)=>{document.getElementById(`podium-${r}`).innerHTML=card(top[i]||null,r,['gold','silver','bronze'][i]);});
      const lower=rows.slice(3,50); let page=1; const per=10;
      const paint=()=>{const start=(page-1)*per; const chunk=lower.slice(start,start+per); list.innerHTML=chunk.length?chunk.map((r,i)=>`<div class="rank-list-row"><b>${start+i+4}</b><div class="rank-user"><span>${window.SYKA_UTILS.initials(r.name||r.full_name||'U')}</span><div><strong>${window.SYKA_UTILS.escapeHtml(r.name||r.full_name||'Peserta')}</strong><small>${window.SYKA_UTILS.escapeHtml(r.grade||'')}</small></div></div><strong>${Number(r.xp||r.total_xp||0).toLocaleString('id-ID')} XP</strong></div>`).join(''):window.SYKA_EMPTY.render({title:'Data juara belum tersedia',text:'Tampilan siap digunakan. Backend leaderboard akan mengisi data ini.'}); const pages=Math.max(1,Math.ceil(lower.length/per)); paging.innerHTML=pages>1?`<button class="page-btn" ${page===1?'disabled':''} data-p="${page-1}">‹</button>${Array.from({length:pages},(_,i)=>`<button class="page-btn ${page===i+1?'active':''}" data-p="${i+1}">${i+1}</button>`).join('')}<button class="page-btn" ${page===pages?'disabled':''} data-p="${page+1}">›</button>`:''; paging.querySelectorAll('.page-btn').forEach(b=>b.onclick=()=>{page=Number(b.dataset.p);paint();});};
      paint();
    }catch(e){list.innerHTML=window.SYKA_EMPTY.render({title:'Peringkat segera hadir',text:'Backend leaderboard belum diaktifkan. Tampilan juara siap digunakan.'}); paging.innerHTML='';}
  }
  window.SYKA_PAGE_LEADERBOARD={render};
})();


/* src/pages/Awards.js */
(function(){async function render(root){const a=window.SYKA_STATE.getState().auth;if(!a.user){root.innerHTML='<div class="auth-gate"><div><span class="eyebrow">ACHIEVEMENTS</span><h1>Prestasi pribadi</h1><p>Masuk untuk melihat awards dan certificate.</p><button id="a-login" class="btn btn-primary">Masuk</button></div></div>';document.getElementById('a-login').onclick=()=>window.SYKA_APP.openAuth('login',{target:'/prestasi'});return;}root.innerHTML='<section class="page-title"><span class="eyebrow">ACHIEVEMENTS</span><h1>Prestasi Saya</h1><p>Awards pribadi bersifat private. Verification publik menggunakan kode terbatas.</p></section><div id="awards-grid" class="card-grid"></div>';try{const rows=await window.SYKA_AWARD_SERVICE.getAwards(a.user.id);document.getElementById('awards-grid').innerHTML=rows.length?rows.map(r=>`<article class="syka-card award-card"><span class="award-icon">✦</span><h3>${window.SYKA_UTILS.escapeHtml(r.title||r.name||'Achievement')}</h3><p>${window.SYKA_UTILS.escapeHtml(r.description||'Achievement tercatat di account.')}</p></article>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada prestasi',text:'Achievement akan muncul setelah result dan reward event difinalisasi backend.'});}catch(e){document.getElementById('awards-grid').innerHTML=window.SYKA_EMPTY.render({title:'Belum terhubung',text:'Query awards belum tersedia.'});}}
window.SYKA_PAGE_AWARDS={render};})();




/* src/pages/Orders.js */
(function(){async function render(root){const a=window.SYKA_STATE.getState().auth;if(!a.user){root.innerHTML='<div class="auth-gate"><div><span class="eyebrow">ORDERS</span><h1>Pesanan</h1><p>Masuk untuk melihat transaksi dan fulfillment.</p><button id="o-login" class="btn btn-primary">Masuk</button></div></div>';document.getElementById('o-login').onclick=()=>window.SYKA_APP.openAuth('login',{target:'/pesanan'});return;}root.innerHTML='<section class="page-title"><span class="eyebrow">COMMERCE</span><h1>Pesanan Saya</h1><p>Payment state ditentukan server setelah webhook provider terverifikasi.</p></section><div id="orders-list"></div>';try{const rows=await window.SYKA_ORDER_SERVICE.list(a.user.id);document.getElementById('orders-list').innerHTML=rows.length?rows.map(r=>`<article class="syka-card order-row"><div><strong>#${window.SYKA_UTILS.escapeHtml(r.id||'ORDER')}</strong><small>${window.SYKA_UTILS.formatDate(r.created_at)}</small></div><span class="chip chip-purple">${window.SYKA_UTILS.escapeHtml(r.status||'DRAFT')}</span></article>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada pesanan',text:'Order akan tampil setelah proses commerce digunakan.'});}catch(e){document.getElementById('orders-list').innerHTML=window.SYKA_EMPTY.render({title:'Order belum terhubung',text:'Tabel orders/RLS belum tersedia.'});}}
window.SYKA_PAGE_ORDERS={render};})();




/* src/pages/Verify.js */
(function(){async function render(root, code){root.innerHTML='<div class="verify-card syka-card"><span class="eyebrow">PUBLIC VERIFICATION</span><h1>Verifikasi Sertifikat</h1><div id="verify-body">Memeriksa kode...</div></div>';const body=document.getElementById('verify-body');if(!code){body.innerHTML='<div class="verify-form"><input id="verify-code" placeholder="Masukkan kode verifikasi"><button class="btn btn-primary" id="verify-btn">Verifikasi</button></div>';document.getElementById('verify-btn').onclick=()=>window.SYKA_ROUTER.navigate('/verifikasi/'+encodeURIComponent(document.getElementById('verify-code').value.trim()));return;}try{const row=await window.SYKA_AWARD_SERVICE.verify(code);body.innerHTML=row?`<div class="verify-success"><div class="verify-icon">✓</div><h2>Sertifikat ditemukan</h2><p>Status: <b>${window.SYKA_UTILS.escapeHtml(row.status||'PUBLISHED')}</b></p><dl><dt>Kode</dt><dd>${window.SYKA_UTILS.escapeHtml(code)}</dd><dt>Nama</dt><dd>${window.SYKA_UTILS.escapeHtml(row.recipient_name||row.name||'—')}</dd></dl></div>`:window.SYKA_EMPTY.render({title:'Kode tidak ditemukan',text:'Periksa kembali kode verifikasi.'});}catch(e){body.innerHTML=window.SYKA_EMPTY.render({title:'Verifikasi belum tersedia',text:'Public verification view belum tersedia di backend.'});}}
window.SYKA_PAGE_VERIFY={render};})();




/* src/pages/Admin.js */
(function(){
  const svc=()=>window.SYKA_CONTROL_SERVICE; const esc=v=>window.SYKA_UTILS.escapeHtml(v); const fmt=v=>window.SYKA_UTILS.formatDate(v);
  const tabs=[
    ['dashboard','Dashboard'],['users','Users'],['competitions','Competitions'],['questions','Questions'],['twibbon','Twibbon'],['results','Results'],['certificates','Certificates'],['orders','Orders'],['moderation','UGC Moderation'],['plans','Plans'],['settings','Settings'],['audit','Audit']
  ];
  function shell(tab){return `<div class="control-head"><div><span class="eyebrow">ADMIN CONTROL PLANE</span><h1>Panel Admin</h1><p>Platform-wide management, moderation, audit, settings, dan privileged workflows.</p></div></div><div class="control-tabs">${tabs.map(([k,l])=>`<a href="${window.SYKA_ROUTER.href('/admin')}&tab=${encodeURIComponent(k)}" class="control-tab ${k===tab?'active':''}" data-route-link>${l}</a>`).join('')}</div><div id="control-content"><div class="page-loading"><div class="loading-spinner"></div></div></div>`;}
  async function render(root){const auth=window.SYKA_STATE.getState().auth;if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Panel admin hanya untuk administrator.'})+'<div class="control-center"><button class="btn btn-primary" id="admin-login">Masuk</button></div>';document.getElementById('admin-login').onclick=()=>window.SYKA_APP.openAuth('login');return;}if(!auth.roles.includes('admin')){root.innerHTML=window.SYKA_EMPTY.render({title:'Akses ditolak',text:'Akun ini tidak memiliki role admin.'});return;}const tab=window.SYKA_STATE.getState().route.query.tab||'dashboard';root.innerHTML=shell(tabs.some(x=>x[0]===tab)?tab:'dashboard');root.querySelectorAll('[data-route-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const u=new URL(a.href);window.SYKA_ROUTER.navigate('/admin');const current=window.SYKA_STATE.getState().route.query;current.tab=u.searchParams.get('tab')||'dashboard';window.history.replaceState({},'',u.pathname+'&tab='+encodeURIComponent(current.tab));window.SYKA_ROUTER.refresh();}));await renderTab(document.getElementById('control-content'),tab);}
  async function renderTab(root,tab){try{if(tab==='dashboard')return dashboard(root);if(tab==='users')return users(root);if(tab==='competitions')return competitions(root);if(tab==='questions')return questions(root);if(tab==='twibbon')return twibbon(root);if(tab==='results')return results(root);if(tab==='certificates')return certificates(root);if(tab==='orders')return orders(root);if(tab==='moderation')return moderation(root);if(tab==='plans')return plans(root);if(tab==='settings')return settings(root);if(tab==='audit')return audit(root);}catch(e){root.innerHTML=window.SYKA_EMPTY.render({title:'Modul gagal dimuat',text:e.message||'Periksa migration/RLS.'});}}
  function kpis(items){return `<div class="admin-kpi-grid">${items.map(x=>`<div class="syka-card admin-kpi"><strong>${esc(x.v)}</strong><span>${esc(x.l)}</span></div>`).join('')}</div>`;}
  async function dashboard(root){const [stats,comps,regs,users,audit]=await Promise.all([window.SYKA_ADMIN_SERVICE.platformStats(),svc().listCompetitionsAdmin({limit:300}),svc().listRegistrations({}),svc().listUsers({limit:300}),svc().listAudit({limit:12})]);root.innerHTML=kpis([{v:Number(stats.total_students||0).toLocaleString('id-ID'),l:'Siswa'},{v:Number(stats.total_schools||0).toLocaleString('id-ID'),l:'Sekolah'},{v:Number(stats.total_award_recipients||0).toLocaleString('id-ID'),l:'Penerima prestasi'},{v:Number(stats.total_champions||0).toLocaleString('id-ID'),l:'Juara'}])+`<div class="control-grid-2"><section class="syka-card admin-section"><div class="admin-section-head"><div><span class="eyebrow">OVERVIEW</span><h2>Status platform</h2></div></div><div class="mini-stat-grid"><div><b>${users.length}</b><span>Users loaded</span></div><div><b>${comps.length}</b><span>Competitions</span></div><div><b>${regs.length}</b><span>Registrations</span></div><div><b>${audit.length}</b><span>Audit events</span></div></div></section><section class="syka-card admin-section"><div class="admin-section-head"><div><span class="eyebrow">AUDIT</span><h2>Aktivitas terakhir</h2></div></div>${audit.length?audit.map(a=>`<div class="admin-row"><div><strong>${esc(a.action)}</strong><small>${esc(a.entity_type)} ${esc(a.entity_id||'')}</small></div><small>${fmt(a.created_at)}</small></div>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada audit',text:'Aktivitas privileged akan muncul di sini.'})}</section></div>`;}
  async function users(root){const rows=await svc().listUsers({limit:200});root.innerHTML=`<div class="control-local-head"><div><h2>Users</h2><span>${rows.length} pengguna</span></div><input id="admin-user-search" placeholder="Cari nama, username, sekolah..." class="control-search"></div><div class="admin-table" id="admin-users">${rows.map(u=>`<div class="admin-row"><div class="row-main"><div class="avatar-mini">${u.avatar_url?`<img src="${esc(u.avatar_url)}" alt="">`:esc(window.SYKA_UTILS.initials(u.full_name))}</div><div><strong>${esc(u.full_name||u.username||'Tanpa nama')}</strong><small>@${esc(u.username||'—')} · ${esc(u.institution||'—')} · ${esc(u.grade||'—')}</small><div class="chip-row">${u.roles.map(r=>`<span class="chip">${esc(r.role)}${r.is_active?'':' (off)'}</span>`).join('')}<span class="chip ${u.status!=='ACTIVE'?'chip-warn':''}">${esc(u.status)}</span></div></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-user-status="${u.id}" data-status="${u.status==='ACTIVE'?'SUSPENDED':'ACTIVE'}">${u.status==='ACTIVE'?'Suspend':'Aktifkan'}</button><button class="btn btn-primary btn-sm" data-user-role="${u.id}">Role</button></div></div>`).join('')}</div>`;bindUserSearch(rows);root.querySelectorAll('[data-user-status]').forEach(b=>b.onclick=async()=>{try{await svc().setUserStatus(b.dataset.userStatus,b.dataset.status,'Admin control plane');window.SYKA_TOAST.show('Status pengguna diperbarui.','success');renderTab(root,'users');}catch(e){window.SYKA_TOAST.show(e.message,'error');}});root.querySelectorAll('[data-user-role]').forEach(b=>b.onclick=()=>roleModal(b.dataset.userRole));}
  function bindUserSearch(rows){const i=document.getElementById('admin-user-search');i.oninput=()=>{const q=i.value.toLowerCase();document.querySelectorAll('#admin-users .admin-row').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'flex':'none');};}
  function roleModal(userId){window.SYKA_MODAL.open({title:'Atur role pengguna',html:`<form id="role-form" class="form-card"><label>Role<select id="role"><option value="student">Pelajar</option><option value="teacher">Guru</option><option value="organizer_member">Organizer</option><option value="admin">Admin</option></select></label><label class="checkline"><input id="active" type="checkbox" checked> Aktif</label><label>Alasan<textarea id="reason" placeholder="Alasan perubahan role"></textarea></label><button class="btn btn-primary">Simpan</button><div id="role-feedback"></div></form>`,onOpen:body=>body.querySelector('#role-form').onsubmit=async e=>{e.preventDefault();try{await svc().setUserRole(userId,body.querySelector('#role').value,body.querySelector('#active').checked,body.querySelector('#reason').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Role diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#role-feedback').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  async function competitions(root){const rows=await svc().listCompetitionsAdmin({limit:200});root.innerHTML=`<div class="control-local-head"><div><h2>Competitions</h2><span>CRUD, state transition, level/reward tersedia.</span></div><button class="btn btn-primary" id="admin-comp-new">+ Kompetisi</button></div><div class="admin-table">${rows.length?rows.map(c=>`<div class="admin-row"><div><strong>${esc(c.title)}</strong><small>${esc(c.category)} · ${esc(c.slug)} · ${esc(c.visibility)}</small><div class="chip-row"><span class="chip">${esc(c.status)}</span>${c.registration_ends_at?`<span class="chip">Pendaftaran sampai ${fmt(c.registration_ends_at)}</span>`:''}</div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-comp-edit="${c.id}">Edit</button><button class="btn btn-ghost btn-sm" data-comp-config="${c.id}">Config</button><button class="btn btn-primary btn-sm" data-comp-next="${c.id}">Transisi</button></div></div>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama.'})}</div>`;root.querySelector('#admin-comp-new').onclick=()=>competitionModal(null);root.querySelectorAll('[data-comp-edit]').forEach(b=>b.onclick=()=>competitionModal(rows.find(x=>x.id===b.dataset.compEdit)));root.querySelectorAll('[data-comp-next]').forEach(b=>b.onclick=()=>transitionModal(rows.find(x=>x.id===b.dataset.compNext)));root.querySelectorAll('[data-comp-config]').forEach(b=>b.onclick=()=>competitionConfigModal(rows.find(x=>x.id===b.dataset.compConfig)));}
  function competitionModal(current){const p=current||{};window.SYKA_MODAL.open({title:current?'Edit kompetisi':'Tambah kompetisi',wide:true,html:`<form id="comp-form" class="form-card"><div class="form-grid-2"><label>Judul *<input id="title" required value="${esc(p.title||'')}"></label><label>Slug *<input id="slug" required value="${esc(p.slug||'')}"></label></div><label>Deskripsi singkat<textarea id="short">${esc(p.short_description||'')}</textarea></label><label>Kategori<input id="category" value="${esc(p.category||'Kompetisi')}"></label><div class="form-grid-2"><label>Registration start<input id="rs" type="datetime-local"></label><label>Registration end<input id="re" type="datetime-local"></label></div><div class="form-grid-2"><label>Start<input id="s" type="datetime-local"></label><label>End<input id="e" type="datetime-local"></label></div><label>Announcement<input id="a" type="datetime-local"></label><div class="form-actions"><button class="btn btn-ghost" type="button" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div><div id="feedback"></div></form>`,onOpen:body=>{const form=body.querySelector('#comp-form');const set=(id,v)=>{if(v)body.querySelector(id).value=new Date(v).toISOString().slice(0,16);};set('#rs',p.registration_starts_at);set('#re',p.registration_ends_at);set('#s',p.starts_at);set('#e',p.ends_at);set('#a',p.announcement_at);form.onsubmit=async e=>{e.preventDefault();const rs=x=>x?new Date(x).toISOString():null;try{const title=form.querySelector('#title').value.trim();const slug=form.querySelector('#slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');await svc().saveCompetition({title,slug,short_description:form.querySelector('#short').value.trim(),category:form.querySelector('#category').value.trim()||'Kompetisi',registration_starts_at:rs(form.querySelector('#rs').value),registration_ends_at:rs(form.querySelector('#re').value),starts_at:rs(form.querySelector('#s').value),ends_at:rs(form.querySelector('#e').value),announcement_at:rs(form.querySelector('#a').value),visibility:'PUBLIC'},current?.id||null);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Kompetisi tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(err){form.querySelector('#feedback').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}};}});}
  async function competitionConfigModal(c){
    try{
      const [levels,rules,rewards]=await Promise.all([svc().listLevels(c.id),svc().getRegistrationRules(c.id),svc().listRewards(c.id)]);
      window.SYKA_MODAL.open({title:'Competition configuration',wide:true,html:`<div class="form-card"><div class="control-grid-2"><section><h3>Eligibility / Rules</h3><label>Allowed grades (comma separated)<textarea id="rules-grades">${esc((rules?.allowed_grades||[]).join(', '))}</textarea></label><div class="form-grid-2"><label>Max participants<input id="rules-max" type="number" value="${rules?.max_participants??''}"></label><label>Express cost<input id="rules-cost" type="number" value="${rules?.express_cost??0}"></label></div><label class="checkline"><input id="rules-tw" type="checkbox" ${rules?.require_twibbon?'checked':''}> Require twibbon</label><label class="checkline"><input id="rules-social" type="checkbox" ${rules?.require_social_proof?'checked':''}> Require social proof</label><label class="checkline"><input id="rules-express" type="checkbox" ${rules?.express_enabled?'checked':''}> Express registration</label><button class="btn btn-primary btn-sm" id="save-rules">Simpan rules</button></section><section><h3>Level</h3><div class="admin-table">${levels.map(l=>`<div class="admin-row"><div><strong>${esc(l.label)}</strong><small>${esc(l.code)} · ${esc((l.allowed_grades||[]).join(', '))} · ${l.points} pts</small></div></div>`).join('')||'<p class="muted">Belum ada level.</p>'}</div><button class="btn btn-ghost btn-sm" id="new-level">+ Level</button><h3 style="margin-top:16px">Reward</h3><div class="admin-table">${rewards.map(r=>`<div class="admin-row"><div><strong>${esc(r.rank_code)}</strong><small>${esc(r.title||'')} · ${r.points} pts · ${esc(r.emblem_name||'')}</small></div></div>`).join('')||'<p class="muted">Belum ada reward.</p>'}</div><button class="btn btn-ghost btn-sm" id="new-reward">+ Reward</button></section></div><div id="cfg-feedback"></div></div>`,onOpen:body=>{body.querySelector('#save-rules').onclick=async()=>{try{await svc().saveRegistrationRules({allowed_grades:body.querySelector('#rules-grades').value.split(',').map(x=>x.trim()).filter(Boolean),max_participants:body.querySelector('#rules-max').value?Number(body.querySelector('#rules-max').value):null,express_cost:Number(body.querySelector('#rules-cost').value||0),require_twibbon:body.querySelector('#rules-tw').checked,require_social_proof:body.querySelector('#rules-social').checked,express_enabled:body.querySelector('#rules-express').checked},c.id);window.SYKA_TOAST.show('Rules tersimpan.','success');}catch(e){body.querySelector('#cfg-feedback').innerHTML=`<div class="inline-error">${esc(e.message)}</div>`;}};body.querySelector('#new-level').onclick=()=>smallLevelModal(c.id);body.querySelector('#new-reward').onclick=()=>smallRewardModal(c.id);}});
    }catch(e){window.SYKA_TOAST.show(e.message,'error');}
  }
  function smallLevelModal(cid){window.SYKA_MODAL.open({title:'Tambah level',html:`<form id="lvf" class="form-card"><label>Code<input id="code" required></label><label>Label<input id="label" required></label><label>Allowed grades<input id="grades" placeholder="6 SD,7 SMP"></label><label>Points<input id="points" type="number" value="0"></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:body=>body.querySelector('#lvf').onsubmit=async e=>{e.preventDefault();try{await svc().saveLevel({competition_id:cid,code:body.querySelector('#code').value.trim(),label:body.querySelector('#label').value.trim(),allowed_grades:body.querySelector('#grades').value.split(',').map(x=>x.trim()).filter(Boolean),points:Number(body.querySelector('#points').value||0)});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Level dibuat.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#lvf').insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(err.message)}</div>`);}}});}
  function smallRewardModal(cid){window.SYKA_MODAL.open({title:'Tambah reward',html:`<form id="rwf" class="form-card"><label>Rank code<input id="rank" placeholder="1ST" required></label><label>Title<input id="title"></label><label>Points<input id="points" type="number" value="0"></label><label>Emblem<input id="emblem"></label><label class="checkline"><input id="cert" type="checkbox" checked> Certificate</label><button class="btn btn-primary">Simpan</button></form>`,onOpen:body=>body.querySelector('#rwf').onsubmit=async e=>{e.preventDefault();try{await svc().saveReward({competition_id:cid,rank_code:body.querySelector('#rank').value.trim(),title:body.querySelector('#title').value.trim()||null,points:Number(body.querySelector('#points').value||0),emblem_name:body.querySelector('#emblem').value.trim()||null,certificate_enabled:body.querySelector('#cert').checked});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Reward dibuat.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#rwf').insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(err.message)}</div>`);}}});}
  function transitionModal(c){const order=['PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','ARCHIVED','SUSPENDED','CANCELLED'];window.SYKA_MODAL.open({title:'Ubah status kompetisi',html:`<form id="tr-form" class="form-card"><p>Status saat ini: <b>${esc(c.status)}</b></p><label>Status tujuan<select id="to">${order.map(s=>`<option>${s}</option>`).join('')}</select></label><label>Alasan<textarea id="reason"></textarea></label><button class="btn btn-primary">Simpan transisi</button><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#tr-form').onsubmit=async e=>{e.preventDefault();try{await svc().transitionCompetition(c.id,body.querySelector('#to').value,body.querySelector('#reason').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Status kompetisi berubah.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  async function questions(root){const [banks,qs]=await Promise.all([svc().listQuestionBanks(),svc().listQuestions({})]);root.innerHTML=`<div class="control-local-head"><div><h2>Questions Builder</h2><span>Bank soal, builder, moderation, dan answer key.</span></div><div class="row-actions"><button class="btn btn-ghost btn-sm" id="new-bank">+ Bank</button><button class="btn btn-primary btn-sm" id="new-q">+ Soal</button></div></div><div class="control-grid-2"><section><h3>Question Banks</h3><div class="admin-table">${banks.map(b=>`<div class="admin-row"><div><strong>${esc(b.name)}</strong><small>${esc(b.status)} · ${esc(b.description||'')}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada bank soal',text:'Buat bank soal pertama.'})}</div></section><section><h3>Questions</h3><div class="admin-table">${qs.map(q=>`<div class="admin-row"><div><strong>${esc(q.prompt)}</strong><small>${esc(q.type)} · ${q.points} poin · ${esc(q.status)}</small></div><button class="btn btn-ghost btn-sm" data-q-edit="${q.id}">Edit</button></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada soal',text:'Tambahkan soal.'})}</div></section></div>`;root.querySelector('#new-bank').onclick=()=>bankModal();root.querySelector('#new-q').onclick=()=>questionModal();root.querySelectorAll('[data-q-edit]').forEach(b=>b.onclick=()=>questionModal(qs.find(x=>x.id===b.dataset.qEdit)));}
  function bankModal(){window.SYKA_MODAL.open({title:'Question Bank',html:`<form id="bank-form" class="form-card"><label>Nama *<input id="name" required></label><label>Deskripsi<textarea id="desc"></textarea></label><label>Status<select id="status"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label><button class="btn btn-primary">Simpan</button><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#bank-form').onsubmit=async e=>{e.preventDefault();try{const a=window.SYKA_STATE.getState().auth;const memberships=await window.SYKA_ADMIN_SERVICE.listMyOrganizerMemberships(a.user.id);const organizerId=memberships[0]?.organizer_id||null;await svc().saveQuestionBank({name:body.querySelector('#name').value.trim(),description:body.querySelector('#desc').value.trim(),status:body.querySelector('#status').value,organizer_id:organizerId,owner_user_id:a.user.id});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Bank soal tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  function questionModal(current){const p=current||{};window.SYKA_MODAL.open({title:current?'Edit soal':'Tambah soal',wide:true,html:`<form id="q-form" class="form-card"><label>Pertanyaan *<textarea id="prompt" required>${esc(p.prompt||'')}</textarea></label><div class="form-grid-2"><label>Type<select id="type"><option value="multiple_choice">Multiple choice</option><option value="checkbox">Checkbox</option><option value="essay">Essay</option><option value="file">File</option></select></label><label>Poin<input id="points" type="number" step="0.5" value="${p.points||1}"></label></div><label>Competition ID (opsional)<input id="cid" value="${esc(p.competition_id||'')}"></label><label>Status<select id="status"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label><div class="form-actions"><button class="btn btn-primary">Simpan</button></div><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#q-form').onsubmit=async e=>{e.preventDefault();try{await svc().saveQuestion({prompt:body.querySelector('#prompt').value.trim(),type:body.querySelector('#type').value,points:Number(body.querySelector('#points').value||1),required:true,competition_id:body.querySelector('#cid').value.trim()||null,status:body.querySelector('#status').value,config:{}},current?.id||null);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Soal tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  async function twibbon(root){const rows=await svc().listTwibbonTemplates({});root.innerHTML=`<div class="control-local-head"><div><h2>Twibbon Templates</h2><span>Template dan konfigurasi submission.</span></div><button class="btn btn-primary" id="new-tw">+ Template</button></div><div class="admin-table">${rows.map(t=>`<div class="admin-row"><div><strong>${esc(t.name)}</strong><small>${esc(t.competition_id||'Global')} · ${t.is_required?'Wajib':'Opsional'} · ${t.is_active?'Aktif':'Nonaktif'}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada template',text:'Tambahkan template twibbon.'})}</div>`;root.querySelector('#new-tw').onclick=()=>twibbonModal();}
  function twibbonModal(){window.SYKA_MODAL.open({title:'Twibbon template',html:`<form id="tw-form" class="form-card"><label>Nama *<input id="name" required></label><label>Competition ID<input id="cid"></label><label>Image URL<input id="url"></label><label>Public ID<input id="pid"></label><label class="checkline"><input id="req" type="checkbox"> Wajib</label><button class="btn btn-primary">Simpan</button><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#tw-form').onsubmit=async e=>{e.preventDefault();try{await svc().saveTwibbonTemplate({name:body.querySelector('#name').value.trim(),competition_id:body.querySelector('#cid').value.trim()||null,image_url:body.querySelector('#url').value.trim()||null,public_id:body.querySelector('#pid').value.trim()||null,is_required:body.querySelector('#req').checked});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Template tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  async function results(root){const rows=await svc().listAttempts({});root.innerHTML=`<div class="control-local-head"><div><h2>Results</h2><span>Grade moderation dan finalisasi.</span></div></div><div class="admin-table">${rows.map(a=>`<div class="admin-row"><div><strong>${esc(a.profiles?.full_name||a.participant_id)}</strong><small>${esc(a.competitions?.title||'')} · ${esc(a.status)} · score ${a.score}</small></div><button class="btn btn-primary btn-sm" data-final="${a.id}" ${a.status==='FINALIZED'?'disabled':''}>Finalize</button></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada attempt',text:'Attempt peserta akan muncul saat lomba berjalan.'})}</div>`;root.querySelectorAll('[data-final]').forEach(b=>b.onclick=()=>finalizeModal(b.dataset.final));}
  function finalizeModal(id){window.SYKA_MODAL.open({title:'Finalisasi hasil',html:`<form id="fin-form" class="form-card"><label>Score final<input id="score" type="number" step="0.01"></label><label>Alasan<textarea id="reason"></textarea></label><button class="btn btn-primary">Finalisasi</button></form>`,onOpen:body=>body.querySelector('#fin-form').onsubmit=async e=>{e.preventDefault();try{await svc().finalizeAttempt(id,Number(body.querySelector('#score').value));window.SYKA_MODAL.close();window.SYKA_TOAST.show('Attempt difinalisasi.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fin-form').insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(err.message)}</div>`);}}});}
  async function certificates(root){const rows=await svc().listCertificates({});root.innerHTML=`<div class="control-local-head"><div><h2>Certificates</h2><span>Generate, review, issue, revoke.</span></div></div><div class="admin-table">${rows.map(x=>`<div class="admin-row"><div><strong>${esc(x.profiles?.full_name||x.user_id)}</strong><small>${esc(x.competitions?.title||'')} · ${esc(x.status)} · rev ${x.current_revision}</small></div><div class="row-actions">${['GENERATED','REVIEW','APPROVED','PUBLISHED','REVOKED'].map(s=>`<button class="btn btn-ghost btn-sm" data-cert="${x.id}" data-status="${s}">${s}</button>`).join('')}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada certificate',text:'Certificate event akan muncul setelah result.'})}</div>`;root.querySelectorAll('[data-cert]').forEach(b=>b.onclick=async()=>{try{await svc().updateCertificate(b.dataset.cert,b.dataset.status);window.SYKA_TOAST.show('Status certificate diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message,'error');}});}
  async function orders(root){const rows=await svc().listOrders({});root.innerHTML=`<div class="control-local-head"><div><h2>Orders</h2><span>Payment, fulfillment, tracking.</span></div></div><div class="admin-table">${rows.map(o=>`<div class="admin-row"><div><strong>${esc(o.profiles?.full_name||o.user_id)}</strong><small>${esc(o.id)} · ${esc(o.status)} · Rp ${Number(o.total||0).toLocaleString('id-ID')}</small></div><select class="compact-select" data-order="${o.id}">${['DRAFT','PENDING_PAYMENT','PAID','PROCESSING','SHIPPED','COMPLETED','REFUNDED','CANCELLED'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada order',text:'Order peserta akan muncul di sini.'})}</div>`;root.querySelectorAll('[data-order]').forEach(s=>s.onchange=async()=>{try{await svc().updateOrder(s.dataset.order,s.value);window.SYKA_TOAST.show('Order diperbarui.','success');}catch(e){window.SYKA_TOAST.show(e.message,'error');}});}
  async function moderation(root){const m=await svc().listModeration();root.innerHTML=`<div class="control-grid-2"><section><h2>Questions UGC</h2><div id="ugc-questions" class="admin-table"><p class="muted">Memuat…</p></div></section><section><h2>Posts</h2><div class="admin-table">${m.posts.map(p=>`<div class="admin-row"><div><strong>${esc(p.title)}</strong><small>${esc(p.status)} · ${fmt(p.created_at)}</small></div><select class="compact-select" data-post="${p.id}"><option>PUBLISHED</option><option>HIDDEN</option><option>ARCHIVED</option></select></div>`).join('')||window.SYKA_EMPTY.render({title:'Tidak ada post',text:'Moderasi post akan muncul.'})}</div></section><section><h2>Comments</h2><div class="admin-table">${m.comments.map(p=>`<div class="admin-row"><div><strong>${esc(p.body).slice(0,100)}</strong><small>${esc(p.moderation_state)} · ${fmt(p.created_at)}</small></div><select class="compact-select" data-comment="${p.id}"><option>PUBLISHED</option><option>HIDDEN</option><option>QUARANTINED</option></select></div>`).join('')||window.SYKA_EMPTY.render({title:'Tidak ada comment',text:'Moderasi komentar akan muncul.'})}</div></section></div>`;(async()=>{try{const qs=await svc().listQuestions({});const box=document.getElementById('ugc-questions');box.innerHTML=qs.map(q=>`<div class="admin-row"><div><strong>${esc(q.prompt)}</strong><small>${esc(q.status)} · ${esc(q.type)}</small></div><select class="compact-select" data-ugc="${q.id}"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option><option>QUARANTINED</option><option>ARCHIVED</option></select></div>`).join('')||'<p class="muted">Tidak ada question UGC.</p>';box.querySelectorAll('[data-ugc]').forEach(s=>s.onchange=async()=>{try{await svc().moderateQuestion(s.dataset.ugc,s.value);window.SYKA_TOAST.show('Question dimoderasi.','success');}catch(e){window.SYKA_TOAST.show(e.message,'error');}});}catch(e){document.getElementById('ugc-questions').innerHTML='<p class="muted">Tidak dapat memuat UGC question.</p>';}})();root.querySelectorAll('[data-post]').forEach(s=>s.onchange=async()=>{try{await svc().moderatePost(s.dataset.post,s.value);window.SYKA_TOAST.show('Post dimoderasi.','success');}catch(e){window.SYKA_TOAST.show(e.message,'error');}});root.querySelectorAll('[data-comment]').forEach(s=>s.onchange=async()=>{try{await svc().moderateComment(s.dataset.comment,s.value);window.SYKA_TOAST.show('Comment dimoderasi.','success');}catch(e){window.SYKA_TOAST.show(e.message,'error');}});}
  async function plans(root){const [plans,ents]=await Promise.all([svc().listPlans(),svc().listEntitlements()]);root.innerHTML=`<div class="control-grid-2"><section><h2>Organizer Plans</h2><div class="admin-table">${plans.map(p=>`<div class="admin-row"><div><strong>${esc(p.plan_code)}</strong><small>${esc(p.organizer_id)} · ${fmt(p.starts_at)}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada plan',text:'Plan organizer akan muncul setelah ditetapkan.'})}</div></section><section><div class="control-local-head"><h2>Entitlements</h2><button class="btn btn-primary btn-sm" id="new-ent">+ Entitlement</button></div><div class="admin-table">${ents.map(e=>`<div class="admin-row"><div><strong>${esc(e.plan_code)} · ${esc(e.capability)}</strong><small>Limit: ${e.limit_value??'—'}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada entitlement',text:'Tambahkan capability per plan.'})}</div></section></div>`;root.querySelector('#new-ent').onclick=()=>entitlementModal();}
  function entitlementModal(){window.SYKA_MODAL.open({title:'Plan entitlement',html:`<form id="ent-form" class="form-card"><label>Plan<select id="plan"><option>FREE</option><option>PRO</option><option>PREMIUM</option></select></label><label>Capability<input id="cap" required placeholder="competition_publish"></label><label>Limit<input id="limit" type="number"></label><label>Config JSON<textarea id="config">{}</textarea></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:body=>body.querySelector('#ent-form').onsubmit=async e=>{e.preventDefault();try{await svc().saveEntitlement({plan_code:body.querySelector('#plan').value,capability:body.querySelector('#cap').value.trim(),limit_value:body.querySelector('#limit').value?Number(body.querySelector('#limit').value):null,config:JSON.parse(body.querySelector('#config').value||'{}')});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Entitlement tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#ent-form').insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(err.message)}</div>`);}}});}
  async function settings(root){const [flags,settings]=await Promise.all([svc().listFlags(),svc().listSettings()]);root.innerHTML=`<div class="control-grid-2"><section><h2>Feature Flags</h2><div class="admin-table">${flags.map(f=>`<div class="admin-row"><div><strong>${esc(f.key)}</strong><small>${f.enabled?'Enabled':'Disabled'}</small></div><button class="btn btn-ghost btn-sm" data-flag="${esc(f.key)}" data-enabled="${!f.enabled}">${f.enabled?'Matikan':'Nyalakan'}</button></div>`).join('')}</div></section><section><h2>Global Settings</h2><div class="admin-table">${settings.map(s=>`<div class="admin-row"><div><strong>${esc(s.key)}</strong><small>${esc(JSON.stringify(s.value))}</small></div><button class="btn btn-ghost btn-sm" data-setting="${esc(s.key)}">Edit</button></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada settings',text:'Global setting dapat disimpan dari sini.'})}</div></section></div>`;root.querySelectorAll('[data-flag]').forEach(b=>b.onclick=async()=>{try{await svc().setFlag(b.dataset.flag,b.dataset.enabled==='true',{});window.SYKA_TOAST.show('Feature flag diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message,'error');}});root.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>settingModal(b.dataset.setting));}
  function settingModal(key){window.SYKA_MODAL.open({title:'Global setting',html:`<form id="set-form" class="form-card"><label>Key<input id="key" value="${esc(key||'')}" required></label><label>Value JSON<textarea id="value">{}</textarea></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:body=>body.querySelector('#set-form').onsubmit=async e=>{e.preventDefault();try{await svc().setSetting(body.querySelector('#key').value.trim(),JSON.parse(body.querySelector('#value').value||'{}'));window.SYKA_MODAL.close();window.SYKA_TOAST.show('Setting tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#set-form').insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(err.message)}</div>`);}}});}
  async function audit(root){const rows=await svc().listAudit({limit:200});root.innerHTML=`<div class="control-local-head"><div><h2>Audit Log</h2><span>Append-only privileged actions.</span></div><input id="audit-search" class="control-search" placeholder="Cari action..."></div><div class="admin-table" id="audit-table">${rows.map(a=>`<div class="admin-row"><div><strong>${esc(a.action)}</strong><small>${esc(a.entity_type)} · ${esc(a.entity_id||'')} · ${esc(a.reason||'')}</small></div><small>${fmt(a.created_at)}</small></div>`).join('')||window.SYKA_EMPTY.render({title:'Audit kosong',text:'Belum ada mutation privileged.'})}</div>`;document.getElementById('audit-search').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#audit-table .admin-row').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'flex':'none');};}
  window.SYKA_PAGE_ADMIN={render};
})();


/* src/pages/Organizer.js */
(function(){
  const svc=()=>window.SYKA_CONTROL_SERVICE;const esc=v=>window.SYKA_UTILS.escapeHtml(v);const fmt=v=>window.SYKA_UTILS.formatDate(v);
  const tabs=[['dashboard','Dashboard'],['competitions','Kompetisi'],['participants','Peserta'],['questions','Soal'],['grading','Grading'],['results','Results'],['awards','Awards'],['certificates','Certificate'],['twibbon','Twibbon'],['notifications','Notifikasi'],['plan','Plan & Usage']];
  async function membership(){const a=window.SYKA_STATE.getState().auth;return window.SYKA_ADMIN_SERVICE.listMyOrganizerMemberships(a.user.id);}
  function shell(tab,org){return `<div class="control-head"><div><span class="eyebrow">ORGANIZER CONTROL PLANE</span><h1>${esc(org?.name||'Penyelenggara')}</h1><p>Create competition → approval → grading → result → award/certificate.</p></div><div class="org-plan-chip">${esc(org?.plan_code||'FREE')}</div></div><div class="control-tabs">${tabs.map(([k,l])=>`<a href="${window.SYKA_ROUTER.href('/organizer')}&tab=${k}" class="control-tab ${k===tab?'active':''}" data-org-tab="${k}">${l}</a>`).join('')}</div><div id="control-content"><div class="page-loading"><div class="loading-spinner"></div></div></div>`;}
  async function render(root){const a=window.SYKA_STATE.getState().auth;if(!a.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Panel penyelenggara hanya untuk anggota organizer.'})+'<div class="control-center"><button class="btn btn-primary" id="org-login">Masuk</button></div>';document.getElementById('org-login').onclick=()=>window.SYKA_APP.openAuth('login');return;}if(!a.roles.includes('organizer_member')&&!a.roles.includes('admin')){root.innerHTML=window.SYKA_EMPTY.render({title:'Akses organizer diperlukan',text:'Tambahkan role organizer_member dan membership terlebih dahulu.'});return;}const memberships=await membership();const m=memberships[0]||{};const tab=window.SYKA_STATE.getState().route.query.tab||'dashboard';root.innerHTML=shell(tabs.some(x=>x[0]===tab)?tab:'dashboard',m.organizers||{});root.querySelectorAll('[data-org-tab]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();window.SYKA_ROUTER.navigate('/organizer');const u=new URL(x.href);const r=u.searchParams.get('tab');history.replaceState({},'',u.pathname+'&tab='+r);window.SYKA_ROUTER.refresh();}));await renderTab(document.getElementById('control-content'),tab,m.organizer_id||null);}
  async function renderTab(root,tab,orgId){try{if(tab==='dashboard')return dashboard(root,orgId);if(tab==='competitions')return competitions(root,orgId);if(tab==='participants')return participants(root,orgId);if(tab==='questions')return questions(root,orgId);if(tab==='grading')return grading(root,orgId);if(tab==='results')return results(root,orgId);if(tab==='awards')return awards(root,orgId);if(tab==='certificates')return certificates(root,orgId);if(tab==='twibbon')return twibbon(root,orgId);if(tab==='notifications')return notifications(root);if(tab==='plan')return plan(root,orgId);}catch(e){root.innerHTML=window.SYKA_EMPTY.render({title:'Modul organizer gagal',text:e.message||'Periksa RLS dan membership.'});}}
  async function dashboard(root,orgId){const rows=await svc().listCompetitionsAdmin({limit:200});const mine=rows.filter(x=>x.organizer_id===orgId);const regs=await Promise.all(mine.slice(0,20).map(c=>svc().listRegistrations({competitionId:c.id})));const allRegs=regs.flat();root.innerHTML=`<div class="admin-kpi-grid"><div class="syka-card admin-kpi"><strong>${mine.length}</strong><span>Kompetisi dikelola</span></div><div class="syka-card admin-kpi"><strong>${mine.filter(x=>x.status==='REGISTRATION_OPEN').length}</strong><span>Registration open</span></div><div class="syka-card admin-kpi"><strong>${allRegs.filter(r=>['APPROVED','ACTIVE'].includes(r.status)).length}</strong><span>Peserta approved</span></div><div class="syka-card admin-kpi"><strong>${allRegs.filter(r=>r.status==='PENDING').length}</strong><span>Pending approval</span></div></div><section class="syka-card admin-section"><div class="admin-section-head"><div><span class="eyebrow">LIFECYCLE</span><h2>Kompetisi terakhir</h2></div><button class="btn btn-primary btn-sm" id="new-org-comp">+ Kompetisi</button></div><div class="admin-table">${mine.slice(0,10).map(c=>`<div class="admin-row"><div><strong>${esc(c.title)}</strong><small>${esc(c.status)} · ${fmt(c.created_at)}</small></div><span class="chip">${esc(c.slug)}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama dari tombol di atas.'})}</div></section>`;document.getElementById('new-org-comp').onclick=()=>competitionModal(orgId,null);}
  async function competitions(root,orgId){const rows=(await svc().listCompetitionsAdmin({limit:200})).filter(x=>x.organizer_id===orgId);root.innerHTML=`<div class="control-local-head"><div><h2>Kompetisi</h2><span>Draft sampai archive sesuai state machine.</span></div><button class="btn btn-primary" id="org-comp-new">+ Kompetisi</button></div><div class="admin-table">${rows.map(c=>`<div class="admin-row"><div><strong>${esc(c.title)}</strong><small>${esc(c.category)} · ${esc(c.slug)}</small><div class="chip-row"><span class="chip">${esc(c.status)}</span><span class="chip">Reg: ${fmt(c.registration_starts_at)} — ${fmt(c.registration_ends_at)}</span></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button><button class="btn btn-primary btn-sm" data-trans="${c.id}">Transisi</button></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama.'})}</div>`;root.querySelector('#org-comp-new').onclick=()=>competitionModal(orgId,null);root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>competitionModal(orgId,rows.find(x=>x.id===b.dataset.edit)));root.querySelectorAll('[data-trans]').forEach(b=>transitionModal(rows.find(x=>x.id===b.dataset.trans)));}
  function competitionModal(orgId,current){const p=current||{};window.SYKA_MODAL.open({title:current?'Edit kompetisi':'Buat kompetisi',wide:true,html:`<form id="ocf" class="form-card"><div class="form-grid-2"><label>Judul *<input id="title" required value="${esc(p.title||'')}"></label><label>Slug *<input id="slug" required value="${esc(p.slug||'')}"></label></div><label>Deskripsi singkat<textarea id="short">${esc(p.short_description||'')}</textarea></label><label>Deskripsi lengkap<textarea id="desc">${esc(p.description||'')}</textarea></label><div class="form-grid-2"><label>Kategori<input id="cat" value="${esc(p.category||'Kompetisi')}"></label><label>Visibility<select id="vis"><option>PUBLIC</option><option>UNLISTED</option><option>PRIVATE</option></select></label></div><div class="form-grid-2"><label>Pendaftaran mulai<input id="rs" type="datetime-local"></label><label>Pendaftaran selesai<input id="re" type="datetime-local"></label></div><div class="form-grid-2"><label>Competition mulai<input id="s" type="datetime-local"></label><label>Competition selesai<input id="e" type="datetime-local"></label></div><label>Pengumuman<input id="a" type="datetime-local"></label><label>Poster URL<input id="poster" placeholder="https://..." value="${esc(p.poster_url||'')}"></label><label>Juknis URL<input id="juknis" value="${esc(p.juknis_url||'')}"></label><div class="form-actions"><button class="btn btn-ghost" type="button" data-close>Batal</button><button class="btn btn-primary">Simpan DRAFT</button></div><div id="fb"></div></form>`,onOpen:body=>{const f=body.querySelector('#ocf');body.querySelector('#vis').value=p.visibility||'PUBLIC';const set=(id,v)=>{if(v)body.querySelector(id).value=new Date(v).toISOString().slice(0,16);};set('#rs',p.registration_starts_at);set('#re',p.registration_ends_at);set('#s',p.starts_at);set('#e',p.ends_at);set('#a',p.announcement_at);f.onsubmit=async e=>{e.preventDefault();const d=x=>x?new Date(x).toISOString():null;try{const payload={organizer_id:orgId,title:f.querySelector('#title').value.trim(),slug:f.querySelector('#slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,''),short_description:f.querySelector('#short').value.trim(),description:f.querySelector('#desc').value.trim(),category:f.querySelector('#cat').value.trim()||'Kompetisi',visibility:f.querySelector('#vis').value,registration_starts_at:d(f.querySelector('#rs').value),registration_ends_at:d(f.querySelector('#re').value),starts_at:d(f.querySelector('#s').value),ends_at:d(f.querySelector('#e').value),announcement_at:d(f.querySelector('#a').value),poster_url:f.querySelector('#poster').value.trim()||null,juknis_url:f.querySelector('#juknis').value.trim()||null};await svc().saveCompetition(payload,current?.id||null);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Kompetisi tersimpan sebagai DRAFT.','success');window.SYKA_ROUTER.refresh();}catch(err){f.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}};}});}
  function transitionModal(c){const next=['PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','ARCHIVED','SUSPENDED','CANCELLED'];window.SYKA_MODAL.open({title:'Competition state machine',html:`<form id="tm" class="form-card"><p>Current: <b>${esc(c.status)}</b></p><label>Target<select id="to">${next.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Reason<textarea id="reason"></textarea></label><button class="btn btn-primary">Apply transition</button><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#tm').onsubmit=async e=>{e.preventDefault();try{await svc().transitionCompetition(c.id,body.querySelector('#to').value,body.querySelector('#reason').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('State competition diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  async function participants(root,orgId){const comps=(await svc().listCompetitionsAdmin({limit:200})).filter(x=>x.organizer_id===orgId);let rows=[];for(const c of comps.slice(0,20)){const rs=await svc().listRegistrations({competitionId:c.id});rows.push(...rs);}root.innerHTML=`<div class="control-local-head"><div><h2>Peserta</h2><span>Approval, reject, twibbon evidence.</span></div><select class="compact-select" id="p-filter"><option value="">Semua status</option><option>PENDING</option><option>APPROVED</option><option>ACTIVE</option><option>REJECTED</option></select></div><div class="admin-table" id="participants">${rows.map(r=>`<div class="admin-row" data-status="${r.status}"><div><strong>${esc(r.profiles?.full_name||r.user_id)}</strong><small>${esc(r.competitions?.title||'')} · @${esc(r.profiles?.username||'—')} · ${esc(r.profiles?.grade||'—')} · ${esc(r.profiles?.institution||'—')}</small><div class="chip-row"><span class="chip">${esc(r.status)}</span>${r.twibbon_asset_url?'<span class="chip">Twibbon ada</span>':''}</div></div><div class="row-actions">${r.status==='PENDING'?`<button class="btn btn-primary btn-sm" data-review="${r.id}" data-decision="APPROVED">Approve</button><button class="btn btn-danger btn-sm" data-review="${r.id}" data-decision="REJECTED">Reject</button>`:''}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada peserta',text:'Registrasi peserta akan muncul di sini.'})}</div>`;document.getElementById('p-filter').onchange=e=>document.querySelectorAll('#participants .admin-row').forEach(r=>r.style.display=!e.target.value||r.dataset.status===e.target.value?'flex':'none');root.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>reviewModal(b.dataset.review,b.dataset.decision));}
  function reviewModal(id,decision){window.SYKA_MODAL.open({title:decision==='APPROVED'?'Approve peserta':'Reject peserta',html:`<form id="rf" class="form-card"><label>Reason / catatan<textarea id="reason"></textarea></label><button class="btn ${decision==='APPROVED'?'btn-primary':'btn-danger'}">${decision==='APPROVED'?'Approve':'Reject'}</button><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#rf').onsubmit=async e=>{e.preventDefault();try{await svc().reviewRegistration(id,decision,body.querySelector('#reason').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Registration diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  async function questions(root,orgId){const [banks,qs]=await Promise.all([svc().listQuestionBanks({organizerId:orgId}),svc().listQuestions({})]);const mine=qs.filter(q=>banks.some(b=>b.id===q.question_bank_id)||q.status);root.innerHTML=`<div class="control-local-head"><div><h2>Question Builder</h2><span>Bank soal, tipe soal, answer key, scoring.</span></div><div class="row-actions"><button class="btn btn-ghost btn-sm" id="qb">+ Bank</button><button class="btn btn-primary btn-sm" id="qq">+ Soal</button></div></div><div class="control-grid-2"><section><h3>Bank Soal</h3><div class="admin-table">${banks.map(b=>`<div class="admin-row"><div><strong>${esc(b.name)}</strong><small>${esc(b.status)} · ${esc(b.description||'')}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada bank',text:'Buat bank soal.'})}</div></section><section><h3>Questions</h3><div class="admin-table">${mine.map(q=>`<div class="admin-row"><div><strong>${esc(q.prompt)}</strong><small>${esc(q.type)} · ${q.points} poin · ${esc(q.status)}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada soal',text:'Buat soal pertama.'})}</div></section></div>`;root.querySelector('#qb').onclick=()=>bankModal(orgId);root.querySelector('#qq').onclick=()=>questionModal();}
  function bankModal(orgId){window.SYKA_MODAL.open({title:'Question Bank',html:`<form id="bf" class="form-card"><label>Nama *<input id="name" required></label><label>Deskripsi<textarea id="desc"></textarea></label><button class="btn btn-primary">Simpan</button><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#bf').onsubmit=async e=>{e.preventDefault();try{const a=window.SYKA_STATE.getState().auth;await svc().saveQuestionBank({organizer_id:orgId,owner_user_id:a.user.id,name:body.querySelector('#name').value.trim(),description:body.querySelector('#desc').value.trim(),status:'DRAFT'});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Bank soal dibuat.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  function questionModal(){window.SYKA_MODAL.open({title:'Question Builder',wide:true,html:`<form id="qf" class="form-card"><label>Pertanyaan *<textarea id="prompt" required></textarea></label><div class="form-grid-2"><label>Type<select id="type"><option value="multiple_choice">Multiple Choice</option><option value="checkbox">Checkbox</option><option value="essay">Essay</option><option value="file">File</option></select></label><label>Points<input id="points" type="number" value="1" step="0.5"></label></div><label>Question Bank ID<input id="bank"></label><label>Competition ID<input id="comp"></label><button class="btn btn-primary">Simpan</button><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#qf').onsubmit=async e=>{e.preventDefault();try{await svc().saveQuestion({prompt:body.querySelector('#prompt').value.trim(),type:body.querySelector('#type').value,points:Number(body.querySelector('#points').value||1),required:true,question_bank_id:body.querySelector('#bank').value.trim()||null,competition_id:body.querySelector('#comp').value.trim()||null,status:'DRAFT',config:{} });window.SYKA_MODAL.close();window.SYKA_TOAST.show('Soal dibuat.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  async function grading(root,orgId){const comps=(await svc().listCompetitionsAdmin({limit:200})).filter(x=>x.organizer_id===orgId);let rows=[];for(const c of comps)rows.push(...await svc().listAttempts({competitionId:c.id}));root.innerHTML=`<div class="control-local-head"><div><h2>Grading</h2><span>Auto/manual grading dan finalize score.</span></div><select id="gstatus" class="compact-select"><option value="">Semua status</option><option>SUBMITTED</option><option>GRADING</option><option>FINALIZED</option></select></div><div class="admin-table" id="grading-list">${rows.map(a=>`<div class="admin-row" data-status="${a.status}"><div><strong>${esc(a.profiles?.full_name||a.participant_id)}</strong><small>${esc(a.competitions?.title||'')} · ${esc(a.status)} · Score ${a.score}</small></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-grade="${a.id}">Grade</button>${a.status!=='FINALIZED'?`<button class="btn btn-primary btn-sm" data-final="${a.id}">Finalize</button>`:''}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada attempt',text:'Attempt akan muncul saat peserta submit.'})}</div>`;document.getElementById('gstatus').onchange=e=>document.querySelectorAll('#grading-list .admin-row').forEach(r=>r.style.display=!e.target.value||r.dataset.status===e.target.value?'flex':'none');root.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>gradeModal(b.dataset.grade));root.querySelectorAll('[data-final]').forEach(b=>b.onclick=()=>finalizeModal(b.dataset.final));}
  async function gradeModal(attemptId){
    try{
      const items=await svc().listGradingItems(attemptId);
      window.SYKA_MODAL.open({
        title:'Grade attempt',
        wide:true,
        html:`<form id="grf" class="form-card">${items.map((i,n)=>`<div class="grade-row"><strong>Item ${n+1}</strong><div class="form-grid-2"><label>Score<input type="number" step="0.01" data-score="${i.id}" value="${i.score}"></label><label>Feedback<input data-feedback="${i.id}" value="${esc(i.feedback||'')}"></label></div></div>`).join('')||'<p class="muted">Belum ada manual grading item.</p>'}<button class="btn btn-primary">Simpan grading</button><div id="fb"></div></form>`,
        onOpen:body=>{
          body.querySelector('#grf').onsubmit=async e=>{
            e.preventDefault();
            try{
              for(const i of items){
                await svc().saveGrade({
                  attempt_id:attemptId,
                  question_id:i.question_id,
                  grader_id:window.SYKA_STATE.getState().auth.user.id,
                  score:Number(body.querySelector(`[data-score="${i.id}"]`).value||0),
                  feedback:body.querySelector(`[data-feedback="${i.id}"]`).value||null
                },i.id);
              }
              window.SYKA_MODAL.close();
              window.SYKA_TOAST.show('Grading tersimpan.','success');
            }catch(err){
              body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;
            }
          };
        }
      });
    }catch(e){window.SYKA_TOAST.show(e.message,'error');}
  }
  function finalizeModal(id){window.SYKA_MODAL.open({title:'Finalize result',html:`<form id="ff" class="form-card"><label>Score final<input id="score" type="number" step="0.01" required></label><button class="btn btn-primary">Finalize</button><div id="fb"></div></form>`,onOpen:body=>body.querySelector('#ff').onsubmit=async e=>{e.preventDefault();try{await svc().finalizeAttempt(id,body.querySelector('#score').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Result final.','success');window.SYKA_ROUTER.refresh();}catch(err){body.querySelector('#fb').innerHTML=`<div class="inline-error">${esc(err.message)}</div>`;}}});}
  async function results(root,orgId){const comps=(await svc().listCompetitionsAdmin({limit:200})).filter(x=>x.organizer_id===orgId);let rows=[];for(const c of comps)rows.push(...await svc().listAttempts({competitionId:c.id,status:'FINALIZED'}));root.innerHTML=`<div class="control-local-head"><div><h2>Results</h2><span>Preview hasil dan publish result dilakukan via competition state.</span></div></div><div class="admin-table">${rows.map(a=>`<div class="admin-row"><div><strong>${esc(a.profiles?.full_name||a.participant_id)}</strong><small>${esc(a.competitions?.title||'')} · Score ${a.score} · finalized ${fmt(a.finalized_at)}</small></div><span class="chip">FINALIZED</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada hasil finalized',text:'Finalisasi attempt dari Grading.'})}</div>`;}
  async function awards(root,orgId){const comps=(await svc().listCompetitionsAdmin({limit:200})).filter(x=>x.organizer_id===orgId);let rows=[];for(const c of comps)rows.push(...await svc().listAwards({competitionId:c.id}));root.innerHTML=`<div class="control-local-head"><div><h2>Awards</h2><span>Achievement dan emblem peserta.</span></div></div><div class="admin-table">${rows.map(a=>`<div class="admin-row"><div><strong>${esc(a.profiles?.full_name||a.user_id)}</strong><small>${esc(a.competitions?.title||'')} · ${esc(a.rank_code||'PARTICIPANT')} · ${esc(a.title)}</small></div><span class="chip">${a.points} pts</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada award',text:'Award event akan muncul setelah result publish.'})}</div>`;}
  async function certificates(root,orgId){const comps=(await svc().listCompetitionsAdmin({limit:200})).filter(x=>x.organizer_id===orgId);let rows=[];for(const c of comps)rows.push(...await svc().listCertificates({competitionId:c.id}));root.innerHTML=`<div class="control-local-head"><div><h2>Certificates</h2><span>DRAFT → GENERATED → REVIEW → APPROVED → PUBLISHED → REVOKED</span></div></div><div class="admin-table">${rows.map(x=>`<div class="admin-row"><div><strong>${esc(x.profiles?.full_name||x.user_id)}</strong><small>${esc(x.competitions?.title||'')} · rev ${x.current_revision}</small></div><div class="row-actions">${['GENERATED','REVIEW','APPROVED','PUBLISHED','REVOKED'].map(s=>`<button class="btn btn-ghost btn-sm" data-cert="${x.id}" data-status="${s}">${s}</button>`).join('')}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada certificate',text:'Certificate dibuat setelah award/result.'})}</div>`;root.querySelectorAll('[data-cert]').forEach(b=>b.onclick=async()=>{try{await svc().updateCertificate(b.dataset.cert,b.dataset.status);window.SYKA_TOAST.show('Certificate diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message,'error');}});}
  async function twibbon(root,orgId){const rows=await svc().listTwibbonTemplates({organizerId:orgId});root.innerHTML=`<div class="control-local-head"><div><h2>Twibbon</h2><span>Template dan review asset peserta.</span></div><button class="btn btn-primary" id="new-tw">+ Template</button></div><div class="admin-table">${rows.map(t=>`<div class="admin-row"><div><strong>${esc(t.name)}</strong><small>${esc(t.competition_id||'Global')} · ${t.is_required?'Wajib':'Opsional'}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada template',text:'Tambah template untuk competition.'})}</div>`;root.querySelector('#new-tw').onclick=()=>twModal(orgId);}
  function twModal(orgId){window.SYKA_MODAL.open({title:'Twibbon template',html:`<form id="twf" class="form-card"><label>Nama *<input id="name" required></label><label>Competition ID<input id="cid"></label><label>Image URL<input id="url"></label><label>Public ID<input id="pid"></label><label class="checkline"><input id="req" type="checkbox"> Required</label><button class="btn btn-primary">Simpan</button></form>`,onOpen:body=>body.querySelector('#twf').onsubmit=async e=>{e.preventDefault();try{await svc().saveTwibbonTemplate({organizer_id:orgId,competition_id:body.querySelector('#cid').value.trim()||null,name:body.querySelector('#name').value.trim(),image_url:body.querySelector('#url').value.trim()||null,public_id:body.querySelector('#pid').value.trim()||null,is_required:body.querySelector('#req').checked});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Template tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(err){window.SYKA_TOAST.show(err.message,'error');}}});}
  async function notifications(root){const rows=await window.SYKA_NOTIFICATION_SERVICE.list?.()||[];root.innerHTML=`<div class="control-local-head"><div><h2>Notifikasi</h2><span>Domain events akan muncul setelah backend event handlers aktif.</span></div></div>${rows.length?`<div class="admin-table">${rows.map(n=>`<div class="admin-row"><div><strong>${esc(n.title)}</strong><small>${esc(n.body||'')} · ${fmt(n.created_at)}</small></div></div>`).join('')}</div>`:window.SYKA_EMPTY.render({title:'Belum ada event',text:'Notification record disimpan di database, bukan hanya toast.'})}`;}
  async function plan(root,orgId){const plans=await svc().listPlans();const ents=await svc().listEntitlements();const mine=plans.filter(p=>p.organizer_id===orgId&&p.is_active)[0];root.innerHTML=`<div class="control-grid-2"><section class="syka-card admin-section"><span class="eyebrow">CURRENT PLAN</span><h2>${esc(mine?.plan_code||'FREE')}</h2><p>${mine?`Aktif sejak ${fmt(mine.starts_at)}${mine.ends_at?` sampai ${fmt(mine.ends_at)}`:''}`:'Belum ada organizer plan aktif. Fallback: FREE.'}</p></section><section class="syka-card admin-section"><span class="eyebrow">ENTITLEMENT</span><div class="admin-table">${ents.filter(e=>e.plan_code===(mine?.plan_code||'FREE')).map(e=>`<div class="admin-row"><div><strong>${esc(e.capability)}</strong><small>Limit: ${e.limit_value??'—'}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada entitlement',text:'Admin dapat mengatur capability pada panel Plans.'})}</div></section></div>`;}
  window.SYKA_PAGE_ORGANIZER={render};
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
    {name:'organizer',match:p=>p==='/organizer'},
    {name:'admin',match:p=>p==='/admin'},
    {name:'verify',match:p=>/^\/verifikasi\/[^/]+$/.test(p)},
  ];
  function parse(p){ const clean=decodeURIComponent((p||'/').split('?')[0].replace(/\/+$/,'')||'/'); let r=routes.find(x=>x.match(clean)); if(!r) return {name:'not_found',params:{},query:window.SYKA_UTILS.queryParams()}; const seg=clean.split('/').filter(Boolean); const params={}; if(r.name==='competition')params.slug=seg[1]; if(r.name==='registration')params.slug=seg[1]; if(r.name==='attempt')params.attemptId=seg[1]; if(r.name==='verify')params.code=seg[1]; return {name:r.name,params,query:window.SYKA_UTILS.queryParams()}; }
  function href(path){ const cfg=window.SYKA_CONFIG; if(cfg.ROUTE_MODE==='hash') return '#'+path; if(cfg.ROUTE_MODE==='path') return path; const u=new URL(window.location.href); u.pathname=cfg.APP_PAGE; u.search=''; u.searchParams.set('route',path); u.hash=''; return u.pathname+u.search; }
  function navigate(path){ const cfg=window.SYKA_CONFIG; if(cfg.ROUTE_MODE==='hash'){window.location.hash='#'+path; return;} if(cfg.ROUTE_MODE==='path'){history.pushState({},'',path); render(); return;} const u=new URL(window.location.href); u.pathname=cfg.APP_PAGE; u.search=''; u.searchParams.set('route',path); u.hash=''; history.pushState({},'',u.pathname+u.search); render(); }
  async function render(){ const p=window.SYKA_UTILS.routePath(); const parsed=parse(p); window.SYKA_STATE.patch('route',parsed); window.SYKA_SIDEBAR.render(); window.SYKA_HEADER.render(); window.SYKA_BOTTOMNAV.render(); const blogFallback=document.getElementById('blogger-content'); if(blogFallback) blogFallback.style.display = parsed.name==='not_found' ? 'block' : 'none'; const root=document.getElementById('page-root'); root.innerHTML='<div class="page-loading"><div class="loading-spinner"></div></div>'; if(parsed.name==='home')return window.SYKA_PAGE_HOME.render(root); if(parsed.name==='lomba')return window.SYKA_PAGE_LOMBA.render(root); if(parsed.name==='competition')return window.SYKA_PAGE_COMPETITION.render(root,parsed.params.slug); if(parsed.name==='registration')return window.SYKA_PAGE_REGISTRATION.render(root,parsed.params.slug); if(parsed.name==='profile')return window.SYKA_PAGE_PROFILE.render(root); if(parsed.name==='leaderboard')return window.SYKA_PAGE_LEADERBOARD.render(root); if(parsed.name==='awards')return window.SYKA_PAGE_AWARDS.render(root); if(parsed.name==='orders')return window.SYKA_PAGE_ORDERS.render(root); if(parsed.name==='verify')return window.SYKA_PAGE_VERIFY.render(root,parsed.params.code); if(parsed.name==='attempt')return window.SYKA_PAGE_PLACEHOLDER.render(root,'Attempt engine','Timer server-authoritative, autosave debounce, resume, submit idempotency, dan grading akan berada di service contract attempt.'); if(parsed.name==='organizer')return window.SYKA_PAGE_ORGANIZER.render(root); if(parsed.name==='admin')return window.SYKA_PAGE_ADMIN.render(root); return window.SYKA_PAGE_PLACEHOLDER.render(root,'Halaman tidak ditemukan','Route belum tersedia di application shell.'); }
  function refresh(){return render();}
  window.addEventListener('popstate',render); window.addEventListener('hashchange',render);
  window.SYKA_ROUTER={parse,href,navigate,render,refresh};
})();




/* src/core/app.js */
(function(){
  let authSubscription = null;
  let authBootstrapped = false;

  async function bootstrapAuth(){
    const client=window.SYKA_SUPABASE.get();
    if(authBootstrapped) return;
    authBootstrapped = true;

    // Subscribe immediately so SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT
    // events cannot be missed during initial session recovery.
    const result = client.auth.onAuthStateChange((event,session)=>{
      // INITIAL_SESSION may be emitted while the client is restoring storage.
      // Never treat a transient null session as a real logout during boot.
      if(event === 'INITIAL_SESSION' && !session){
        return;
      }
      setTimeout(()=>hydrate(session,event),0);
    });
    authSubscription = result?.data?.subscription || null;

    try{
      // getSession reads persisted storage and refreshes when necessary.
      const session=await window.SYKA_AUTH_SERVICE.getSession();
      if(session){
        await hydrate(session,'SESSION_RESTORED');
      } else {
        window.SYKA_STATE.patch('auth.status','anonymous');
      }
    }catch(e){
      // Do not destroy an already restored in-memory user because of a
      // transient database/profile error.
      const current=window.SYKA_STATE.getState();
      if(!current.auth.user){
        window.SYKA_STATE.patch('auth.status','anonymous');
        window.SYKA_TOAST.show('Session belum dapat dipulihkan. Coba refresh sekali lagi.','warning');
      }
    }
  }

  function refreshAuthChrome(){
    try{
      window.SYKA_SIDEBAR?.render?.();
      window.SYKA_HEADER?.render?.();
      window.SYKA_BOTTOMNAV?.render?.();
    }catch(_){}
  }

  async function hydrate(session,event='INITIAL_SESSION'){
    const current=window.SYKA_STATE.getState();

    if(session?.user){
      window.SYKA_STATE.patch('auth.session',session);
      window.SYKA_STATE.patch('auth.user',session.user);
      window.SYKA_STATE.patch('auth.status','authenticated');

      try{
        const [profile,roles]=await Promise.all([
          window.SYKA_PROFILE_SERVICE.getMe(session.user.id),
          window.SYKA_PROFILE_SERVICE.getRoles(session.user.id)
        ]);
        window.SYKA_STATE.patch('auth.profile',profile);
        window.SYKA_STATE.patch('auth.roles',roles.roles);
        window.SYKA_STATE.patch('auth.permissions',roles.permissions);
      }catch(e){
        // Auth remains authenticated even if profile hydration temporarily fails.
        window.SYKA_STATE.patch('auth.profile',null);
        window.SYKA_STATE.patch('auth.roles',[]);
        window.SYKA_STATE.patch('auth.permissions',[]);
      }

      refreshAuthChrome();
      if(event==='PASSWORD_RECOVERY') openPasswordRecovery();
      return;
    }

    // Only a confirmed SIGNED_OUT should clear the current authenticated state.
    // This prevents transient null sessions from causing an apparent logout.
    if(event==='SIGNED_OUT'){
      window.SYKA_STATE.resetUserState();
      refreshAuthChrome();
      return;
    }

    if(!current.auth.user){
      window.SYKA_STATE.patch('auth.status','anonymous');
      refreshAuthChrome();
    }
  }

  function openAuth(mode='login',opts={}){
    const target=opts.target||window.SYKA_UTILS.routePath(); const title=mode==='register'?'Buat akun Sykabelajar':'Masuk ke Sykabelajar';
    const classes=[['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];
    const gradeOptions=classes.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    window.SYKA_MODAL.open({title,wide:true,html:`<div class="auth-tabs"><button class="auth-tab ${mode==='login'?'active':''}" data-mode="login">Masuk</button><button class="auth-tab ${mode==='register'?'active':''}" data-mode="register">Daftar</button></div><form id="auth-form" class="form-card auth-form">${mode==='register'?`<div class="form-grid-2"><label>Nama lengkap *<input id="auth-name" required autocomplete="name"></label><label>Username *<input id="auth-username" required autocomplete="username" pattern="[A-Za-z0-9._-]{3,30}"></label></div><div class="form-grid-2"><label>Email *<input id="auth-email" type="email" required autocomplete="email"></label><label>Password *<div class="password-field"><input id="auth-password" type="password" required minlength="6" autocomplete="new-password"><button type="button" class="password-toggle" data-target="auth-password">Lihat</button></div></label></div><div class="form-grid-2"><label>Tanggal lahir *<input id="auth-birth" type="date" required></label><label>Kelas *<select id="auth-grade" required>${gradeOptions}</select></label></div><div class="form-grid-2"><label>Sekolah *<input id="auth-school" required placeholder="Ketik nama sekolah"></label><label>Pembina / guru pendamping<input id="auth-guardian" placeholder="Opsional"></label></div><div id="auth-school-suggest" class="suggest-list hidden"></div><div class="state-banner">Sekolah akan disimpan dalam format uppercase. Ketika kamu mengetik minimal 2 karakter, rekomendasi sekolah yang mirip akan muncul.</div>`:`<div class="form-grid-2"><label>Email *<input id="auth-email" type="email" required autocomplete="email"></label><label>Password *<div class="password-field"><input id="auth-password" type="password" required minlength="6" autocomplete="current-password"><button type="button" class="password-toggle" data-target="auth-password">Lihat</button></div></label></div><button type="button" class="link-button" id="forgot-password">Lupa password?</button>`}<button class="btn btn-primary btn-block" type="submit">${mode==='register'?'Daftar':'Masuk'}</button><div id="auth-feedback"></div></form>`,onOpen:(body)=>{
      body.querySelectorAll('.auth-tab').forEach(b=>b.onclick=()=>openAuth(b.dataset.mode,opts));
      body.querySelectorAll('.password-toggle').forEach(btn=>btn.onclick=()=>{const i=body.querySelector('#'+btn.dataset.target);i.type=i.type==='password'?'text':'password';btn.textContent=i.type==='password'?'Lihat':'Sembunyikan';});
      if(mode==='register'){
        const school=body.querySelector('#auth-school'),suggest=body.querySelector('#auth-school-suggest'); let timer;
        school.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(r=>`<button type="button" data-name="${window.SYKA_UTILS.escapeHtml(r.name)}">${window.SYKA_UTILS.escapeHtml(r.name)}${r.city?`<small>${window.SYKA_UTILS.escapeHtml(r.city)}</small>`:''}</button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},250);});
      }
      body.querySelector('#auth-form').onsubmit=async e=>{e.preventDefault();const btn=body.querySelector('button[type=submit]');const feedback=body.querySelector('#auth-feedback');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Memproses...';try{if(mode==='login'){await window.SYKA_AUTH_SERVICE.signIn({email:body.querySelector('#auth-email').value.trim(),password:body.querySelector('#auth-password').value});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Login berhasil.','success');setTimeout(()=>window.SYKA_ROUTER.navigate(target||'/profile'),0);}else{const res=await window.SYKA_AUTH_SERVICE.signUp({email:body.querySelector('#auth-email').value.trim(),password:body.querySelector('#auth-password').value,fullName:body.querySelector('#auth-name').value.trim(),username:body.querySelector('#auth-username').value.trim().toLowerCase(),grade:body.querySelector('#auth-grade').value,birthDate:body.querySelector('#auth-birth').value||null,institution:body.querySelector('#auth-school').value.trim().toUpperCase(),guardianName:body.querySelector('#auth-guardian').value.trim()||null});window.SYKA_MODAL.close();if(res.session){window.SYKA_TOAST.show('Akun berhasil dibuat dan langsung masuk.','success');window.SYKA_ROUTER.navigate(target||'/profile');}else window.SYKA_MODAL.open({title:'Cek email',html:'<div class="verify-success"><div class="verify-icon">✉</div><h2>Konfirmasi email</h2><p>Supabase meminta verifikasi email sebelum session dibuat. Cek inbox kamu lalu buka link konfirmasi.</p></div>'});}}catch(err){btn.disabled=false;btn.textContent=mode==='register'?'Daftar':'Masuk';feedback.innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(err.message||'Terjadi kesalahan.')}</div>`;}};
      body.querySelector('#forgot-password')?.addEventListener('click',()=>openForgotPassword());
    }});
  }
  function openForgotPassword(){window.SYKA_MODAL.open({title:'Reset password',html:'<form id="forgot-form" class="form-card"><label>Email<input id="forgot-email" type="email" required placeholder="nama@email.com"></label><button class="btn btn-primary btn-block" type="submit">Kirim link reset</button><div id="forgot-feedback"></div></form>',onOpen:body=>{body.querySelector('#forgot-form').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_AUTH_SERVICE.resetPassword(body.querySelector('#forgot-email').value.trim());window.SYKA_MODAL.close();window.SYKA_TOAST.show('Link reset password dikirim jika email terdaftar.','success');}catch(err){body.querySelector('#forgot-feedback').innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(err.message)}</div>`;}};}})}
  function openPasswordRecovery(){window.SYKA_MODAL.open({title:'Buat password baru',html:'<form id="recovery-form" class="form-card"><label>Password baru<input id="new-password" type="password" minlength="6" required></label><button class="btn btn-primary btn-block" type="submit">Simpan password</button><div id="recovery-feedback"></div></form>',onOpen:body=>{body.querySelector('#recovery-form').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_AUTH_SERVICE.updatePassword(body.querySelector('#new-password').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Password berhasil diperbarui.','success');}catch(err){body.querySelector('#recovery-feedback').innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(err.message)}</div>`;}};}})}
  async function logout(){window.SYKA_MODAL.open({title:'Keluar dari akun?',html:'<p class="confirm-copy">Session browser akan diakhiri dan area privat akan kembali menjadi mode guest.</p><div class="form-actions"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" id="confirm-logout">Keluar</button></div>',onOpen:body=>{body.querySelector('#confirm-logout').onclick=async()=>{try{await window.SYKA_AUTH_SERVICE.signOut();window.SYKA_STATE.resetUserState();window.SYKA_MODAL.close();window.SYKA_TOAST.show('Kamu sudah keluar.','success');window.SYKA_ROUTER.navigate('/');}catch(e){window.SYKA_TOAST.show(e.message||'Logout gagal.','error');}};}})}
  function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem('syka_theme',theme);window.SYKA_STATE.patch('ui.theme',theme);}
  function toggleTheme(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');}
  function toggleSidebar(){document.body.classList.toggle('sidebar-collapsed');localStorage.setItem('syka_sidebar',document.body.classList.contains('sidebar-collapsed')?'0':'1');}
  function toggleMobileNav(){document.body.classList.toggle('mobile-nav-open');}
  function bindInternalNavigation(){
    if(window.__SYKA_INTERNAL_NAV_BOUND) return;
    window.__SYKA_INTERNAL_NAV_BOUND=true;
    document.addEventListener('click',(e)=>{
      const link=e.target.closest?.('a[href]');
      if(!link) return;
      if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const raw=link.getAttribute('href');
      if(!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
      try{
        const u=new URL(raw, window.location.href);
        const cfg=window.SYKA_CONFIG;
        if(u.origin!==window.location.origin) return;
        if(cfg.ROUTE_MODE==='query' && u.pathname===cfg.APP_PAGE && u.searchParams.has('route')){
          e.preventDefault();
          const route=u.searchParams.get('route') || '/';
          window.SYKA_ROUTER.navigate(route);
        }
      }catch(_){}
    });
  }
  function init(){
  if(window.__SYKA_APP_INITIALIZED) return;
  window.__SYKA_APP_INITIALIZED=true;

  bindInternalNavigation();

  const theme=window.SYKA_UTILS.getStoredTheme();
  setTheme(theme);

  if(localStorage.getItem('syka_sidebar')==='0'){
    document.body.classList.add('sidebar-collapsed');
  }

  window.SYKA_SIDEBAR.render();
  window.SYKA_HEADER.render();
  window.SYKA_BOTTOMNAV.render();

  window.__SYKA_AUTH_UI_UNSUB=window.SYKA_STATE.subscribe((state,path)=>{
    if(path && path.startsWith('auth.')) refreshAuthChrome();
  });

  document.getElementById('mobile-nav-overlay')?.addEventListener('click',toggleMobileNav);

  window.addEventListener('online',()=>{
    window.SYKA_STATE.patch('network.online',true);
  });

  window.addEventListener('offline',()=>{
    window.SYKA_STATE.patch('network.online',false);
    window.SYKA_TOAST.show('Koneksi internet terputus.','warning');
  });

  // IMPORTANT:
  // Do NOT render a protected route before the Supabase session has been restored.
  // bootstrapAuth() restores the persisted session, profile and roles first.
  // Only then do we resolve/render the current application route.
  bootstrapAuth()
    .catch((error)=>{
      console.error('[Sykabelajar] Auth bootstrap failed:', error);
    })
    .finally(()=>{
      window.SYKA_ROUTER.render();
    });
}
  window.SYKA_APP={init,openAuth,openForgotPassword,logout,toggleTheme,toggleSidebar,toggleMobileNav,disposeAuth:()=>authSubscription?.unsubscribe?.()};
})();
