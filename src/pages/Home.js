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
