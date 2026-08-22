(function(){
  const esc=window.SYKA_UTILS.escapeHtml,fmt=window.SYKA_UTILS.formatNumber;
  const medals={1:'♛',2:'◇',3:'✦'};
  function podium(r,rank,cls){
    const name=r?.name||r?.full_name||'';
    const ready=Boolean(name);
    return `<article class="podium-card ${cls} ${ready?'has-data':'is-empty'}">
      <div class="podium-rank-badge"><span>${medals[rank]}</span><small>${rank===1?'JUARA 1':rank===2?'JUARA 2':'JUARA 3'}</small></div>
      <div class="podium-avatar">${ready?esc(window.SYKA_UTILS.initials(name)):'—'}</div>
      <strong>${ready?esc(name):'Belum tersedia'}</strong>
      <small>${ready?esc(r?.grade||'Peserta'):'Akan muncul ketika leaderboard aktif'}</small>
      <b>${ready?fmt(r?.xp||r?.total_xp||0)+' XP':'—'}</b>
    </article>`;
  }
  async function render(root){
    root.innerHTML=`<section class="page-title leaderboard-title-v46"><span class="eyebrow">LEADERBOARD</span><h1>Juara & Peringkat</h1><p>Peringkat prestasi akan dihitung dari hasil kompetisi resmi dan XP yang tervalidasi di server.</p></section>
      <section class="leaderboard-status-card"><div class="leaderboard-status-icon">◈</div><div><span class="eyebrow">COMING SOON</span><h2>Peringkat sedang disiapkan</h2><p>Read model leaderboard akan diaktifkan setelah season dan scope penilaian resmi tersedia. Tampilan juara tetap disiapkan dari sekarang.</p></div><span class="status-pill status-warning">SEGERA</span></section>
      <div id="podium" class="podium-grid podium-grid-v46"></div>
      <section class="panel-card leaderboard-list-card"><div class="panel-head"><div><span class="eyebrow">TOP 4–50</span><h2>Daftar juara</h2><p>10 peserta per halaman setelah data leaderboard tersedia.</p></div><span class="chip">TOP 50</span></div><div id="rank-list"></div><div id="rank-pagination" class="pagination"></div></section>`;
    try{
      const rows=await window.SYKA_LEADERBOARD_SERVICE.get({scope:'global',limit:50});
      const podiumRoot=document.getElementById('podium');
      podiumRoot.innerHTML=[1,2,3].map((r,i)=>podium(rows[i],r,['gold','silver','bronze'][i])).join('');
      const lower=rows.slice(3);
      if(!lower.length){
        document.getElementById('rank-list').innerHTML=`<div class="leaderboard-empty-state"><div class="leaderboard-empty-icon">4–50</div><h3>Daftar juara belum tersedia</h3><p>Peserta peringkat 4–50 akan muncul otomatis saat read model leaderboard diaktifkan.</p></div>`;
        document.getElementById('rank-pagination').innerHTML='';
        return;
      }
      let page=1;const per=10;const list=document.getElementById('rank-list'),pagination=document.getElementById('rank-pagination');
      const paint=()=>{const start=(page-1)*per;const chunk=lower.slice(start,start+per);list.innerHTML=chunk.map((r,i)=>`<div class="rank-row rank-row-v46"><span class="rank-number">${start+i+4}</span><div class="rank-user"><div class="avatar-mini">${esc(window.SYKA_UTILS.initials(r.name||r.full_name||'U'))}</div><div><strong>${esc(r.name||r.full_name||'Peserta')}</strong><small>${esc(r.grade||'')}</small></div></div><b>${fmt(r.xp||r.total_xp||0)} XP</b></div>`).join('');const pages=Math.max(1,Math.ceil(lower.length/per));pagination.innerHTML=`<button class="page-btn" data-page="${page-1}" ${page===1?'disabled':''}>‹</button>${Array.from({length:pages},(_,i)=>`<button class="page-btn ${page===i+1?'active':''}" data-page="${i+1}">${i+1}</button>`).join('')}<button class="page-btn" data-page="${page+1}" ${page===pages?'disabled':''}>›</button>`;pagination.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=Number(b.dataset.page);paint();});};
      paint();
    }catch(error){
      document.getElementById('podium').innerHTML=[1,2,3].map((r,i)=>podium(null,r,['gold','silver','bronze'][i])).join('');
      document.getElementById('rank-list').innerHTML=`<div class="leaderboard-empty-state"><div class="leaderboard-empty-icon">!</div><h3>Peringkat belum aktif</h3><p>${esc(error.message||'Read model leaderboard belum tersedia.')}</p></div>`;
    }
  }
  window.SYKA_PAGE_LEADERBOARD={render};
})();
