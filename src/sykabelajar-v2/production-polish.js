(function(){
  if(window.__SYKA_V2_PRODUCTION_POLISH__) return;
  window.__SYKA_V2_PRODUCTION_POLISH__=true;

  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const dummyNames=['Aruna Putra','Mira Cendekia','Bagaskara Wibawa','Larasati Ayu','Dimas Pratama','Naila Zahra'];
  const dummyCompetitions=['Uji Kompetensi Matematika Nasional 2026','Karya Tulis Ilmiah Sains Muda 2026','Web Kita'];

  function isolateApp(){
    const root=document.getElementById('page-root');
    if(!root || root.parentElement!==document.body) document.body.appendChild(root||document.createElement('div'));
    if(!root) return;
    [...document.body.children].forEach(el=>{ if(el!==root) el.setAttribute('data-syka-legacy-hidden','true'); });
    document.documentElement.classList.add('syka-v2-takeover');
    document.body.classList.add('syka-v2-body');
  }

  function boardRows(rows){
    if(!rows.length) return '<div class="v2-data-empty">Belum ada data peringkat.</div>';
    return rows.slice(0,5).map((r,i)=>{
      const name=r.name||r.full_name||r.display_name||r.username||r.profile_name||r.user_name||`Peserta ${i+1}`;
      const score=Number(r.score??r.points??r.xp??r.total_xp??r.total_points??0);
      return `<div class="v2-board-row"><b>${i+1}</b><span class="v2-mini-avatar">${esc(name).slice(0,2).toUpperCase()}</span><div><strong>${esc(name)}</strong><small>${esc(r.school||r.institution||r.organization||'Peserta Sykabelajar')}</small></div><em>${score.toLocaleString('id-ID')}</em></div>`;
    }).join('');
  }

  async function hydrateLanding(){
    const board=document.querySelector('.v2-hero-board');
    if(board && !board.dataset.realData){
      try{
        const svc=window.SYKA_LEADERBOARD_SERVICE;
        const rows=svc?.get?await svc.get({scope:'global',limit:5}):[];
        if(rows.length || board.textContent.includes('Aruna Putra')){
          board.innerHTML=`<div class="v2-board-title">${window.SYKA_V2_ICON?.('chart')||''} Papan Peringkat <span>LIVE</span></div>${boardRows(rows)}`;
          board.dataset.realData='1';
        }
      }catch(_){
        if(board.textContent.includes('Aruna Putra')) board.innerHTML='<div class="v2-board-title">Papan Peringkat</div><div class="v2-data-empty">Data peringkat belum tersedia.</div>';
      }
    }

    const cards=[...document.querySelectorAll('.v2-comp-card')];
    if(cards.length && cards.some(c=>dummyCompetitions.some(x=>c.textContent.includes(x)))){
      try{
        const svc=window.SYKA_COMPETITION_SERVICE;
        const data=svc?.list?await svc.list({limit:6,status:'PUBLIC_ONLY'}):[];
        const grid=cards[0].parentElement;
        if(grid && data.length){
          grid.innerHTML=data.map(c=>`<article class="v2-comp-card"><div class="v2-comp-cover"${c.poster?` style="background-image:url('${esc(c.poster)}')"`:''}></div><div class="v2-comp-body"><span class="v2-chip">${esc(c.category||'Kompetisi')}</span><h3>${esc(c.title)}</h3><p>${esc(c.description||'Ikuti kompetisi dan raih prestasi.')}</p><div class="v2-comp-meta"><strong>+${Number(c.data?.points||c.data?.xp_reward||300)} XP</strong><span>${c.data?.participant_count!=null?Number(c.data.participant_count).toLocaleString('id-ID')+' peserta':'Terbuka'}</span></div></div></article>`).join('');
        } else if(grid){
          grid.innerHTML='<div class="v2-data-empty v2-data-empty-wide">Belum ada kompetisi publik yang tersedia.</div>';
        }
      }catch(_){
        cards.forEach(c=>{ if(dummyCompetitions.some(x=>c.textContent.includes(x))) c.remove(); });
      }
    }
  }

  async function hydrateRail(){
    const rails=[...document.querySelectorAll('.v2-rail')];
    if(!rails.length) return;
    try{
      const svc=window.SYKA_LEADERBOARD_SERVICE;
      const rows=svc?.get?await svc.get({scope:'global',limit:5}):[];
      rails.forEach(rail=>{
        if(!rows.length) return;
        const rank=rail.querySelector('.v2-rank-row')?.parentElement;
        if(rank){
          const title=rank.querySelector('.v2-rail-title');
          rank.innerHTML=(title?title.outerHTML:'<div class="v2-rail-title">Top Peringkat</div>')+rows.slice(0,5).map((r,i)=>{
            const name=r.name||r.full_name||r.display_name||r.username||r.profile_name||`Peserta ${i+1}`;
            const score=Number(r.score??r.points??r.xp??r.total_xp??r.total_points??0);
            return `<div class="v2-rank-row"><b>${i+1}</b><span class="v2-mini-avatar">${esc(name).slice(0,2).toUpperCase()}</span><strong>${esc(name)}</strong><em>${score.toLocaleString('id-ID')}</em></div>`;
          }).join('');
        }
      });
    }catch(_){}
  }

  function cleanDummyText(){
    document.querySelectorAll('.v2-rail-card,.v2-panel,.v2-card').forEach(el=>{
      if(dummyNames.some(n=>el.textContent.includes(n)) && !el.querySelector('.v2-rank-row')){
        el.querySelectorAll('button,.v2-trend').forEach(x=>x.remove());
      }
    });
  }

  function run(){
    isolateApp();
    hydrateLanding();
    hydrateRail();
    cleanDummyText();
  }
  window.addEventListener('DOMContentLoaded',run,{once:true});
  setTimeout(run,250);
  setTimeout(run,1000);
  new MutationObserver(()=>{ if(!document.documentElement.classList.contains('syka-v2-takeover')) run(); }).observe(document.body,{childList:true,subtree:false});
})();
