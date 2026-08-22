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
