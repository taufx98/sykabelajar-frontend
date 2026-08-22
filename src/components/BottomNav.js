(function(){ function render(){const u=window.SYKA_STATE.getState().auth.user; const el=document.getElementById('syka-bottom-nav'); el.innerHTML=`<a href="${window.SYKA_ROUTER.href('/')}" class="bottom-item">⌂<small>Home</small></a><a href="${window.SYKA_ROUTER.href('/lomba')}" class="bottom-item">◈<small>Lomba</small></a><a href="${window.SYKA_ROUTER.href('/juara')}" class="bottom-item">♛<small>Juara</small></a><a href="${window.SYKA_ROUTER.href(u?'/profile':'/profile')}" class="bottom-item">◎<small>${u?'Saya':'Masuk'}</small></a>`;} window.SYKA_BOTTOMNAV={render};})();


