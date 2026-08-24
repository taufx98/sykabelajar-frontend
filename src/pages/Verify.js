(function(){
  async function render(root,code){
    root.innerHTML=`<section class="page-title"><span class="eyebrow">VERIFICATION</span><h1>Verifikasi Certificate</h1><p>Masukkan kode publik untuk memeriksa proof of achievement.</p></section><form id="verify-form" class="verify-search"><input id="verify-code" value="${window.SYKA_UTILS.escapeHtml(code||'')}" placeholder="Masukkan kode verifikasi"><button class="btn btn-primary">Verifikasi</button></form><div id="verify-result"></div>`;
    document.getElementById('verify-form').onsubmit=e=>{e.preventDefault();const value=document.getElementById('verify-code').value.trim();if(value)window.SYKA_ROUTER.navigate('/verifikasi/'+encodeURIComponent(value));};
    if(!code){document.getElementById('verify-result').innerHTML=window.SYKA_EMPTY.render({title:'Masukkan kode verifikasi',text:'Kode dapat diperoleh dari QR/halaman certificate publik.'});return;}
    try{const row=await window.SYKA_AWARD_SERVICE.verify(code);document.getElementById('verify-result').innerHTML=row?`<section class="verification-card syka-card"><div class="verification-icon">✓</div><span class="status-pill status-success">TERVERIFIKASI</span><h2>${window.SYKA_UTILS.escapeHtml(row.public_name||'Certificate')}</h2><p>Status ${window.SYKA_UTILS.escapeHtml(row.status||'PUBLISHED')} · kode ${window.SYKA_UTILS.escapeHtml(row.verification_code||code)}</p><small>Data private certificate tidak dibuka oleh public verification view.</small></section>`:window.SYKA_EMPTY.render({title:'Kode tidak ditemukan',text:'Periksa kembali kode verifikasi dan pastikan certificate sudah dipublikasikan.'});}
    catch(error){document.getElementById('verify-result').innerHTML=window.SYKA_EMPTY.render({title:'Verifikasi belum tersedia',text:error.message||'Read model verification belum dapat diakses.'});}
  }
  window.SYKA_PAGE_VERIFY={render};
})();
