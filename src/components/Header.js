(function(){
  function roleLabel(roles){
    if(roles.includes('admin'))return 'Admin';
    if(roles.includes('organizer_member'))return 'Penyelenggara';
    if(roles.includes('teacher'))return 'Guru';
    return 'Pelajar';
  }
  const esc=()=>window.SYKA_UTILS.escapeHtml;
  async function renderNotifications(){
    const auth=window.SYKA_STATE.getState().auth;
    const panel=document.getElementById('header-notification-panel');
    if(!panel||!auth.user)return;
    panel.innerHTML='<div class="notif-loading">Memuat notifikasi…</div>';
    try{
      const rows=await window.SYKA_NOTIFICATION_SERVICE.list(auth.user.id);
      const unread=rows.filter(x=>!x.read_at).length;
      const badge=document.getElementById('notification-count');
      if(badge){badge.textContent=unread>99?'99+':String(unread);badge.classList.toggle('hidden',unread===0);}
      panel.innerHTML=rows.length?`<div class="notif-head"><div><strong>Notifikasi</strong><small>${unread?`${unread} belum dibaca`:'Semua sudah dibaca'}</small></div><button type="button" class="notif-close" id="notif-close">×</button></div><div class="notif-list">${rows.map(n=>`<button type="button" class="notif-item ${n.read_at?'read':''}" data-notif-id="${esc()(n.id)}"><span class="notif-icon">${n.read_at?'•':'●'}</span><span><strong>${esc()(n.title||n.type||'Notifikasi')}</strong><small>${esc()(n.body||'')}</small><time>${esc()(window.SYKA_UTILS.formatDateTime(n.created_at))}</time></span></button>`).join('')}</div>`:'<div class="notif-empty"><strong>Tidak ada notifikasi</strong><span>Kami akan menaruh pemberitahuan penting di sini.</span></div>';
      panel.querySelector('#notif-close')?.addEventListener('click',()=>panel.classList.add('hidden'));
      panel.querySelectorAll('[data-notif-id]').forEach(btn=>btn.addEventListener('click',async()=>{
        try{
          await window.SYKA_NOTIFICATION_SERVICE.markRead(btn.dataset.notifId);
          btn.classList.add('read');
          const count=document.getElementById('notification-count');
          if(count && !count.classList.contains('hidden')){
            const n=Math.max(0,Number(count.textContent||0)-1);
            count.textContent=String(n);count.classList.toggle('hidden',n===0);
          }
        }catch(e){window.SYKA_TOAST.show(e.message||'Notifikasi gagal diperbarui.','error');}
      }));
    }catch(error){
      panel.innerHTML=`<div class="notif-empty"><strong>Notifikasi tidak dapat dimuat</strong><span>${esc()(error.message||'Coba lagi beberapa saat.')}</span><button type="button" class="btn btn-secondary btn-sm" id="notif-retry">Coba lagi</button></div>`;
      panel.querySelector('#notif-retry')?.addEventListener('click',renderNotifications);
    }
  }
  async function render(){
    const auth=window.SYKA_STATE.getState().auth;const u=auth.user,p=auth.profile||{};
    const name=p.full_name||u?.user_metadata?.full_name||u?.email?.split('@')[0]||'Pengguna';
    const avatar=p.avatar_url||'';const canAdmin=auth.roles.includes('admin');const canOrganizer=auth.roles.includes('organizer_member')||canAdmin;const el=document.getElementById('syka-header');if(!el)return;
    const announcement='Kompetisi, prestasi, misi, dan pengalaman belajar dalam satu tempat.';
    el.innerHTML=`<div class="header-inner"><div class="header-left"><div class="header-mobile-left"><button class="icon-btn mobile-menu" id="mobile-menu-btn" aria-label="Menu">☰</button></div><a class="mobile-brand" href="${window.SYKA_ROUTER.href('/home')}" aria-label="Sykabelajar"><span class="brand-logo-mini">S</span></a></div><div class="header-announcement" aria-label="Pengumuman"><span class="announcement-dot"></span><div class="announcement-marquee"><span>${esc()(announcement)}</span><span aria-hidden="true">${esc()(announcement)}</span></div></div><div class="header-actions"><button class="icon-btn header-notification-btn" id="notification-btn" title="Notifikasi" aria-label="Notifikasi"><span>♢</span><b id="notification-count" class="notification-badge hidden">0</b></button><button class="icon-btn" id="theme-btn" title="Ganti tema" aria-label="Tema">${document.documentElement.dataset.theme==='dark'?'☀':'◐'}</button>${u?`<div class="profile-quick"><button class="profile-trigger" id="profile-quick-btn" aria-label="Profil"><span class="profile-avatar-mini">${avatar?`<img src="${esc()(avatar)}" alt="">`:esc()(window.SYKA_UTILS.initials(name))}</span><span class="profile-text"><strong>${esc()(name)}</strong><small>${roleLabel(auth.roles)}</small></span><span class="profile-chevron">⌄</span></button><div class="profile-menu hidden" id="profile-menu">${canAdmin?`<button data-go="/admin">Panel Admin</button>`:''}${canOrganizer?`<button data-go="/organizer">Panel Penyelenggara</button>`:''}<button data-go="/profile">Profil Saya</button><button data-go="/prestasi">Prestasi</button><button data-go="/pesanan">Pesanan</button><button class="danger" id="logout-btn">Keluar</button></div></div>`:`<button class="btn btn-primary btn-sm" id="header-login">Masuk</button>`}</div><div class="header-notification-panel hidden" id="header-notification-panel"></div></div>`;
    document.getElementById('theme-btn')?.addEventListener('click',()=>window.SYKA_APP.toggleTheme());
    document.getElementById('mobile-menu-btn')?.addEventListener('click',()=>window.SYKA_APP.toggleMobileNav());
    document.getElementById('header-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login'));
    document.getElementById('notification-btn')?.addEventListener('click',async e=>{e.stopPropagation();const panel=document.getElementById('header-notification-panel');panel?.classList.toggle('hidden');if(!panel?.classList.contains('hidden'))await renderNotifications();});
    const trigger=document.getElementById('profile-quick-btn'),menu=document.getElementById('profile-menu');
    if(trigger&&menu){trigger.onclick=e=>{e.stopPropagation();menu.classList.toggle('hidden');document.getElementById('header-notification-panel')?.classList.add('hidden');};menu.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{menu.classList.add('hidden');window.SYKA_ROUTER.navigate(b.dataset.go);});document.getElementById('logout-btn')?.addEventListener('click',()=>window.SYKA_APP.logout());}
  }
  window.SYKA_HEADER={render,renderNotifications};
})();
