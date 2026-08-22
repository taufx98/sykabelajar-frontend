(function(){
  function render(c){
    const u=window.SYKA_UTILS; const status=(c.status||'').replaceAll('_',' '); const poster=u.cloudinaryTransform(c.poster,{width:720,height:405,crop:'fill'});
    return `<article class="syka-card syka-competition-card"><a class="competition-media" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug))}">${poster?`<img src="${u.escapeHtml(poster)}" alt="${u.escapeHtml(c.title)}" loading="lazy">`:`<div class="media-fallback">Sykabelajar</div>`}</a><div class="card-body"><div class="eyebrow-row"><span class="chip chip-purple">${u.escapeHtml(c.category)}</span><span class="status-dot ${String(c.status).toLowerCase().includes('open')?'success':'muted'}">${u.escapeHtml(status)}</span></div><h3><a href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug))}">${u.escapeHtml(c.title)}</a></h3><p>${u.escapeHtml(c.description || 'Lihat persyaratan, timeline, hadiah, dan mekanisme kompetisi.')}</p><div class="meta-row"><span>Daftar s/d ${u.formatDate(c.registrationEndsAt)}</span><span>Mulai ${u.formatDate(c.startsAt)}</span></div><a class="btn btn-primary btn-block" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug))}">Lihat Detail <span>→</span></a></div></article>`;
  }
  window.SYKA_COMPETITION_CARD={render};
})();


