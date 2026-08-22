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
    window.SYKA_MODAL.open({title:donation?'Dukung Sykabelajar':'Konfirmasi pesanan',html:`<div class="purchase-modal"><div class="purchase-summary"><div class="store-icon">${donation?'♥':'✦'}</div><div><span class="eyebrow">${esc(typeLabel[product.product_type]||'PRODUK')}</span><h3>${esc(product.name)}</h3><p>${esc(product.short_description||'')}</p></div></div><div class="purchase-price"><span>Total</span><strong id="purchase-total">${money(product.price,product.currency)}</strong></div><label class="quantity-label">Jumlah<input id="purchase-qty" type="number" min="1" max="20" value="1"></label><div class="form-hint">Pesanan dibuat sebagai DRAFT. Pembayaran baru dianggap berhasil setelah provider memvalidasi webhook di backend.</div><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batalkan</button><button type="button" class="btn btn-primary" id="purchase-confirm">${donation?'Buat dukungan':'Buat pesanan'}</button></div></div>`,onOpen:body=>{
      body.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
      const qty=body.querySelector('#purchase-qty');const total=body.querySelector('#purchase-total');
      const recalc=()=>total.textContent=money((Number(qty.value)||1)*Number(product.price||0),product.currency);
      qty.addEventListener('input',recalc);
      body.querySelector('#purchase-confirm').onclick=async()=>{const btn=body.querySelector('#purchase-confirm');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Membuat…';try{const order=await window.SYKA_STORE_SERVICE.createProductOrder(product.id,Math.max(1,Math.min(20,Number(qty.value)||1)));window.SYKA_MODAL.close();window.SYKA_TOAST.show(`Pesanan #${String(order.id).slice(0,8)} dibuat.`, 'success');setTimeout(()=>window.SYKA_ROUTER.navigate('/pesanan'),250);}catch(error){btn.disabled=false;btn.textContent=donation?'Buat dukungan':'Buat pesanan';body.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message||'Pesanan gagal dibuat.')}</div>`);}};
    }});
  }

  window.SYKA_PAGE_STORE={render};
})();
