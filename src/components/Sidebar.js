(function(){
  function render(){
    const auth=window.SYKA_STATE.getState().auth;const path=window.SYKA_UTILS.routePath();const admin=auth.roles.includes('admin');const organizer=auth.roles.includes('organizer_member')||admin;
    const items=[['/','Beranda','⌂'],['/lomba','Lomba','◈'],['/juara','Juara','♛'],['/prestasi','Prestasi','✦'],['/tugas','Misi','✓']];if(auth.user)items.push(['/toko','Toko','◇']);if(organizer)items.push(['/organizer','Penyelenggara','▣']);if(admin)items.push(['/admin','Admin','⚙']);
    const el=document.getElementById('syka-sidebar');if(!el)return;
    el.innerHTML=`<div class="sidebar-inner"><div class="sidebar-brand"><a href="${window.SYKA_ROUTER.href('/')}" class="brand-link"><span class="brand-logo">S</span><span><strong>Sykabelajar.id</strong><small>Platform kompetensi</small></span></a><button class="sidebar-collapse" id="sidebar-collapse" aria-label="Ciutkan sidebar">‹</button></div><nav class="sidebar-nav">${items.map(([href,label,icon])=>`<a href="${window.SYKA_ROUTER.href(href)}" class="side-item ${path===href?'active':''}" data-side-link><span class="side-icon">${icon}</span><span>${label}</span></a>`).join('')}</nav><div class="sidebar-spacer"></div><div class="sidebar-footer"><button class="side-action" id="side-profile"><span>◎</span>${auth.user?'Profil Saya':'Masuk / Daftar'}</button><button class="side-action" id="side-theme"><span>◐</span>Tema</button></div></div>`;
    document.getElementById('sidebar-collapse')?.addEventListener('click',()=>window.SYKA_APP.toggleSidebar());
    document.getElementById('side-theme')?.addEventListener('click',()=>window.SYKA_APP.toggleTheme());
    document.getElementById('side-profile')?.addEventListener('click',()=>auth.user?window.SYKA_ROUTER.navigate('/profile'):window.SYKA_APP.openAuth('login'));
    el.querySelectorAll('[data-side-link]').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('mobile-nav-open')));
    document.getElementById('mobile-nav-overlay')?.addEventListener('click',()=>document.body.classList.remove('mobile-nav-open'),{once:true});
  }
  window.SYKA_SIDEBAR={render};
})();
