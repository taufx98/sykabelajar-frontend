(function(){
  const esc=v=>window.SYKA_UTILS.escapeHtml(v);
  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Masuk untuk melihat notifikasi.',actionHtml:'<button class="btn btn-primary" id="notif-login">Masuk</button>'});root.querySelector('#notif-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/notifikasi'}));return;}
    root.innerHTML='<section class="page-title"><span class="eyebrow">NOTIFIKASI</span><h1>Pemberitahuan</h1><p>Approval, lomba, hasil, pesanan, misi, dan aktivitas penting akunmu.</p></section><div id="notifications-page" class="notification-page-card"></div>';
    const el=document.getElementById('notifications-page');
    try{const rows=await window.SYKA_NOTIFICATION_SERVICE.list(auth.user.id);el.innerHTML=rows.length?rows.map(n=>`<button class="page-notif-row ${n.read_at?'read':''}" data-id="${esc(n.id)}"><span class="page-notif-dot">${n.read_at?'':'●'}</span><span><strong>${esc(n.title||n.type||'Notifikasi')}</strong><small>${esc(n.body||'')}</small><time>${esc(window.SYKA_UTILS.formatDateTime(n.created_at))}</time></span></button>`).join(''):'<div class="empty-card"><strong>Tidak ada notifikasi</strong><span>Semua pemberitahuan penting akan muncul di sini.</span></div>';
      el.querySelectorAll('[data-id]').forEach(btn=>btn.addEventListener('click',async()=>{try{await window.SYKA_NOTIFICATION_SERVICE.markRead(btn.dataset.id);btn.classList.add('read');btn.querySelector('.page-notif-dot').textContent='';}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menandai notifikasi.','error');}}));
    }catch(e){el.innerHTML=`<div class="empty-card"><strong>Notifikasi gagal dimuat</strong><span>${esc(e.message||'Coba lagi.')}</span><button type="button" class="btn btn-secondary btn-sm" id="notif-retry-page">Coba lagi</button></div>`;el.querySelector('#notif-retry-page')?.addEventListener('click',()=>render(root));}
  }
  window.SYKA_PAGE_NOTIFICATIONS={render};
})();
