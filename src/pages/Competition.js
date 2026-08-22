(function(){
  const esc=window.SYKA_UTILS.escapeHtml;
  const fmt=window.SYKA_UTILS.formatDateTime;

  function timelineCard(label,start,end){
    return `<div class="timeline-card-v46"><span>${esc(label)}</span><strong>${esc(start||'Jadwal menyusul')}</strong>${end?`<small>sampai ${esc(end)}</small>`:''}</div>`;
  }

  async function render(root,slug){
    root.innerHTML='<div class="page-loading"><div class="loading-spinner"></div><span>Memuat detail kompetisi…</span></div>';
    const c=await window.SYKA_COMPETITION_SERVICE.getBySlug(slug);
    if(!c){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Slug kompetisi tidak tersedia atau sudah diarsipkan.',actionHtml:`<a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/lomba')}">Kembali ke katalog</a>`});
      return;
    }
    const [levels,rules,rewards]=await Promise.all([
      window.SYKA_COMPETITION_SERVICE.getLevels(c.id).catch(()=>[]),
      window.SYKA_COMPETITION_SERVICE.getRules(c.id).catch(()=>null),
      window.SYKA_COMPETITION_SERVICE.getRewards(c.id).catch(()=>[])
    ]);
    const auth=window.SYKA_STATE.getState().auth;
    const reg=auth.user?await window.SYKA_REGISTRATION_SERVICE.getStatus(auth.user.id,c.id).catch(()=>null):null;
    const poster=window.SYKA_UTILS.cloudinaryTransform(c.poster||c.poster_url,{width:1400,height:800,crop:'fill'});
    const shareRoute=window.location.href;

    root.innerHTML=`
      <section class="competition-detail-v46">
        <div class="competition-detail-cover">
          ${poster?`<img src="${esc(poster)}" alt="${esc(c.title)}">`:'<div class="competition-cover-empty"><span>✦</span><strong>Poster kompetisi</strong><small>Belum ditambahkan penyelenggara.</small></div>'}
          <div class="cover-gradient"></div>
          <div class="cover-badges"><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span><span class="chip chip-white">${esc(c.category||'Kompetisi')}</span></div>
        </div>
        <div class="competition-detail-main">
          <div class="eyebrow">SYKABELAJAR COMPETITION</div>
          <h1>${esc(c.title)}</h1>
          <p class="competition-lead">${esc(c.description||c.short_description||'Ikuti kompetisi, selesaikan prosesnya, dan bangun bukti prestasi yang bisa diverifikasi.')}</p>
          <div class="timeline-grid-v46">
            ${timelineCard('Pendaftaran',fmt(c.registrationStartsAt),c.registrationEndsAt?fmt(c.registrationEndsAt):'')}
            ${timelineCard('Kompetisi',fmt(c.startsAt),c.endsAt?fmt(c.endsAt):'')}
            ${timelineCard('Pengumuman',fmt(c.announcementAt),'')}
          </div>
          <div class="competition-actions-v46">
            ${reg?`<div class="registration-state-box"><span class="eyebrow">STATUS PENDAFTARAN</span><strong>${esc(reg.status||'PENDING')}</strong><small>Status berasal dari server.</small></div>`:`<a class="btn btn-primary btn-lg" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(slug)+'/daftar')}">Daftar sekarang <span>→</span></a>`}
            <button class="btn btn-secondary btn-lg" id="share-competition">Bagikan</button>
          </div>
        </div>
      </section>

      <section class="detail-grid-v46">
        <section class="panel-card detail-panel-v46">
          <div class="panel-head"><div><span class="eyebrow">ELIGIBILITY</span><h2>Siapa yang bisa ikut?</h2></div></div>
          <div class="detail-list detail-list-v46">
            <div><span>Jenjang / kelas</span><strong>${levels.length?levels.map(x=>esc(x.label||x.grade||'')).filter(Boolean).join(' · '):((rules?.allowed_grades||[]).join(' · ')||'Mengikuti aturan kompetisi')}</strong></div>
            <div><span>Twibbon</span><strong>${rules?.require_twibbon?'Wajib':'Opsional / tidak ditentukan'}</strong></div>
            <div><span>Social proof</span><strong>${rules?.require_social_proof?'Wajib':'Opsional / tidak ditentukan'}</strong></div>
            <div><span>Kuota</span><strong>${rules?.max_participants?Number(rules.max_participants).toLocaleString('id-ID'):'Tanpa batas khusus'}</strong></div>
          </div>
        </section>
        <section class="panel-card detail-panel-v46">
          <div class="panel-head"><div><span class="eyebrow">REWARD</span><h2>Hadiah & penghargaan</h2></div></div>
          <div class="reward-list reward-list-v46">${rewards.length?rewards.map(r=>`<div class="reward-item reward-item-v46"><span class="reward-rank">${esc(r.rank_code)}</span><div><strong>${esc(r.title||'Reward')}</strong><small>${Number(r.points||0).toLocaleString('id-ID')} points${r.emblem_name?' · '+esc(r.emblem_name):''}</small></div></div>`).join(''):window.SYKA_EMPTY.render({title:'Reward belum dipublikasikan',text:'Penyelenggara belum mengisi reward kompetisi.'})}</div>
        </section>
      </section>

      <section class="detail-grid-v46 detail-grid-bottom">
        <section class="panel-card detail-panel-v46"><div class="panel-head"><div><span class="eyebrow">GUIDE</span><h2>Yang perlu disiapkan</h2></div></div><div class="prep-grid-v46"><div><span>01</span><strong>Data diri</strong><small>Nama, kelas, dan sekolah harus sesuai profil.</small></div><div><span>02</span><strong>Dokumen / twibbon</strong><small>Siapkan bukti sesuai aturan kompetisi.</small></div><div><span>03</span><strong>Ikuti timeline</strong><small>Perhatikan batas pendaftaran dan pengumuman.</small></div></div></section>
        <section class="panel-card detail-panel-v46"><div class="panel-head"><div><span class="eyebrow">SUPPORT</span><h2>Punya pertanyaan?</h2></div></div><div class="support-callout-v46"><strong>Perlu bantuan?</strong><p>Hubungi penyelenggara dari informasi yang tersedia pada tahap pendaftaran.</p><a href="${window.SYKA_ROUTER.href('/profile')}" class="text-link">Cek profil saya →</a></div></section>
      </section>`;

    document.getElementById('share-competition')?.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(shareRoute);window.SYKA_TOAST.show('Link kompetisi disalin.','success');}
      catch(_){window.SYKA_TOAST.show('Salin URL dari address bar.','info');}
    });
  }
  window.SYKA_PAGE_COMPETITION={render};
})();
