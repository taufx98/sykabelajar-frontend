/* Bolt-style home/feed renderer. Reads posts, competitions and profile data from Supabase only. */
(function(){
  if(window.__SYKA_BOLT_HOME__)return;
  window.__SYKA_BOLT_HOME__=true;
  const supa=()=>window.SYKA_SUPABASE?.get?.();
  const auth=()=>window.SYKA_AUTH_SERVICE;
  const root=()=>document.getElementById('page-root');
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const fmt=n=>Number(n||0).toLocaleString('id-ID');
  const route=()=>new URLSearchParams(location.search).get('route')||'/';
  const initials=n=>String(n||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'U';
  function card(t){return `<article class="bolt-card" style="padding:15px"><div class="bolt-post"><span class="bolt-avatar">${initials(t.author_name||t.full_name||t.username||'U')}</span><div class="bolt-post-main"><div class="bolt-post-head"><strong>${esc(t.author_name||t.full_name||t.username||'Pengguna')}</strong><span>· ${esc(t.created_at||'')}</span></div><div style="font-size:10px;color:#64748b;margin-top:1px">@${esc(t.username||'pengguna')}</div><p>${esc(t.title||t.content||t.body||t.text||'')}</p>${t.image_url||t.image?<div style="border:1px solid rgba(255,255,255,.05);border-radius:12px;overflow:hidden;margin-bottom:10px"><img src="${esc(t.image_url||t.image)}" alt="" style="width:100%;max-height:360px;object-fit:cover"></div>:''}<div class="bolt-post-actions"><button type="button">♡ ${fmt(t.likes||0)}</button><button type="button">◯ ${fmt(t.comments_count||0)}</button><button type="button">↻ ${fmt(t.reposts||0)}</button><button type="button">↗</button><button type="button">⌑</button></div></div></div></article>`}
  async function load(){
    if(!['/home','/student'].includes(route()))return;
    const r=root();if(!r)return;
    try{
      let posts=[];
      const q=await supa()?.from('posts').select('*').order('created_at',{ascending:false}).limit(20);
      posts=q?.data||[];
      if(!posts.length){
        const c=window.SYKA_COMPETITION_SERVICE?.list?await window.SYKA_COMPETITION_SERVICE.list({limit:8,status:'PUBLIC_ONLY'}):[];
        posts=c.map(x=>({author_name:'Sykabelajar',username:'sykabelajar',created_at:x.createdAt||x.created_at,title:x.title,content:x.description||x.short_description||'Uji kompetensi publik tersedia.',image:x.poster||x.poster_url,likes:0,comments_count:0,reposts:0,type:'competition'}));
      }
      const body=posts.length?posts.map(card).join(''):'<div class="bolt-empty">Belum ada aktivitas dari backend.</div>';
      const comps=window.SYKA_COMPETITION_SERVICE?.list?await window.SYKA_COMPETITION_SERVICE.list({limit:3,status:'PUBLIC_ONLY'}):[];
      const quick=comps.length?`<div class="bolt-card" style="padding:14px;margin-bottom:12px;background:linear-gradient(90deg,rgba(16,185,129,.08),transparent)"><div style="display:flex;align-items:center;gap:10px"><span class="bolt-feature-icon" style="width:40px;height:40px">${window.SYKA_BOLT_ICON?window.SYKA_BOLT_ICON('trophy'):'🏆'}</span><div style="min-width:0"><div style="font-size:12px;font-weight:700">Uji Kompetensi Terbuka</div><div style="color:#64748b;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(comps[0].title||'Kompetisi terbaru')}</div></div><a class="bolt-btn primary" style="margin-left:auto;padding:8px 11px" href="?route=/lomba">Lihat</a></div></div>`:'';
      r.innerHTML=`<div class="bolt-section"><div class="bolt-section-head" style="align-items:center"><div><h1 class="bolt-page-title" style="font-size:25px">Beranda</h1><p class="bolt-page-sub">Aktivitas terbaru dari komunitas dan kompetisi Sykabelajar.</p></div><span class="bolt-chip">LIVE</span></div><div class="bolt-card" style="padding:0;margin-bottom:12px"><div style="display:flex;gap:8px;padding:12px;border-bottom:1px solid rgba(255,255,255,.05)"><button style="flex:1;border:0;background:transparent;color:#34d399;font-weight:700;font-size:12px;padding:8px;border-bottom:2px solid #34d399">Lomba</button><button style="flex:1;border:0;background:transparent;color:#64748b;font-weight:700;font-size:12px;padding:8px">Prestasi</button></div></div>${quick}<div class="bolt-feed">${body}</div></div>`;
    }catch(e){console.error('[Sykabelajar Bolt] feed failed',e);r.innerHTML='<div class="bolt-section"><div class="bolt-empty">Data feed belum bisa dimuat dari backend.</div></div>'}
  }
  function schedule(){if(['\/home','\/student'].includes(route()))setTimeout(load,80)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('popstate',schedule);
  window.addEventListener('syka-bolt-ready',schedule);
})();
