(function(){
  function render(c){
    const u=window.SYKA_UTILS;
    const status=(c.status||'').replaceAll('_',' ');
    const poster=u.cloudinaryTransform(c.poster||c.poster_url,{width:900,height:506,crop:'fill'});
    const route=window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug));
    return `<article class="syka-card competition-card-v46">
      <a class="competition-media-v46" href="${route}" aria-label="Lihat ${u.escapeHtml(c.title)}">
        ${poster?`<img src="${u.escapeHtml(poster)}" alt="${u.escapeHtml(c.title)}" loading="lazy">`:'<div class="competition-media-placeholder"><span>✦</span><small>Sykabelajar.id</small></div>'}
        <span class="competition-status-overlay ${u.statusClass(c.status)}">${u.escapeHtml(status)}</span>
      </a>
      <div class="competition-card-body-v46">
        <div class="eyebrow-row"><span class="chip chip-purple">${u.escapeHtml(c.category||'Kompetisi')}</span><span class="competition-date-badge">${c.registrationEndsAt||c.registration_ends_at?`Daftar s/d ${u.formatDate(c.registrationEndsAt||c.registration_ends_at)}`:'Jadwal menyusul'}</span></div>
        <h3><a href="${route}">${u.escapeHtml(c.title)}</a></h3>
        <p>${u.escapeHtml(c.description||c.short_description||'Temukan persyaratan, timeline, hadiah, dan mekanisme kompetisi.')}</p>
        <div class="competition-meta-v46"><span><b>Mulai</b>${u.formatDate(c.startsAt||c.starts_at)}</span><span><b>Pengumuman</b>${u.formatDate(c.announcementAt||c.announcement_at)}</span></div>
        <a class="btn btn-primary btn-block" href="${route}">Lihat detail <span>→</span></a>
      </div>
    </article>`;
  }
  window.SYKA_COMPETITION_CARD={render};
})();
