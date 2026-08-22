(function () {
  function ensure() { return document.getElementById('syka-toast-root') || (() => { const el=document.createElement('div'); el.id='syka-toast-root'; document.body.appendChild(el); return el; })(); }
  function show(message, type='info') { const root=ensure(); const el=document.createElement('div'); el.className=`syka-toast syka-toast-${type}`; el.innerHTML=`<span>${window.SYKA_UTILS.escapeHtml(message)}</span><button aria-label="Tutup">×</button>`; el.querySelector('button').onclick=()=>el.remove(); root.appendChild(el); setTimeout(()=>el.remove(),4500); }
  window.SYKA_TOAST = { show };
})();


