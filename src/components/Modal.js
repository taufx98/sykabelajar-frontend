(function () {
  function open({ title='', html='', onOpen, onClose, wide=false }={}) {
    close();
    const root=document.createElement('div'); root.id='syka-modal-root'; root.className='syka-modal-backdrop';
    root.innerHTML=`<div class="syka-modal ${wide?'syka-modal-wide':''}" role="dialog" aria-modal="true"><div class="syka-modal-head"><div><h2>${window.SYKA_UTILS.escapeHtml(title)}</h2></div><button class="syka-icon-btn" data-close aria-label="Tutup">×</button></div><div class="syka-modal-body">${html}</div></div>`;
    document.body.appendChild(root); root.addEventListener('click',e=>{ if(e.target===root || e.target.closest('[data-close]')) close(); }); onOpen?.(root.querySelector('.syka-modal-body'), root);
    window._sykaModalClose=()=>{ onClose?.(); root.remove(); window._sykaModalClose=null; };
  }
  function close(){ if(window._sykaModalClose) window._sykaModalClose(); else document.getElementById('syka-modal-root')?.remove(); }
  window.SYKA_MODAL={open,close};
})();


