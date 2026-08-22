(function(){
  const esc=window.SYKA_UTILS.escapeHtml;
  const money=(v,c='IDR')=>new Intl.NumberFormat('id-ID',{style:'currency',currency:c,maximumFractionDigits:0}).format(Number(v)||0);
  async function render(root){
    const a=window.SYKA_STATE.getState().auth;
    if(!a.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk untuk melihat pesanan',text:'Riwayat order, bukti transfer, dan status verifikasi ada di sini.',actionHtml:'<button class="btn btn-primary" id="order-login">Masuk</button>'});document.getElementById('order-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/pesanan'}));return;}
    root.innerHTML=`<section class="page-title"><span class="eyebrow">COMMERCE</span><h1>Pesanan Saya</h1><p>Setiap pembayaran manual akan masuk review admin. Status <b>PAID</b> hanya setelah pembayaran diverifikasi.</p></section><div id="orders" class="orders-grid-v46"></div>`;
    try{
      const rows=await window.SYKA_ORDER_SERVICE.list(a.user.id);
      document.getElementById('orders').innerHTML=rows.length?rows.map(o=>`<article class="order-card-v46"><div class="order-card-head"><div><span class="eyebrow">ORDER</span><h3>#${esc(String(o.id).slice(0,10))}</h3><small>${window.SYKA_UTILS.formatDateTime(o.created_at)}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(o.status)}">${esc(o.status||'DRAFT')}</span></div><div class="order-summary-grid"><div><span>Total</span><strong>${money(o.total,o.currency)}</strong></div><div><span>WhatsApp</span><strong>${esc(o.contact_whatsapp||'—')}</strong></div><div><span>Metode</span><strong>${esc(o.payment_method||'—')}</strong></div></div>${o.payment_proof_url?`<div class="order-proof"><img src="${esc(window.SYKA_UTILS.cloudinaryTransform(o.payment_proof_url,{width:320,height:220,crop:'fit'}))}" alt="Bukti transfer" loading="lazy"><div><strong>Bukti transfer</strong><small>Status: ${esc(o.payment_proof_status||'SUBMITTED')}</small></div></div>`:'<div class="order-proof-empty">Bukti transfer belum diunggah.</div>'}</article>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada pesanan',text:'Katalog Toko dan pembelian yang kamu kirim akan muncul di sini.'});
    }catch(error){document.getElementById('orders').innerHTML=window.SYKA_EMPTY.render({title:'Pesanan belum dapat dimuat',text:error.message||'Coba lagi.'});}
  }
  window.SYKA_PAGE_ORDERS={render};
})();
