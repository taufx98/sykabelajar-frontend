(function(){
  const esc=v=>window.SYKA_UTILS.escapeHtml(v);
  const money=(v,currency='IDR')=>new Intl.NumberFormat('id-ID',{style:'currency',currency,maximumFractionDigits:0}).format(Number(v)||0);
  const typeLabel={EDU_COIN_TOPUP:'Koin Edu',FEATURE_UNLOCK:'Fitur akun',DIGITAL_ITEM:'Item digital',DONATION:'Dukungan',PLAN:'Paket'};
  const audienceLabel={student:'Pelajar',teacher:'Guru',organizer:'Penyelenggara'};

  function currentAudience(){
    const roles=window.SYKA_STATE.getState().auth.roles||[];
    if(roles.includes('admin'))return 'Semua';
    if(roles.includes('organizer_member'))return 'Penyelenggara';
    if(roles.includes('teacher'))return 'Guru';
    return 'Pelajar';
  }

  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk untuk membuka Toko',text:'Beli Koin Edu, buka fitur khusus, dukung Sykabelajar, dan kelola pembelianmu dalam satu tempat.',actionHtml:'<button class="btn btn-primary" id="store-login">Masuk</button>'});
      document.getElementById('store-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/toko'}));
      return;
    }

    root.innerHTML=`
      <section class="store-hero">
        <div>
          <span class="eyebrow">SYKABELAJAR STORE</span>
          <h1>Fitur, Koin Edu, &amp; Dukungan</h1>
          <p>Semua pembelian dirancang modular agar bisa dipakai pelajar, guru, dan penyelenggara sesuai kebutuhan.</p>
        </div>
        <div class="store-audience"><span class="store-audience-dot"></span><strong>${esc(currentAudience())}</strong><small>katalog yang relevan untuk akunmu</small></div>
      </section>
      <div class="store-notice"><span class="support-icon">◈</span><div><strong>Belum ada pembayaran langsung di browser</strong><p>Pesanan dibuat sebagai draft dan baru dianggap lunas setelah provider payment terverifikasi melalui webhook backend.</p></div></div>
      <section class="store-section"><div class="section-head"><div><span class="eyebrow">CATALOG</span><h2>Yang bisa kamu gunakan</h2></div><a class="btn btn-ghost btn-sm" href="${window.SYKA_ROUTER.href('/pesanan')}">Pesanan saya →</a></div><div id="store-grid" class="store-grid"></div></section>
    `;

    try{
      const products=await window.SYKA_STORE_SERVICE.listProducts();
      const grid=document.getElementById('store-grid');
      grid.innerHTML=products.map(productCard).join('')||window.SYKA_EMPTY.render({title:'Belum ada produk',text:'Katalog sedang disiapkan oleh Sykabelajar.'});
      grid.querySelectorAll('[data-buy]').forEach(btn=>btn.addEventListener('click',()=>openBuy(products.find(p=>p.id===btn.dataset.buy))));
    }catch(error){
      document.getElementById('store-grid').innerHTML=window.SYKA_EMPTY.render({title:'Katalog belum dapat dimuat',text:error.message||'Coba lagi beberapa saat.'});
    }
  }

  function productCard(p){
    const benefit=(p.benefits||[])[0];
    const benefits=(p.benefits||[]).map(b=>{
      if(b.benefit_type==='EDU_COIN') return `<span>+${Number(b.quantity||0).toLocaleString('id-ID')} Koin Edu</span>`;
      if(b.benefit_type==='FEATURE') return `<span>${esc(b.benefit_key||'Fitur khusus')}${b.duration_days?` · ${b.duration_days} hari`:''}</span>`;
      if(b.benefit_type==='PLAN') return `<span>Paket ${esc(b.benefit_key||'')}</span>`;
      return `<span>Benefit khusus</span>`;
    }).join('');
    const donation=p.product_type==='DONATION';
    return `<article class="store-card ${p.is_featured?'featured':''}">
      ${p.image_url?`<div class="store-card-media"><img src="${esc(window.SYKA_UTILS.cloudinaryTransform(p.image_url,{width:640,height:400,crop:'fill'}))}" alt="${esc(p.name)}" loading="lazy"></div>`:`<div class="store-card-media placeholder">${donation?'♥':p.product_type==='EDU_COIN_TOPUP'?'✦':'◆'}</div>`}
      <div class="store-card-top"><span class="store-icon">${donation?'♥':p.product_type==='EDU_COIN_TOPUP'?'✦':p.product_type==='FEATURE_UNLOCK'?'◈':'◆'}</span><span class="chip">${esc(typeLabel[p.product_type]||p.product_type)}</span></div>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.short_description||p.description||'')}</p>
      <div class="store-benefits">${benefits||'<span>Produk digital Sykabelajar</span>'}</div>
      <div class="store-card-bottom"><div><small>${donation?'Dukungan':'Mulai dari'}</small><strong>${money(p.price,p.currency)}</strong></div><button type="button" class="btn btn-primary" data-buy="${esc(p.id)}">${donation?'Dukung':'Beli'}</button></div>
    </article>`;
  }

  function openBuy(product){
    if(!product)return;
    const donation=product.product_type==='DONATION';
    const price=Number(product.price)||0;
    const requiresProof=price>0;
    window.SYKA_MODAL.open({title:donation?'Dukung Sykabelajar':'Pembayaran manual',wide:true,html:`
      <div class="purchase-modal purchase-modal-v46">
        <div class="purchase-summary purchase-summary-v46"><div class="store-icon">${donation?'♥':'✦'}</div><div><span class="eyebrow">${esc(typeLabel[product.product_type]||'PRODUK')}</span><h3>${esc(product.name)}</h3><p>${esc(product.short_description||'')}</p></div></div>
        <div class="purchase-flow-v46"><div class="purchase-step active"><span>1</span><div><strong>Data pembayaran</strong><small>Nomor WhatsApp untuk konfirmasi.</small></div></div><div class="purchase-step"><span>2</span><div><strong>Bukti transfer</strong><small>Upload gambar langsung ke Cloudinary.</small></div></div><div class="purchase-step"><span>3</span><div><strong>Review admin</strong><small>Benefit aktif setelah pembayaran diverifikasi.</small></div></div></div>
        <div class="purchase-price"><span>Total</span><strong id="purchase-total">${money(price,product.currency)}</strong></div>
        <div class="form-grid-2"><label>Nomor WhatsApp *<input id="purchase-whatsapp" inputmode="tel" placeholder="08xxxxxxxxxx" required></label><label>Jumlah *<input id="purchase-qty" type="number" min="1" max="20" value="1"></label></div>
        ${requiresProof?`<div class="upload-field-card"><div><span class="eyebrow">BUKTI TRANSFER</span><h3>Upload foto / screenshot</h3><p>Jangan tempel link. Gambar akan diunggah ke Cloudinary dan URL aman akan disimpan ke order.</p></div><div class="upload-preview" id="payment-proof-preview"><div class="upload-placeholder"><span>↑</span><strong>Belum ada bukti</strong><small>PNG, JPG, WEBP • maksimal 8 MB</small></div></div><div class="upload-actions"><button type="button" class="btn btn-secondary" id="payment-proof-upload">Pilih gambar</button><button type="button" class="btn btn-ghost hidden" id="payment-proof-remove">Ganti gambar</button></div><div id="payment-proof-info"></div></div>`:'<div class="store-notice"><span>♥</span><div><strong>Dukungan tanpa nominal</strong><p>Kamu tetap dapat mengirim dukungan setelah mengisi nomor WhatsApp.</p></div></div>'}
        <div class="form-hint">Setelah order dibuat, status awal <b>PENDING_PAYMENT</b>. Admin akan memeriksa bukti transfer. Jangan kirim uang di luar instruksi resmi Sykabelajar.</div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batalkan</button><button type="button" class="btn btn-primary" id="purchase-confirm">${donation?'Kirim dukungan':'Kirim pesanan'}</button></div>
        <div id="purchase-feedback"></div>
      </div>`,onOpen:body=>{
      body.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
      const qty=body.querySelector('#purchase-qty'),total=body.querySelector('#purchase-total');
      const recalc=()=>total.textContent=money((Number(qty.value)||1)*price,product.currency);
      qty.addEventListener('input',recalc);
      let proof=null;
      body.querySelector('#payment-proof-upload')?.addEventListener('click',async()=>{
        try{proof=await window.SYKA_CLOUDINARY.openPaymentProofWidget();const preview=body.querySelector('#payment-proof-preview');preview.innerHTML=`<img src="${esc(proof.secure_url)}" alt="Bukti transfer"><div class="upload-file-meta"><strong>${esc(proof.original_filename||'Bukti transfer')}</strong><small>${Math.round((proof.bytes||0)/1024)} KB</small></div>`;body.querySelector('#payment-proof-remove')?.classList.remove('hidden');body.querySelector('#payment-proof-upload').textContent='Ganti gambar';}catch(error){body.querySelector('#purchase-feedback').innerHTML=`<div class="inline-error">${esc(error.message||'Upload gagal.')}</div>`;}});
      body.querySelector('#payment-proof-remove')?.addEventListener('click',()=>{proof=null;body.querySelector('#payment-proof-preview').innerHTML='<div class="upload-placeholder"><span>↑</span><strong>Belum ada bukti</strong><small>PNG, JPG, WEBP • maksimal 8 MB</small></div>';body.querySelector('#payment-proof-upload').textContent='Pilih gambar';});
      body.querySelector('#purchase-confirm').onclick=async()=>{
        const btn=body.querySelector('#purchase-confirm');const wa=body.querySelector('#purchase-whatsapp').value.trim();
        if(wa.length<8){body.querySelector('#purchase-feedback').innerHTML='<div class="inline-error">Masukkan nomor WhatsApp yang valid.</div>';return;}
        if(requiresProof&&!proof){body.querySelector('#purchase-feedback').innerHTML='<div class="inline-error">Upload bukti transfer sebelum mengirim pesanan.</div>';return;}
        btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Mengirim…';
        try{const order=await window.SYKA_STORE_SERVICE.createProductOrder(product.id,Math.max(1,Math.min(20,Number(qty.value)||1)),{whatsapp:wa,payment_method:'MANUAL_TRANSFER',proof_url:proof?.secure_url,proof_public_id:proof?.public_id,proof_width:proof?.width,proof_height:proof?.height,proof_version:proof?.version,proof_resource_type:proof?.resource_type});window.SYKA_MODAL.close();window.SYKA_TOAST.show(`Pesanan #${String(order.id).slice(0,8)} terkirim. Tunggu verifikasi admin.`,'success');setTimeout(()=>window.SYKA_ROUTER.navigate('/pesanan'),250);}catch(error){btn.disabled=false;btn.textContent=donation?'Kirim dukungan':'Kirim pesanan';body.querySelector('#purchase-feedback').innerHTML=`<div class="inline-error">${esc(error.message||'Pesanan gagal dibuat.')}</div>`;}}
    }});
  }

  window.SYKA_PAGE_STORE={render};
})();
